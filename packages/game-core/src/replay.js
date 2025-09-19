/**
 * Replay System for Tournament Analysis
 * Captures and serializes game events for competitive analysis
 */

export class ReplaySystem {
  constructor() {
    this.events = [];
    this.metadata = {
      version: '1.0.0',
      startedAt: null,
      endedAt: null,
      gameId: null,
      playerIds: []
    };
    this.isRecording = false;
  }

  /**
   * Start recording a new replay session
   */
  startRecording(gameId = null, playerIds = []) {
    this.events = [];
    this.metadata = {
      version: '1.0.0',
      startedAt: Date.now(),
      endedAt: null,
      gameId: gameId || this.generateGameId(),
      playerIds: [...playerIds],
      totalDuration: 0
    };
    this.isRecording = true;
    
    this.recordEvent({
      type: 'game-start',
      timestamp: this.metadata.startedAt,
      data: {
        gameId: this.metadata.gameId,
        players: this.metadata.playerIds
      }
    });
  }

  /**
   * Stop recording and finalize replay
   */
  stopRecording() {
    if (!this.isRecording) return null;
    
    this.metadata.endedAt = Date.now();
    this.metadata.totalDuration = this.metadata.endedAt - this.metadata.startedAt;
    this.isRecording = false;
    
    this.recordEvent({
      type: 'game-end',
      timestamp: this.metadata.endedAt,
      data: {
        duration: this.metadata.totalDuration,
        totalEvents: this.events.length
      }
    });

    return this.exportReplay();
  }

  /**
   * Record a game event
   */
  recordEvent(event) {
    if (!this.isRecording) return;

    const replayEvent = {
      id: this.generateEventId(),
      timestamp: event.timestamp || Date.now(),
      type: event.type,
      data: event.data || {},
      gameTime: this.metadata.startedAt ? 
        (event.timestamp || Date.now()) - this.metadata.startedAt : 0
    };

    this.events.push(replayEvent);
  }

  /**
   * Record card play event
   */
  recordCardPlay(cardId, lane, player, gameState) {
    this.recordEvent({
      type: 'card-play',
      data: {
        cardId,
        lane,
        player,
        chakraCost: gameState.hand?.find(c => c.id === cardId)?.cost || 0,
        remainingChakra: gameState.chakra?.current || 0,
        activeTerrain: gameState.activeTerrain,
        deckSize: gameState.deck?.length || 0
      }
    });
  }

  /**
   * Record combo execution event
   */
  recordComboExecution(comboId, comboName, lane, player, gameState) {
    this.recordEvent({
      type: 'combo-execution',
      data: {
        comboId,
        comboName,
        lane,
        player,
        comboCost: gameState.combos?.find(c => c.id === comboId)?.cost || 0,
        totalCombos: gameState.stats?.combos || 0,
        activeTerrain: gameState.activeTerrain
      }
    });
  }

  /**
   * Record combat resolution event
   */
  recordCombatResolution(lane, combatData) {
    this.recordEvent({
      type: 'combat-resolution',
      data: {
        lane,
        playerUnits: combatData.playerUnits || 0,
        aiUnits: combatData.aiUnits || 0,
        damageDealt: combatData.damageDealt || 0,
        unitsDestroyed: combatData.unitsDestroyed || 0,
        strongholdDamage: combatData.strongholdDamage || 0
      }
    });
  }

  /**
   * Record terrain rotation event
   */
  recordTerrainRotation(fromTerrain, toTerrain, gameTime) {
    this.recordEvent({
      type: 'terrain-rotation',
      data: {
        fromTerrain,
        toTerrain,
        gameTime,
        rotationCount: this.events.filter(e => e.type === 'terrain-rotation').length + 1
      }
    });
  }

  /**
   * Record game state snapshot (for analysis)
   */
  recordGameSnapshot(gameState, label = 'checkpoint') {
    this.recordEvent({
      type: 'game-snapshot',
      data: {
        label,
        phase: gameState.phase,
        chakra: gameState.chakra,
        battlefield: this.serializeBattlefield(gameState.battlefield),
        strongholds: gameState.strongholds,
        stats: gameState.stats,
        activeTerrain: gameState.activeTerrain,
        timeRemaining: gameState.clock?.remainingSeconds || 0
      }
    });
  }

  /**
   * Export complete replay data
   */
  exportReplay() {
    return {
      metadata: { ...this.metadata },
      events: [...this.events],
      statistics: this.generateStatistics(),
      exportedAt: Date.now()
    };
  }

  /**
   * Import and validate replay data
   */
  importReplay(replayData) {
    if (!this.validateReplayData(replayData)) {
      throw new Error('Invalid replay data format');
    }

    this.metadata = replayData.metadata;
    this.events = replayData.events;
    this.isRecording = false;

    return true;
  }

  /**
   * Generate replay statistics for analysis
   */
  generateStatistics() {
    const stats = {
      totalEvents: this.events.length,
      eventTypes: {},
      combos: {
        total: 0,
        successful: 0,
        byType: {},
        byLane: { mountain: 0, forest: 0, river: 0 }
      },
      cards: {
        totalPlayed: 0,
        bySchool: { Ninjutsu: 0, Taijutsu: 0, Genjutsu: 0 },
        byLane: { mountain: 0, forest: 0, river: 0 }
      },
      combat: {
        totalResolutions: 0,
        totalDamage: 0,
        unitsDestroyed: 0,
        strongholdDamage: 0
      },
      terrain: {
        rotations: 0,
        utilization: { mountain: 0, forest: 0, river: 0 }
      }
    };

    // Analyze events
    this.events.forEach(event => {
      // Count event types
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;

      // Analyze specific event types
      switch (event.type) {
        case 'card-play':
          stats.cards.totalPlayed++;
          if (event.data.cardSchool) {
            stats.cards.bySchool[event.data.cardSchool]++;
          }
          if (event.data.lane) {
            stats.cards.byLane[event.data.lane]++;
          }
          break;

        case 'combo-execution':
          stats.combos.total++;
          stats.combos.successful++;
          if (event.data.comboId) {
            stats.combos.byType[event.data.comboId] = 
              (stats.combos.byType[event.data.comboId] || 0) + 1;
          }
          if (event.data.lane) {
            stats.combos.byLane[event.data.lane]++;
          }
          break;

        case 'combat-resolution':
          stats.combat.totalResolutions++;
          stats.combat.totalDamage += event.data.damageDealt || 0;
          stats.combat.unitsDestroyed += event.data.unitsDestroyed || 0;
          stats.combat.strongholdDamage += event.data.strongholdDamage || 0;
          break;

        case 'terrain-rotation':
          stats.terrain.rotations++;
          break;
      }
    });

    // Calculate APM (Actions Per Minute)
    const durationMinutes = this.metadata.totalDuration / (1000 * 60);
    stats.apm = durationMinutes > 0 ? 
      (stats.cards.totalPlayed + stats.combos.total) / durationMinutes : 0;

    return stats;
  }

  /**
   * Serialize battlefield state for storage
   */
  serializeBattlefield(battlefield) {
    const serialized = {};
    for (const [lane, laneState] of Object.entries(battlefield)) {
      serialized[lane] = {
        player: laneState.player.map(unit => ({
          id: unit.id,
          cardId: unit.cardId,
          attack: unit.attack,
          health: unit.health,
          maxHealth: unit.maxHealth,
          statusCount: unit.status?.length || 0
        })),
        ai: laneState.ai.map(unit => ({
          id: unit.id,
          cardId: unit.cardId,
          attack: unit.attack,
          health: unit.health,
          maxHealth: unit.maxHealth,
          statusCount: unit.status?.length || 0
        }))
      };
    }
    return serialized;
  }

  /**
   * Validate replay data structure
   */
  validateReplayData(data) {
    return data &&
           data.metadata &&
           data.events &&
           Array.isArray(data.events) &&
           typeof data.metadata.startedAt === 'number' &&
           typeof data.metadata.version === 'string';
  }

  /**
   * Generate unique game ID
   */
  generateGameId() {
    return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get replay summary for quick analysis
   */
  getReplaySummary() {
    if (!this.events.length) return null;

    const stats = this.generateStatistics();
    return {
      gameId: this.metadata.gameId,
      duration: this.metadata.totalDuration,
      totalEvents: this.events.length,
      apm: Math.round(stats.apm * 100) / 100,
      combosExecuted: stats.combos.total,
      cardsPlayed: stats.cards.totalPlayed,
      finalPhase: this.events[this.events.length - 1]?.data?.phase || 'unknown'
    };
  }
}

/**
 * Utility function to create and manage replay system
 */
export function createReplaySystem() {
  return new ReplaySystem();
}