/**
 * Comprehensive Analytics Infrastructure for Ninja Clan Wars
 * Privacy-first design with local aggregation and optional reporting
 * Provides actionable insights for game balance, player retention, and competitive integrity
 */

import { persistenceManager } from './persistence.js';
import { combatEvents } from './combat-events.js';

/**
 * Privacy-first analytics configuration
 */
const ANALYTICS_CONFIG = {
  // Data retention periods (in milliseconds)
  RETENTION: {
    RAW_EVENTS: 7 * 24 * 60 * 60 * 1000, // 7 days
    AGGREGATED_DATA: 90 * 24 * 60 * 60 * 1000, // 90 days
    PERFORMANCE_METRICS: 30 * 24 * 60 * 60 * 1000, // 30 days
    SESSION_DATA: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  
  // Performance monitoring thresholds
  PERFORMANCE: {
    SLOW_LOAD_THRESHOLD: 3000, // 3 seconds
    LOW_FPS_THRESHOLD: 30, // Below 30 FPS
    HIGH_MEMORY_THRESHOLD: 100 * 1024 * 1024, // 100MB
    ERROR_SAMPLE_RATE: 1.0 // Sample all errors
  },
  
  // Batch processing configuration
  BATCHING: {
    MAX_BATCH_SIZE: 100,
    FLUSH_INTERVAL: 60000, // 1 minute
    MAX_MEMORY_USAGE: 10 * 1024 * 1024 // 10MB
  },
  
  // Privacy settings
  PRIVACY: {
    ANONYMIZE_USER_DATA: true,
    EXCLUDE_PII: true,
    LOCAL_PROCESSING_ONLY: true,
    OPTIONAL_REPORTING: true
  }
};

/**
 * Core Analytics Engine
 */
export class AnalyticsEngine {
  constructor() {
    this.isInitialized = false;
    this.eventQueue = [];
    this.sessionData = null;
    this.performanceObserver = null;
    this.frameTimes = [];
    this.eventListeners = new Map();
    
    // Event type registry for validation
    this.eventTypes = new Set([
      // Player Behavior Events
      'session_start', 'session_end', 'session_pause', 'session_resume',
      'match_start', 'match_end', 'match_abandon', 'match_pause',
      'feature_use', 'screen_view', 'user_action', 'progression_event',
      
      // Performance Events
      'page_load', 'asset_load', 'render_frame', 'memory_usage',
      'error_occurred', 'crash_detected', 'network_request',
      
      // Game Balance Events
      'card_played', 'combo_executed', 'unit_spawned', 'unit_destroyed',
      'damage_dealt', 'healing_applied', 'terrain_effect', 'match_outcome',
      
      // Competitive Events
      'ranking_change', 'matchmaking_queue', 'tournament_event',
      'spectator_action', 'leaderboard_view'
    ]);
    
    this.processingQueue = [];
    this.flushTimer = null;
  }

  /**
   * Initialize the analytics system
   */
  async initialize(deps = {}) {
    try {
      if (this.isInitialized) return;

      // Set up dependencies (allow injection for testing)
      this.persistenceManager = deps.persistenceManager || persistenceManager;
      this.combatEvents = deps.combatEvents || combatEvents;

      // Initialize persistence if not already done
      if (!this.persistenceManager.isInitialized) {
        await this.persistenceManager.initialize();
      }

      // Set up event listeners
      this._setupEventListeners();
      
      // Initialize performance monitoring
      this._initializePerformanceMonitoring();
      
      // Start session tracking
      await this._startSession();
      
      // Set up periodic flushing
      this._setupPeriodicFlushing();
      
      // Clean up old data
      await this._cleanupOldData();
      
      this.isInitialized = true;
      console.log('[Analytics] System initialized successfully');
      
      this.trackEvent('analytics_initialized', {
        timestamp: Date.now(),
        version: '1.0.0'
      });
      
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Track a custom event with automatic validation and enrichment
   */
  trackEvent(eventType, data = {}, options = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('[Analytics] System not initialized, queuing event');
        this.eventQueue.push({ eventType, data, options, timestamp: Date.now() });
        return;
      }

      // Validate event type
      if (!this.eventTypes.has(eventType)) {
        console.warn(`[Analytics] Unknown event type: ${eventType}`);
      }

      // Create enriched event
      const event = this._enrichEvent({
        type: eventType,
        data: this._sanitizeData(data),
        timestamp: Date.now(),
        sessionId: this.sessionData?.sessionId,
        ...options
      });

      // Add to processing queue
      this.processingQueue.push(event);
      
      // Emit to real-time listeners
      this._emitToListeners(eventType, event);
      
      // Check if we need to flush
      if (this.processingQueue.length >= ANALYTICS_CONFIG.BATCHING.MAX_BATCH_SIZE) {
        this._flushEvents();
      }

    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * Get analytics insights for a specific category
   */
  async getInsights(category, timeRange = 7 * 24 * 60 * 60 * 1000) {
    try {
      const endTime = Date.now();
      const startTime = endTime - timeRange;

      switch (category) {
        case 'player_behavior':
          return await this._getPlayerBehaviorInsights(startTime, endTime);
        case 'performance':
          return await this._getPerformanceInsights(startTime, endTime);
        case 'game_balance':
          return await this._getGameBalanceInsights(startTime, endTime);
        case 'competitive':
          return await this._getCompetitiveInsights(startTime, endTime);
        default:
          throw new Error(`Unknown insights category: ${category}`);
      }
    } catch (error) {
      console.error(`[Analytics] Failed to get ${category} insights:`, error);
      throw error;
    }
  }

  /**
   * Export anonymized analytics data
   */
  async exportData(options = {}) {
    try {
      const {
        timeRange = 30 * 24 * 60 * 60 * 1000,
        categories = ['all'],
        format = 'json',
        anonymize = true
      } = options;

      const endTime = Date.now();
      const startTime = endTime - timeRange;
      
      const exportData = {
        metadata: {
          exportedAt: Date.now(),
          timeRange: { startTime, endTime },
          categories,
          anonymized: anonymize,
          version: '1.0.0'
        },
        data: {}
      };

      // Export requested categories
      if (categories.includes('all') || categories.includes('player_behavior')) {
        exportData.data.playerBehavior = await this._exportPlayerBehaviorData(startTime, endTime, anonymize);
      }
      
      if (categories.includes('all') || categories.includes('performance')) {
        exportData.data.performance = await this._exportPerformanceData(startTime, endTime, anonymize);
      }
      
      if (categories.includes('all') || categories.includes('game_balance')) {
        exportData.data.gameBalance = await this._exportGameBalanceData(startTime, endTime, anonymize);
      }
      
      if (categories.includes('all') || categories.includes('competitive')) {
        exportData.data.competitive = await this._exportCompetitiveData(startTime, endTime, anonymize);
      }

      return format === 'json' ? exportData : this._formatData(exportData, format);
      
    } catch (error) {
      console.error('[Analytics] Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time analytics events
   */
  subscribe(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(callback);
    
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Get real-time system health metrics
   */
  getSystemHealth() {
    return {
      analytics: {
        initialized: this.isInitialized,
        queueSize: this.processingQueue.length,
        memoryUsage: this._estimateMemoryUsage(),
        lastFlush: this.lastFlushTime
      },
      performance: this._getCurrentPerformanceMetrics(),
      session: this.sessionData ? {
        id: this.sessionData.sessionId,
        startTime: this.sessionData.startTime,
        duration: Date.now() - this.sessionData.startTime,
        eventCount: this.sessionData.eventCount
      } : null
    };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Set up event listeners for automatic tracking
   */
  _setupEventListeners() {
    // Combat events integration
    this.combatEvents.subscribe((event) => {
      if (event) {
        this.trackEvent('combat_event', {
          combatEventType: event.type,
          combatData: event.data
        });
      }
    });

    // Page visibility tracking
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent('session_pause');
        } else {
          this.trackEvent('session_resume');
        }
      });
    }

    // Error tracking
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackEvent('error_occurred', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack?.substring(0, 500) // Limit stack trace size
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackEvent('error_occurred', {
          type: 'unhandled_promise_rejection',
          reason: event.reason?.toString().substring(0, 500)
        });
      });
    }
  }

  /**
   * Initialize performance monitoring
   */
  _initializePerformanceMonitoring() {
    // Frame rate monitoring
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      let lastFrameTime = performance.now();
      
      const measureFrame = (currentTime) => {
        const frameTime = currentTime - lastFrameTime;
        this.frameTimes.push(frameTime);
        
        // Keep only recent frame times
        if (this.frameTimes.length > 60) { // Keep 1 second at 60fps
          this.frameTimes.shift();
        }
        
        // Track low FPS
        const fps = 1000 / frameTime;
        if (fps < ANALYTICS_CONFIG.PERFORMANCE.LOW_FPS_THRESHOLD) {
          this.trackEvent('render_frame', {
            fps,
            frameTime,
            lowPerformance: true
          });
        }
        
        lastFrameTime = currentTime;
        window.requestAnimationFrame(measureFrame);
      };
      
      window.requestAnimationFrame(measureFrame);
    }

    // Memory usage monitoring
    if (typeof performance !== 'undefined' && performance.memory) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        const memoryUsage = memoryInfo.usedJSHeapSize;
        
        if (memoryUsage > ANALYTICS_CONFIG.PERFORMANCE.HIGH_MEMORY_THRESHOLD) {
          this.trackEvent('memory_usage', {
            usedJSHeapSize: memoryInfo.usedJSHeapSize,
            totalJSHeapSize: memoryInfo.totalJSHeapSize,
            jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
            highUsage: true
          });
        }
      }, 30000); // Check every 30 seconds
    }

    // Page load performance
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          
          this.trackEvent('page_load', {
            loadTime,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: performance.getEntriesByType('paint')
              .find(entry => entry.name === 'first-paint')?.startTime,
            slowLoad: loadTime > ANALYTICS_CONFIG.PERFORMANCE.SLOW_LOAD_THRESHOLD
          });
        }, 1000);
      });
    }
  }

  /**
   * Start a new analytics session
   */
  async _startSession() {
    this.sessionData = {
      sessionId: this._generateSessionId(),
      startTime: Date.now(),
      eventCount: 0,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null
    };

    this.trackEvent('session_start', {
      sessionId: this.sessionData.sessionId,
      userAgent: this._anonymizeUserAgent(this.sessionData.userAgent),
      viewport: this.sessionData.viewport
    });
  }

  /**
   * Set up periodic event flushing
   */
  _setupPeriodicFlushing() {
    this.flushTimer = setInterval(() => {
      if (this.processingQueue.length > 0) {
        this._flushEvents();
      }
    }, ANALYTICS_CONFIG.BATCHING.FLUSH_INTERVAL);
  }

  /**
   * Flush events to persistent storage
   */
  async _flushEvents() {
    if (this.processingQueue.length === 0) return;

    try {
      const events = [...this.processingQueue];
      this.processingQueue = [];
      
      // Batch store events
      await this._storeEvents(events);
      
      // Update session event count
      if (this.sessionData) {
        this.sessionData.eventCount += events.length;
      }
      
      this.lastFlushTime = Date.now();
      
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-queue events for retry
      this.processingQueue.unshift(...events);
    }
  }

  /**
   * Store events in persistent storage
   */
  async _storeEvents(events) {
    const analyticsData = {
      batchId: this._generateBatchId(),
      timestamp: Date.now(),
      events: events,
      sessionId: this.sessionData?.sessionId
    };

    // Store raw events with expiration
    await this.persistenceManager.setMetadata(
      `analytics_batch_${analyticsData.batchId}`,
      analyticsData
    );

    // Update aggregated metrics
    await this._updateAggregatedMetrics(events);
  }

  /**
   * Update aggregated analytics metrics
   */
  async _updateAggregatedMetrics(events) {
    const currentMetrics = await this.persistenceManager.getMetadata('analytics_aggregated') || {
      value: {
        playerBehavior: {},
        performance: {},
        gameBalance: {},
        competitive: {},
        lastUpdated: Date.now()
      }
    };

    const metrics = currentMetrics.value;

    // Process each event for aggregation
    for (const event of events) {
      switch (event.category || this._categorizeEvent(event.type)) {
        case 'player_behavior':
          this._aggregatePlayerBehaviorMetrics(metrics.playerBehavior, event);
          break;
        case 'performance':
          this._aggregatePerformanceMetrics(metrics.performance, event);
          break;
        case 'game_balance':
          this._aggregateGameBalanceMetrics(metrics.gameBalance, event);
          break;
        case 'competitive':
          this._aggregateCompetitiveMetrics(metrics.competitive, event);
          break;
      }
    }

    metrics.lastUpdated = Date.now();
    await this.persistenceManager.setMetadata('analytics_aggregated', metrics);
  }

  /**
   * Categorize event type for aggregation
   */
  _categorizeEvent(eventType) {
    const categories = {
      player_behavior: ['session_', 'match_', 'feature_', 'screen_', 'user_', 'progression_'],
      performance: ['page_', 'asset_', 'render_', 'memory_', 'error_', 'crash_', 'network_'],
      game_balance: ['card_', 'combo_', 'unit_', 'damage_', 'healing_', 'terrain_', 'combat_'],
      competitive: ['ranking_', 'matchmaking_', 'tournament_', 'spectator_', 'leaderboard_']
    };

    for (const [category, prefixes] of Object.entries(categories)) {
      if (prefixes.some(prefix => eventType.startsWith(prefix))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Aggregate player behavior metrics
   */
  _aggregatePlayerBehaviorMetrics(metrics, event) {
    if (!metrics.sessions) metrics.sessions = { total: 0, averageDuration: 0, dailyActive: {} };
    if (!metrics.engagement) metrics.engagement = { featuresUsed: {}, screenViews: {} };
    if (!metrics.retention) metrics.retention = { dailyUsers: {}, returningUsers: {} };

    const eventDate = new Date(event.timestamp).toDateString();

    switch (event.type) {
      case 'session_start':
        metrics.sessions.total++;
        metrics.retention.dailyUsers[eventDate] = (metrics.retention.dailyUsers[eventDate] || 0) + 1;
        break;
        
      case 'session_end':
        if (event.data.duration) {
          const currentAvg = metrics.sessions.averageDuration;
          const total = metrics.sessions.total;
          metrics.sessions.averageDuration = ((currentAvg * (total - 1)) + event.data.duration) / total;
        }
        break;
        
      case 'feature_use':
        if (event.data.feature) {
          metrics.engagement.featuresUsed[event.data.feature] = 
            (metrics.engagement.featuresUsed[event.data.feature] || 0) + 1;
        }
        break;
        
      case 'screen_view':
        if (event.data.screen) {
          metrics.engagement.screenViews[event.data.screen] = 
            (metrics.engagement.screenViews[event.data.screen] || 0) + 1;
        }
        break;
    }
  }

  /**
   * Aggregate performance metrics
   */
  _aggregatePerformanceMetrics(metrics, event) {
    if (!metrics.loadTimes) metrics.loadTimes = { average: 0, samples: 0 };
    if (!metrics.frameRates) metrics.frameRates = { average: 0, samples: 0, belowThreshold: 0 };
    if (!metrics.errors) metrics.errors = { total: 0, byType: {} };
    if (!metrics.memory) metrics.memory = { peakUsage: 0, averageUsage: 0, samples: 0 };

    switch (event.type) {
      case 'page_load':
        if (event.data.loadTime) {
          const current = metrics.loadTimes;
          current.average = ((current.average * current.samples) + event.data.loadTime) / (current.samples + 1);
          current.samples++;
        }
        break;
        
      case 'render_frame':
        if (event.data.fps) {
          const current = metrics.frameRates;
          current.average = ((current.average * current.samples) + event.data.fps) / (current.samples + 1);
          current.samples++;
          
          if (event.data.lowPerformance) {
            current.belowThreshold++;
          }
        }
        break;
        
      case 'error_occurred':
        metrics.errors.total++;
        const errorType = event.data.type || 'unknown';
        metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
        break;
        
      case 'memory_usage':
        if (event.data.usedJSHeapSize) {
          const current = metrics.memory;
          current.peakUsage = Math.max(current.peakUsage, event.data.usedJSHeapSize);
          current.averageUsage = ((current.averageUsage * current.samples) + event.data.usedJSHeapSize) / (current.samples + 1);
          current.samples++;
        }
        break;
    }
  }

  /**
   * Aggregate game balance metrics
   */
  _aggregateGameBalanceMetrics(metrics, event) {
    if (!metrics.cardUsage) metrics.cardUsage = {};
    if (!metrics.comboUsage) metrics.comboUsage = {};
    if (!metrics.winRates) metrics.winRates = { byArchetype: {}, overall: { wins: 0, total: 0 } };
    if (!metrics.terrainImpact) metrics.terrainImpact = {};

    switch (event.type) {
      case 'card_played':
        if (event.data.cardId) {
          const cardId = event.data.cardId;
          if (!metrics.cardUsage[cardId]) {
            metrics.cardUsage[cardId] = { timesPlayed: 0, winRate: 0, averageCost: 0 };
          }
          metrics.cardUsage[cardId].timesPlayed++;
        }
        break;
        
      case 'combo_executed':
        if (event.data.comboId) {
          const comboId = event.data.comboId;
          if (!metrics.comboUsage[comboId]) {
            metrics.comboUsage[comboId] = { timesExecuted: 0, successRate: 0, averageImpact: 0 };
          }
          metrics.comboUsage[comboId].timesExecuted++;
        }
        break;
        
      case 'match_outcome':
        metrics.winRates.overall.total++;
        if (event.data.won) {
          metrics.winRates.overall.wins++;
        }
        
        if (event.data.archetype) {
          const archetype = event.data.archetype;
          if (!metrics.winRates.byArchetype[archetype]) {
            metrics.winRates.byArchetype[archetype] = { wins: 0, total: 0 };
          }
          metrics.winRates.byArchetype[archetype].total++;
          if (event.data.won) {
            metrics.winRates.byArchetype[archetype].wins++;
          }
        }
        break;
        
      case 'terrain_effect':
        if (event.data.terrain) {
          const terrain = event.data.terrain;
          if (!metrics.terrainImpact[terrain]) {
            metrics.terrainImpact[terrain] = { activations: 0, averageImpact: 0 };
          }
          metrics.terrainImpact[terrain].activations++;
        }
        break;
    }
  }

  /**
   * Aggregate competitive metrics
   */
  _aggregateCompetitiveMetrics(metrics, event) {
    if (!metrics.rankings) metrics.rankings = { distributions: {}, averageProgression: 0 };
    if (!metrics.matchmaking) metrics.matchmaking = { averageWaitTime: 0, qualityScores: [] };
    if (!metrics.tournaments) metrics.tournaments = { participation: 0, completionRate: 0 };

    switch (event.type) {
      case 'ranking_change':
        if (event.data.newRank) {
          const rank = event.data.newRank;
          metrics.rankings.distributions[rank] = (metrics.rankings.distributions[rank] || 0) + 1;
        }
        break;
        
      case 'matchmaking_queue':
        if (event.data.waitTime) {
          const current = metrics.matchmaking.averageWaitTime;
          const samples = metrics.matchmaking.qualityScores.length;
          metrics.matchmaking.averageWaitTime = ((current * samples) + event.data.waitTime) / (samples + 1);
        }
        break;
        
      case 'tournament_event':
        if (event.data.action === 'join') {
          metrics.tournaments.participation++;
        }
        break;
    }
  }

  /**
   * Enrich event with additional context
   */
  _enrichEvent(event) {
    return {
      ...event,
      id: this._generateEventId(),
      category: this._categorizeEvent(event.type),
      browser: this._getBrowserInfo(),
      performance: this._getCurrentPerformanceSnapshot()
    };
  }

  /**
   * Sanitize event data for privacy compliance
   */
  _sanitizeData(data) {
    if (!ANALYTICS_CONFIG.PRIVACY.EXCLUDE_PII) return data;
    
    const sanitized = { ...data };
    
    // Remove potential PII fields
    const piiFields = ['email', 'username', 'userId', 'ip', 'location'];
    piiFields.forEach(field => delete sanitized[field]);
    
    // Anonymize identifiers
    if (sanitized.playerId) {
      sanitized.playerId = this._hashIdentifier(sanitized.playerId);
    }
    
    return sanitized;
  }

  /**
   * Get current performance snapshot
   */
  _getCurrentPerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now()
    };

    // Frame rate
    if (this.frameTimes.length > 0) {
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      snapshot.fps = 1000 / avgFrameTime;
    }

    // Memory usage
    if (typeof performance !== 'undefined' && performance.memory) {
      snapshot.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      };
    }

    return snapshot;
  }

  /**
   * Get current performance metrics
   */
  _getCurrentPerformanceMetrics() {
    return {
      fps: this.frameTimes.length > 0 ? 
        1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length) : null,
      memoryUsage: typeof performance !== 'undefined' && performance.memory ? 
        performance.memory.usedJSHeapSize : null,
      eventQueueSize: this.processingQueue.length
    };
  }

  /**
   * Emit event to real-time listeners
   */
  _emitToListeners(eventType, event) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[Analytics] Listener error:', error);
        }
      });
    }
  }

  /**
   * Estimate current memory usage
   */
  _estimateMemoryUsage() {
    const eventSize = JSON.stringify(this.processingQueue).length;
    return eventSize + (this.sessionData ? JSON.stringify(this.sessionData).length : 0);
  }

  /**
   * Clean up old analytics data
   */
  async _cleanupOldData() {
    const cutoffTime = Date.now() - ANALYTICS_CONFIG.RETENTION.RAW_EVENTS;
    
    // This would be implemented with actual cleanup logic
    // For now, we'll just log the intention
    console.log(`[Analytics] Cleanup old data before ${new Date(cutoffTime).toISOString()}`);
  }

  /**
   * Generate unique session ID
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  _generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Generate unique batch ID
   */
  _generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get browser information
   */
  _getBrowserInfo() {
    if (typeof navigator === 'undefined') return { type: 'unknown' };
    
    return {
      userAgent: this._anonymizeUserAgent(navigator.userAgent),
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    };
  }

  /**
   * Anonymize user agent string
   */
  _anonymizeUserAgent(userAgent) {
    if (!ANALYTICS_CONFIG.PRIVACY.ANONYMIZE_USER_DATA) return userAgent;
    
    // Extract only browser and version info, remove system details
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    return browserMatch ? browserMatch[0] : 'Unknown Browser';
  }

  /**
   * Hash identifier for anonymization
   */
  _hashIdentifier(identifier) {
    // Simple hash function for demo - would use crypto.subtle in production
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `anon_${Math.abs(hash).toString(36)}`;
  }

  // ========== INSIGHTS METHODS ==========

  /**
   * Get player behavior insights
   */
  async _getPlayerBehaviorInsights(startTime, endTime) {
    const metrics = await this.persistenceManager.getMetadata('analytics_aggregated');
    if (!metrics?.value?.playerBehavior) return null;

    const behavior = metrics.value.playerBehavior;
    
    return {
      sessionMetrics: {
        totalSessions: behavior.sessions?.total || 0,
        averageSessionDuration: behavior.sessions?.averageDuration || 0,
        dailyActiveUsers: Object.keys(behavior.retention?.dailyUsers || {}).length
      },
      engagementMetrics: {
        topFeatures: this._getTopEntries(behavior.engagement?.featuresUsed || {}),
        screenDistribution: this._getTopEntries(behavior.engagement?.screenViews || {}),
        retentionRate: this._calculateRetentionRate(behavior.retention)
      },
      recommendations: this._generateBehaviorRecommendations(behavior)
    };
  }

  /**
   * Get performance insights
   */
  async _getPerformanceInsights(startTime, endTime) {
    const metrics = await this.persistenceManager.getMetadata('analytics_aggregated');
    if (!metrics?.value?.performance) return null;

    const performance = metrics.value.performance;
    
    return {
      loadPerformance: {
        averageLoadTime: performance.loadTimes?.average || 0,
        slowLoadsPercentage: this._calculateSlowLoadsPercentage(performance.loadTimes)
      },
      renderPerformance: {
        averageFPS: performance.frameRates?.average || 0,
        lowFPSPercentage: this._calculateLowFPSPercentage(performance.frameRates)
      },
      errorMetrics: {
        totalErrors: performance.errors?.total || 0,
        errorsByType: performance.errors?.byType || {},
        errorRate: this._calculateErrorRate(performance.errors)
      },
      memoryMetrics: {
        peakUsage: performance.memory?.peakUsage || 0,
        averageUsage: performance.memory?.averageUsage || 0
      },
      recommendations: this._generatePerformanceRecommendations(performance)
    };
  }

  /**
   * Get game balance insights
   */
  async _getGameBalanceInsights(startTime, endTime) {
    const metrics = await this.persistenceManager.getMetadata('analytics_aggregated');
    if (!metrics?.value?.gameBalance) return null;

    const balance = metrics.value.gameBalance;
    
    return {
      cardMetrics: {
        mostPlayedCards: this._getTopEntries(balance.cardUsage || {}, 'timesPlayed'),
        cardWinRates: this._calculateCardWinRates(balance.cardUsage || {}),
        underusedCards: this._findUnderusedCards(balance.cardUsage || {})
      },
      comboMetrics: {
        mostUsedCombos: this._getTopEntries(balance.comboUsage || {}, 'timesExecuted'),
        comboSuccessRates: this._calculateComboSuccessRates(balance.comboUsage || {})
      },
      archetypeMetrics: {
        winRatesByArchetype: this._calculateArchetypeWinRates(balance.winRates?.byArchetype || {}),
        overallWinRate: this._calculateOverallWinRate(balance.winRates?.overall)
      },
      terrainMetrics: {
        terrainUtilization: this._calculateTerrainUtilization(balance.terrainImpact || {}),
        terrainBalance: this._assessTerrainBalance(balance.terrainImpact || {})
      },
      recommendations: this._generateBalanceRecommendations(balance)
    };
  }

  /**
   * Get competitive insights
   */
  async _getCompetitiveInsights(startTime, endTime) {
    const metrics = await this.persistenceManager.getMetadata('analytics_aggregated');
    if (!metrics?.value?.competitive) return null;

    const competitive = metrics.value.competitive;
    
    return {
      rankingMetrics: {
        rankDistribution: competitive.rankings?.distributions || {},
        averageProgression: competitive.rankings?.averageProgression || 0
      },
      matchmakingMetrics: {
        averageWaitTime: competitive.matchmaking?.averageWaitTime || 0,
        matchQuality: this._calculateMatchQuality(competitive.matchmaking)
      },
      tournamentMetrics: {
        participationRate: competitive.tournaments?.participation || 0,
        completionRate: competitive.tournaments?.completionRate || 0
      },
      recommendations: this._generateCompetitiveRecommendations(competitive)
    };
  }

  // ========== UTILITY METHODS FOR INSIGHTS ==========

  _getTopEntries(data, field = null) {
    const entries = Object.entries(data);
    if (field) {
      return entries
        .sort((a, b) => (b[1][field] || 0) - (a[1][field] || 0))
        .slice(0, 10)
        .map(([key, value]) => ({ key, value: value[field] }));
    }
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, value]) => ({ key, value }));
  }

  _calculateRetentionRate(retention) {
    if (!retention?.dailyUsers) return 0;
    
    const days = Object.keys(retention.dailyUsers);
    if (days.length < 2) return 0;
    
    // Simple day-over-day retention calculation
    const recent = days.slice(-7); // Last 7 days
    const avgUsers = recent.reduce((sum, day) => sum + retention.dailyUsers[day], 0) / recent.length;
    
    return avgUsers > 0 ? (avgUsers / retention.dailyUsers[days[0]]) * 100 : 0;
  }

  _calculateSlowLoadsPercentage(loadTimes) {
    if (!loadTimes?.samples) return 0;
    return loadTimes.average > ANALYTICS_CONFIG.PERFORMANCE.SLOW_LOAD_THRESHOLD ? 100 : 0;
  }

  _calculateLowFPSPercentage(frameRates) {
    if (!frameRates?.samples) return 0;
    return (frameRates.belowThreshold / frameRates.samples) * 100;
  }

  _calculateErrorRate(errors) {
    if (!errors?.total) return 0;
    // Error rate would need total events to be meaningful
    return errors.total;
  }

  _calculateCardWinRates(cardUsage) {
    return Object.entries(cardUsage)
      .map(([cardId, data]) => ({
        cardId,
        winRate: data.winRate || 0,
        timesPlayed: data.timesPlayed || 0
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }

  _findUnderusedCards(cardUsage) {
    const avgUsage = Object.values(cardUsage).reduce((sum, data) => sum + (data.timesPlayed || 0), 0) / Object.keys(cardUsage).length;
    
    return Object.entries(cardUsage)
      .filter(([_, data]) => (data.timesPlayed || 0) < avgUsage * 0.5)
      .map(([cardId, data]) => ({
        cardId,
        timesPlayed: data.timesPlayed || 0,
        percentageOfAverage: ((data.timesPlayed || 0) / avgUsage) * 100
      }))
      .sort((a, b) => a.timesPlayed - b.timesPlayed);
  }

  _calculateComboSuccessRates(comboUsage) {
    return Object.entries(comboUsage)
      .map(([comboId, data]) => ({
        comboId,
        successRate: data.successRate || 100, // Assume 100% if not tracked
        timesExecuted: data.timesExecuted || 0
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  _calculateArchetypeWinRates(archetypeData) {
    return Object.entries(archetypeData)
      .map(([archetype, data]) => ({
        archetype,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        totalMatches: data.total || 0
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }

  _calculateOverallWinRate(overallData) {
    if (!overallData?.total) return 0;
    return (overallData.wins / overallData.total) * 100;
  }

  _calculateTerrainUtilization(terrainImpact) {
    const total = Object.values(terrainImpact).reduce((sum, data) => sum + (data.activations || 0), 0);
    
    return Object.entries(terrainImpact)
      .map(([terrain, data]) => ({
        terrain,
        utilization: total > 0 ? ((data.activations || 0) / total) * 100 : 0,
        activations: data.activations || 0
      }))
      .sort((a, b) => b.utilization - a.utilization);
  }

  _assessTerrainBalance(terrainImpact) {
    const utilization = this._calculateTerrainUtilization(terrainImpact);
    const avgUtilization = utilization.reduce((sum, t) => sum + t.utilization, 0) / utilization.length;
    
    return {
      isBalanced: utilization.every(t => Math.abs(t.utilization - avgUtilization) < 10),
      variance: this._calculateVariance(utilization.map(t => t.utilization)),
      recommendations: utilization
        .filter(t => Math.abs(t.utilization - avgUtilization) > 15)
        .map(t => ({
          terrain: t.terrain,
          issue: t.utilization > avgUtilization ? 'overused' : 'underused',
          severity: Math.abs(t.utilization - avgUtilization)
        }))
    };
  }

  _calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  _calculateMatchQuality(matchmaking) {
    // Match quality would be based on various factors
    return {
      averageWaitTime: matchmaking?.averageWaitTime || 0,
      qualityScore: 85, // Placeholder - would calculate based on rank differences, etc.
    };
  }

  // ========== RECOMMENDATION ENGINES ==========

  _generateBehaviorRecommendations(behavior) {
    const recommendations = [];
    
    if (behavior.sessions?.averageDuration < 300000) { // Less than 5 minutes
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        title: 'Improve Session Duration',
        description: 'Average session duration is below 5 minutes. Consider adding onboarding tutorials or engagement hooks.',
        metric: 'session_duration',
        currentValue: behavior.sessions.averageDuration,
        targetValue: 600000 // 10 minutes
      });
    }
    
    const topFeatures = this._getTopEntries(behavior.engagement?.featuresUsed || {});
    if (topFeatures.length > 0 && topFeatures[0].value / behavior.sessions?.total < 0.5) {
      recommendations.push({
        type: 'feature_adoption',
        priority: 'medium',
        title: 'Increase Feature Discovery',
        description: 'Most popular features are only used by less than 50% of users.',
        metric: 'feature_adoption',
        topFeature: topFeatures[0].key,
        adoptionRate: (topFeatures[0].value / behavior.sessions?.total) * 100
      });
    }
    
    return recommendations;
  }

  _generatePerformanceRecommendations(performance) {
    const recommendations = [];
    
    if (performance.loadTimes?.average > ANALYTICS_CONFIG.PERFORMANCE.SLOW_LOAD_THRESHOLD) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Load Times',
        description: 'Average load time exceeds 3 seconds. Consider code splitting and asset optimization.',
        metric: 'load_time',
        currentValue: performance.loadTimes.average,
        targetValue: ANALYTICS_CONFIG.PERFORMANCE.SLOW_LOAD_THRESHOLD
      });
    }
    
    if (performance.frameRates?.average < ANALYTICS_CONFIG.PERFORMANCE.LOW_FPS_THRESHOLD) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Improve Frame Rate',
        description: 'Average FPS is below 30. Optimize rendering and reduce computational overhead.',
        metric: 'fps',
        currentValue: performance.frameRates.average,
        targetValue: 60
      });
    }
    
    if (performance.errors?.total > 10) {
      recommendations.push({
        type: 'stability',
        priority: 'high',
        title: 'Reduce Error Rate',
        description: 'High number of errors detected. Review error logs and implement fixes.',
        metric: 'error_count',
        currentValue: performance.errors.total,
        topErrorType: this._getTopEntries(performance.errors.byType || {})[0]?.key
      });
    }
    
    return recommendations;
  }

  _generateBalanceRecommendations(balance) {
    const recommendations = [];
    
    // Check for card balance issues
    const cardWinRates = this._calculateCardWinRates(balance.cardUsage || {});
    const imbalancedCards = cardWinRates.filter(card => 
      card.winRate > 70 || (card.winRate < 40 && card.timesPlayed > 10)
    );
    
    if (imbalancedCards.length > 0) {
      recommendations.push({
        type: 'balance',
        priority: 'medium',
        title: 'Card Balance Issues Detected',
        description: `${imbalancedCards.length} cards show significant win rate imbalances.`,
        metric: 'card_balance',
        imbalancedCards: imbalancedCards.slice(0, 5)
      });
    }
    
    // Check archetype balance
    const archetypeRates = this._calculateArchetypeWinRates(balance.winRates?.byArchetype || {});
    const imbalancedArchetypes = archetypeRates.filter(arch => 
      arch.winRate > 60 || arch.winRate < 40
    );
    
    if (imbalancedArchetypes.length > 0) {
      recommendations.push({
        type: 'balance',
        priority: 'high',
        title: 'Archetype Imbalance',
        description: 'Some archetypes show significant win rate disparities.',
        metric: 'archetype_balance',
        imbalancedArchetypes
      });
    }
    
    // Check terrain balance
    const terrainBalance = this._assessTerrainBalance(balance.terrainImpact || {});
    if (!terrainBalance.isBalanced) {
      recommendations.push({
        type: 'balance',
        priority: 'medium',
        title: 'Terrain Usage Imbalance',
        description: 'Terrain usage is not evenly distributed.',
        metric: 'terrain_balance',
        issues: terrainBalance.recommendations
      });
    }
    
    return recommendations;
  }

  _generateCompetitiveRecommendations(competitive) {
    const recommendations = [];
    
    if (competitive.matchmaking?.averageWaitTime > 60000) { // More than 1 minute
      recommendations.push({
        type: 'matchmaking',
        priority: 'high',
        title: 'Reduce Matchmaking Wait Times',
        description: 'Average wait time exceeds 1 minute. Consider widening matching criteria.',
        metric: 'wait_time',
        currentValue: competitive.matchmaking.averageWaitTime,
        targetValue: 30000
      });
    }
    
    if (competitive.tournaments?.completionRate < 50) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Improve Tournament Completion',
        description: 'Tournament completion rate is below 50%. Review tournament structure.',
        metric: 'tournament_completion',
        currentValue: competitive.tournaments.completionRate,
        targetValue: 75
      });
    }
    
    return recommendations;
  }

  // ========== DATA EXPORT METHODS ==========

  async _exportPlayerBehaviorData(startTime, endTime, anonymize) {
    // Implementation would fetch and format player behavior data
    return {
      sessions: await this._fetchSessionData(startTime, endTime, anonymize),
      engagement: await this._fetchEngagementData(startTime, endTime, anonymize),
      retention: await this._fetchRetentionData(startTime, endTime, anonymize)
    };
  }

  async _exportPerformanceData(startTime, endTime, anonymize) {
    // Implementation would fetch and format performance data
    return {
      loadTimes: await this._fetchLoadTimeData(startTime, endTime),
      frameRates: await this._fetchFrameRateData(startTime, endTime),
      errors: await this._fetchErrorData(startTime, endTime, anonymize),
      memory: await this._fetchMemoryData(startTime, endTime)
    };
  }

  async _exportGameBalanceData(startTime, endTime, anonymize) {
    // Implementation would fetch and format game balance data
    return {
      cardUsage: await this._fetchCardUsageData(startTime, endTime),
      comboUsage: await this._fetchComboUsageData(startTime, endTime),
      winRates: await this._fetchWinRateData(startTime, endTime),
      terrainImpact: await this._fetchTerrainData(startTime, endTime)
    };
  }

  async _exportCompetitiveData(startTime, endTime, anonymize) {
    // Implementation would fetch and format competitive data
    return {
      rankings: await this._fetchRankingData(startTime, endTime, anonymize),
      matchmaking: await this._fetchMatchmakingData(startTime, endTime),
      tournaments: await this._fetchTournamentData(startTime, endTime)
    };
  }

  // Placeholder methods for data fetching - would be implemented based on storage structure
  async _fetchSessionData(startTime, endTime, anonymize) { return {}; }
  async _fetchEngagementData(startTime, endTime, anonymize) { return {}; }
  async _fetchRetentionData(startTime, endTime, anonymize) { return {}; }
  async _fetchLoadTimeData(startTime, endTime) { return {}; }
  async _fetchFrameRateData(startTime, endTime) { return {}; }
  async _fetchErrorData(startTime, endTime, anonymize) { return {}; }
  async _fetchMemoryData(startTime, endTime) { return {}; }
  async _fetchCardUsageData(startTime, endTime) { return {}; }
  async _fetchComboUsageData(startTime, endTime) { return {}; }
  async _fetchWinRateData(startTime, endTime) { return {}; }
  async _fetchTerrainData(startTime, endTime) { return {}; }
  async _fetchRankingData(startTime, endTime, anonymize) { return {}; }
  async _fetchMatchmakingData(startTime, endTime) { return {}; }
  async _fetchTournamentData(startTime, endTime) { return {}; }

  _formatData(data, format) {
    switch (format) {
      case 'csv':
        return this._convertToCSV(data);
      case 'xml':
        return this._convertToXML(data);
      default:
        return data;
    }
  }

  _convertToCSV(data) {
    // CSV conversion implementation
    return 'CSV format not yet implemented';
  }

  _convertToXML(data) {
    // XML conversion implementation
    return 'XML format not yet implemented';
  }
}

// ========== SPECIALIZED ANALYTICS MODULES ==========

/**
 * Player Behavior Analytics Module
 */
export class PlayerBehaviorAnalytics {
  constructor(analyticsEngine) {
    this.analytics = analyticsEngine;
  }

  trackSessionStart(sessionData) {
    this.analytics.trackEvent('session_start', {
      sessionType: sessionData.type || 'normal',
      previousSessionGap: sessionData.previousSessionGap,
      deviceType: sessionData.deviceType
    });
  }

  trackSessionEnd(sessionData) {
    this.analytics.trackEvent('session_end', {
      duration: sessionData.duration,
      eventsCount: sessionData.eventsCount,
      matchesPlayed: sessionData.matchesPlayed,
      reason: sessionData.reason || 'user_quit'
    });
  }

  trackFeatureUsage(feature, context = {}) {
    this.analytics.trackEvent('feature_use', {
      feature,
      context,
      firstTimeUse: context.firstTimeUse || false
    });
  }

  trackProgression(milestone, data = {}) {
    this.analytics.trackEvent('progression_event', {
      milestone,
      ...data,
      timestamp: Date.now()
    });
  }

  async getEngagementScore(playerId, timeRange = 7 * 24 * 60 * 60 * 1000) {
    // Calculate engagement score based on various factors
    const insights = await this.analytics.getInsights('player_behavior', timeRange);
    if (!insights) return 0;

    const factors = {
      sessionFrequency: Math.min(insights.sessionMetrics.totalSessions / 7, 1) * 30,
      sessionDuration: Math.min(insights.sessionMetrics.averageSessionDuration / 600000, 1) * 25,
      featureAdoption: Math.min(Object.keys(insights.engagementMetrics.topFeatures).length / 5, 1) * 25,
      retention: insights.engagementMetrics.retentionRate * 0.2
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }
}

/**
 * Performance Analytics Module
 */
export class PerformanceAnalytics {
  constructor(analyticsEngine) {
    this.analytics = analyticsEngine;
    this.performanceObserver = null;
    this._initializePerformanceTracking();
  }

  _initializePerformanceTracking() {
    // Track navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => this._trackPageLoad(), 1000);
      });
    }
  }

  _trackPageLoad() {
    const timing = performance.timing;
    const navigation = performance.navigation;
    
    this.analytics.trackEvent('page_load', {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstByte: timing.responseStart - timing.navigationStart,
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      navigationType: navigation.type
    });
  }

  trackAssetLoad(assetType, url, loadTime, success) {
    this.analytics.trackEvent('asset_load', {
      assetType,
      url: url.split('/').pop(), // Only filename for privacy
      loadTime,
      success,
      slow: loadTime > 2000
    });
  }

  trackRenderPerformance(componentName, renderTime) {
    this.analytics.trackEvent('render_frame', {
      component: componentName,
      renderTime,
      slow: renderTime > 16.67 // 60fps threshold
    });
  }

  trackError(error, context = {}) {
    this.analytics.trackEvent('error_occurred', {
      message: error.message?.substring(0, 200),
      stack: error.stack?.substring(0, 500),
      type: error.name,
      context,
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
  }

  async getPerformanceScore() {
    const insights = await this.analytics.getInsights('performance');
    if (!insights) return 0;

    const factors = {
      loadTime: Math.max(0, 100 - (insights.loadPerformance.averageLoadTime / 100)),
      frameRate: Math.min(insights.renderPerformance.averageFPS / 60 * 100, 100),
      errorRate: Math.max(0, 100 - insights.errorMetrics.errorRate),
      memoryUsage: Math.max(0, 100 - (insights.memoryMetrics.averageUsage / (100 * 1024 * 1024) * 100))
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0) / 4;
  }
}

/**
 * Game Balance Analytics Module
 */
export class GameBalanceAnalytics {
  constructor(analyticsEngine) {
    this.analytics = analyticsEngine;
  }

  trackCardPlay(cardId, context) {
    this.analytics.trackEvent('card_played', {
      cardId,
      cost: context.cost,
      lane: context.lane,
      terrain: context.terrain,
      turn: context.turn,
      handSize: context.handSize,
      chakra: context.chakra
    });
  }

  trackComboExecution(comboId, context) {
    this.analytics.trackEvent('combo_executed', {
      comboId,
      lane: context.lane,
      terrain: context.terrain,
      success: context.success,
      damage: context.damage,
      cardsUsed: context.cardsUsed
    });
  }

  trackMatchOutcome(outcome, context) {
    this.analytics.trackEvent('match_outcome', {
      won: outcome.won,
      duration: outcome.duration,
      archetype: context.archetype,
      opponentArchetype: context.opponentArchetype,
      finalScore: outcome.finalScore,
      cardsPlayed: context.cardsPlayed,
      combosExecuted: context.combosExecuted
    });
  }

  trackTerrainEffect(terrain, effect, impact) {
    this.analytics.trackEvent('terrain_effect', {
      terrain,
      effect,
      impact,
      beneficial: impact > 0
    });
  }

  async getBalanceReport() {
    const insights = await this.analytics.getInsights('game_balance');
    if (!insights) return null;

    return {
      cardBalance: this._analyzeCardBalance(insights.cardMetrics),
      archetypeBalance: this._analyzeArchetypeBalance(insights.archetypeMetrics),
      terrainBalance: this._analyzeTerrainBalance(insights.terrainMetrics),
      metaShifts: this._analyzeMetaShifts(insights),
      recommendations: insights.recommendations
    };
  }

  _analyzeCardBalance(cardMetrics) {
    const { mostPlayedCards, cardWinRates, underusedCards } = cardMetrics;
    
    return {
      overpoweredCards: cardWinRates.filter(card => card.winRate > 70 && card.timesPlayed > 20),
      underpoweredCards: cardWinRates.filter(card => card.winRate < 40 && card.timesPlayed > 10),
      popularCards: mostPlayedCards.slice(0, 10),
      underusedCards: underusedCards.slice(0, 10),
      balanceScore: this._calculateCardBalanceScore(cardWinRates)
    };
  }

  _analyzeArchetypeBalance(archetypeMetrics) {
    const { winRatesByArchetype, overallWinRate } = archetypeMetrics;
    
    return {
      dominantArchetypes: winRatesByArchetype.filter(arch => arch.winRate > overallWinRate + 10),
      weakArchetypes: winRatesByArchetype.filter(arch => arch.winRate < overallWinRate - 10),
      balanceScore: this._calculateArchetypeBalanceScore(winRatesByArchetype),
      diversity: this._calculateArchetypeDiversity(winRatesByArchetype)
    };
  }

  _analyzeTerrainBalance(terrainMetrics) {
    const { terrainUtilization, terrainBalance } = terrainMetrics;
    
    return {
      utilization: terrainUtilization,
      balanced: terrainBalance.isBalanced,
      variance: terrainBalance.variance,
      recommendations: terrainBalance.recommendations
    };
  }

  _analyzeMetaShifts(insights) {
    // Analyze trends in card usage and win rates over time
    // This would require historical data comparison
    return {
      emergingCards: [],
      decliningCards: [],
      archetypeShifts: [],
      stabilityScore: 85 // Placeholder
    };
  }

  _calculateCardBalanceScore(cardWinRates) {
    if (cardWinRates.length === 0) return 100;
    
    const variance = this._calculateVariance(cardWinRates.map(card => card.winRate));
    return Math.max(0, 100 - variance * 2);
  }

  _calculateArchetypeBalanceScore(archetypes) {
    if (archetypes.length === 0) return 100;
    
    const variance = this._calculateVariance(archetypes.map(arch => arch.winRate));
    return Math.max(0, 100 - variance);
  }

  _calculateArchetypeDiversity(archetypes) {
    // Calculate how evenly distributed the archetypes are
    const total = archetypes.reduce((sum, arch) => sum + arch.totalMatches, 0);
    if (total === 0) return 0;
    
    const expectedPercentage = 100 / archetypes.length;
    const deviations = archetypes.map(arch => 
      Math.abs((arch.totalMatches / total * 100) - expectedPercentage)
    );
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    return Math.max(0, 100 - avgDeviation * 2);
  }

  _calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

/**
 * Competitive Analytics Module
 */
export class CompetitiveAnalytics {
  constructor(analyticsEngine) {
    this.analytics = analyticsEngine;
  }

  trackRankingChange(playerId, oldRating, newRating, matchOutcome) {
    this.analytics.trackEvent('ranking_change', {
      playerId: this.analytics._hashIdentifier(playerId),
      oldRating,
      newRating,
      change: newRating - oldRating,
      matchOutcome,
      tier: this._getRatingTier(newRating)
    });
  }

  trackMatchmakingQueue(queueData) {
    this.analytics.trackEvent('matchmaking_queue', {
      waitTime: queueData.waitTime,
      playerRating: queueData.playerRating,
      queueType: queueData.queueType,
      foundMatch: queueData.foundMatch,
      ratingDifference: queueData.ratingDifference
    });
  }

  trackTournamentEvent(eventType, tournamentData) {
    this.analytics.trackEvent('tournament_event', {
      action: eventType,
      tournamentId: tournamentData.tournamentId,
      participants: tournamentData.participants,
      round: tournamentData.round,
      bracket: tournamentData.bracket
    });
  }

  trackSpectatorAction(action, context) {
    this.analytics.trackEvent('spectator_action', {
      action,
      matchId: context.matchId,
      viewerCount: context.viewerCount,
      timestamp: Date.now()
    });
  }

  async getCompetitiveHealth() {
    const insights = await this.analytics.getInsights('competitive');
    if (!insights) return null;

    return {
      rankingDistribution: this._analyzeRankingDistribution(insights.rankingMetrics),
      matchmakingQuality: this._analyzeMatchmakingQuality(insights.matchmakingMetrics),
      tournamentHealth: this._analyzeTournamentHealth(insights.tournamentMetrics),
      competitiveIntegrity: this._assessCompetitiveIntegrity(insights),
      recommendations: insights.recommendations
    };
  }

  _getRatingTier(rating) {
    if (rating < 1000) return 'Bronze';
    if (rating < 1200) return 'Silver';
    if (rating < 1400) return 'Gold';
    if (rating < 1600) return 'Platinum';
    if (rating < 1800) return 'Diamond';
    return 'Master';
  }

  _analyzeRankingDistribution(rankingMetrics) {
    const { rankDistribution } = rankingMetrics;
    const total = Object.values(rankDistribution).reduce((sum, count) => sum + count, 0);
    
    const distribution = Object.entries(rankDistribution)
      .map(([rank, count]) => ({
        rank,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      distribution,
      healthy: this._isHealthyDistribution(distribution),
      concentrated: this._checkConcentration(distribution)
    };
  }

  _analyzeMatchmakingQuality(matchmakingMetrics) {
    const { averageWaitTime, matchQuality } = matchmakingMetrics;
    
    return {
      waitTimeScore: this._scoreWaitTime(averageWaitTime),
      qualityScore: matchQuality.qualityScore || 0,
      overallScore: (this._scoreWaitTime(averageWaitTime) + (matchQuality.qualityScore || 0)) / 2,
      issues: this._identifyMatchmakingIssues(averageWaitTime, matchQuality)
    };
  }

  _analyzeTournamentHealth(tournamentMetrics) {
    const { participationRate, completionRate } = tournamentMetrics;
    
    return {
      participationScore: participationRate || 0,
      completionScore: completionRate || 0,
      overallHealth: ((participationRate || 0) + (completionRate || 0)) / 2,
      recommendations: this._generateTournamentRecommendations(participationRate, completionRate)
    };
  }

  _assessCompetitiveIntegrity(insights) {
    // Assess overall competitive scene health
    const factors = {
      rankingDistribution: this._analyzeRankingDistribution(insights.rankingMetrics).healthy ? 25 : 0,
      matchmakingQuality: this._analyzeMatchmakingQuality(insights.matchmakingMetrics).overallScore * 0.25,
      tournamentHealth: this._analyzeTournamentHealth(insights.tournamentMetrics).overallHealth * 0.25,
      playerRetention: 20 // Would calculate from player behavior data
    };

    const integrityScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    
    return {
      score: integrityScore,
      level: this._getIntegrityLevel(integrityScore),
      factors,
      recommendations: this._generateIntegrityRecommendations(factors)
    };
  }

  _isHealthyDistribution(distribution) {
    // Check if distribution follows expected bell curve
    const middle = Math.floor(distribution.length / 2);
    const peak = distribution[middle];
    const edges = [distribution[0], distribution[distribution.length - 1]];
    
    return peak.percentage > Math.max(...edges.map(e => e.percentage));
  }

  _checkConcentration(distribution) {
    // Check if too many players are concentrated in one tier
    const maxPercentage = Math.max(...distribution.map(d => d.percentage));
    return maxPercentage > 50;
  }

  _scoreWaitTime(waitTime) {
    if (waitTime < 30000) return 100; // Under 30 seconds
    if (waitTime < 60000) return 80;  // Under 1 minute
    if (waitTime < 120000) return 60; // Under 2 minutes
    if (waitTime < 300000) return 40; // Under 5 minutes
    return 20; // Over 5 minutes
  }

  _identifyMatchmakingIssues(waitTime, matchQuality) {
    const issues = [];
    
    if (waitTime > 120000) {
      issues.push({
        type: 'long_wait_times',
        severity: waitTime > 300000 ? 'high' : 'medium',
        description: 'Players experiencing long matchmaking wait times'
      });
    }
    
    if (matchQuality.qualityScore < 70) {
      issues.push({
        type: 'poor_match_quality',
        severity: matchQuality.qualityScore < 50 ? 'high' : 'medium',
        description: 'Matches have significant skill rating differences'
      });
    }
    
    return issues;
  }

  _generateTournamentRecommendations(participation, completion) {
    const recommendations = [];
    
    if (participation < 30) {
      recommendations.push({
        type: 'increase_participation',
        priority: 'high',
        suggestion: 'Add tournament rewards or improve discovery'
      });
    }
    
    if (completion < 60) {
      recommendations.push({
        type: 'improve_completion',
        priority: 'medium',
        suggestion: 'Reduce tournament length or add checkpoints'
      });
    }
    
    return recommendations;
  }

  _getIntegrityLevel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  }

  _generateIntegrityRecommendations(factors) {
    const recommendations = [];
    
    Object.entries(factors).forEach(([factor, score]) => {
      if (score < 20) {
        recommendations.push({
          factor,
          priority: 'high',
          score,
          action: this._getRecommendationForFactor(factor)
        });
      }
    });
    
    return recommendations;
  }

  _getRecommendationForFactor(factor) {
    const actions = {
      rankingDistribution: 'Review ranking algorithm and consider rank resets',
      matchmakingQuality: 'Adjust matching criteria and queue optimization',
      tournamentHealth: 'Improve tournament format and incentives',
      playerRetention: 'Focus on engagement and onboarding improvements'
    };
    
    return actions[factor] || 'Review and optimize system';
  }
}

// ========== MAIN EXPORTS ==========

// Singleton instance for global access
export const analyticsEngine = new AnalyticsEngine();

// Specialized analytics modules
export const playerBehaviorAnalytics = new PlayerBehaviorAnalytics(analyticsEngine);
export const performanceAnalytics = new PerformanceAnalytics(analyticsEngine);
export const gameBalanceAnalytics = new GameBalanceAnalytics(analyticsEngine);
export const competitiveAnalytics = new CompetitiveAnalytics(analyticsEngine);

// Utility functions for common operations
export const AnalyticsUtils = {
  /**
   * Initialize all analytics systems
   */
  async initializeAll() {
    await analyticsEngine.initialize();
    console.log('[Analytics] All systems initialized');
  },

  /**
   * Get comprehensive dashboard data
   */
  async getDashboard(timeRange = 7 * 24 * 60 * 60 * 1000) {
    const [behavior, performance, balance, competitive] = await Promise.all([
      analyticsEngine.getInsights('player_behavior', timeRange),
      analyticsEngine.getInsights('performance', timeRange),
      analyticsEngine.getInsights('game_balance', timeRange),
      analyticsEngine.getInsights('competitive', timeRange)
    ]);

    return {
      timeRange,
      generatedAt: Date.now(),
      playerBehavior: behavior,
      performance: performance,
      gameBalance: balance,
      competitive: competitive,
      systemHealth: analyticsEngine.getSystemHealth()
    };
  },

  /**
   * Export comprehensive analytics report
   */
  async exportReport(options = {}) {
    return await analyticsEngine.exportData({
      timeRange: options.timeRange || 30 * 24 * 60 * 60 * 1000,
      categories: options.categories || ['all'],
      format: options.format || 'json',
      anonymize: options.anonymize !== false
    });
  },

  /**
   * Get real-time system status
   */
  getSystemStatus() {
    return {
      analytics: analyticsEngine.getSystemHealth(),
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }
};