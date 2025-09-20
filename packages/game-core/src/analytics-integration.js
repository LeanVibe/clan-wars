/**
 * Analytics Integration for Ninja Clan Wars Game Core
 * Automatically tracks game events for comprehensive analytics
 */

import { analyticsEngine, gameBalanceAnalytics, competitiveAnalytics } from './analytics.js';
import { combatEvents } from './combat-events.js';

/**
 * Game Analytics Integration Manager
 * Bridges game events with the analytics system
 */
export class GameAnalyticsIntegration {
  constructor() {
    this.isInitialized = false;
    this.currentMatchData = null;
    this.matchStartTime = null;
    this.combatEventSubscription = null;
  }

  /**
   * Initialize analytics integration
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Initialize analytics engine if not already done
      if (!analyticsEngine.isInitialized) {
        await analyticsEngine.initialize();
      }

      // Set up combat event monitoring
      this._setupCombatEventTracking();

      this.isInitialized = true;
      console.log('[Analytics Integration] Initialized successfully');

    } catch (error) {
      console.error('[Analytics Integration] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Track match start event
   */
  trackMatchStart(gameState, matchConfig = {}) {
    try {
      this.matchStartTime = Date.now();
      this.currentMatchData = {
        matchId: this._generateMatchId(),
        startTime: this.matchStartTime,
        playerDeck: this._extractDeckInfo(gameState.deck),
        initialState: this._sanitizeGameState(gameState),
        matchType: matchConfig.matchType || 'casual',
        opponent: matchConfig.opponent || 'ai'
      };

      // Track with analytics engine
      analyticsEngine.trackEvent('match_start', {
        matchId: this.currentMatchData.matchId,
        matchType: this.currentMatchData.matchType,
        deckArchetype: this._determineDeckArchetype(gameState.deck),
        initialChakra: gameState.chakra?.current || 0,
        initialHandSize: gameState.hand?.length || 0,
        activeTerrain: gameState.activeTerrain || 'mountain'
      });

      // Track with game balance analytics
      gameBalanceAnalytics.trackMatchOutcome({
        started: true,
        matchId: this.currentMatchData.matchId
      }, {
        archetype: this._determineDeckArchetype(gameState.deck),
        deckSize: gameState.deck?.length || 0
      });

      console.log(`[Analytics Integration] Match started: ${this.currentMatchData.matchId}`);

    } catch (error) {
      console.error('[Analytics Integration] Failed to track match start:', error);
    }
  }

  /**
   * Track match end event
   */
  trackMatchEnd(gameState, outcome) {
    try {
      if (!this.currentMatchData) {
        console.warn('[Analytics Integration] No current match data for match end');
        return;
      }

      const duration = Date.now() - this.matchStartTime;
      const matchStats = this._calculateMatchStats(gameState, duration);

      // Track with analytics engine
      analyticsEngine.trackEvent('match_end', {
        matchId: this.currentMatchData.matchId,
        duration,
        outcome: outcome.result, // 'win', 'loss', 'draw'
        finalScore: outcome.score || 0,
        ...matchStats
      });

      // Track with game balance analytics
      gameBalanceAnalytics.trackMatchOutcome({
        won: outcome.result === 'win',
        duration,
        finalScore: outcome.score || 0
      }, {
        archetype: this._determineDeckArchetype(this.currentMatchData.playerDeck),
        opponentArchetype: outcome.opponentArchetype || 'unknown',
        cardsPlayed: matchStats.cardsPlayed,
        combosExecuted: matchStats.combosExecuted
      });

      // Track with competitive analytics if ranked
      if (this.currentMatchData.matchType === 'ranked' && outcome.ratingChange) {
        competitiveAnalytics.trackRankingChange(
          'current_player', // Would be actual player ID
          outcome.oldRating || 1200,
          outcome.newRating || 1200,
          outcome.result
        );
      }

      console.log(`[Analytics Integration] Match ended: ${this.currentMatchData.matchId}, Result: ${outcome.result}`);

      // Clear current match data
      this.currentMatchData = null;
      this.matchStartTime = null;

    } catch (error) {
      console.error('[Analytics Integration] Failed to track match end:', error);
    }
  }

  /**
   * Track card play event
   */
  trackCardPlay(cardId, lane, gameState) {
    try {
      const card = this._findCardById(gameState.deck, cardId) || this._findCardById(gameState.hand, cardId);
      if (!card) return;

      // Track with game balance analytics
      gameBalanceAnalytics.trackCardPlay(cardId, {
        cost: card.cost || 0,
        lane: lane,
        terrain: gameState.activeTerrain || 'mountain',
        turn: this._calculateTurn(gameState),
        handSize: gameState.hand?.length || 0,
        chakra: gameState.chakra?.current || 0
      });

      // Track general event
      analyticsEngine.trackEvent('card_played', {
        cardId,
        cardName: card.name,
        cardSchool: card.school,
        cost: card.cost || 0,
        lane,
        terrain: gameState.activeTerrain,
        chakraAfterPlay: (gameState.chakra?.current || 0) - (card.cost || 0),
        matchId: this.currentMatchData?.matchId
      });

    } catch (error) {
      console.error('[Analytics Integration] Failed to track card play:', error);
    }
  }

  /**
   * Track combo execution event
   */
  trackComboExecution(comboId, comboName, lane, gameState, success = true, damage = 0) {
    try {
      // Track with game balance analytics
      gameBalanceAnalytics.trackComboExecution(comboId, {
        lane,
        terrain: gameState.activeTerrain || 'mountain',
        success,
        damage,
        cardsUsed: this._getCardsUsedInCombo(comboId, gameState)
      });

      // Track general event
      analyticsEngine.trackEvent('combo_executed', {
        comboId,
        comboName,
        lane,
        terrain: gameState.activeTerrain,
        success,
        damage,
        matchId: this.currentMatchData?.matchId
      });

    } catch (error) {
      console.error('[Analytics Integration] Failed to track combo execution:', error);
    }
  }

  /**
   * Track terrain effect activation
   */
  trackTerrainEffect(terrain, effect, impact) {
    try {
      gameBalanceAnalytics.trackTerrainEffect(terrain, effect, impact);

      analyticsEngine.trackEvent('terrain_effect', {
        terrain,
        effect,
        impact,
        beneficial: impact > 0,
        matchId: this.currentMatchData?.matchId
      });

    } catch (error) {
      console.error('[Analytics Integration] Failed to track terrain effect:', error);
    }
  }

  /**
   * Track player performance metrics
   */
  trackPerformanceMetric(metricType, value, context = {}) {
    try {
      analyticsEngine.trackEvent('performance_metric', {
        metricType,
        value,
        context,
        matchId: this.currentMatchData?.matchId,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('[Analytics Integration] Failed to track performance metric:', error);
    }
  }

  /**
   * Get current match analytics summary
   */
  getCurrentMatchSummary() {
    if (!this.currentMatchData) return null;

    return {
      matchId: this.currentMatchData.matchId,
      duration: Date.now() - this.matchStartTime,
      matchType: this.currentMatchData.matchType,
      startTime: this.matchStartTime
    };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Set up combat event tracking
   */
  _setupCombatEventTracking() {
    this.combatEventSubscription = combatEvents.subscribe((event) => {
      if (!event) return;

      try {
        // Map combat events to analytics events
        switch (event.type) {
          case 'damage':
            this._trackDamageEvent(event);
            break;
          case 'heal':
            this._trackHealEvent(event);
            break;
          case 'death':
            this._trackUnitDeathEvent(event);
            break;
          case 'spawn':
            this._trackUnitSpawnEvent(event);
            break;
          case 'combo':
            this._trackComboFromCombatEvent(event);
            break;
          case 'stronghold':
            this._trackStrongholdDamageEvent(event);
            break;
          case 'terrain':
            this._trackTerrainRotationEvent(event);
            break;
          case 'meditate':
            this._trackMeditateEvent(event);
            break;
          case 'reactive':
            this._trackReactiveJutsuEvent(event);
            break;
        }
      } catch (error) {
        console.error('[Analytics Integration] Error processing combat event:', error);
      }
    });
  }

  _trackDamageEvent(event) {
    analyticsEngine.trackEvent('damage_dealt', {
      attackerId: event.data.attacker?.id,
      targetId: event.data.target?.id,
      damage: event.data.damage,
      lane: event.data.lane,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackHealEvent(event) {
    analyticsEngine.trackEvent('healing_applied', {
      targetId: event.data.target?.id,
      amount: event.data.amount,
      lane: event.data.lane,
      source: event.data.source,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackUnitDeathEvent(event) {
    analyticsEngine.trackEvent('unit_destroyed', {
      unitId: event.data.unit?.id,
      unitName: event.data.unit?.name,
      lane: event.data.lane,
      killerId: event.data.killer?.id,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackUnitSpawnEvent(event) {
    analyticsEngine.trackEvent('unit_spawned', {
      unitId: event.data.unit?.id,
      unitName: event.data.unit?.name,
      lane: event.data.lane,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackComboFromCombatEvent(event) {
    this.trackComboExecution(
      event.data.comboId,
      event.data.comboName,
      event.data.lane,
      { activeTerrain: 'unknown' }, // Limited context from combat event
      true // Assume success if event fired
    );
  }

  _trackStrongholdDamageEvent(event) {
    analyticsEngine.trackEvent('stronghold_damage', {
      owner: event.data.owner,
      damage: event.data.damage,
      remainingHealth: event.data.remainingHealth,
      maxHealth: event.data.maxHealth,
      lane: event.data.lane,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackTerrainRotationEvent(event) {
    analyticsEngine.trackEvent('terrain_rotation', {
      newTerrain: event.data.terrainName,
      terrainId: event.data.terrainId,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackMeditateEvent(event) {
    analyticsEngine.trackEvent('meditate_action', {
      discardedCard: event.data.discardedCard,
      chakraGained: event.data.chakraGained,
      matchId: this.currentMatchData?.matchId
    });
  }

  _trackReactiveJutsuEvent(event) {
    analyticsEngine.trackEvent('reactive_jutsu', {
      jutsuName: event.data.jutsuName,
      jutsuId: event.data.jutsuId,
      lane: event.data.lane,
      owner: event.data.owner,
      matchId: this.currentMatchData?.matchId
    });
  }

  /**
   * Extract deck information for analytics
   */
  _extractDeckInfo(deck) {
    if (!deck) return { cards: [], totalCards: 0 };

    return {
      cards: deck.map(card => ({
        id: card.id,
        name: card.name,
        cost: card.cost,
        school: card.school
      })),
      totalCards: deck.length
    };
  }

  /**
   * Determine deck archetype based on card composition
   */
  _determineDeckArchetype(deck) {
    if (!deck || deck.length === 0) return 'unknown';

    const schoolCounts = deck.reduce((counts, card) => {
      const school = card.school || 'unknown';
      counts[school] = (counts[school] || 0) + 1;
      return counts;
    }, {});

    const dominantSchool = Object.entries(schoolCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Simple archetype determination based on dominant school
    const schoolToArchetype = {
      'Ninjutsu': 'Control',
      'Taijutsu': 'Aggro', 
      'Genjutsu': 'Combo'
    };

    return schoolToArchetype[dominantSchool] || 'Mixed';
  }

  /**
   * Sanitize game state for analytics (remove sensitive data)
   */
  _sanitizeGameState(gameState) {
    return {
      phase: gameState.phase,
      chakra: gameState.chakra,
      activeTerrain: gameState.activeTerrain,
      handSize: gameState.hand?.length || 0,
      deckSize: gameState.deck?.length || 0,
      // Exclude actual cards and detailed state
    };
  }

  /**
   * Calculate match statistics
   */
  _calculateMatchStats(gameState, duration) {
    return {
      finalChakra: gameState.chakra?.current || 0,
      finalHandSize: gameState.hand?.length || 0,
      finalDeckSize: gameState.deck?.length || 0,
      cardsPlayed: this._countCardsPlayed(gameState),
      combosExecuted: this._countCombosExecuted(gameState),
      terrainRotations: this._countTerrainRotations(gameState),
      averageAPM: this._calculateAPM(duration)
    };
  }

  _countCardsPlayed(gameState) {
    // Would track this during match, for now estimate based on deck size
    const initialDeckSize = this.currentMatchData?.playerDeck?.totalCards || 30;
    const currentDeckSize = gameState.deck?.length || 0;
    const handSize = gameState.hand?.length || 0;
    return Math.max(0, initialDeckSize - currentDeckSize - handSize);
  }

  _countCombosExecuted(gameState) {
    // Would track this during match, placeholder for now
    return gameState.stats?.combos || 0;
  }

  _countTerrainRotations(gameState) {
    // Would track this during match, placeholder for now
    return Math.floor((Date.now() - this.matchStartTime) / (45 * 1000)); // Estimate based on 45s rotations
  }

  _calculateAPM(duration) {
    const minutes = duration / (1000 * 60);
    const actions = this._countCardsPlayed() + this._countCombosExecuted();
    return minutes > 0 ? actions / minutes : 0;
  }

  _calculateTurn(gameState) {
    // Estimate turn based on elapsed time and game phase
    if (!this.matchStartTime) return 1;
    const elapsed = Date.now() - this.matchStartTime;
    return Math.floor(elapsed / 30000) + 1; // Estimate 30s per turn
  }

  _findCardById(collection, cardId) {
    if (!collection || !Array.isArray(collection)) return null;
    return collection.find(card => card.id === cardId);
  }

  _getCardsUsedInCombo(comboId, gameState) {
    // Would need to track this based on combo requirements
    // Placeholder implementation
    return [];
  }

  _generateMatchId() {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ========== INTEGRATION UTILITIES ==========

/**
 * Utility functions for integrating analytics with existing game code
 */
export const AnalyticsIntegrationUtils = {
  /**
   * Wrap existing match functions with analytics tracking
   */
  wrapMatchFunctions(matchModule) {
    const integration = new GameAnalyticsIntegration();
    
    return {
      ...matchModule,
      
      // Wrap startMatch to include analytics
      async startMatch(baseState, timestamp, matchConfig = {}) {
        await integration.initialize();
        const result = matchModule.startMatch(baseState, timestamp);
        integration.trackMatchStart(result, matchConfig);
        return result;
      },
      
      // Wrap playCard to include analytics
      playCard(state, cardData) {
        const result = matchModule.playCard(state, cardData);
        integration.trackCardPlay(cardData.cardId, cardData.lane, state);
        return result;
      },
      
      // Add match end tracking
      endMatch(state, outcome) {
        integration.trackMatchEnd(state, outcome);
        return outcome;
      },
      
      // Expose integration for additional tracking
      analytics: integration
    };
  },

  /**
   * Create analytics-aware game controller
   */
  createAnalyticsController() {
    const integration = new GameAnalyticsIntegration();
    
    return {
      integration,
      
      async initialize() {
        await integration.initialize();
      },
      
      startMatch(gameState, config) {
        integration.trackMatchStart(gameState, config);
      },
      
      endMatch(gameState, outcome) {
        integration.trackMatchEnd(gameState, outcome);
      },
      
      trackCardPlay(cardId, lane, gameState) {
        integration.trackCardPlay(cardId, lane, gameState);
      },
      
      trackCombo(comboId, comboName, lane, gameState, success, damage) {
        integration.trackComboExecution(comboId, comboName, lane, gameState, success, damage);
      },
      
      trackPerformance(metricType, value, context) {
        integration.trackPerformanceMetric(metricType, value, context);
      },
      
      getMatchSummary() {
        return integration.getCurrentMatchSummary();
      }
    };
  }
};

// ========== EXPORTS ==========

// Singleton instance for global use
export const gameAnalyticsIntegration = new GameAnalyticsIntegration();

// Initialize integration when module is imported
if (typeof window !== 'undefined') {
  // Browser environment - initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      gameAnalyticsIntegration.initialize().catch(console.error);
    });
  } else {
    gameAnalyticsIntegration.initialize().catch(console.error);
  }
} else {
  // Node environment - initialize immediately
  gameAnalyticsIntegration.initialize().catch(console.error);
}