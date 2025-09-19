/**
 * Reactive Jutsu System - 3s combo windows with counter mechanics
 * Enables instant-speed responses to combat and opponent actions
 */

import { createId } from './utils.js';
import { effectEngine, EventTypes } from './effect-engine.js';

export const COMBO_WINDOW_DURATION_MS = 3000;
export const REACTIVE_JUTSU_TYPES = {
  SUBSTITUTION: 'substitution',
  SMOKE_BOMB: 'smoke_bomb',
  COUNTER_ATTACK: 'counter_attack',
  SHIELD_WALL: 'shield_wall'
};

/**
 * Reactive Jutsu definitions with instant-speed mechanics
 */
export const reactiveJutsu = [
  {
    id: 'substitution-jutsu',
    name: 'Substitution Jutsu',
    type: REACTIVE_JUTSU_TYPES.SUBSTITUTION,
    cost: 2,
    instant: true,
    description: 'Prevent damage to target unit and counter-attack',
    school: 'Ninjutsu',
    triggers: ['onUnitDamaged', 'onBeforeCombat'],
    effect: {
      type: 'substitution',
      preventDamage: true,
      counterAttack: true,
      counterMultiplier: 1.5
    }
  },
  {
    id: 'smoke-bomb',
    name: 'Smoke Bomb',
    type: REACTIVE_JUTSU_TYPES.SMOKE_BOMB,
    cost: 3,
    instant: true,
    description: 'Skip combat this turn in target lane',
    school: 'Ninjutsu',
    triggers: ['onBeforeCombat'],
    effect: {
      type: 'skip_combat',
      duration: 1000, // 1 second
      applyToLane: true
    }
  },
  {
    id: 'lightning-counter',
    name: 'Lightning Counter',
    type: REACTIVE_JUTSU_TYPES.COUNTER_ATTACK,
    cost: 4,
    instant: true,
    description: 'Counter with double damage when attacked',
    school: 'Ninjutsu',
    triggers: ['onUnitDamaged'],
    effect: {
      type: 'counter_strike',
      damageMultiplier: 2,
      chainLightning: true
    }
  },
  {
    id: 'earth-wall',
    name: 'Earth Wall',
    type: REACTIVE_JUTSU_TYPES.SHIELD_WALL,
    cost: 3,
    instant: true,
    description: 'Create protective barrier for entire lane',
    school: 'Taijutsu',
    triggers: ['onBeforeCombat', 'onUnitDamaged'],
    effect: {
      type: 'shield_wall',
      shieldValue: 3,
      applyToLane: true,
      durationMs: 5000
    }
  }
];

/**
 * Reactive Jutsu Manager
 */
export class ReactiveJutsuManager {
  constructor() {
    this.activeWindows = new Map();
    this.pendingActivations = new Map();
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for reactive triggers
   */
  initializeEventListeners() {
    // Listen for combat events that can trigger reactive windows
    effectEngine.on(EventTypes.ON_BEFORE_COMBAT, (data) => {
      return this.handleCombatTrigger(data, 'onBeforeCombat');
    }, 'reactive-jutsu-before-combat');

    effectEngine.on(EventTypes.ON_UNIT_DAMAGED, (data) => {
      return this.handleCombatTrigger(data, 'onUnitDamaged');
    }, 'reactive-jutsu-unit-damaged');

    effectEngine.on(EventTypes.ON_TICK, (data) => {
      return this.handleTick(data);
    }, 'reactive-jutsu-tick');
  }

  /**
   * Handle combat triggers that open reactive windows
   */
  handleCombatTrigger(data, triggerType) {
    if (!data || !data.state) return data;
    
    const { state, timestamp, unit, lane } = data;
    
    try {
      // Check if player has reactive jutsu available
      const availableJutsu = this.getAvailableReactiveJutsu(state, triggerType);
      
      if (availableJutsu.length > 0) {
        // Open combo window for reactive jutsu
        const windowId = this.openComboWindow(state, {
          triggerType,
          availableJutsu,
          targetUnit: unit,
          lane,
          timestamp: timestamp || Date.now(),
          expiresAt: (timestamp || Date.now()) + COMBO_WINDOW_DURATION_MS
        });

        // Emit event to UI about available reactive options
        effectEngine.emit('onReactiveWindowOpened', {
          windowId,
          triggerType,
          availableJutsu,
          timeRemaining: COMBO_WINDOW_DURATION_MS,
          targetUnit: unit,
          lane
        });
      }
    } catch (error) {
      console.warn('[ReactiveJutsu] Error handling combat trigger:', error);
    }

    return data;
  }

  /**
   * Handle tick events to process active windows and activations
   */
  handleTick(data) {
    if (!data) return data;
    
    const { timestamp } = data;
    const currentTime = timestamp || Date.now();
    
    try {
      // Clean up expired windows
      for (const [windowId, window] of this.activeWindows) {
        if (window && currentTime >= window.expiresAt) {
          this.closeComboWindow(windowId);
          effectEngine.emit('onReactiveWindowClosed', { windowId, reason: 'expired' });
        }
      }

      // Process pending activations
      for (const [activationId, activation] of this.pendingActivations) {
        if (activation && currentTime >= activation.executeAt) {
          this.executeReactiveJutsu(activation);
          this.pendingActivations.delete(activationId);
        }
      }
    } catch (error) {
      console.warn('[ReactiveJutsu] Error in tick handler:', error);
    }

    return data;
  }

  /**
   * Get available reactive jutsu for a trigger type
   */
  getAvailableReactiveJutsu(state, triggerType) {
    if (!state?.reactiveJutsu) return [];
    
    return state.reactiveJutsu.filter(jutsu => {
      // Check if jutsu responds to this trigger
      if (!jutsu?.triggers?.includes(triggerType)) return false;
      
      // Check if player can afford it
      if (!state.chakra || state.chakra.current < jutsu.cost) return false;
      
      return true;
    });
  }

  /**
   * Open a combo window for reactive jutsu
   */
  openComboWindow(state, windowData) {
    const windowId = createId('reactive-window');
    this.activeWindows.set(windowId, windowData);
    
    return windowId;
  }

  /**
   * Close a combo window
   */
  closeComboWindow(windowId) {
    this.activeWindows.delete(windowId);
  }

  /**
   * Activate a reactive jutsu during an open window
   */
  activateReactiveJutsu(state, { windowId, jutsuId, timestamp }) {
    const window = this.activeWindows.get(windowId);
    if (!window || timestamp >= window.expiresAt) {
      return { success: false, reason: 'window_expired' };
    }

    const jutsu = window.availableJutsu.find(j => j.id === jutsuId);
    if (!jutsu) {
      return { success: false, reason: 'jutsu_not_available' };
    }

    if (state.chakra.current < jutsu.cost) {
      return { success: false, reason: 'insufficient_chakra' };
    }

    // Schedule activation with slight delay for visual feedback
    const activationId = createId('reactive-activation');
    const activation = {
      id: activationId,
      jutsu,
      window,
      state,
      executeAt: timestamp + 100, // 100ms delay for UI feedback
      timestamp
    };

    this.pendingActivations.set(activationId, activation);
    
    // Close the window immediately after activation
    this.closeComboWindow(windowId);
    
    // Spend chakra immediately
    state.chakra.current = Math.max(0, state.chakra.current - jutsu.cost);

    effectEngine.emit('onReactiveWindowClosed', { windowId, reason: 'activated' });
    
    return { success: true, activationId };
  }

  /**
   * Execute a reactive jutsu effect
   */
  executeReactiveJutsu(activation) {
    const { jutsu, window, state, timestamp } = activation;

    switch (jutsu.effect.type) {
      case 'substitution':
        return this.executeSubstitution(activation);
      
      case 'skip_combat':
        return this.executeSkipCombat(activation);
      
      case 'counter_strike':
        return this.executeCounterStrike(activation);
      
      case 'shield_wall':
        return this.executeShieldWall(activation);
      
      default:
        console.warn(`Unknown reactive jutsu effect: ${jutsu.effect.type}`);
    }
  }

  /**
   * Execute Substitution Jutsu effect
   */
  executeSubstitution(activation) {
    const { jutsu, window, state } = activation;
    const { targetUnit, lane } = window;

    if (!targetUnit || !lane) return;

    // Prevent the incoming damage
    if (jutsu.effect.preventDamage && targetUnit.incomingDamage) {
      targetUnit.incomingDamage = 0;
      
      // Add substitution effect to unit
      targetUnit.status = targetUnit.status || [];
      targetUnit.status.push({
        type: 'substitution_active',
        appliedAt: activation.timestamp,
        counterAttack: jutsu.effect.counterAttack,
        counterMultiplier: jutsu.effect.counterMultiplier || 1
      });
    }

    effectEngine.emit('onReactiveJutsuExecuted', {
      jutsu: jutsu.id,
      type: 'substitution',
      targetUnit,
      lane
    });
  }

  /**
   * Execute Smoke Bomb effect
   */
  executeSkipCombat(activation) {
    const { jutsu, window, state } = activation;
    const { lane } = window;

    if (!lane || !state.battlefield[lane]) return;

    // Add smoke effect to lane
    state.battlefield[lane].smokeEffect = {
      type: 'skip_combat',
      appliedAt: activation.timestamp,
      expiresAt: activation.timestamp + (jutsu.effect.duration || 1000),
      skipNextCombat: true
    };

    effectEngine.emit('onReactiveJutsuExecuted', {
      jutsu: jutsu.id,
      type: 'skip_combat',
      lane
    });
  }

  /**
   * Execute Counter Strike effect
   */
  executeCounterStrike(activation) {
    const { jutsu, window, state } = activation;
    const { targetUnit, lane } = window;

    if (!targetUnit || !lane) return;

    // Add counter-attack status
    targetUnit.status = targetUnit.status || [];
    targetUnit.status.push({
      type: 'counter_strike',
      appliedAt: activation.timestamp,
      damageMultiplier: jutsu.effect.damageMultiplier || 2,
      chainLightning: jutsu.effect.chainLightning || false,
      triggersRemaining: 1
    });

    effectEngine.emit('onReactiveJutsuExecuted', {
      jutsu: jutsu.id,
      type: 'counter_strike',
      targetUnit,
      lane
    });
  }

  /**
   * Execute Shield Wall effect
   */
  executeShieldWall(activation) {
    const { jutsu, window, state } = activation;
    const { lane } = window;

    if (!lane || !state.battlefield[lane]) return;

    const laneState = state.battlefield[lane];
    const shieldValue = jutsu.effect.shieldValue || 3;
    const duration = jutsu.effect.durationMs || 5000;

    // Apply shield to all player units in lane
    if (jutsu.effect.applyToLane) {
      for (const unit of laneState.player) {
        unit.status = unit.status || [];
        unit.status.push({
          type: 'shield',
          value: shieldValue,
          appliedAt: activation.timestamp,
          expiresAt: activation.timestamp + duration,
          source: 'earth_wall'
        });
      }
    }

    effectEngine.emit('onReactiveJutsuExecuted', {
      jutsu: jutsu.id,
      type: 'shield_wall',
      lane,
      shieldValue
    });
  }

  /**
   * Get current active windows for UI display
   */
  getActiveWindows() {
    return Array.from(this.activeWindows.entries()).map(([id, window]) => ({
      id,
      ...window
    }));
  }

  /**
   * Check if any reactive windows are currently open
   */
  hasActiveWindows() {
    return this.activeWindows.size > 0;
  }
}

// Global reactive jutsu manager instance
export const reactiveJutsuManager = new ReactiveJutsuManager();

/**
 * Helper function to add reactive jutsu to game state
 */
export function initializeReactiveJutsu(state) {
  return {
    ...state,
    reactiveJutsu: [...reactiveJutsu],
    reactiveWindows: [],
    reactiveActivations: []
  };
}

/**
 * Helper function to activate reactive jutsu from UI
 */
export function playReactiveJutsu(state, { windowId, jutsuId, timestamp }) {
  return reactiveJutsuManager.activateReactiveJutsu(state, {
    windowId,
    jutsuId,
    timestamp
  });
}