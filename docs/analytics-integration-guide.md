# Analytics Integration Guide

## Overview

The Ninja Clan Wars analytics infrastructure provides comprehensive insights into player behavior, game balance, and competitive integrity while maintaining strict privacy standards. This guide covers integration patterns for the PWA frontend.

## Core Components

### 1. Analytics Engine (`AnalyticsEngine`)

The main analytics engine handles event collection, processing, and aggregation.

```javascript
import { analyticsEngine, AnalyticsUtils } from '@game-core/analytics';

// Initialize analytics
await analyticsEngine.initialize();

// Track custom events
analyticsEngine.trackEvent('feature_use', {
  feature: 'deck_builder',
  context: { firstTimeUse: true }
});

// Get real-time insights
const insights = await analyticsEngine.getInsights('player_behavior');
```

### 2. Specialized Analytics Modules

#### Player Behavior Analytics
```javascript
import { playerBehaviorAnalytics } from '@game-core/analytics';

// Track session lifecycle
playerBehaviorAnalytics.trackSessionStart({
  type: 'normal',
  deviceType: 'mobile',
  previousSessionGap: 3600000
});

playerBehaviorAnalytics.trackSessionEnd({
  duration: 1800000,
  eventsCount: 25,
  matchesPlayed: 3
});

// Get engagement score
const score = await playerBehaviorAnalytics.getEngagementScore('player123');
```

#### Performance Analytics
```javascript
import { performanceAnalytics } from '@game-core/analytics';

// Track performance metrics
performanceAnalytics.trackAssetLoad('image', '/assets/card.png', 1500, true);
performanceAnalytics.trackRenderPerformance('card-component', 20);
performanceAnalytics.trackError(new Error('Network timeout'), { 
  component: 'matchmaking' 
});
```

#### Game Balance Analytics
```javascript
import { gameBalanceAnalytics } from '@game-core/analytics';

// Track game events
gameBalanceAnalytics.trackCardPlay('fire_bolt', {
  cost: 3,
  lane: 'mountain',
  terrain: 'mountain',
  turn: 5
});

gameBalanceAnalytics.trackMatchOutcome({
  won: true,
  duration: 1200000
}, {
  archetype: 'Aggro',
  opponentArchetype: 'Control'
});
```

#### Competitive Analytics
```javascript
import { competitiveAnalytics } from '@game-core/analytics';

// Track competitive events
competitiveAnalytics.trackRankingChange('player123', 1200, 1250, 'win');
competitiveAnalytics.trackMatchmakingQueue({
  waitTime: 45000,
  playerRating: 1300,
  foundMatch: true
});
```

### 3. Game Integration

For automatic game event tracking, use the `GameAnalyticsIntegration`:

```javascript
import { gameAnalyticsIntegration } from '@game-core/analytics-integration';

// Initialize integration
await gameAnalyticsIntegration.initialize();

// Track match lifecycle
gameAnalyticsIntegration.trackMatchStart(gameState, { matchType: 'ranked' });
gameAnalyticsIntegration.trackCardPlay('fire_bolt', 'mountain', gameState);
gameAnalyticsIntegration.trackMatchEnd(gameState, { result: 'win', score: 150 });
```

## PWA Integration Patterns

### 1. Component-Level Analytics

Track user interactions in Lit components:

```javascript
import { LitElement, html } from 'lit';
import { analyticsEngine } from '@game-core/analytics';

export class NinjaCardComponent extends LitElement {
  _onCardClick(event) {
    // Track card interaction
    analyticsEngine.trackEvent('user_action', {
      action: 'card_click',
      cardId: this.card.id,
      context: 'hand'
    });
    
    // Handle game logic
    this._playCard();
  }
  
  _onCardHover() {
    // Track engagement
    analyticsEngine.trackEvent('user_action', {
      action: 'card_hover',
      cardId: this.card.id,
      duration: Date.now() - this.hoverStartTime
    });
  }
}
```

### 2. Route-Level Analytics

Track screen views and navigation:

```javascript
import { Router } from '@vaadin/router';
import { analyticsEngine } from '@game-core/analytics';

// Set up route tracking
Router.setRoutes([
  {
    path: '/deck-builder',
    component: 'deck-builder-view',
    action: () => {
      analyticsEngine.trackEvent('screen_view', {
        screen: 'deck_builder',
        timestamp: Date.now()
      });
    }
  }
]);
```

### 3. Performance Monitoring

Automatically track performance metrics:

```javascript
import { performanceAnalytics } from '@game-core/analytics';

// Track component render times
export class GameBoardComponent extends LitElement {
  updated() {
    const renderTime = performance.now() - this.renderStartTime;
    performanceAnalytics.trackRenderPerformance('game-board', renderTime);
  }
  
  willUpdate() {
    this.renderStartTime = performance.now();
  }
}

// Track asset loading
const loadAsset = async (url) => {
  const startTime = performance.now();
  try {
    const response = await fetch(url);
    const loadTime = performance.now() - startTime;
    performanceAnalytics.trackAssetLoad('image', url, loadTime, response.ok);
    return response;
  } catch (error) {
    const loadTime = performance.now() - startTime;
    performanceAnalytics.trackAssetLoad('image', url, loadTime, false);
    throw error;
  }
};
```

## Dashboard Integration

### Real-Time Analytics Dashboard

```javascript
import { AnalyticsUtils } from '@game-core/analytics';

export class AnalyticsDashboard extends LitElement {
  static properties = {
    dashboardData: { type: Object }
  };
  
  async connectedCallback() {
    super.connectedCallback();
    await this._loadDashboard();
    
    // Update dashboard every 30 seconds
    this.updateInterval = setInterval(() => {
      this._loadDashboard();
    }, 30000);
  }
  
  async _loadDashboard() {
    this.dashboardData = await AnalyticsUtils.getDashboard();
  }
  
  render() {
    if (!this.dashboardData) return html`<div>Loading...</div>`;
    
    return html`
      <div class="dashboard">
        <section class="player-behavior">
          <h3>Player Engagement</h3>
          <div class="metric">
            Sessions: ${this.dashboardData.playerBehavior?.sessionMetrics?.totalSessions}
          </div>
          <div class="metric">
            Avg Duration: ${this._formatDuration(this.dashboardData.playerBehavior?.sessionMetrics?.averageSessionDuration)}
          </div>
        </section>
        
        <section class="performance">
          <h3>Performance</h3>
          <div class="metric">
            Load Time: ${this.dashboardData.performance?.loadPerformance?.averageLoadTime}ms
          </div>
          <div class="metric">
            Avg FPS: ${this.dashboardData.performance?.renderPerformance?.averageFPS}
          </div>
        </section>
        
        <section class="game-balance">
          <h3>Game Balance</h3>
          <div class="top-cards">
            ${this.dashboardData.gameBalance?.cardMetrics?.mostPlayedCards?.map(card => 
              html`<div class="card-stat">${card.key}: ${card.value}</div>`
            )}
          </div>
        </section>
      </div>
    `;
  }
}
```

## Privacy Configuration

### Local-Only Mode

```javascript
import { analyticsEngine, ANALYTICS_CONFIG } from '@game-core/analytics';

// Configure for maximum privacy
ANALYTICS_CONFIG.PRIVACY.LOCAL_PROCESSING_ONLY = true;
ANALYTICS_CONFIG.PRIVACY.ANONYMIZE_USER_DATA = true;
ANALYTICS_CONFIG.PRIVACY.EXCLUDE_PII = true;

await analyticsEngine.initialize();
```

### Data Export for Analysis

```javascript
import { AnalyticsUtils } from '@game-core/analytics';

// Export anonymized data
const exportData = await AnalyticsUtils.exportReport({
  timeRange: 7 * 24 * 60 * 60 * 1000, // 7 days
  categories: ['game_balance', 'performance'],
  format: 'json',
  anonymize: true
});

// Save to file
const blob = new Blob([JSON.stringify(exportData, null, 2)], {
  type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'analytics-report.json';
a.click();
```

## Error Handling

### Graceful Degradation

```javascript
import { analyticsEngine } from '@game-core/analytics';

export class GameComponent extends LitElement {
  _trackEvent(eventType, data) {
    try {
      analyticsEngine.trackEvent(eventType, data);
    } catch (error) {
      // Analytics failure shouldn't break game functionality
      console.warn('Analytics tracking failed:', error);
    }
  }
  
  _onGameAction() {
    // Core game logic (never fails)
    this._executeGameAction();
    
    // Analytics tracking (can fail safely)
    this._trackEvent('game_action', { action: 'card_play' });
  }
}
```

### Analytics Health Monitoring

```javascript
import { analyticsEngine } from '@game-core/analytics';

export class AnalyticsHealthMonitor {
  static checkHealth() {
    const health = analyticsEngine.getSystemHealth();
    
    if (!health.analytics.initialized) {
      console.warn('Analytics not initialized');
      return false;
    }
    
    if (health.analytics.queueSize > 1000) {
      console.warn('Analytics queue backup detected');
      return false;
    }
    
    if (health.analytics.memoryUsage > 50 * 1024 * 1024) {
      console.warn('High analytics memory usage');
      return false;
    }
    
    return true;
  }
}

// Monitor health periodically
setInterval(() => {
  AnalyticsHealthMonitor.checkHealth();
}, 60000); // Every minute
```

## Best Practices

### 1. Event Naming Convention

Use consistent event naming:
- `session_start`, `session_end` - Player lifecycle
- `match_start`, `match_end` - Game lifecycle  
- `card_played`, `combo_executed` - Game actions
- `screen_view`, `feature_use` - UI interactions
- `error_occurred`, `performance_issue` - System events

### 2. Data Structure

Keep event data consistent:

```javascript
const eventData = {
  // Core game context
  matchId: 'match_123',
  playerId: 'player_456', // Will be anonymized
  timestamp: Date.now(),
  
  // Event-specific data
  cardId: 'fire_bolt',
  lane: 'mountain',
  cost: 3,
  
  // Additional context
  context: {
    turn: 5,
    terrain: 'mountain',
    handSize: 4
  }
};
```

### 3. Performance Considerations

- Use batching for high-frequency events
- Avoid tracking every frame or mouse movement
- Aggregate similar events before sending
- Monitor memory usage and queue sizes

### 4. Privacy Compliance

- Never track personal information
- Anonymize all user identifiers
- Process data locally when possible
- Provide clear opt-out mechanisms
- Document data collection practices

## Testing Analytics

### Unit Testing

```javascript
import { describe, it, expect } from 'vitest';
import { analyticsEngine } from '@game-core/analytics';

describe('Analytics Integration', () => {
  it('should track card play events', async () => {
    const mockPersistence = { /* mock implementation */ };
    await analyticsEngine.initialize({ persistenceManager: mockPersistence });
    
    analyticsEngine.trackEvent('card_played', { cardId: 'fire_bolt' });
    
    expect(analyticsEngine.processingQueue.length).toBeGreaterThan(0);
    const event = analyticsEngine.processingQueue.find(e => e.type === 'card_played');
    expect(event.data.cardId).toBe('fire_bolt');
  });
});
```

### Integration Testing

Test analytics with actual game flows:

```javascript
import { gameAnalyticsIntegration } from '@game-core/analytics-integration';

describe('Game Analytics Integration', () => {
  it('should track complete match lifecycle', async () => {
    await gameAnalyticsIntegration.initialize();
    
    // Start match
    const gameState = createTestGameState();
    gameAnalyticsIntegration.trackMatchStart(gameState);
    
    // Play cards
    gameAnalyticsIntegration.trackCardPlay('fire_bolt', 'mountain', gameState);
    
    // End match
    gameAnalyticsIntegration.trackMatchEnd(gameState, { result: 'win' });
    
    // Verify events were tracked
    const summary = gameAnalyticsIntegration.getCurrentMatchSummary();
    expect(summary).toBeNull(); // Should be cleared after match end
  });
});
```

This analytics infrastructure provides comprehensive insights while maintaining privacy and performance standards suitable for a competitive gaming environment.