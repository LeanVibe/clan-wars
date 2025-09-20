/**
 * Game Persistence Bridge
 * High-level integration between game systems and persistence layer
 */

import { persistenceManager, PersistenceUtils } from './persistence.js';
import { rankingSystem } from './ranking.js';
import { createId } from './utils.js';

/**
 * Game Persistence Bridge - manages data flow between game and storage
 */
export class GamePersistenceBridge {
  constructor() {
    this.isInitialized = false;
    this.currentPlayerId = null;
    this.autoSaveEnabled = true;
    this.saveQueue = new Map(); // Queued saves for batch processing
    this.eventHandlers = new Map();
  }

  /**
   * Initialize the persistence bridge and all related systems
   */
  async initialize(playerId) {
    try {
      // Initialize persistence manager
      await persistenceManager.initialize();
      
      // Set current player
      this.currentPlayerId = playerId;
      
      // Load and sync ranking system
      await this._syncRankingSystem();
      
      // Set up auto-save listeners
      this._setupAutoSave();
      
      // Set up event bridges
      this._setupEventBridges();
      
      this.isInitialized = true;
      console.log('[GamePersistenceBridge] Initialization complete');
      
      return {
        success: true,
        playerId,
        storageInfo: await persistenceManager.getStorageInfo()
      };
    } catch (error) {
      console.error('[GamePersistenceBridge] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Sync ranking system with persistence layer
   */
  async _syncRankingSystem() {
    try {
      const savedRankingData = await persistenceManager.loadRankingData();
      if (savedRankingData && Object.keys(savedRankingData).length > 0) {
        rankingSystem.importData(savedRankingData);
        console.log('[GamePersistenceBridge] Ranking data loaded from storage');
      }
      
      // Enable auto-save for ranking system
      rankingSystem.enablePersistence(persistenceManager);
    } catch (error) {
      console.warn('[GamePersistenceBridge] Failed to sync ranking system:', error);
    }
  }

  /**
   * Set up automatic saving for various game events
   */
  _setupAutoSave() {
    if (!this.autoSaveEnabled) return;

    // Set up debounced save operations
    const debouncedSaves = new Map();
    
    const createDebouncedSave = (key, saveFunction, delay = 2000) => {
      return (...args) => {
        if (debouncedSaves.has(key)) {
          clearTimeout(debouncedSaves.get(key));
        }
        
        const timeoutId = setTimeout(async () => {
          try {
            await saveFunction(...args);
            debouncedSaves.delete(key);
          } catch (error) {
            console.error(`[GamePersistenceBridge] Auto-save failed for ${key}:`, error);
          }
        }, delay);
        
        debouncedSaves.set(key, timeoutId);
      };
    };

    // Auto-save player progress
    this.eventHandlers.set('playerProgress', createDebouncedSave(
      'playerProgress',
      this.savePlayerProgress.bind(this)
    ));

    // Auto-save preferences
    this.eventHandlers.set('preferences', createDebouncedSave(
      'preferences',
      this.savePlayerPreferences.bind(this)
    ));
  }

  /**
   * Set up event bridges between game systems and persistence
   */
  _setupEventBridges() {
    // Listen to ranking system events
    rankingSystem.addEventListener('ratingUpdated', (data) => {
      this._handleRatingUpdate(data);
    });

    rankingSystem.addEventListener('rankChanged', (data) => {
      this._handleRankChange(data);
    });

    // Listen to persistence events
    persistenceManager.addEventListener('error', (data) => {
      this._handlePersistenceError(data);
    });

    persistenceManager.addEventListener('storageWarning', (data) => {
      this._handleStorageWarning(data);
    });
  }

  /**
   * Handle rating update events
   */
  async _handleRatingUpdate(data) {
    try {
      // Update player statistics
      const player = await this.getPlayer(data.playerId);
      if (player) {
        player.statistics = player.statistics || {};
        player.statistics.currentRating = data.newRating;
        player.statistics.peakRating = Math.max(
          player.statistics.peakRating || 0,
          data.newRating
        );
        
        await this.savePlayer(player);
      }
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to handle rating update:', error);
    }
  }

  /**
   * Handle rank change events
   */
  async _handleRankChange(data) {
    try {
      // Award achievements for rank ups
      if (data.newRank.minRating > data.oldRank.minRating) {
        await this._awardRankAchievement(data.playerId, data.newRank);
      }
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to handle rank change:', error);
    }
  }

  /**
   * Award achievement for reaching new rank
   */
  async _awardRankAchievement(playerId, rank) {
    try {
      const player = await this.getPlayer(playerId);
      if (!player) return;

      const achievementId = `rank_${rank.id}`;
      const existingAchievement = player.achievements?.find(a => a.id === achievementId);
      
      if (!existingAchievement) {
        player.achievements = player.achievements || [];
        player.achievements.push({
          id: achievementId,
          name: `Reached ${rank.name}`,
          description: `Achieved ${rank.name} rank`,
          unlockedAt: Date.now(),
          category: 'ranking'
        });
        
        await this.savePlayer(player);
        console.log(`[GamePersistenceBridge] Achievement awarded: ${achievementId}`);
      }
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to award rank achievement:', error);
    }
  }

  /**
   * Handle persistence errors
   */
  _handlePersistenceError(data) {
    console.error('[GamePersistenceBridge] Persistence error:', data.error);
    
    // Emit error event for UI to handle
    this._emit('persistenceError', {
      error: data.error,
      context: data.context,
      recoverable: this._isRecoverableError(data.error)
    });
  }

  /**
   * Handle storage warnings
   */
  _handleStorageWarning(data) {
    console.warn('[GamePersistenceBridge] Storage warning:', data.warnings);
    
    // Emit warning for UI
    this._emit('storageWarning', {
      warnings: data.warnings,
      usage: data.usage,
      recommendations: this._getStorageRecommendations(data)
    });
  }

  /**
   * Determine if an error is recoverable
   */
  _isRecoverableError(error) {
    const recoverableMessages = [
      'quota exceeded',
      'transaction inactive',
      'version change'
    ];
    
    const message = error.message?.toLowerCase() || '';
    return recoverableMessages.some(msg => message.includes(msg));
  }

  /**
   * Get storage optimization recommendations
   */
  _getStorageRecommendations(storageData) {
    const recommendations = [];
    const { usage, total } = storageData;

    if (usage.replays?.count > 80) {
      recommendations.push({
        type: 'cleanup',
        target: 'replays',
        message: 'Consider deleting old replays to free up space',
        action: 'cleanupReplays'
      });
    }

    if (usage.matches?.count > 400) {
      recommendations.push({
        type: 'cleanup',
        target: 'matches',
        message: 'Old match history can be archived',
        action: 'archiveMatches'
      });
    }

    if (total.size > 200 * 1024 * 1024) { // 200MB
      recommendations.push({
        type: 'export',
        message: 'Consider exporting data for backup before cleanup',
        action: 'exportData'
      });
    }

    return recommendations;
  }

  // ========== HIGH-LEVEL DATA OPERATIONS ==========

  /**
   * Create or update player profile
   */
  async savePlayer(playerData) {
    try {
      if (!PersistenceUtils.validatePlayerData(playerData)) {
        throw new Error('Invalid player data structure');
      }

      const player = await persistenceManager.savePlayer(playerData);
      
      // Update login time
      await persistenceManager.updatePlayerLogin(player.playerId);
      
      return player;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save player:', error);
      throw error;
    }
  }

  /**
   * Get player profile
   */
  async getPlayer(playerId = this.currentPlayerId) {
    try {
      return await persistenceManager.getPlayer(playerId);
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to get player:', error);
      throw error;
    }
  }

  /**
   * Save player preferences
   */
  async savePlayerPreferences(preferences, playerId = this.currentPlayerId) {
    try {
      await persistenceManager.savePreferences(playerId, preferences);
      this._emit('preferencesSaved', { playerId, preferences });
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save preferences:', error);
      throw error;
    }
  }

  /**
   * Get player preferences
   */
  async getPlayerPreferences(playerId = this.currentPlayerId) {
    try {
      return await persistenceManager.getPreferences(playerId);
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to get preferences:', error);
      return {};
    }
  }

  /**
   * Save player progress (achievements, statistics, etc.)
   */
  async savePlayerProgress(progressData, playerId = this.currentPlayerId) {
    try {
      const player = await this.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }

      // Merge progress data
      player.achievements = progressData.achievements || player.achievements;
      player.statistics = { ...player.statistics, ...progressData.statistics };
      player.settings = { ...player.settings, ...progressData.settings };

      await this.savePlayer(player);
      this._emit('progressSaved', { playerId, progressData });
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save player progress:', error);
      throw error;
    }
  }

  /**
   * Save custom deck
   */
  async saveDeck(deckData, playerId = this.currentPlayerId) {
    try {
      if (!PersistenceUtils.validateDeckData(deckData)) {
        throw new Error('Invalid deck data structure');
      }

      deckData.playerId = playerId;
      deckData.deckId = deckData.deckId || PersistenceUtils.generateId('deck');

      const deck = await persistenceManager.saveDeck(deckData);
      this._emit('deckSaved', { deck });
      
      return deck;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save deck:', error);
      throw error;
    }
  }

  /**
   * Get all decks for current player
   */
  async getPlayerDecks(playerId = this.currentPlayerId) {
    try {
      return await persistenceManager.getPlayerDecks(playerId);
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to get player decks:', error);
      return [];
    }
  }

  /**
   * Delete a deck
   */
  async deleteDeck(deckId) {
    try {
      await persistenceManager.deleteDeck(deckId);
      this._emit('deckDeleted', { deckId });
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to delete deck:', error);
      throw error;
    }
  }

  /**
   * Save match result with full data integration
   */
  async saveMatchResult(matchData, playerId = this.currentPlayerId) {
    try {
      // Generate IDs if not provided
      matchData.matchId = matchData.matchId || PersistenceUtils.generateId('match');
      matchData.playerId = playerId;
      matchData.completedAt = matchData.completedAt || Date.now();

      // Save match data
      const match = await persistenceManager.saveMatch(matchData);

      // Update deck statistics if deck was used
      if (matchData.deckId && matchData.outcome) {
        const won = matchData.outcome === 'win';
        await persistenceManager.updateDeckStats(matchData.deckId, won);
      }

      // Update player statistics
      const player = await this.getPlayer(playerId);
      if (player) {
        player.totalMatches = (player.totalMatches || 0) + 1;
        if (matchData.outcome === 'win') {
          player.totalWins = (player.totalWins || 0) + 1;
        }
        await this.savePlayer(player);
      }

      // Update ranking system
      if (matchData.outcome && matchData.opponentRating) {
        const outcome = matchData.outcome === 'win' ? 1 : matchData.outcome === 'draw' ? 0.5 : 0;
        rankingSystem.updatePlayerRating(
          playerId,
          matchData.opponentRating,
          outcome,
          {
            matchId: match.matchId,
            duration: matchData.duration,
            deckId: matchData.deckId
          }
        );
      }

      this._emit('matchSaved', { match });
      return match;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save match result:', error);
      throw error;
    }
  }

  /**
   * Save match replay
   */
  async saveReplay(replayData, playerId = this.currentPlayerId) {
    try {
      replayData.replayId = replayData.replayId || PersistenceUtils.generateId('replay');
      replayData.playerId = playerId;

      const replay = await persistenceManager.saveReplay(replayData);
      this._emit('replaySaved', { replay });
      
      return replay;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save replay:', error);
      throw error;
    }
  }

  /**
   * Save current game state
   */
  async saveGameState(gameState, metadata = {}, playerId = this.currentPlayerId) {
    try {
      const stateData = {
        stateId: PersistenceUtils.generateId('state'),
        playerId,
        state: gameState,
        matchType: metadata.matchType || 'unknown',
        matchId: metadata.matchId || null,
        ...metadata
      };

      const savedState = await persistenceManager.saveGameState(stateData);
      this._emit('gameStateSaved', { savedState });
      
      return savedState;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to save game state:', error);
      throw error;
    }
  }

  /**
   * Load saved game state
   */
  async loadGameState(stateId) {
    try {
      const gameState = await persistenceManager.loadGameState(stateId);
      if (gameState) {
        this._emit('gameStateLoaded', { gameState });
      }
      return gameState;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to load game state:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive player statistics
   */
  async getPlayerStatistics(playerId = this.currentPlayerId) {
    try {
      const [player, matches, decks, ranking] = await Promise.all([
        this.getPlayer(playerId),
        persistenceManager.getMatchHistory(playerId, 100),
        this.getPlayerDecks(playerId),
        Promise.resolve(rankingSystem.getPlayerRating(playerId))
      ]);

      // Calculate advanced statistics
      const wins = matches.filter(m => m.outcome === 'win').length;
      const losses = matches.filter(m => m.outcome === 'loss').length;
      const draws = matches.filter(m => m.outcome === 'draw').length;
      
      const recentMatches = matches.slice(0, 10);
      const recentWins = recentMatches.filter(m => m.outcome === 'win').length;
      
      return {
        player: player || {},
        ranking,
        matches: {
          total: matches.length,
          wins,
          losses,
          draws,
          winRate: matches.length > 0 ? wins / matches.length : 0,
          recentWinRate: recentMatches.length > 0 ? recentWins / recentMatches.length : 0
        },
        decks: {
          total: decks.length,
          custom: decks.filter(d => d.isCustom).length,
          mostUsed: this._getMostUsedDeck(decks, matches)
        },
        achievements: player?.achievements || [],
        lastActive: player?.lastLoginAt || null
      };
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to get player statistics:', error);
      throw error;
    }
  }

  /**
   * Get most used deck from match history
   */
  _getMostUsedDeck(decks, matches) {
    const deckUsage = new Map();
    
    for (const match of matches) {
      if (match.deckId) {
        deckUsage.set(match.deckId, (deckUsage.get(match.deckId) || 0) + 1);
      }
    }

    if (deckUsage.size === 0) return null;
    
    const mostUsedDeckId = Array.from(deckUsage.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    return decks.find(d => d.deckId === mostUsedDeckId) || null;
  }

  // ========== UTILITY OPERATIONS ==========

  /**
   * Get storage information and recommendations
   */
  async getStorageStatus() {
    try {
      const storageInfo = await persistenceManager.getStorageInfo();
      return {
        ...storageInfo,
        recommendations: this._getStorageRecommendations(storageInfo)
      };
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to get storage status:', error);
      throw error;
    }
  }

  /**
   * Export all player data
   */
  async exportPlayerData(playerId = this.currentPlayerId) {
    try {
      const [allData, player, preferences] = await Promise.all([
        persistenceManager.exportAllData(),
        this.getPlayer(playerId),
        this.getPlayerPreferences(playerId)
      ]);

      // Filter data for specific player
      const playerData = {
        version: allData.version,
        exportedAt: allData.exportedAt,
        playerId,
        player,
        preferences,
        matches: allData.data.matches?.filter(m => m.playerId === playerId) || [],
        decks: allData.data.decks?.filter(d => d.playerId === playerId) || [],
        replays: allData.data.replays?.filter(r => r.playerId === playerId) || [],
        gameStates: allData.data.gameStates?.filter(s => s.playerId === playerId) || [],
        ranking: rankingSystem.getPlayerRating(playerId)
      };

      return playerData;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to export player data:', error);
      throw error;
    }
  }

  /**
   * Clean up old data based on storage limits
   */
  async cleanupOldData(options = {}) {
    try {
      const storageInfo = await persistenceManager.getStorageInfo();
      const results = {
        replaysDeleted: 0,
        matchesArchived: 0,
        statesDeleted: 0,
        spaceSaved: 0
      };

      // Clean up old replays if over limit
      if (storageInfo.usage.replays?.count > STORAGE_LIMITS.MAX_REPLAYS * 0.8) {
        // This would need to be implemented in persistence manager
        console.log('[GamePersistenceBridge] Replay cleanup needed');
      }

      // Clean up old saved states
      if (storageInfo.usage.gameStates?.count > 20) {
        // This would need to be implemented in persistence manager
        console.log('[GamePersistenceBridge] Game state cleanup needed');
      }

      this._emit('dataCleanup', results);
      return results;
    } catch (error) {
      console.error('[GamePersistenceBridge] Failed to cleanup old data:', error);
      throw error;
    }
  }

  // ========== EVENT MANAGEMENT ==========

  /**
   * Add event listener
   */
  addEventListener(event, listener) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, listener) {
    const listeners = this.eventHandlers.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  _emit(event, data) {
    const listeners = this.eventHandlers.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[GamePersistenceBridge] Error in event listener for ${event}:`, error);
      }
    }
  }

  /**
   * Enable or disable auto-save
   */
  setAutoSave(enabled) {
    this.autoSaveEnabled = enabled;
    if (enabled) {
      this._setupAutoSave();
    }
  }

  /**
   * Close and cleanup
   */
  close() {
    this.eventHandlers.clear();
    persistenceManager.close();
    this.isInitialized = false;
  }
}

// Singleton instance for global access
export const gamePersistenceBridge = new GamePersistenceBridge();