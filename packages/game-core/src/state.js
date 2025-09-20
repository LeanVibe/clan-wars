import { combos, starterDeck, terrains } from './data';

export const MATCH_DURATION_SECONDS = 5 * 60;
export const TERRAIN_ROTATION_SECONDS = 90;
export const MAX_CHAKRA = 12;
export const OVERFLOW_CHAKRA = 15;
export const CHAKRA_REGEN_PER_SECOND = 0.5;
export const STRONGHOLD_BASE_HEALTH = 15;
export const STRUCTURE_DAMAGE_MULTIPLIER = 0.5; // 50% damage reduction vs direct attacks
export const STRUCTURE_ARMOR = 3; // Flat damage reduction for better protection
export const MEDITATE_COOLDOWN_MS = 5000;

export function createInitialState(now = currentTime()) {
  const activeTerrain = terrains[0].id;
  return {
    phase: 'menu',
    activeTerrain,
    nextTerrainAt: now + TERRAIN_ROTATION_SECONDS * 1000,
    chakra: {
      current: MAX_CHAKRA,
      max: MAX_CHAKRA,
      overflowMax: OVERFLOW_CHAKRA,
      regenPerSecond: CHAKRA_REGEN_PER_SECOND,
      lastTick: now,
      overheatPenalty: 0,
      lastMeditateAt: null
    },
    deck: [...starterDeck],
    hand: [],
    discard: [],
    battlefield: {
      mountain: { player: [], ai: [] },
      forest: { player: [], ai: [] },
      river: { player: [], ai: [] }
    },
    combos: [...combos],
    comboState: {
      recentPlays: [],
      pending: [],
      lastTriggered: null,
      history: []
    },
    strongholds: [
      {
        id: 'player-mountain',
        lane: 'mountain',
        health: STRONGHOLD_BASE_HEALTH,
        maxHealth: STRONGHOLD_BASE_HEALTH,
        owner: 'player'
      },
      {
        id: 'player-forest',
        lane: 'forest',
        health: STRONGHOLD_BASE_HEALTH,
        maxHealth: STRONGHOLD_BASE_HEALTH,
        owner: 'player'
      },
      {
        id: 'player-river',
        lane: 'river',
        health: STRONGHOLD_BASE_HEALTH,
        maxHealth: STRONGHOLD_BASE_HEALTH,
        owner: 'player'
      },
      {
        id: 'ai-mountain',
        lane: 'mountain',
        health: STRONGHOLD_BASE_HEALTH,
        maxHealth: STRONGHOLD_BASE_HEALTH,
        owner: 'ai'
      },
      {
        id: 'ai-forest',
        lane: 'forest',
        health: STRONGHOLD_BASE_HEALTH,
        maxHealth: STRONGHOLD_BASE_HEALTH,
        owner: 'ai'
      },
      {
        id: 'ai-river',
        lane: 'river',
        health: STRONGHOLD_BASE_HEALTH,
        maxHealth: STRONGHOLD_BASE_HEALTH,
        owner: 'ai'
      }
    ],
    stats: {
      actions: 0,
      combos: 0,
      apm: 0,
      terrainUtilization: 0,
      strongholdsDestroyed: 0,
      tickCount: 0,
      floatingChakraTotal: 0,
      laneContestTicks: {
        mountain: 0,
        forest: 0,
        river: 0
      },
      comboWindows: 0,
      comboConversions: 0,
      comboAttempts: 0,
      firstStructureHitAt: null,
      firstStructureDestroyedAt: null,
      structureDamageEvents: [],
      cardDeadTimeTotal: 0,
      cardsDrawn: 0
    },
    clock: {
      durationSeconds: MATCH_DURATION_SECONDS,
      remainingSeconds: MATCH_DURATION_SECONDS
    },
    combat: {
      lastResolvedAt: now
    },
    ai: {
      nextSpawnAt: now + 4000
    }
  };
}

export function currentTime() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}
