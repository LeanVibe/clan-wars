/**
 * IndexedDB-based Persistence System for Ninja Clan Wars
 * Provides comprehensive data storage for competitive gaming requirements
 */

import { rankingSystem } from './ranking.js';

// Database configuration
const DB_NAME = 'NinjaClanWarsDB';
const DB_VERSION = 1;

// Object store names
const STORES = {
  PLAYERS: 'players',
  RANKINGS: 'rankings', 
  DECKS: 'decks',
  MATCHES: 'matches',
  REPLAYS: 'replays',
  GAME_STATES: 'gameStates',
  PREFERENCES: 'preferences',
  METADATA: 'metadata'
};

// Storage quotas and limits
const STORAGE_LIMITS = {
  MAX_REPLAYS: 100,
  MAX_MATCHES: 500,
  MAX_SAVED_STATES: 10,
  MAX_CUSTOM_DECKS: 50,
  REPLAY_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB per replay
  TOTAL_SIZE_WARNING: 250 * 1024 * 1024 // 250MB warning threshold
};

// Database schema versioning
const SCHEMA_VERSIONS = {
  1: {
    stores: [
      {
        name: STORES.PLAYERS,
        keyPath: 'playerId',
        indexes: [
          { name: 'createdAt', keyPath: 'createdAt' },
          { name: 'lastLoginAt', keyPath: 'lastLoginAt' }
        ]
      },
      {
        name: STORES.RANKINGS,
        keyPath: 'playerId',
        indexes: [
          { name: 'rating', keyPath: 'rating' },
          { name: 'seasonId', keyPath: 'seasonId' },
          { name: 'lastMatchAt', keyPath: 'lastMatchAt' }
        ]
      },
      {
        name: STORES.DECKS,
        keyPath: 'deckId',
        indexes: [
          { name: 'playerId', keyPath: 'playerId' },
          { name: 'createdAt', keyPath: 'createdAt' },
          { name: 'isCustom', keyPath: 'isCustom' }
        ]
      },
      {
        name: STORES.MATCHES,
        keyPath: 'matchId',
        indexes: [
          { name: 'playerId', keyPath: 'playerId' },
          { name: 'completedAt', keyPath: 'completedAt' },
          { name: 'outcome', keyPath: 'outcome' },
          { name: 'matchType', keyPath: 'matchType' }
        ]
      },
      {
        name: STORES.REPLAYS,
        keyPath: 'replayId',
        indexes: [
          { name: 'matchId', keyPath: 'matchId' },
          { name: 'playerId', keyPath: 'playerId' },
          { name: 'createdAt', keyPath: 'createdAt' },
          { name: 'size', keyPath: 'size' }
        ]
      },
      {
        name: STORES.GAME_STATES,
        keyPath: 'stateId',
        indexes: [
          { name: 'playerId', keyPath: 'playerId' },
          { name: 'savedAt', keyPath: 'savedAt' },
          { name: 'matchType', keyPath: 'matchType' }
        ]
      },
      {
        name: STORES.PREFERENCES,
        keyPath: 'playerId',
        indexes: [
          { name: 'category', keyPath: 'category' },
          { name: 'updatedAt', keyPath: 'updatedAt' }
        ]
      },
      {
        name: STORES.METADATA,
        keyPath: 'key',
        indexes: [
          { name: 'updatedAt', keyPath: 'updatedAt' }
        ]
      }
    ]
  }
};

/**
 * Main persistence manager class
 */
export class PersistenceManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.migrations = new Map();
    this.eventListeners = new Map();
    this.compressionEnabled = true;
    this.encryptionEnabled = false; // Future feature
  }

  /**
   * Initialize the database and perform migrations
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      this.db = await this._openDatabase();
      await this._performMigrations();
      await this._validateSchema();
      
      this.isInitialized = true;
      this._emit('initialized', { success: true });
      
      console.log('[Persistence] Database initialized successfully');
    } catch (error) {
      console.error('[Persistence] Failed to initialize database:', error);
      this._emit('error', { error, context: 'initialization' });
      throw error;
    }
  }

  /**
   * Open IndexedDB connection with proper error handling
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported in this browser'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        console.log(`[Persistence] Upgrading database from version ${oldVersion} to ${newVersion}`);
        this._upgradeDatabase(db, oldVersion, newVersion);
      };

      request.onblocked = () => {
        console.warn('[Persistence] Database upgrade blocked by other connections');
      };
    });
  }

  /**
   * Handle database schema upgrades
   */
  _upgradeDatabase(db, oldVersion, newVersion) {
    for (let version = oldVersion + 1; version <= newVersion; version++) {
      const schema = SCHEMA_VERSIONS[version];
      if (!schema) continue;

      console.log(`[Persistence] Applying schema version ${version}`);
      
      for (const storeConfig of schema.stores) {
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(storeConfig.name)) {
          const store = db.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement || false
          });

          // Create indexes
          if (storeConfig.indexes) {
            for (const index of storeConfig.indexes) {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false,
                multiEntry: index.multiEntry || false
              });
            }
          }

          console.log(`[Persistence] Created object store: ${storeConfig.name}`);
        }
      }
    }
  }

  /**
   * Validate database schema matches expected structure
   */
  async _validateSchema() {
    const storeNames = Array.from(this.db.objectStoreNames);
    const expectedStores = Object.values(STORES);
    
    for (const storeName of expectedStores) {
      if (!storeNames.includes(storeName)) {
        throw new Error(`Missing required object store: ${storeName}`);
      }
    }

    console.log('[Persistence] Schema validation passed');
  }

  /**
   * Perform any necessary data migrations
   */
  async _performMigrations() {
    const metadata = await this.getMetadata('lastMigration');
    const lastMigration = metadata?.value || 0;
    
    for (const [version, migration] of this.migrations) {
      if (version > lastMigration) {
        console.log(`[Persistence] Running migration ${version}`);
        await migration(this);
        await this.setMetadata('lastMigration', version);
      }
    }
  }

  /**
   * Register a data migration
   */
  registerMigration(version, migrationFn) {
    this.migrations.set(version, migrationFn);
  }

  /**
   * Add event listener
   */
  addEventListener(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, listener) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  _emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[Persistence] Error in event listener for ${event}:`, error);
      }
    }
  }

  /**
   * Create a transaction with proper error handling
   */
  _createTransaction(storeNames, mode = 'readonly') {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    const transaction = this.db.transaction(stores, mode);
    
    transaction.onerror = (event) => {
      console.error('[Persistence] Transaction error:', event.target.error);
      this._emit('transactionError', { error: event.target.error, stores });
    };

    return transaction;
  }

  /**
   * Execute a store operation with promise wrapper
   */
  _executeOperation(transaction, storeName, operation) {
    return new Promise((resolve, reject) => {
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Compress data before storage (optional)
   */
  _compressData(data) {
    if (!this.compressionEnabled) return data;
    
    try {
      // Simple JSON compression - could be enhanced with actual compression algorithms
      return {
        compressed: true,
        data: JSON.stringify(data)
      };
    } catch (error) {
      console.warn('[Persistence] Data compression failed:', error);
      return data;
    }
  }

  /**
   * Decompress data after retrieval
   */
  _decompressData(data) {
    if (!data || !data.compressed) return data;
    
    try {
      return JSON.parse(data.data);
    } catch (error) {
      console.warn('[Persistence] Data decompression failed:', error);
      return data;
    }
  }

  // ========== PLAYER DATA OPERATIONS ==========

  /**
   * Create or update player profile
   */
  async savePlayer(playerData) {
    try {
      const transaction = this._createTransaction(STORES.PLAYERS, 'readwrite');
      
      const player = {
        playerId: playerData.playerId,
        username: playerData.username,
        avatar: playerData.avatar || null,
        createdAt: playerData.createdAt || Date.now(),
        lastLoginAt: Date.now(),
        totalMatches: playerData.totalMatches || 0,
        totalWins: playerData.totalWins || 0,
        achievements: playerData.achievements || [],
        statistics: playerData.statistics || {},
        settings: playerData.settings || {},
        version: 1
      };

      await this._executeOperation(transaction, STORES.PLAYERS, 
        store => store.put(player)
      );

      this._emit('playerSaved', { playerId: player.playerId });
      return player;
    } catch (error) {
      console.error('[Persistence] Failed to save player:', error);
      throw error;
    }
  }

  /**
   * Get player profile by ID
   */
  async getPlayer(playerId) {
    try {
      const transaction = this._createTransaction(STORES.PLAYERS);
      
      const player = await this._executeOperation(transaction, STORES.PLAYERS,
        store => store.get(playerId)
      );

      return player || null;
    } catch (error) {
      console.error('[Persistence] Failed to get player:', error);
      throw error;
    }
  }

  /**
   * Update player's last login time
   */
  async updatePlayerLogin(playerId) {
    try {
      const player = await this.getPlayer(playerId);
      if (player) {
        player.lastLoginAt = Date.now();
        await this.savePlayer(player);
      }
    } catch (error) {
      console.error('[Persistence] Failed to update player login:', error);
    }
  }

  // ========== RANKING SYSTEM OPERATIONS ==========

  /**
   * Save ranking data
   */
  async saveRankingData(rankingData) {
    try {
      const transaction = this._createTransaction(STORES.RANKINGS, 'readwrite');
      
      const compressed = this._compressData(rankingData);
      await this._executeOperation(transaction, STORES.RANKINGS,
        store => store.put(compressed)
      );

      this._emit('rankingDataSaved', { playerId: rankingData.playerId });
    } catch (error) {
      console.error('[Persistence] Failed to save ranking data:', error);
      throw error;
    }
  }

  /**
   * Load ranking data
   */
  async loadRankingData() {
    try {
      const transaction = this._createTransaction(STORES.RANKINGS);
      
      const allRankings = await this._executeOperation(transaction, STORES.RANKINGS,
        store => store.getAll()
      );

      const decompressed = allRankings.map(data => this._decompressData(data));
      
      // Reconstruct ranking system data
      const rankingSystemData = {
        seasons: new Map(),
        playerRatings: new Map(),
        matchHistory: new Map(),
        currentSeasonId: null
      };

      for (const ranking of decompressed) {
        if (ranking.seasons) {
          for (const [id, season] of Object.entries(ranking.seasons)) {
            rankingSystemData.seasons.set(id, season);
          }
        }
        if (ranking.playerRatings) {
          for (const [id, rating] of Object.entries(ranking.playerRatings)) {
            rankingSystemData.playerRatings.set(id, rating);
          }
        }
        if (ranking.matchHistory) {
          for (const [id, history] of Object.entries(ranking.matchHistory)) {
            rankingSystemData.matchHistory.set(id, history);
          }
        }
        if (ranking.currentSeasonId) {
          rankingSystemData.currentSeasonId = ranking.currentSeasonId;
        }
      }

      return rankingSystemData;
    } catch (error) {
      console.error('[Persistence] Failed to load ranking data:', error);
      throw error;
    }
  }

  /**
   * Sync ranking system with persistence
   */
  async syncRankingSystem() {
    try {
      const savedData = await this.loadRankingData();
      if (savedData && Object.keys(savedData).length > 0) {
        rankingSystem.importData(savedData);
      }
      
      // Set up auto-save for ranking changes
      this._setupRankingAutoSave();
    } catch (error) {
      console.error('[Persistence] Failed to sync ranking system:', error);
    }
  }

  /**
   * Set up automatic saving of ranking data
   */
  _setupRankingAutoSave() {
    let saveTimeout = null;
    
    const debouncedSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      
      saveTimeout = setTimeout(async () => {
        try {
          const data = rankingSystem.exportData();
          await this.saveRankingData(data);
        } catch (error) {
          console.error('[Persistence] Auto-save of ranking data failed:', error);
        }
      }, 2000); // Save 2 seconds after last change
    };

    // Hook into ranking system events (would need to be implemented in ranking.js)
    // For now, we'll save periodically
    setInterval(debouncedSave, 30000); // Save every 30 seconds
  }

  // ========== DECK MANAGEMENT OPERATIONS ==========

  /**
   * Save custom deck
   */
  async saveDeck(deckData) {
    try {
      const transaction = this._createTransaction(STORES.DECKS, 'readwrite');
      
      const deck = {
        deckId: deckData.deckId,
        playerId: deckData.playerId,
        name: deckData.name,
        cards: deckData.cards,
        isCustom: deckData.isCustom || true,
        createdAt: deckData.createdAt || Date.now(),
        updatedAt: Date.now(),
        version: deckData.version || 1,
        tags: deckData.tags || [],
        description: deckData.description || '',
        winRate: deckData.winRate || 0,
        totalGames: deckData.totalGames || 0
      };

      await this._executeOperation(transaction, STORES.DECKS,
        store => store.put(deck)
      );

      this._emit('deckSaved', { deckId: deck.deckId, playerId: deck.playerId });
      return deck;
    } catch (error) {
      console.error('[Persistence] Failed to save deck:', error);
      throw error;
    }
  }

  /**
   * Get all decks for a player
   */
  async getPlayerDecks(playerId) {
    try {
      const transaction = this._createTransaction(STORES.DECKS);
      
      const allDecks = await this._executeOperation(transaction, STORES.DECKS,
        store => store.index('playerId').getAll(playerId)
      );

      return allDecks.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('[Persistence] Failed to get player decks:', error);
      throw error;
    }
  }

  /**
   * Delete a deck
   */
  async deleteDeck(deckId) {
    try {
      const transaction = this._createTransaction(STORES.DECKS, 'readwrite');
      
      await this._executeOperation(transaction, STORES.DECKS,
        store => store.delete(deckId)
      );

      this._emit('deckDeleted', { deckId });
    } catch (error) {
      console.error('[Persistence] Failed to delete deck:', error);
      throw error;
    }
  }

  /**
   * Update deck statistics after a match
   */
  async updateDeckStats(deckId, won) {
    try {
      const transaction = this._createTransaction(STORES.DECKS, 'readwrite');
      
      const deck = await this._executeOperation(transaction, STORES.DECKS,
        store => store.get(deckId)
      );

      if (deck) {
        deck.totalGames = (deck.totalGames || 0) + 1;
        if (won) {
          deck.totalWins = (deck.totalWins || 0) + 1;
        }
        deck.winRate = deck.totalWins / deck.totalGames;
        deck.updatedAt = Date.now();

        await this._executeOperation(transaction, STORES.DECKS,
          store => store.put(deck)
        );
      }
    } catch (error) {
      console.error('[Persistence] Failed to update deck stats:', error);
    }
  }

  // ========== MATCH DATA OPERATIONS ==========

  /**
   * Save match result
   */
  async saveMatch(matchData) {
    try {
      const transaction = this._createTransaction(STORES.MATCHES, 'readwrite');
      
      const match = {
        matchId: matchData.matchId,
        playerId: matchData.playerId,
        opponentId: matchData.opponentId || 'ai',
        deckId: matchData.deckId,
        outcome: matchData.outcome, // 'win', 'loss', 'draw'
        matchType: matchData.matchType || 'ranked',
        duration: matchData.duration,
        playerRating: matchData.playerRating,
        opponentRating: matchData.opponentRating,
        ratingChange: matchData.ratingChange,
        statistics: this._compressData(matchData.statistics || {}),
        metadata: matchData.metadata || {},
        completedAt: matchData.completedAt || Date.now(),
        version: 1
      };

      await this._executeOperation(transaction, STORES.MATCHES,
        store => store.put(match)
      );

      // Clean up old matches if over limit
      await this._cleanupOldMatches();

      this._emit('matchSaved', { matchId: match.matchId, playerId: match.playerId });
      return match;
    } catch (error) {
      console.error('[Persistence] Failed to save match:', error);
      throw error;
    }
  }

  /**
   * Get match history for a player
   */
  async getMatchHistory(playerId, limit = 50) {
    try {
      const transaction = this._createTransaction(STORES.MATCHES);
      
      const matches = await this._executeOperation(transaction, STORES.MATCHES,
        store => store.index('playerId').getAll(playerId)
      );

      const decompressed = matches.map(match => ({
        ...match,
        statistics: this._decompressData(match.statistics)
      }));

      return decompressed
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, limit);
    } catch (error) {
      console.error('[Persistence] Failed to get match history:', error);
      throw error;
    }
  }

  /**
   * Clean up old matches to maintain storage limits
   */
  async _cleanupOldMatches() {
    try {
      const transaction = this._createTransaction(STORES.MATCHES, 'readwrite');
      
      const allMatches = await this._executeOperation(transaction, STORES.MATCHES,
        store => store.getAll()
      );

      if (allMatches.length > STORAGE_LIMITS.MAX_MATCHES) {
        const sorted = allMatches.sort((a, b) => b.completedAt - a.completedAt);
        const toDelete = sorted.slice(STORAGE_LIMITS.MAX_MATCHES);

        for (const match of toDelete) {
          await this._executeOperation(transaction, STORES.MATCHES,
            store => store.delete(match.matchId)
          );
        }

        console.log(`[Persistence] Cleaned up ${toDelete.length} old matches`);
      }
    } catch (error) {
      console.error('[Persistence] Failed to cleanup old matches:', error);
    }
  }

  // ========== REPLAY OPERATIONS ==========

  /**
   * Save match replay
   */
  async saveReplay(replayData) {
    try {
      // Check replay size limits
      const size = new Blob([JSON.stringify(replayData.data)]).size;
      if (size > STORAGE_LIMITS.REPLAY_SIZE_LIMIT) {
        throw new Error(`Replay size (${size} bytes) exceeds limit (${STORAGE_LIMITS.REPLAY_SIZE_LIMIT} bytes)`);
      }

      const transaction = this._createTransaction(STORES.REPLAYS, 'readwrite');
      
      const replay = {
        replayId: replayData.replayId,
        matchId: replayData.matchId,
        playerId: replayData.playerId,
        data: this._compressData(replayData.data),
        metadata: replayData.metadata || {},
        size: size,
        createdAt: replayData.createdAt || Date.now(),
        version: 1
      };

      await this._executeOperation(transaction, STORES.REPLAYS,
        store => store.put(replay)
      );

      // Clean up old replays if over limit
      await this._cleanupOldReplays();

      this._emit('replaySaved', { replayId: replay.replayId, matchId: replay.matchId });
      return replay;
    } catch (error) {
      console.error('[Persistence] Failed to save replay:', error);
      throw error;
    }
  }

  /**
   * Load replay data
   */
  async getReplay(replayId) {
    try {
      const transaction = this._createTransaction(STORES.REPLAYS);
      
      const replay = await this._executeOperation(transaction, STORES.REPLAYS,
        store => store.get(replayId)
      );

      if (replay) {
        replay.data = this._decompressData(replay.data);
      }

      return replay;
    } catch (error) {
      console.error('[Persistence] Failed to get replay:', error);
      throw error;
    }
  }

  /**
   * Get all replays for a player
   */
  async getPlayerReplays(playerId, limit = 20) {
    try {
      const transaction = this._createTransaction(STORES.REPLAYS);
      
      const replays = await this._executeOperation(transaction, STORES.REPLAYS,
        store => store.index('playerId').getAll(playerId)
      );

      return replays
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit)
        .map(replay => ({
          ...replay,
          data: null // Don't load full data for list view
        }));
    } catch (error) {
      console.error('[Persistence] Failed to get player replays:', error);
      throw error;
    }
  }

  /**
   * Clean up old replays to maintain storage limits
   */
  async _cleanupOldReplays() {
    try {
      const transaction = this._createTransaction(STORES.REPLAYS, 'readwrite');
      
      const allReplays = await this._executeOperation(transaction, STORES.REPLAYS,
        store => store.getAll()
      );

      if (allReplays.length > STORAGE_LIMITS.MAX_REPLAYS) {
        const sorted = allReplays.sort((a, b) => b.createdAt - a.createdAt);
        const toDelete = sorted.slice(STORAGE_LIMITS.MAX_REPLAYS);

        for (const replay of toDelete) {
          await this._executeOperation(transaction, STORES.REPLAYS,
            store => store.delete(replay.replayId)
          );
        }

        console.log(`[Persistence] Cleaned up ${toDelete.length} old replays`);
      }
    } catch (error) {
      console.error('[Persistence] Failed to cleanup old replays:', error);
    }
  }

  // ========== GAME STATE OPERATIONS ==========

  /**
   * Save current game state
   */
  async saveGameState(stateData) {
    try {
      const transaction = this._createTransaction(STORES.GAME_STATES, 'readwrite');
      
      const gameState = {
        stateId: stateData.stateId,
        playerId: stateData.playerId,
        matchId: stateData.matchId || null,
        state: this._compressData(stateData.state),
        matchType: stateData.matchType || 'unknown',
        savedAt: Date.now(),
        version: 1
      };

      await this._executeOperation(transaction, STORES.GAME_STATES,
        store => store.put(gameState)
      );

      // Clean up old saved states
      await this._cleanupOldGameStates(stateData.playerId);

      this._emit('gameStateSaved', { stateId: gameState.stateId, playerId: gameState.playerId });
      return gameState;
    } catch (error) {
      console.error('[Persistence] Failed to save game state:', error);
      throw error;
    }
  }

  /**
   * Load saved game state
   */
  async loadGameState(stateId) {
    try {
      const transaction = this._createTransaction(STORES.GAME_STATES);
      
      const gameState = await this._executeOperation(transaction, STORES.GAME_STATES,
        store => store.get(stateId)
      );

      if (gameState) {
        gameState.state = this._decompressData(gameState.state);
      }

      return gameState;
    } catch (error) {
      console.error('[Persistence] Failed to load game state:', error);
      throw error;
    }
  }

  /**
   * Get all saved game states for a player
   */
  async getPlayerGameStates(playerId) {
    try {
      const transaction = this._createTransaction(STORES.GAME_STATES);
      
      const gameStates = await this._executeOperation(transaction, STORES.GAME_STATES,
        store => store.index('playerId').getAll(playerId)
      );

      return gameStates
        .sort((a, b) => b.savedAt - a.savedAt)
        .map(state => ({
          ...state,
          state: null // Don't load full state data for list view
        }));
    } catch (error) {
      console.error('[Persistence] Failed to get player game states:', error);
      throw error;
    }
  }

  /**
   * Delete a saved game state
   */
  async deleteGameState(stateId) {
    try {
      const transaction = this._createTransaction(STORES.GAME_STATES, 'readwrite');
      
      await this._executeOperation(transaction, STORES.GAME_STATES,
        store => store.delete(stateId)
      );

      this._emit('gameStateDeleted', { stateId });
    } catch (error) {
      console.error('[Persistence] Failed to delete game state:', error);
      throw error;
    }
  }

  /**
   * Clean up old game states for a player
   */
  async _cleanupOldGameStates(playerId) {
    try {
      const transaction = this._createTransaction(STORES.GAME_STATES, 'readwrite');
      
      const playerStates = await this._executeOperation(transaction, STORES.GAME_STATES,
        store => store.index('playerId').getAll(playerId)
      );

      if (playerStates.length > STORAGE_LIMITS.MAX_SAVED_STATES) {
        const sorted = playerStates.sort((a, b) => b.savedAt - a.savedAt);
        const toDelete = sorted.slice(STORAGE_LIMITS.MAX_SAVED_STATES);

        for (const state of toDelete) {
          await this._executeOperation(transaction, STORES.GAME_STATES,
            store => store.delete(state.stateId)
          );
        }

        console.log(`[Persistence] Cleaned up ${toDelete.length} old game states for player ${playerId}`);
      }
    } catch (error) {
      console.error('[Persistence] Failed to cleanup old game states:', error);
    }
  }

  // ========== PREFERENCES OPERATIONS ==========

  /**
   * Save user preferences
   */
  async savePreferences(playerId, preferences) {
    try {
      const transaction = this._createTransaction(STORES.PREFERENCES, 'readwrite');
      
      const prefs = {
        playerId: playerId,
        preferences: preferences,
        updatedAt: Date.now(),
        version: 1
      };

      await this._executeOperation(transaction, STORES.PREFERENCES,
        store => store.put(prefs)
      );

      this._emit('preferencesSaved', { playerId });
    } catch (error) {
      console.error('[Persistence] Failed to save preferences:', error);
      throw error;
    }
  }

  /**
   * Load user preferences
   */
  async getPreferences(playerId) {
    try {
      const transaction = this._createTransaction(STORES.PREFERENCES);
      
      const prefs = await this._executeOperation(transaction, STORES.PREFERENCES,
        store => store.get(playerId)
      );

      return prefs?.preferences || {};
    } catch (error) {
      console.error('[Persistence] Failed to get preferences:', error);
      return {};
    }
  }

  // ========== METADATA OPERATIONS ==========

  /**
   * Set metadata value
   */
  async setMetadata(key, value) {
    try {
      const transaction = this._createTransaction(STORES.METADATA, 'readwrite');
      
      const metadata = {
        key: key,
        value: value,
        updatedAt: Date.now()
      };

      await this._executeOperation(transaction, STORES.METADATA,
        store => store.put(metadata)
      );
    } catch (error) {
      console.error('[Persistence] Failed to set metadata:', error);
      throw error;
    }
  }

  /**
   * Get metadata value
   */
  async getMetadata(key) {
    try {
      const transaction = this._createTransaction(STORES.METADATA);
      
      const metadata = await this._executeOperation(transaction, STORES.METADATA,
        store => store.get(key)
      );

      return metadata || null;
    } catch (error) {
      console.error('[Persistence] Failed to get metadata:', error);
      return null;
    }
  }

  // ========== STORAGE MANAGEMENT ==========

  /**
   * Get storage usage statistics
   */
  async getStorageInfo() {
    try {
      const usage = {};
      const total = { count: 0, size: 0 };

      for (const storeName of Object.values(STORES)) {
        const transaction = this._createTransaction(storeName);
        const count = await this._executeOperation(transaction, storeName,
          store => store.count()
        );

        // Estimate size (rough calculation)
        const allData = await this._executeOperation(transaction, storeName,
          store => store.getAll()
        );
        
        const size = new Blob([JSON.stringify(allData)]).size;

        usage[storeName] = { count, size };
        total.count += count;
        total.size += size;
      }

      // Check if we're approaching storage limits
      const quota = await this._getStorageQuota();
      const warnings = [];

      if (total.size > STORAGE_LIMITS.TOTAL_SIZE_WARNING) {
        warnings.push('Approaching storage limit');
      }

      if (usage[STORES.REPLAYS].count >= STORAGE_LIMITS.MAX_REPLAYS * 0.9) {
        warnings.push('Replay storage nearly full');
      }

      return {
        usage,
        total,
        quota,
        warnings,
        limits: STORAGE_LIMITS
      };
    } catch (error) {
      console.error('[Persistence] Failed to get storage info:', error);
      throw error;
    }
  }

  /**
   * Get browser storage quota information
   */
  async _getStorageQuota() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        return await navigator.storage.estimate();
      }
      return { quota: 'unknown', usage: 'unknown' };
    } catch (error) {
      console.warn('[Persistence] Could not get storage quota:', error);
      return { quota: 'unknown', usage: 'unknown' };
    }
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAllData() {
    try {
      const storeNames = Object.values(STORES);
      const transaction = this._createTransaction(storeNames, 'readwrite');

      for (const storeName of storeNames) {
        await this._executeOperation(transaction, storeName,
          store => store.clear()
        );
      }

      this._emit('allDataCleared', {});
      console.log('[Persistence] All data cleared');
    } catch (error) {
      console.error('[Persistence] Failed to clear all data:', error);
      throw error;
    }
  }

  /**
   * Export all data for backup
   */
  async exportAllData() {
    try {
      const exportData = {
        version: DB_VERSION,
        exportedAt: Date.now(),
        data: {}
      };

      for (const storeName of Object.values(STORES)) {
        const transaction = this._createTransaction(storeName);
        const storeData = await this._executeOperation(transaction, storeName,
          store => store.getAll()
        );
        
        // Decompress data for export
        exportData.data[storeName] = storeData.map(item => this._decompressData(item));
      }

      return exportData;
    } catch (error) {
      console.error('[Persistence] Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Import data from backup
   */
  async importData(importData) {
    try {
      if (!importData.data || !importData.version) {
        throw new Error('Invalid import data format');
      }

      // Clear existing data first
      await this.clearAllData();

      // Import data to each store
      for (const [storeName, storeData] of Object.entries(importData.data)) {
        if (!Object.values(STORES).includes(storeName)) {
          console.warn(`[Persistence] Skipping unknown store: ${storeName}`);
          continue;
        }

        const transaction = this._createTransaction(storeName, 'readwrite');
        
        for (const item of storeData) {
          const compressed = this._compressData(item);
          await this._executeOperation(transaction, storeName,
            store => store.put(compressed)
          );
        }
      }

      this._emit('dataImported', { recordCount: Object.keys(importData.data).length });
      console.log('[Persistence] Data import completed');
    } catch (error) {
      console.error('[Persistence] Failed to import data:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[Persistence] Database connection closed');
    }
  }
}

// Singleton instance for global access
export const persistenceManager = new PersistenceManager();

// Utility functions for common operations
export const PersistenceUtils = {
  /**
   * Generate unique IDs for various entities
   */
  generateId: (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Validate player data structure
   */
  validatePlayerData: (playerData) => {
    const required = ['playerId', 'username'];
    return required.every(field => playerData.hasOwnProperty(field));
  },

  /**
   * Validate deck data structure
   */
  validateDeckData: (deckData) => {
    const required = ['deckId', 'playerId', 'name', 'cards'];
    return required.every(field => deckData.hasOwnProperty(field)) &&
           Array.isArray(deckData.cards) &&
           deckData.cards.length > 0;
  },

  /**
   * Calculate estimated storage size for data
   */
  estimateSize: (data) => {
    return new Blob([JSON.stringify(data)]).size;
  },

  /**
   * Format storage size for display
   */
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};