/**
 * Combat Event Manager - Tracks all battle actions for UI feedback
 */

class CombatEventManager {
  constructor() {
    this.events = [];
    this.listeners = new Set();
    this.maxEvents = 100; // Limit memory usage
  }

  /**
   * Add a combat event
   */
  addEvent(type, data, timestamp = Date.now()) {
    const event = {
      id: this.generateId(),
      type,
      data,
      timestamp,
      message: this.formatMessage(type, data)
    };

    this.events.push(event);
    
    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(event, this.events);
      } catch (error) {
        console.warn('Combat event listener error:', error);
      }
    });
  }

  /**
   * Subscribe to combat events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all events
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = [];
    this.listeners.forEach(listener => {
      try {
        listener(null, []);
      } catch (error) {
        console.warn('Combat event listener error:', error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format event message for fallback display
   */
  formatMessage(type, data) {
    switch (type) {
      case 'damage':
        return `${data.attacker.name} deals ${data.damage} damage to ${data.target.name}`;
      case 'heal':
        return `${data.target.name} heals ${data.amount} HP`;
      case 'death':
        return `${data.unit.name} is defeated`;
      case 'spawn':
        return `${data.unit.name} enters ${data.lane} lane`;
      case 'combo':
        return `${data.comboName} activated in ${data.lane}`;
      case 'stronghold':
        return `${data.owner} stronghold takes ${data.damage} damage (${data.remainingHealth}/${data.maxHealth})`;
      case 'terrain':
        return `Terrain rotated to ${data.terrainName}`;
      case 'meditate':
        return `Player meditated: +1 chakra`;
      case 'reactive':
        return `${data.jutsuName} activated`;
      default:
        return `Combat event: ${type}`;
    }
  }

  // Helper methods for common events
  logDamage(attacker, target, damage, lane) {
    this.addEvent('damage', { attacker, target, damage, lane });
  }

  logHeal(target, amount, lane, source = null) {
    this.addEvent('heal', { target, amount, lane, source });
  }

  logDeath(unit, lane, killer = null) {
    this.addEvent('death', { unit, lane, killer });
  }

  logSpawn(unit, lane) {
    this.addEvent('spawn', { unit, lane });
  }

  logCombo(comboName, comboId, lane, owner) {
    this.addEvent('combo', { comboName, comboId, lane, owner });
  }

  logStrongholdDamage(owner, damage, remainingHealth, maxHealth, lane) {
    this.addEvent('stronghold', { owner, damage, remainingHealth, maxHealth, lane });
  }

  logTerrainRotation(terrainName, terrainId) {
    this.addEvent('terrain', { terrainName, terrainId });
  }

  logMeditate(discardedCard, chakraGained) {
    this.addEvent('meditate', { discardedCard, chakraGained });
  }

  logReactiveJutsu(jutsuName, jutsuId, lane, owner) {
    this.addEvent('reactive', { jutsuName, jutsuId, lane, owner });
  }
}

// Global instance
export const combatEvents = new CombatEventManager();

// Export for use in tests
export { CombatEventManager };