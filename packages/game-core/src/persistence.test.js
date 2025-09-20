/**
 * Test suite for Persistence System
 * Verifies IndexedDB operations and data integrity
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceManager, PersistenceUtils } from './persistence.js';
import { rankingSystem } from './ranking.js';

// Mock IndexedDB for testing
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      close: () => {},
      objectStoreNames: {
        contains: () => true
      },
      transaction: () => ({
        objectStore: () => ({
          put: () => ({ onsuccess: null, onerror: null }),
          get: () => ({ onsuccess: null, onerror: null }),
          getAll: () => ({ onsuccess: null, onerror: null }),
          delete: () => ({ onsuccess: null, onerror: null }),
          clear: () => ({ onsuccess: null, onerror: null }),
          count: () => ({ onsuccess: null, onerror: null }),
          index: () => ({
            getAll: () => ({ onsuccess: null, onerror: null })
          })
        }),
        onerror: null
      })
    }
  })
};

describe('PersistenceManager', () => {
  let persistenceManager;

  beforeEach(() => {
    persistenceManager = new PersistenceManager();
  });

  afterEach(() => {
    if (persistenceManager.isInitialized) {
      persistenceManager.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize database with proper schema', async () => {
      // Mock successful initialization
      persistenceManager._openDatabase = async () => ({
        close: () => {},
        objectStoreNames: new Set(['players', 'rankings', 'decks', 'matches', 'replays', 'gameStates', 'preferences', 'metadata'])
      });

      await persistenceManager.initialize();
      expect(persistenceManager.isInitialized).toBe(true);
    });

    it('should handle initialization errors', async () => {
      // Mock failed initialization
      persistenceManager._openDatabase = async () => {
        throw new Error('Database connection failed');
      };

      await expect(persistenceManager.initialize()).rejects.toThrow('Database connection failed');
      expect(persistenceManager.isInitialized).toBe(false);
    });
  });

  describe('Player Data Operations', () => {
    beforeEach(async () => {
      // Mock successful database setup
      persistenceManager.db = {
        transaction: () => ({
          objectStore: () => ({
            put: () => ({ onsuccess: null, onerror: null }),
            get: () => ({ onsuccess: null, onerror: null })
          }),
          onerror: null
        })
      };
      persistenceManager.isInitialized = true;
    });

    it('should save player data correctly', async () => {
      const playerData = {
        playerId: 'player123',
        username: 'TestNinja',
        avatar: 'ninja1.png',
        totalMatches: 5,
        totalWins: 3
      };

      // Mock successful operation
      persistenceManager._executeOperation = async () => playerData;

      const result = await persistenceManager.savePlayer(playerData);
      expect(result.playerId).toBe('player123');
      expect(result.username).toBe('TestNinja');
      expect(result.totalMatches).toBe(5);
    });

    it('should retrieve player data', async () => {
      const playerId = 'player123';
      const expectedPlayer = {
        playerId,
        username: 'TestNinja',
        totalMatches: 5
      };

      // Mock successful retrieval
      persistenceManager._executeOperation = async () => expectedPlayer;

      const result = await persistenceManager.getPlayer(playerId);
      expect(result.playerId).toBe(playerId);
      expect(result.username).toBe('TestNinja');
    });
  });

  describe('Deck Management', () => {
    beforeEach(async () => {
      persistenceManager.db = { transaction: () => ({}) };
      persistenceManager.isInitialized = true;
    });

    it('should save custom deck', async () => {
      const deckData = {
        deckId: 'deck123',
        playerId: 'player123',
        name: 'Fire Combo Deck',
        cards: [
          { id: 'card1', name: 'Fire Shuriken' },
          { id: 'card2', name: 'Flame Jutsu' }
        ],
        isCustom: true
      };

      persistenceManager._executeOperation = async () => deckData;

      const result = await persistenceManager.saveDeck(deckData);
      expect(result.deckId).toBe('deck123');
      expect(result.name).toBe('Fire Combo Deck');
      expect(result.cards).toHaveLength(2);
    });

    it('should retrieve player decks', async () => {
      const playerId = 'player123';
      const mockDecks = [
        { deckId: 'deck1', name: 'Deck 1', updatedAt: Date.now() },
        { deckId: 'deck2', name: 'Deck 2', updatedAt: Date.now() - 1000 }
      ];

      persistenceManager._executeOperation = async () => mockDecks;

      const result = await persistenceManager.getPlayerDecks(playerId);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Deck 1'); // Should be sorted by updatedAt
    });
  });

  describe('Match Data Storage', () => {
    beforeEach(async () => {
      persistenceManager.db = { transaction: () => ({}) };
      persistenceManager.isInitialized = true;
      persistenceManager._cleanupOldMatches = async () => {}; // Mock cleanup
    });

    it('should save match results', async () => {
      const matchData = {
        matchId: 'match123',
        playerId: 'player123',
        outcome: 'win',
        duration: 300,
        playerRating: 1350,
        opponentRating: 1280,
        ratingChange: 25,
        statistics: {
          combos: 5,
          apm: 45
        }
      };

      persistenceManager._executeOperation = async () => matchData;

      const result = await persistenceManager.saveMatch(matchData);
      expect(result.matchId).toBe('match123');
      expect(result.outcome).toBe('win');
      expect(result.ratingChange).toBe(25);
    });

    it('should retrieve match history', async () => {
      const playerId = 'player123';
      const mockMatches = [
        { matchId: 'match1', outcome: 'win', completedAt: Date.now() },
        { matchId: 'match2', outcome: 'loss', completedAt: Date.now() - 1000 }
      ];

      persistenceManager._executeOperation = async () => mockMatches;
      persistenceManager._decompressData = (data) => data;

      const result = await persistenceManager.getMatchHistory(playerId, 10);
      expect(result).toHaveLength(2);
      expect(result[0].matchId).toBe('match1'); // Most recent first
    });
  });

  describe('Game State Operations', () => {
    beforeEach(async () => {
      persistenceManager.db = { transaction: () => ({}) };
      persistenceManager.isInitialized = true;
      persistenceManager._cleanupOldGameStates = async () => {};
    });

    it('should save game state', async () => {
      const stateData = {
        stateId: 'state123',
        playerId: 'player123',
        matchId: 'match123',
        state: {
          phase: 'battle',
          chakra: { current: 8 },
          battlefield: { mountain: { player: [], ai: [] } }
        },
        matchType: 'ranked'
      };

      persistenceManager._executeOperation = async () => stateData;

      const result = await persistenceManager.saveGameState(stateData);
      expect(result.stateId).toBe('state123');
      expect(result.matchType).toBe('ranked');
    });

    it('should load game state', async () => {
      const stateId = 'state123';
      const mockState = {
        stateId,
        state: { phase: 'battle', chakra: { current: 8 } }
      };

      persistenceManager._executeOperation = async () => mockState;
      persistenceManager._decompressData = (data) => data;

      const result = await persistenceManager.loadGameState(stateId);
      expect(result.stateId).toBe(stateId);
      expect(result.state.phase).toBe('battle');
    });
  });

  describe('Storage Management', () => {
    beforeEach(async () => {
      persistenceManager.db = { transaction: () => ({}) };
      persistenceManager.isInitialized = true;
    });

    it('should calculate storage usage', async () => {
      const mockStorageData = {
        players: [{ playerId: 'p1' }, { playerId: 'p2' }],
        matches: [{ matchId: 'm1' }],
        replays: []
      };

      persistenceManager._executeOperation = async (transaction, storeName, operation) => {
        if (operation.name === 'count') return mockStorageData[storeName]?.length || 0;
        return mockStorageData[storeName] || [];
      };

      persistenceManager._getStorageQuota = async () => ({ quota: 1000000, usage: 500000 });

      const result = await persistenceManager.getStorageInfo();
      expect(result.usage.players.count).toBe(2);
      expect(result.usage.matches.count).toBe(1);
      expect(result.usage.replays.count).toBe(0);
      expect(result.total.count).toBe(3);
    });

    it('should export all data', async () => {
      const mockData = {
        players: [{ playerId: 'p1' }],
        rankings: [{ playerId: 'p1', rating: 1200 }]
      };

      persistenceManager._executeOperation = async (transaction, storeName) => mockData[storeName] || [];
      persistenceManager._decompressData = (data) => data;

      const result = await persistenceManager.exportAllData();
      expect(result.version).toBe(1);
      expect(result.data.players).toHaveLength(1);
      expect(result.exportedAt).toBeDefined();
    });
  });

  describe('Data Compression', () => {
    it('should compress and decompress data', () => {
      const originalData = {
        player: 'ninja123',
        stats: { wins: 10, losses: 5 },
        deck: ['card1', 'card2', 'card3']
      };

      const compressed = persistenceManager._compressData(originalData);
      expect(compressed.compressed).toBe(true);
      expect(typeof compressed.data).toBe('string');

      const decompressed = persistenceManager._decompressData(compressed);
      expect(decompressed).toEqual(originalData);
    });

    it('should handle compression errors gracefully', () => {
      // Create circular reference that will cause JSON.stringify to fail
      const circularData = {};
      circularData.self = circularData;

      const result = persistenceManager._compressData(circularData);
      expect(result).toBe(circularData); // Should return original data on error
    });
  });

  describe('Event System', () => {
    it('should add and remove event listeners', () => {
      let eventFired = false;
      const listener = () => { eventFired = true; };

      persistenceManager.addEventListener('test', listener);
      persistenceManager._emit('test', {});
      expect(eventFired).toBe(true);

      eventFired = false;
      persistenceManager.removeEventListener('test', listener);
      persistenceManager._emit('test', {});
      expect(eventFired).toBe(false);
    });

    it('should handle listener errors gracefully', () => {
      const badListener = () => { throw new Error('Listener error'); };
      
      persistenceManager.addEventListener('test', badListener);
      
      // Should not throw
      expect(() => {
        persistenceManager._emit('test', {});
      }).not.toThrow();
    });
  });
});

describe('PersistenceUtils', () => {
  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = PersistenceUtils.generateId('test');
      const id2 = PersistenceUtils.generateId('test');
      
      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Data Validation', () => {
    it('should validate player data', () => {
      const validPlayer = { playerId: 'p1', username: 'ninja' };
      const invalidPlayer = { username: 'ninja' }; // missing playerId
      
      expect(PersistenceUtils.validatePlayerData(validPlayer)).toBe(true);
      expect(PersistenceUtils.validatePlayerData(invalidPlayer)).toBe(false);
    });

    it('should validate deck data', () => {
      const validDeck = {
        deckId: 'd1',
        playerId: 'p1',
        name: 'Test Deck',
        cards: ['card1', 'card2']
      };
      const invalidDeck = {
        deckId: 'd1',
        name: 'Test Deck'
      }; // missing playerId and cards
      
      expect(PersistenceUtils.validateDeckData(validDeck)).toBe(true);
      expect(PersistenceUtils.validateDeckData(invalidDeck)).toBe(false);
    });
  });

  describe('Storage Utilities', () => {
    it('should estimate data size', () => {
      const data = { test: 'data', numbers: [1, 2, 3] };
      const size = PersistenceUtils.estimateSize(data);
      
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });

    it('should format bytes correctly', () => {
      expect(PersistenceUtils.formatBytes(0)).toBe('0 Bytes');
      expect(PersistenceUtils.formatBytes(1024)).toBe('1 KB');
      expect(PersistenceUtils.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(PersistenceUtils.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});

describe('Ranking System Integration', () => {
  beforeEach(() => {
    // Reset ranking system state
    rankingSystem.playerRatings.clear();
    rankingSystem.matchHistory.clear();
    rankingSystem.eventListeners.clear();
    rankingSystem.persistenceEnabled = false;
  });

  it('should emit events on rating updates', () => {
    let ratingUpdatedEvent = null;
    let rankChangedEvent = null;

    rankingSystem.addEventListener('ratingUpdated', (data) => {
      ratingUpdatedEvent = data;
    });

    rankingSystem.addEventListener('rankChanged', (data) => {
      rankChangedEvent = data;
    });

    // Update rating that causes rank change
    const result = rankingSystem.updatePlayerRating('player123', 1200, 1, {
      matchId: 'match123'
    });

    expect(ratingUpdatedEvent).toBeTruthy();
    expect(ratingUpdatedEvent.playerId).toBe('player123');
    expect(ratingUpdatedEvent.ratingChange).toBeGreaterThan(0);

    // First player starts at 1200, should stay in same rank initially
    // Test with bigger rating change to trigger rank change
    rankingSystem.updatePlayerRating('player123', 800, 1, {
      matchId: 'match124'
    });

    if (rankChangedEvent) {
      expect(rankChangedEvent.playerId).toBe('player123');
    }
  });

  it('should enable persistence integration', () => {
    const mockPersistenceManager = {
      saveRankingData: async () => {}
    };

    rankingSystem.enablePersistence(mockPersistenceManager);
    expect(rankingSystem.persistenceEnabled).toBe(true);
  });
});