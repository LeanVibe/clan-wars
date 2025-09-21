/**
 * Offline Replay Service - Enables replay functionality when offline
 * Integrates with service worker and IndexedDB for seamless offline experience
 */

class OfflineReplayService {
  constructor() {
    this.dbName = 'ninja-clan-wars-replays';
    this.dbVersion = 1;
    this.storeName = 'cached-replays';
    this.db = null;
    this.serviceWorkerRegistration = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];

    this.init();
  }

  async init() {
    try {
      // Initialize IndexedDB for offline replay caching
      await this.initDatabase();
      
      // Register service worker if not already registered
      await this.registerServiceWorker();
      
      // Setup online/offline listeners
      this.setupNetworkListeners();
      
      // Sync pending replays when coming online
      if (this.isOnline) {
        await this.syncPendingReplays();
      }

      console.log('[OfflineReplay] Service initialized successfully');
    } catch (error) {
      console.error('[OfflineReplay] Failed to initialize:', error);
    }
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'replayId' });
          store.createIndex('matchId', 'matchId', { unique: false });
          store.createIndex('playerId', 'playerId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('[OfflineReplay] Service Worker registered');
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.warn('[OfflineReplay] Service Worker registration failed:', error);
      }
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', async () => {
      this.isOnline = true;
      console.log('[OfflineReplay] Network online - syncing replays');
      await this.syncPendingReplays();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[OfflineReplay] Network offline - enabling offline mode');
    });
  }

  /**
   * Cache replay data for offline access
   */
  async cacheReplay(replayData) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const cacheEntry = {
      replayId: replayData.replayId,
      matchId: replayData.matchId,
      playerId: replayData.playerId,
      data: replayData.data,
      metadata: replayData.metadata,
      timestamp: Date.now(),
      synced: this.isOnline,
      size: JSON.stringify(replayData.data).length
    };

    try {
      await store.put(cacheEntry);
      console.log(`[OfflineReplay] Cached replay ${replayData.replayId}`);
      
      // Add to sync queue if offline
      if (!this.isOnline) {
        this.syncQueue.push(replayData.replayId);
      }
      
      return cacheEntry;
    } catch (error) {
      console.error('[OfflineReplay] Failed to cache replay:', error);
      throw error;
    }
  }

  /**
   * Retrieve replay from cache (works offline)
   */
  async getCachedReplay(replayId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(replayId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all cached replays for a player
   */
  async getPlayerCachedReplays(playerId, limit = 20) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('playerId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(playerId);
      request.onsuccess = () => {
        const replays = request.result
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        resolve(replays);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending replays when online
   */
  async syncPendingReplays() {
    if (!this.isOnline || !this.db) {
      return;
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('synced');
    
    try {
      const unsyncedReplays = await new Promise((resolve, reject) => {
        const request = index.getAll(false);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const replay of unsyncedReplays) {
        try {
          // Attempt to sync with main persistence system
          await this.syncReplayToMain(replay);
          
          // Mark as synced
          replay.synced = true;
          await store.put(replay);
          
          console.log(`[OfflineReplay] Synced replay ${replay.replayId}`);
        } catch (error) {
          console.warn(`[OfflineReplay] Failed to sync replay ${replay.replayId}:`, error);
        }
      }

      // Clear sync queue
      this.syncQueue = [];
    } catch (error) {
      console.error('[OfflineReplay] Failed to sync replays:', error);
    }
  }

  /**
   * Sync replay to main persistence system
   */
  async syncReplayToMain(replay) {
    // Import the game persistence bridge dynamically to avoid circular dependencies
    const { GamePersistenceBridge } = await import('@clan-wars/game-core');
    const bridge = new GamePersistenceBridge();
    
    return bridge.saveReplay({
      replayId: replay.replayId,
      matchId: replay.matchId,
      data: replay.data,
      metadata: replay.metadata
    }, replay.playerId);
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'REPLAY_CACHE_REQUEST':
        this.handleCacheRequest(data);
        break;
      case 'REPLAY_SYNC_STATUS':
        this.handleSyncStatus(data);
        break;
      default:
        console.log('[OfflineReplay] Unknown service worker message:', type);
    }
  }

  async handleCacheRequest(data) {
    try {
      await this.cacheReplay(data.replay);
      
      // Notify service worker of successful cache
      if (this.serviceWorkerRegistration?.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'REPLAY_CACHED',
          replayId: data.replay.replayId
        });
      }
    } catch (error) {
      console.error('[OfflineReplay] Failed to cache replay from SW:', error);
    }
  }

  handleSyncStatus(data) {
    console.log('[OfflineReplay] Sync status update:', data);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.db) {
      return { replays: 0, size: 0, synced: 0, pending: 0 };
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const replays = request.result;
        const stats = {
          replays: replays.length,
          size: replays.reduce((total, r) => total + (r.size || 0), 0),
          synced: replays.filter(r => r.synced).length,
          pending: replays.filter(r => !r.synced).length
        };
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear old cached replays to manage storage
   */
  async clearOldCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    if (!this.db) {
      return;
    }

    const cutoff = Date.now() - maxAge;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');
    
    try {
      const oldReplays = await new Promise((resolve, reject) => {
        const request = index.getAll(IDBKeyRange.upperBound(cutoff));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const replay of oldReplays) {
        if (replay.synced) { // Only delete synced replays
          await store.delete(replay.replayId);
        }
      }

      console.log(`[OfflineReplay] Cleared ${oldReplays.filter(r => r.synced).length} old cached replays`);
    } catch (error) {
      console.error('[OfflineReplay] Failed to clear old cache:', error);
    }
  }
}

// Create singleton instance
const offlineReplayService = new OfflineReplayService();

export { offlineReplayService, OfflineReplayService };
export default offlineReplayService;