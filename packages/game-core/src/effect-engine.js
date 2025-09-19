/**
 * Effect Engine v1 - Event-driven combat effects system
 * Provides event hooks for keyword statuses to respond predictably
 */

export class EffectEngine {
  constructor() {
    this.eventListeners = new Map();
    this.debugMode = false;
  }

  /**
   * Register an event listener
   * @param {string} eventType - Event type (onPlay, onTick, onBeforeCombat, etc.)
   * @param {Function} listener - Callback function
   * @param {string} id - Unique identifier for this listener
   */
  on(eventType, listener, id) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Map());
    }
    this.eventListeners.get(eventType).set(id, listener);
  }

  /**
   * Remove an event listener
   * @param {string} eventType - Event type
   * @param {string} id - Listener identifier
   */
  off(eventType, id) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(id);
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} eventType - Event type
   * @param {Object} eventData - Data to pass to listeners
   * @returns {Object} Modified event data after all listeners
   */
  emit(eventType, eventData) {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners || listeners.size === 0) {
      return eventData;
    }

    let modifiedData = { ...eventData };
    
    if (this.debugMode) {
      console.log(`[EffectEngine] Emitting ${eventType}:`, modifiedData);
    }

    // Execute listeners in registration order
    for (const [id, listener] of listeners) {
      try {
        const result = listener(modifiedData);
        if (result && typeof result === 'object') {
          modifiedData = { ...modifiedData, ...result };
        }
      } catch (error) {
        console.error(`[EffectEngine] Error in listener ${id} for ${eventType}:`, error);
      }
    }

    return modifiedData;
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clearAll() {
    this.eventListeners.clear();
  }

  /**
   * Enable/disable debug logging
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// Global effect engine instance
export const effectEngine = new EffectEngine();

/**
 * Event Types supported by the engine
 */
export const EventTypes = {
  ON_PLAY: 'onPlay',
  ON_TICK: 'onTick', 
  ON_BEFORE_COMBAT: 'onBeforeCombat',
  ON_AFTER_COMBAT: 'onAfterCombat',
  ON_UNIT_DAMAGED: 'onUnitDamaged',
  ON_UNIT_DEATH: 'onUnitDeath',
  ON_TERRAIN_CHANGE: 'onTerrainChange',
  ON_COMBO_TRIGGERED: 'onComboTriggered',
  ON_CHAKRA_OVERFLOW: 'onChakraOverflow'
};

/**
 * Status effect helpers that integrate with the event system
 */
export class StatusEffects {
  /**
   * Initialize status effects to listen to relevant events
   */
  static initialize() {
    // Stealth effects
    effectEngine.on(EventTypes.ON_BEFORE_COMBAT, (data) => {
      return StatusEffects.processStealthEffects(data);
    }, 'stealth-processor');

    // Ambush effects  
    effectEngine.on(EventTypes.ON_BEFORE_COMBAT, (data) => {
      return StatusEffects.processAmbushEffects(data);
    }, 'ambush-processor');

    // Aura effects
    effectEngine.on(EventTypes.ON_BEFORE_COMBAT, (data) => {
      return StatusEffects.processAuraEffects(data);
    }, 'aura-processor');

    // Healing effects
    effectEngine.on(EventTypes.ON_AFTER_COMBAT, (data) => {
      return StatusEffects.processHealingEffects(data);
    }, 'healing-processor');

    // Shield effects  
    effectEngine.on(EventTypes.ON_UNIT_DAMAGED, (data) => {
      return StatusEffects.processShieldEffects(data);
    }, 'shield-processor');

    // Regeneration effects
    effectEngine.on(EventTypes.ON_TICK, (data) => {
      return StatusEffects.processRegenEffects(data);
    }, 'regen-processor');
  }

  /**
   * Process stealth effects before combat
   */
  static processStealthEffects(data) {
    const { unit, timestamp } = data;
    if (!unit?.status) return data;

    const stealthStatus = unit.status.find(s => 
      s.type === 'stealth' && (!s.expiresAt || timestamp < s.expiresAt)
    );

    if (stealthStatus) {
      // Stealth units cannot be targeted directly
      return {
        ...data,
        canBeTargeted: false,
        evasionChance: stealthStatus.evasionBonus ?? 0.3
      };
    }

    return data;
  }

  /**
   * Process ambush effects before combat
   */
  static processAmbushEffects(data) {
    const { unit, state, timestamp } = data;
    if (!unit?.status) return data;

    const ambushStatus = unit.status.find(s => 
      s.type === 'ambush' && !s.triggered
    );

    if (ambushStatus) {
      const isTerrainSynergy = state?.activeTerrain === ambushStatus.favoredTerrain;
      const multiplier = isTerrainSynergy 
        ? ambushStatus.terrainMultiplier ?? ambushStatus.multiplier ?? 2
        : ambushStatus.multiplier ?? 2;

      return {
        ...data,
        damageMultiplier: (data.damageMultiplier ?? 1) * multiplier,
        ambushTriggered: true
      };
    }

    return data;
  }

  /**
   * Process aura effects before combat
   */
  static processAuraEffects(data) {
    const { lane, owner, state } = data;
    if (!state?.battlefield?.[lane]?.[owner]) return data;

    const units = state.battlefield[lane][owner];
    let totalAttackBonus = 0;
    let totalDefenseBonus = 0;
    let totalDamageReduction = 0;

    // Collect aura bonuses from all units in lane
    for (const unit of units) {
      const auraStatuses = (unit.status ?? []).filter(s => s.type === 'aura');
      for (const aura of auraStatuses) {
        totalAttackBonus += aura.attackBonus ?? 0;
        totalDefenseBonus += aura.defenseBonus ?? 0;
        totalDamageReduction += aura.damageReduction ?? 0;
      }
    }

    if (totalAttackBonus || totalDefenseBonus || totalDamageReduction) {
      return {
        ...data,
        auraAttackBonus: totalAttackBonus,
        auraDefenseBonus: totalDefenseBonus,
        auraDamageReduction: Math.min(totalDamageReduction, 0.8) // Cap at 80%
      };
    }

    return data;
  }

  /**
   * Process healing effects after combat
   */
  static processHealingEffects(data) {
    const { lane, state } = data;
    if (!state?.battlefield?.[lane]) return data;

    const laneState = state.battlefield[lane];
    const healedLane = {
      player: StatusEffects.applyHealingToUnits(laneState.player),
      ai: StatusEffects.applyHealingToUnits(laneState.ai)
    };

    return {
      ...data,
      battlefield: {
        ...state.battlefield,
        [lane]: healedLane
      }
    };
  }

  /**
   * Apply healing effects to a unit array
   */
  static applyHealingToUnits(units) {
    if (!units?.length) return units;

    return units.map((unit, index) => {
      let healedUnit = { ...unit };
      
      // Check for heal-adjacent effects
      const healStatus = unit.status?.find(s => s.type === 'heal-adjacent');
      if (healStatus) {
        const healAmount = healStatus.value ?? 1;
        
        // Heal adjacent units
        if (index > 0) {
          const leftUnit = units[index - 1];
          const maxHealth = leftUnit.maxHealth ?? leftUnit.health ?? 0;
          leftUnit.health = Math.min(maxHealth, leftUnit.health + healAmount);
        }
        if (index < units.length - 1) {
          const rightUnit = units[index + 1];
          const maxHealth = rightUnit.maxHealth ?? rightUnit.health ?? 0;
          rightUnit.health = Math.min(maxHealth, rightUnit.health + healAmount);
        }
      }

      return healedUnit;
    });
  }

  /**
   * Process shield effects when unit takes damage
   */
  static processShieldEffects(data) {
    const { unit, damage } = data;
    if (!unit?.status || !damage) return data;

    let remainingDamage = damage;
    let totalShieldValue = 0;
    const updatedStatuses = [];

    // Process shield statuses
    for (const status of unit.status) {
      if (status.type === 'shield' && remainingDamage > 0) {
        const shieldValue = status.remainingValue ?? status.value ?? 0;
        if (shieldValue > 0) {
          const absorbed = Math.min(shieldValue, remainingDamage);
          remainingDamage -= absorbed;
          totalShieldValue += absorbed;

          // Update shield with remaining value
          if (shieldValue > absorbed) {
            updatedStatuses.push({
              ...status,
              remainingValue: shieldValue - absorbed
            });
          }
          continue;
        }
      }
      updatedStatuses.push(status);
    }

    return {
      ...data,
      finalDamage: remainingDamage,
      shieldAbsorbed: totalShieldValue,
      updatedStatuses
    };
  }

  /**
   * Process regeneration effects on tick
   */
  static processRegenEffects(data) {
    const { state, timestamp } = data;
    if (!state?.battlefield) return data;

    const updatedBattlefield = {};
    
    for (const [lane, laneState] of Object.entries(state.battlefield)) {
      updatedBattlefield[lane] = {
        player: StatusEffects.applyRegenToUnits(laneState.player, timestamp),
        ai: StatusEffects.applyRegenToUnits(laneState.ai, timestamp)
      };
    }

    return {
      ...data,
      battlefield: updatedBattlefield
    };
  }

  /**
   * Apply regeneration to unit array
   */
  static applyRegenToUnits(units, timestamp) {
    if (!units?.length) return units;

    return units.map(unit => {
      const regenStatuses = (unit.status ?? []).filter(s => s.type === 'regen');
      if (!regenStatuses.length) return unit;

      let totalHealing = 0;
      for (const regen of regenStatuses) {
        const interval = regen.tickIntervalMs ?? 1000;
        const lastTick = regen.lastTickAt ?? regen.appliedAt ?? timestamp;
        
        if (timestamp - lastTick >= interval) {
          totalHealing += regen.magnitude ?? 1;
          regen.lastTickAt = timestamp;
        }
      }

      if (totalHealing > 0) {
        const maxHealth = unit.maxHealth ?? unit.health ?? 0;
        return {
          ...unit,
          health: Math.min(maxHealth, unit.health + totalHealing)
        };
      }

      return unit;
    });
  }
}

// Auto-initialize status effects when module loads
StatusEffects.initialize();