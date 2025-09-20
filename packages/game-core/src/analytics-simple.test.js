/**
 * Simplified Analytics Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngine } from './analytics.js';

// Mock browser environment
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
      domContentLoadedEventEnd: Date.now() - 1000
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
global.requestAnimationFrame = global.window.requestAnimationFrame;

describe('Analytics Core Functionality', () => {
  let analytics;
  let mockPersistence;
  let mockCombatEvents;

  beforeEach(() => {
    // Create mock dependencies
    mockPersistence = {
      isInitialized: true,
      initialize: async () => {},
      setMetadata: async () => {},
      getMetadata: async () => null
    };

    mockCombatEvents = {
      subscribe: () => () => {},
      addEvent: () => {},
      getEvents: () => []
    };

    analytics = new AnalyticsEngine();
  });

  it('should create analytics engine instance', () => {
    expect(analytics).toBeDefined();
    expect(analytics.isInitialized).toBe(false);
    expect(analytics.eventQueue).toEqual([]);
    expect(analytics.processingQueue).toEqual([]);
  });

  it('should validate event types', () => {
    expect(analytics.eventTypes.has('session_start')).toBe(true);
    expect(analytics.eventTypes.has('card_played')).toBe(true);
    expect(analytics.eventTypes.has('match_end')).toBe(true);
    expect(analytics.eventTypes.has('invalid_event')).toBe(false);
  });

  it('should initialize with dependencies', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    expect(analytics.isInitialized).toBe(true);
    expect(analytics.persistenceManager).toBe(mockPersistence);
    expect(analytics.combatEvents).toBe(mockCombatEvents);
  });

  it('should track events when initialized', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    analytics.trackEvent('session_start', { sessionType: 'test' });
    
    expect(analytics.processingQueue.length).toBe(2); // analytics_initialized + session_start
    const sessionEvent = analytics.processingQueue.find(e => e.type === 'session_start');
    expect(sessionEvent).toBeDefined();
    expect(sessionEvent.data.sessionType).toBe('test');
  });

  it('should queue events when not initialized', () => {
    analytics.trackEvent('session_start', { sessionType: 'test' });
    
    expect(analytics.eventQueue.length).toBe(1);
    expect(analytics.processingQueue.length).toBe(0);
  });

  it('should sanitize sensitive data', () => {
    const sensitiveData = {
      email: 'user@example.com',
      playerId: 'player123',
      gameData: 'safe_data'
    };
    
    const sanitized = analytics._sanitizeData(sensitiveData);
    
    expect(sanitized.email).toBeUndefined();
    expect(sanitized.gameData).toBe('safe_data');
    expect(sanitized.playerId).not.toBe('player123'); // Should be hashed
  });

  it('should categorize events correctly', () => {
    expect(analytics._categorizeEvent('session_start')).toBe('player_behavior');
    expect(analytics._categorizeEvent('card_played')).toBe('game_balance');
    expect(analytics._categorizeEvent('page_load')).toBe('performance');
    expect(analytics._categorizeEvent('ranking_change')).toBe('competitive');
    expect(analytics._categorizeEvent('unknown_event')).toBe('general');
  });

  it('should generate unique IDs', () => {
    const id1 = analytics._generateEventId();
    const id2 = analytics._generateEventId();
    const sessionId = analytics._generateSessionId();
    const batchId = analytics._generateBatchId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^event_\d+_[a-z0-9]+$/);
    expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(batchId).toMatch(/^batch_\d+_[a-z0-9]+$/);
  });

  it('should hash identifiers for privacy', () => {
    const playerId = 'player_12345';
    const hashed = analytics._hashIdentifier(playerId);
    
    expect(hashed).not.toBe(playerId);
    expect(hashed).toMatch(/^anon_[a-z0-9]+$/);
    
    // Same input should produce same hash
    const hashed2 = analytics._hashIdentifier(playerId);
    expect(hashed).toBe(hashed2);
  });

  it('should anonymize user agent strings', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36';
    const anonymized = analytics._anonymizeUserAgent(userAgent);
    
    expect(anonymized).not.toContain('Windows NT');
    expect(anonymized).not.toContain('Win64');
    expect(anonymized).toContain('Chrome');
  });

  it('should enrich events with context', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    const event = {
      type: 'test_event',
      data: { value: 123 },
      timestamp: Date.now()
    };
    
    const enriched = analytics._enrichEvent(event);
    
    expect(enriched.id).toBeDefined();
    expect(enriched.category).toBe('general');
    expect(enriched.browser).toBeDefined();
    expect(enriched.performance).toBeDefined();
  });

  it('should estimate memory usage', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    // Add some events
    analytics.trackEvent('test_event', { data: 'test' });
    analytics.trackEvent('test_event', { data: 'test2' });
    
    const memoryUsage = analytics._estimateMemoryUsage();
    expect(memoryUsage).toBeGreaterThan(0);
  });

  it('should get current performance metrics', () => {
    const metrics = analytics._getCurrentPerformanceMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.eventQueueSize).toBe(0);
    expect(typeof metrics.memoryUsage).toBe('number');
  });

  it('should handle errors gracefully', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    // Should not throw with invalid data
    expect(() => {
      analytics.trackEvent('test_event', null);
      analytics.trackEvent('test_event', undefined);
      analytics.trackEvent(null, { data: 'test' });
    }).not.toThrow();
  });

  it('should subscribe and unsubscribe event listeners', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    let eventReceived = null;
    const unsubscribe = analytics.subscribe('test_event', (event) => {
      eventReceived = event;
    });
    
    analytics.trackEvent('test_event', { value: 456 });
    
    expect(eventReceived).toBeDefined();
    expect(eventReceived.type).toBe('test_event');
    expect(eventReceived.data.value).toBe(456);
    
    // Test unsubscribe
    unsubscribe();
    eventReceived = null;
    analytics.trackEvent('test_event', { value: 789 });
    
    expect(eventReceived).toBeNull();
  });

  it('should get system health information', async () => {
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: mockCombatEvents
    });
    
    const health = analytics.getSystemHealth();
    
    expect(health).toBeDefined();
    expect(health.analytics).toBeDefined();
    expect(health.analytics.initialized).toBe(true);
    expect(health.performance).toBeDefined();
  });
});

describe('Analytics Event Aggregation', () => {
  let analytics;
  let mockPersistence;

  beforeEach(async () => {
    mockPersistence = {
      isInitialized: true,
      initialize: async () => {},
      setMetadata: async () => {},
      getMetadata: async () => ({
        value: {
          playerBehavior: { sessions: { total: 0 } },
          performance: { loadTimes: { average: 0, samples: 0 } },
          gameBalance: { cardUsage: {} },
          competitive: { rankings: {} },
          lastUpdated: Date.now()
        }
      })
    };

    analytics = new AnalyticsEngine();
    await analytics.initialize({
      persistenceManager: mockPersistence,
      combatEvents: { subscribe: () => () => {} }
    });
  });

  it('should aggregate player behavior metrics', () => {
    const metrics = { sessions: { total: 0, averageDuration: 0 } };
    const event = { type: 'session_start', timestamp: Date.now() };
    
    analytics._aggregatePlayerBehaviorMetrics(metrics, event);
    
    expect(metrics.sessions.total).toBe(1);
  });

  it('should aggregate performance metrics', () => {
    const metrics = { loadTimes: { average: 0, samples: 0 } };
    const event = { type: 'page_load', data: { loadTime: 2000 }, timestamp: Date.now() };
    
    analytics._aggregatePerformanceMetrics(metrics, event);
    
    expect(metrics.loadTimes.average).toBe(2000);
    expect(metrics.loadTimes.samples).toBe(1);
  });

  it('should aggregate game balance metrics', () => {
    const metrics = { cardUsage: {} };
    const event = { type: 'card_played', data: { cardId: 'fire_bolt' }, timestamp: Date.now() };
    
    analytics._aggregateGameBalanceMetrics(metrics, event);
    
    expect(metrics.cardUsage.fire_bolt).toBeDefined();
    expect(metrics.cardUsage.fire_bolt.timesPlayed).toBe(1);
  });

  it('should aggregate competitive metrics', () => {
    const metrics = { rankings: { distributions: {} } };
    const event = { type: 'ranking_change', data: { newRank: 'Silver' }, timestamp: Date.now() };
    
    analytics._aggregateCompetitiveMetrics(metrics, event);
    
    expect(metrics.rankings.distributions.Silver).toBe(1);
  });
});

describe('Analytics Privacy Features', () => {
  let analytics;

  beforeEach(() => {
    analytics = new AnalyticsEngine();
  });

  it('should exclude PII from event data', () => {
    const eventData = {
      email: 'user@example.com',
      username: 'testuser',
      userId: 'user123',
      ip: '192.168.1.1',
      playerId: 'player_12345',
      gameAction: 'card_play',
      cardId: 'fire_bolt'
    };
    
    const sanitized = analytics._sanitizeData(eventData);
    
    // PII should be removed
    expect(sanitized.email).toBeUndefined();
    expect(sanitized.username).toBeUndefined();
    expect(sanitized.userId).toBeUndefined();
    expect(sanitized.ip).toBeUndefined();
    
    // Game data should be preserved
    expect(sanitized.gameAction).toBe('card_play');
    expect(sanitized.cardId).toBe('fire_bolt');
    
    // Player ID should be hashed
    expect(sanitized.playerId).toMatch(/^anon_[a-z0-9]+$/);
    expect(sanitized.playerId).not.toBe('player_12345');
  });

  it('should respect privacy configuration', () => {
    // Test browser info anonymization
    const browserInfo = analytics._getBrowserInfo();
    
    expect(browserInfo).toBeDefined();
    expect(browserInfo.userAgent).not.toContain('detailed system info');
    expect(browserInfo.language).toBeDefined();
    expect(browserInfo.platform).toBeDefined();
  });
});