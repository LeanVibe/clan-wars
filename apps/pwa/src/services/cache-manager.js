/**
 * Cache Manager Service - Manages PWA cache storage and optimization
 * Provides cache statistics, cleanup, and monitoring capabilities
 */

class CacheManager {
  constructor() {
    this.cacheNames = [
      'game-core-scripts',
      'game-components', 
      'game-assets',
      'stylesheets',
      'api-cache',
      'google-fonts-stylesheets',
      'google-fonts-webfonts',
      'cdn-assets',
      'game-data'
    ];
    this.storageQuotaWarningThreshold = 0.8; // 80%
    this.listeners = new Set();
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats() {
    try {
      const stats = {
        caches: {},
        totalSize: 0,
        totalEntries: 0,
        storageQuota: null,
        storageUsage: null,
        storageAvailable: null,
        lastCleanup: localStorage.getItem('cache-last-cleanup'),
        warnings: []
      };

      // Get storage quota information
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        stats.storageQuota = estimate.quota;
        stats.storageUsage = estimate.usage;
        stats.storageAvailable = estimate.quota - estimate.usage;
      }

      // Analyze each cache
      for (const cacheName of this.cacheNames) {
        try {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          let cacheSize = 0;
          const entries = [];

          for (const request of requests) {
            try {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                const size = blob.size;
                cacheSize += size;
                
                entries.push({
                  url: request.url,
                  size: size,
                  method: request.method,
                  cached: response.headers.get('date') || 'unknown'
                });
              }
            } catch (error) {
              console.warn(`[CacheManager] Error analyzing cache entry ${request.url}:`, error);
            }
          }

          stats.caches[cacheName] = {
            size: cacheSize,
            entries: entries.length,
            items: entries.sort((a, b) => b.size - a.size).slice(0, 10) // Top 10 largest
          };

          stats.totalSize += cacheSize;
          stats.totalEntries += entries.length;

        } catch (error) {
          console.warn(`[CacheManager] Error accessing cache ${cacheName}:`, error);
          stats.caches[cacheName] = { size: 0, entries: 0, error: error.message };
        }
      }

      // Generate warnings
      if (stats.storageQuota && stats.storageUsage) {
        const usagePercentage = stats.storageUsage / stats.storageQuota;
        if (usagePercentage > this.storageQuotaWarningThreshold) {
          stats.warnings.push({
            type: 'storage-quota',
            message: `Storage usage is ${(usagePercentage * 100).toFixed(1)}% of available quota`,
            severity: usagePercentage > 0.95 ? 'critical' : 'warning'
          });
        }
      }

      // Check for large caches
      const largeCacheThreshold = 10 * 1024 * 1024; // 10MB
      for (const [cacheName, cache] of Object.entries(stats.caches)) {
        if (cache.size > largeCacheThreshold) {
          stats.warnings.push({
            type: 'large-cache',
            message: `Cache "${cacheName}" is using ${this.formatBytes(cache.size)}`,
            severity: 'info'
          });
        }
      }

      return stats;

    } catch (error) {
      console.error('[CacheManager] Error getting cache stats:', error);
      return {
        caches: {},
        totalSize: 0,
        totalEntries: 0,
        error: error.message,
        warnings: [{ type: 'error', message: 'Unable to analyze cache storage', severity: 'error' }]
      };
    }
  }

  /**
   * Clear specific cache by name
   */
  async clearCache(cacheName) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        await cache.delete(request);
      }
      
      console.log(`[CacheManager] Cleared cache: ${cacheName}`);
      this.notifyListeners('cache-cleared', { cacheName, entriesCleared: requests.length });
      
      return { success: true, entriesCleared: requests.length };
    } catch (error) {
      console.error(`[CacheManager] Error clearing cache ${cacheName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    const results = {};
    let totalCleared = 0;

    for (const cacheName of this.cacheNames) {
      const result = await this.clearCache(cacheName);
      results[cacheName] = result;
      if (result.success) {
        totalCleared += result.entriesCleared;
      }
    }

    // Update last cleanup time
    localStorage.setItem('cache-last-cleanup', Date.now().toString());

    this.notifyListeners('all-caches-cleared', { results, totalCleared });
    return { results, totalCleared };
  }

  /**
   * Clean up old cache entries based on expiration and usage
   */
  async cleanupOldEntries() {
    const stats = await this.getCacheStats();
    const cleanupResults = {};
    let totalCleaned = 0;

    for (const cacheName of this.cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        let cleanedCount = 0;

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const dateHeader = response.headers.get('date');
            const age = dateHeader ? Date.now() - new Date(dateHeader).getTime() : 0;
            
            // Clean entries older than 30 days for most caches
            const maxAge = this.getMaxAgeForCache(cacheName);
            if (age > maxAge) {
              await cache.delete(request);
              cleanedCount++;
            }
          }
        }

        cleanupResults[cacheName] = { cleaned: cleanedCount };
        totalCleaned += cleanedCount;

      } catch (error) {
        console.warn(`[CacheManager] Error cleaning cache ${cacheName}:`, error);
        cleanupResults[cacheName] = { error: error.message };
      }
    }

    localStorage.setItem('cache-last-cleanup', Date.now().toString());
    this.notifyListeners('cleanup-completed', { cleanupResults, totalCleaned });

    return { cleanupResults, totalCleaned };
  }

  /**
   * Get maximum age for specific cache type
   */
  getMaxAgeForCache(cacheName) {
    const maxAges = {
      'game-core-scripts': 30 * 24 * 60 * 60 * 1000, // 30 days
      'game-components': 7 * 24 * 60 * 60 * 1000,    // 7 days
      'game-assets': 90 * 24 * 60 * 60 * 1000,       // 90 days
      'stylesheets': 7 * 24 * 60 * 60 * 1000,        // 7 days
      'api-cache': 1 * 24 * 60 * 60 * 1000,          // 1 day
      'google-fonts-stylesheets': 365 * 24 * 60 * 60 * 1000, // 1 year
      'google-fonts-webfonts': 365 * 24 * 60 * 60 * 1000,    // 1 year
      'cdn-assets': 30 * 24 * 60 * 60 * 1000,        // 30 days
      'game-data': 7 * 24 * 60 * 60 * 1000           // 7 days
    };

    return maxAges[cacheName] || 30 * 24 * 60 * 60 * 1000; // Default 30 days
  }

  /**
   * Preload critical game assets
   */
  async preloadCriticalAssets() {
    const criticalAssets = [
      '/packages/game-core/src/index.js',
      '/packages/game-core/src/data.js',
      '/packages/game-core/src/match.js',
      '/packages/game-core/src/state.js',
      '/src/components/ninja-clan-wars-app.js',
      '/src/components/ninja-battle-canvas.js',
      '/src/components/ninja-hand.js'
    ];

    const cache = await caches.open('game-core-scripts');
    let preloadedCount = 0;

    for (const assetUrl of criticalAssets) {
      try {
        const cachedResponse = await cache.match(assetUrl);
        if (!cachedResponse) {
          const response = await fetch(assetUrl);
          if (response.ok) {
            await cache.put(assetUrl, response);
            preloadedCount++;
          }
        }
      } catch (error) {
        console.warn(`[CacheManager] Failed to preload ${assetUrl}:`, error);
      }
    }

    this.notifyListeners('preload-completed', { preloadedCount, totalAssets: criticalAssets.length });
    return { preloadedCount, totalAssets: criticalAssets.length };
  }

  /**
   * Monitor cache performance
   */
  async monitorCachePerformance() {
    const performance = {
      hitRate: 0,
      missRate: 0,
      averageResponseTime: 0,
      errors: 0,
      timestamp: Date.now()
    };

    // This would be enhanced with actual performance monitoring
    // For now, providing basic structure
    
    return performance;
  }

  /**
   * Get cache recommendations
   */
  async getCacheRecommendations() {
    const stats = await this.getCacheStats();
    const recommendations = [];

    // Storage quota recommendation
    if (stats.storageQuota && stats.storageUsage) {
      const usagePercentage = stats.storageUsage / stats.storageQuota;
      if (usagePercentage > 0.8) {
        recommendations.push({
          type: 'cleanup',
          priority: 'high',
          message: 'Storage usage is high. Consider clearing old cache entries.',
          action: 'cleanup-old-entries'
        });
      }
    }

    // Large cache recommendation
    for (const [cacheName, cache] of Object.entries(stats.caches)) {
      if (cache.size > 20 * 1024 * 1024) { // 20MB
        recommendations.push({
          type: 'optimize',
          priority: 'medium',
          message: `Cache "${cacheName}" is large (${this.formatBytes(cache.size)}). Consider selective cleanup.`,
          action: `clear-cache:${cacheName}`
        });
      }
    }

    // Last cleanup recommendation
    const lastCleanup = localStorage.getItem('cache-last-cleanup');
    if (!lastCleanup || Date.now() - parseInt(lastCleanup) > 7 * 24 * 60 * 60 * 1000) {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        message: 'Cache hasn\'t been cleaned in over a week. Regular cleanup improves performance.',
        action: 'cleanup-old-entries'
      });
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Event listener management
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ type: event, ...data });
      } catch (error) {
        console.error('[CacheManager] Error in listener callback:', error);
      }
    });
  }

  /**
   * Initialize cache manager
   */
  async initialize() {
    try {
      console.log('[CacheManager] Initializing cache management...');
      
      // Preload critical assets
      await this.preloadCriticalAssets();
      
      // Check if cleanup is needed
      const recommendations = await this.getCacheRecommendations();
      const needsCleanup = recommendations.some(r => r.action === 'cleanup-old-entries');
      
      if (needsCleanup) {
        console.log('[CacheManager] Automatic cleanup recommended');
        // Don't auto-cleanup on initialization to avoid blocking startup
        // Just log the recommendation
      }

      this.notifyListeners('initialized', { recommendations });
      
    } catch (error) {
      console.error('[CacheManager] Failed to initialize:', error);
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export { cacheManager, CacheManager };
export default cacheManager;