/**
 * Comprehensive Test Suite for Analytics Infrastructure
 * Tests all major analytics components and integration points
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  AnalyticsEngine, 
  PlayerBehaviorAnalytics,
  PerformanceAnalytics,
  GameBalanceAnalytics,
  CompetitiveAnalytics
} from './analytics.js';

// Mock browser globals for testing
global.window = {
  addEventListener: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  location: { pathname: '/test' },
  navigator: {
    userAgent: 'Test Browser/1.0',
    language: 'en-US',
    platform: 'Test',
    cookieEnabled: true
  },
  performance: {
    now: () => Date.now(),
    timing: {
      navigationStart: Date.now() - 5000,
      loadEventEnd: Date.now(),
      domContentLoadedEventEnd: Date.now() - 1000,
      responseStart: Date.now() - 4000,
      domainLookupStart: Date.now() - 4500,
      domainLookupEnd: Date.now() - 4400
    },
    navigation: { type: 0 },
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 100000000
    },
    getEntriesByType: () => [{ name: 'first-paint', startTime: 100 }]
  }
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  hidden: false
};

global.navigator = global.window.navigator;
global.performance = global.window.performance;

// Mock persistence manager
const mockPersistenceManager = {
  isInitialized: false,
  initialize: async () => {
    mockPersistenceManager.isInitialized = true;
  },
  setMetadata: async () => {},
  getMetadata: async () => null
};

// Mock combat events
const mockCombatEvents = {
  subscribe: () => () => {},
  addEvent: () => {},
  getEvents: () => []
};

describe('Analytics Infrastructure', () => {
  let analytics;
  let testEventData;

  beforeEach(() => {
    analytics = new AnalyticsEngine();
    
    testEventData = {
      type: 'test_event',
      data: { value: 42, context: 'test' },
      timestamp: Date.now()
    };
    
    // Reset state
    analytics.isInitialized = false;
    analytics.eventQueue = [];
    analytics.processingQueue = [];
    
    // Reset mock state
    mockPersistenceManager.isInitialized = false;
  });

  afterEach(() => {
    // Clean up timers and listeners
    if (analytics.flushTimer) {
      clearInterval(analytics.flushTimer);
    }
    analytics.eventListeners.clear();
  });

  describe('AnalyticsEngine Core', () => {
    it('should initialize successfully', async () => {
      await analytics.initialize({
        persistenceManager: mockPersistenceManager,
        combatEvents: mockCombatEvents
      });
      expect(analytics.isInitialized).toBe(true);
    });

    it('should validate event types', () => {
      expect(analytics.eventTypes.has('session_start')).toBe(true);
      expect(analytics.eventTypes.has('card_played')).toBe(true);
      expect(analytics.eventTypes.has('invalid_event')).toBe(false);
    });

    it('should track events when initialized', async () => {
      await analytics.initialize();
      
      analytics.trackEvent('session_start', { sessionType: 'test' });
      
      expect(analytics.processingQueue.length).toBe(1);
      expect(analytics.processingQueue[0].type).toBe('session_start');
      expect(analytics.processingQueue[0].data.sessionType).toBe('test');
    });

    it('should queue events when not initialized', () => {
      analytics.trackEvent('session_start', { sessionType: 'test' });
      
      expect(analytics.eventQueue.length).toBe(1);
      expect(analytics.processingQueue.length).toBe(0);
    });

    it('should sanitize PII data', () => {
      const sensitiveData = {
        email: 'user@example.com',
        playerId: 'player123',
        gameData: 'safe'
      };
      
      const sanitized = analytics._sanitizeData(sensitiveData);
      
      expect(sanitized.email).toBeUndefined();
      expect(sanitized.gameData).toBe('safe');
      expect(sanitized.playerId).not.toBe('player123'); // Should be hashed
    });

    it('should emit events to listeners', async () => {
      await analytics.initialize();
      
      const listener = vi.fn();
      analytics.subscribe('test_event', listener);
      
      analytics.trackEvent('test_event', { value: 123 });
      
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('test_event');
    });

    it('should flush events periodically', async () => {
      await analytics.initialize();
      
      // Add events to queue
      analytics.trackEvent('session_start');
      analytics.trackEvent('card_played');
      
      expect(analytics.processingQueue.length).toBe(2);
      
      // Manually trigger flush
      await analytics._flushEvents();
      
      expect(analytics.processingQueue.length).toBe(0);
    });
  });

  describe('Player Behavior Analytics', () => {
    let behaviorAnalytics;

    beforeEach(async () => {
      await analytics.initialize();
      behaviorAnalytics = new PlayerBehaviorAnalytics(analytics);
    });

    it('should track session start', () => {
      const sessionData = {
        type: 'normal',
        deviceType: 'desktop',
        previousSessionGap: 3600000
      };
      
      behaviorAnalytics.trackSessionStart(sessionData);
      
      const event = analytics.processingQueue.find(e => e.type === 'session_start');
      expect(event).toBeDefined();
      expect(event.data.sessionType).toBe('normal');
      expect(event.data.deviceType).toBe('desktop');
    });

    it('should track session end', () => {
      const sessionData = {
        duration: 1800000, // 30 minutes
        eventsCount: 25,
        matchesPlayed: 3,
        reason: 'user_quit'
      };
      
      behaviorAnalytics.trackSessionEnd(sessionData);
      
      const event = analytics.processingQueue.find(e => e.type === 'session_end');
      expect(event).toBeDefined();
      expect(event.data.duration).toBe(1800000);
      expect(event.data.matchesPlayed).toBe(3);
    });

    it('should track feature usage', () => {
      behaviorAnalytics.trackFeatureUsage('deck_builder', { firstTimeUse: true });
      
      const event = analytics.processingQueue.find(e => e.type === 'feature_use');
      expect(event).toBeDefined();
      expect(event.data.feature).toBe('deck_builder');
      expect(event.data.context.firstTimeUse).toBe(true);
    });

    it('should calculate engagement score with mock data', async () => {
      // Mock insights response
      analytics.getInsights = async () => ({
        sessionMetrics: { totalSessions: 5, averageSessionDuration: 600000 },
        engagementMetrics: { 
          topFeatures: [{ key: 'feature1' }, { key: 'feature2' }],
          retentionRate: 75 
        }
      });
      
      const score = await behaviorAnalytics.getEngagementScore('player123');
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Analytics', () => {
    let performanceAnalytics;

    beforeEach(async () => {
      await analytics.initialize();
      performanceAnalytics = new PerformanceAnalytics(analytics);
    });

    it('should track asset load performance', () => {
      performanceAnalytics.trackAssetLoad('image', '/assets/card.png', 1500, true);
      
      const event = analytics.processingQueue.find(e => e.type === 'asset_load');
      expect(event).toBeDefined();
      expect(event.data.assetType).toBe('image');
      expect(event.data.loadTime).toBe(1500);
      expect(event.data.success).toBe(true);
    });

    it('should track render performance', () => {
      performanceAnalytics.trackRenderPerformance('card-component', 20);
      
      const event = analytics.processingQueue.find(e => e.type === 'render_frame');
      expect(event).toBeDefined();
      expect(event.data.component).toBe('card-component');
      expect(event.data.renderTime).toBe(20);
      expect(event.data.slow).toBe(true); // Over 16.67ms threshold
    });

    it('should track errors', () => {
      const error = new Error('Test error');
      performanceAnalytics.trackError(error, { component: 'test' });
      
      const event = analytics.processingQueue.find(e => e.type === 'error_occurred');
      expect(event).toBeDefined();
      expect(event.data.message).toBe('Test error');
      expect(event.data.context.component).toBe('test');
    });
  });

  describe('Game Balance Analytics', () => {
    let balanceAnalytics;

    beforeEach(async () => {
      await analytics.initialize();
      balanceAnalytics = new GameBalanceAnalytics(analytics);
    });

    it('should track card play', () => {
      const context = {
        cost: 3,
        lane: 'mountain',
        terrain: 'mountain',
        turn: 5,
        handSize: 4,
        chakra: 7
      };
      
      balanceAnalytics.trackCardPlay('fire_bolt', context);
      
      const event = analytics.processingQueue.find(e => e.type === 'card_played');
      expect(event).toBeDefined();
      expect(event.data.cardId).toBe('fire_bolt');
      expect(event.data.cost).toBe(3);
      expect(event.data.lane).toBe('mountain');
    });

    it('should track combo execution', () => {
      const context = {
        lane: 'forest',
        terrain: 'forest',
        success: true,
        damage: 15,
        cardsUsed: ['card1', 'card2']
      };
      
      balanceAnalytics.trackComboExecution('flame_combo', context);
      
      const event = analytics.processingQueue.find(e => e.type === 'combo_executed');
      expect(event).toBeDefined();
      expect(event.data.comboId).toBe('flame_combo');
      expect(event.data.success).toBe(true);
      expect(event.data.damage).toBe(15);
    });

    it('should track match outcome', () => {
      const outcome = { won: true, duration: 1200000, finalScore: 150 };
      const context = {
        archetype: 'Aggro',
        opponentArchetype: 'Control',
        cardsPlayed: 12,
        combosExecuted: 3
      };
      
      balanceAnalytics.trackMatchOutcome(outcome, context);
      
      const event = analytics.processingQueue.find(e => e.type === 'match_outcome');
      expect(event).toBeDefined();
      expect(event.data.won).toBe(true);
      expect(event.data.archetype).toBe('Aggro');
    });

    it('should calculate card balance score', () => {
      const cardWinRates = [
        { cardId: 'card1', winRate: 45 },
        { cardId: 'card2', winRate: 55 },
        { cardId: 'card3', winRate: 50 }
      ];
      
      const score = balanceAnalytics._calculateCardBalanceScore(cardWinRates);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Competitive Analytics', () => {
    let competitiveAnalytics;

    beforeEach(async () => {
      await analytics.initialize();
      competitiveAnalytics = new CompetitiveAnalytics(analytics);
    });

    it('should track ranking changes', () => {
      competitiveAnalytics.trackRankingChange('player123', 1200, 1250, 'win');
      
      const event = analytics.processingQueue.find(e => e.type === 'ranking_change');
      expect(event).toBeDefined();
      expect(event.data.oldRating).toBe(1200);
      expect(event.data.newRating).toBe(1250);
      expect(event.data.change).toBe(50);
    });

    it('should track matchmaking queue', () => {
      const queueData = {
        waitTime: 45000,
        playerRating: 1300,
        queueType: 'ranked',
        foundMatch: true,
        ratingDifference: 50
      };
      
      competitiveAnalytics.trackMatchmakingQueue(queueData);
      
      const event = analytics.processingQueue.find(e => e.type === 'matchmaking_queue');
      expect(event).toBeDefined();
      expect(event.data.waitTime).toBe(45000);
      expect(event.data.foundMatch).toBe(true);
    });

    it('should get rating tier correctly', () => {
      expect(competitiveAnalytics._getRatingTier(800)).toBe('Bronze');
      expect(competitiveAnalytics._getRatingTier(1100)).toBe('Silver');
      expect(competitiveAnalytics._getRatingTier(1300)).toBe('Gold');
      expect(competitiveAnalytics._getRatingTier(1500)).toBe('Platinum');
      expect(competitiveAnalytics._getRatingTier(1700)).toBe('Diamond');
      expect(competitiveAnalytics._getRatingTier(1900)).toBe('Master');
    });
  });

  describe('Game Analytics Integration', () => {
    let integration;

    beforeEach(async () => {
      integration = new GameAnalyticsIntegration();
      await integration.initialize();
    });

    it('should initialize successfully', async () => {
      expect(integration.isInitialized).toBe(true);
    });

    it('should track match start', () => {
      const gameState = {
        deck: [
          { id: 'card1', name: 'Fire Bolt', cost: 2, school: 'Ninjutsu' },
          { id: 'card2', name: 'Quick Strike', cost: 1, school: 'Taijutsu' }
        ],
        hand: [{ id: 'card3', name: 'Block', cost: 1 }],
        chakra: { current: 5 },
        activeTerrain: 'mountain'
      };
      
      integration.trackMatchStart(gameState, { matchType: 'ranked' });
      
      expect(integration.currentMatchData).toBeDefined();
      expect(integration.currentMatchData.matchType).toBe('ranked');
      expect(integration.matchStartTime).toBeDefined();
    });

    it('should track match end', () => {
      // Set up current match
      integration.currentMatchData = {
        matchId: 'test_match',
        startTime: Date.now() - 600000, // 10 minutes ago
        playerDeck: { cards: [], totalCards: 30 }
      };
      integration.matchStartTime = Date.now() - 600000;
      
      const gameState = {
        hand: [{ id: 'card1' }],
        deck: [{ id: 'card2' }],
        stats: { combos: 2 }
      };
      
      const outcome = {
        result: 'win',
        score: 100,
        ratingChange: 25
      };
      
      integration.trackMatchEnd(gameState, outcome);
      
      expect(integration.currentMatchData).toBeNull();
      expect(integration.matchStartTime).toBeNull();
    });

    it('should determine deck archetype', () => {
      const aggroDeck = [
        { school: 'Taijutsu' },
        { school: 'Taijutsu' },
        { school: 'Ninjutsu' }
      ];
      
      const controlDeck = [
        { school: 'Ninjutsu' },
        { school: 'Ninjutsu' },
        { school: 'Taijutsu' }
      ];
      
      expect(integration._determineDeckArchetype(aggroDeck)).toBe('Aggro');
      expect(integration._determineDeckArchetype(controlDeck)).toBe('Control');
      expect(integration._determineDeckArchetype([])).toBe('unknown');
    });

    it('should generate unique match IDs', () => {
      const id1 = integration._generateMatchId();
      const id2 = integration._generateMatchId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^match_\d+_[a-z0-9]+$/);
    });
  });

  describe('Analytics Utils', () => {
    it('should get comprehensive dashboard', async () => {
      // Mock all insights
      vi.spyOn(analyticsEngine, 'getInsights')
        .mockResolvedValueOnce({ sessionMetrics: {} }) // player_behavior
        .mockResolvedValueOnce({ loadPerformance: {} }) // performance
        .mockResolvedValueOnce({ cardMetrics: {} }) // game_balance
        .mockResolvedValueOnce({ rankingMetrics: {} }); // competitive
      
      vi.spyOn(analyticsEngine, 'getSystemHealth').mockReturnValue({
        analytics: { initialized: true },
        performance: {},
        session: null
      });
      
      const dashboard = await AnalyticsUtils.getDashboard();
      
      expect(dashboard).toBeDefined();
      expect(dashboard.timeRange).toBeDefined();
      expect(dashboard.playerBehavior).toBeDefined();
      expect(dashboard.performance).toBeDefined();
      expect(dashboard.gameBalance).toBeDefined();
      expect(dashboard.competitive).toBeDefined();
      expect(dashboard.systemHealth).toBeDefined();
    });

    it('should export comprehensive report', async () => {
      vi.spyOn(analyticsEngine, 'exportData').mockResolvedValue({
        metadata: { exportedAt: Date.now() },
        data: { playerBehavior: {}, performance: {} }
      });
      
      const report = await AnalyticsUtils.exportReport({
        timeRange: 7 * 24 * 60 * 60 * 1000,
        format: 'json'
      });
      
      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.data).toBeDefined();
    });

    it('should get system status', () => {
      vi.spyOn(analyticsEngine, 'getSystemHealth').mockReturnValue({
        analytics: { initialized: true, queueSize: 0 }
      });
      
      const status = AnalyticsUtils.getSystemStatus();
      
      expect(status).toBeDefined();
      expect(status.analytics).toBeDefined();
      expect(status.timestamp).toBeDefined();
      expect(status.version).toBe('1.0.0');
    });
  });

  describe('Privacy and Security', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('should hash player identifiers', () => {
      const playerId = 'player_12345';
      const hashed = analytics._hashIdentifier(playerId);
      
      expect(hashed).not.toBe(playerId);
      expect(hashed).toMatch(/^anon_[a-z0-9]+$/);
    });

    it('should anonymize user agent', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const anonymized = analytics._anonymizeUserAgent(userAgent);
      
      expect(anonymized).not.toContain('Windows NT');
      expect(anonymized).not.toContain('Win64');
      expect(anonymized).toContain('Chrome');
    });

    it('should exclude PII from events', () => {
      const eventData = {
        email: 'user@example.com',
        username: 'testuser',
        gameAction: 'card_play',
        cardId: 'fire_bolt'
      };
      
      analytics.trackEvent('card_played', eventData);
      
      const event = analytics.processingQueue[0];
      expect(event.data.email).toBeUndefined();
      expect(event.data.username).toBeUndefined();
      expect(event.data.gameAction).toBe('card_play');
      expect(event.data.cardId).toBe('fire_bolt');
    });

    it('should respect privacy configuration', () => {
      // Test with privacy enabled
      expect(analytics._sanitizeData({ email: 'test@example.com' }).email).toBeUndefined();
      
      // Test anonymization flag
      const userAgent = 'Mozilla/5.0 (detailed system info)';
      expect(analytics._anonymizeUserAgent(userAgent)).not.toContain('detailed system info');
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('should handle invalid event data gracefully', () => {
      expect(() => {
        analytics.trackEvent('test_event', null);
      }).not.toThrow();
      
      expect(() => {
        analytics.trackEvent('test_event', undefined);
      }).not.toThrow();
      
      expect(() => {
        analytics.trackEvent(null, { data: 'test' });
      }).not.toThrow();
    });

    it('should handle storage failures gracefully', async () => {
      // Mock storage failure
      vi.spyOn(analytics, '_storeEvents').mockRejectedValue(new Error('Storage failed'));
      
      // Should not throw
      await expect(analytics._flushEvents()).resolves.toBeUndefined();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      analytics.subscribe('test_event', errorListener);
      
      // Should not throw despite listener error
      expect(() => {
        analytics.trackEvent('test_event', { data: 'test' });
      }).not.toThrow();
    });

    it('should handle performance monitoring failures', () => {
      // Mock performance API unavailable
      const originalPerformance = global.performance;
      delete global.performance;
      
      expect(() => {
        analytics._getCurrentPerformanceSnapshot();
      }).not.toThrow();
      
      // Restore
      global.performance = originalPerformance;
    });
  });

  describe('Memory Management', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('should limit event queue size', () => {
      // Fill beyond batch size
      for (let i = 0; i < 150; i++) {
        analytics.trackEvent('test_event', { index: i });
      }
      
      // Should auto-flush when reaching batch size
      expect(analytics.processingQueue.length).toBeLessThan(150);
    });

    it('should estimate memory usage', () => {
      analytics.trackEvent('test_event', { data: 'large data'.repeat(1000) });
      
      const memoryUsage = analytics._estimateMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
    });

    it('should clean up old data', async () => {
      const cleanupSpy = vi.spyOn(analytics, '_cleanupOldData');
      
      await analytics.initialize();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});

describe('Integration with Game Systems', () => {
  let integration;
  let mockGameState;

  beforeEach(async () => {
    integration = new GameAnalyticsIntegration();
    await integration.initialize();
    
    mockGameState = {
      deck: [
        { id: 'card1', name: 'Fire Bolt', cost: 2, school: 'Ninjutsu' },
        { id: 'card2', name: 'Quick Strike', cost: 1, school: 'Taijutsu' }
      ],
      hand: [{ id: 'card3', name: 'Block', cost: 1 }],
      chakra: { current: 5 },
      activeTerrain: 'mountain',
      stats: { combos: 0 }
    };
  });

  it('should integrate with combat events', () => {
    const mockCombatEvent = {
      type: 'damage',
      data: {
        attacker: { id: 'unit1', name: 'Ninja' },
        target: { id: 'unit2', name: 'Guardian' },
        damage: 5,
        lane: 'mountain'
      }
    };
    
    // Simulate combat event
    integration._trackDamageEvent(mockCombatEvent);
    
    // Should create analytics event
    const analyticsEvents = analyticsEngine.processingQueue;
    const damageEvent = analyticsEvents.find(e => e.type === 'damage_dealt');
    expect(damageEvent).toBeDefined();
    expect(damageEvent.data.damage).toBe(5);
  });

  it('should track complete match lifecycle', () => {
    // Start match
    integration.trackMatchStart(mockGameState, { matchType: 'ranked' });
    expect(integration.currentMatchData).toBeDefined();
    
    // Play some cards
    integration.trackCardPlay('card1', 'mountain', mockGameState);
    integration.trackCardPlay('card2', 'forest', mockGameState);
    
    // Execute combo
    integration.trackComboExecution('flame_combo', 'Flame Combo', 'mountain', mockGameState, true, 10);
    
    // End match
    const outcome = { result: 'win', score: 150 };
    integration.trackMatchEnd(mockGameState, outcome);
    expect(integration.currentMatchData).toBeNull();
    
    // Verify events were tracked
    const events = analyticsEngine.processingQueue;
    expect(events.some(e => e.type === 'match_start')).toBe(true);
    expect(events.some(e => e.type === 'card_played')).toBe(true);
    expect(events.some(e => e.type === 'combo_executed')).toBe(true);
    expect(events.some(e => e.type === 'match_end')).toBe(true);
  });

  it('should provide match analytics summary', () => {
    integration.trackMatchStart(mockGameState, { matchType: 'casual' });
    
    const summary = integration.getCurrentMatchSummary();
    
    expect(summary).toBeDefined();
    expect(summary.matchId).toBeDefined();
    expect(summary.matchType).toBe('casual');
    expect(summary.duration).toBeGreaterThan(0);
  });
});