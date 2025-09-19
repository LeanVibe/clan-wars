import { terrains, combos as comboPool } from './data.js';
import {
  MAX_CHAKRA,
  OVERFLOW_CHAKRA,
  CHAKRA_REGEN_PER_SECOND,
  TERRAIN_ROTATION_SECONDS,
  MATCH_DURATION_SECONDS,
  STRUCTURE_DAMAGE_MULTIPLIER,
  STRUCTURE_ARMOR,
  MEDITATE_COOLDOWN_MS
} from './state.js';
import { shuffle, createId, reshuffle } from './utils.js';

export const HAND_LIMIT = 5;
export const INITIAL_HAND_SIZE = 4;
const DEFAULT_COMBO_WINDOW_MS = 6000;
const COMBO_HISTORY_WINDOW_MS = 10000;

function getEffectiveCardCost(state, card) {
  if (!card) return 0;
  const baseCost = card.cost ?? 0;
  const penalty = state?.chakra?.overheatPenalty ?? 0;
  return baseCost + penalty;
}

function createStatusForKeyword(keyword, timestamp) {
  if (!keyword) return null;
  switch (keyword.type) {
    case 'stealth':
      return createStatusInstance({
        type: 'stealth',
        durationMs: keyword.durationMs ?? 2000
      }, timestamp);
    case 'shield':
      return createStatusInstance({
        type: 'shield',
        value: keyword.value ?? 1
      }, timestamp);
    case 'ambush':
      return createStatusInstance({
        type: 'ambush',
        multiplier: keyword.multiplier ?? 2,
        terrainMultiplier: keyword.terrainMultiplier ?? keyword.multiplier ?? 2,
        favoredTerrain: keyword.favoredTerrain
      }, timestamp);
    case 'regen':
      return createStatusInstance({
        type: 'regen',
        magnitude: keyword.magnitude ?? 1,
        tickIntervalMs: keyword.tickIntervalMs ?? 1000
      }, timestamp);
    case 'heal-adjacent':
      return createStatusInstance({
        type: 'heal-adjacent',
        value: keyword.value ?? 1
      }, timestamp);
    case 'aura':
      return createStatusInstance({
        type: 'aura',
        attackBonus: keyword.attackBonus ?? 0,
        defenseBonus: keyword.defenseBonus ?? 0,
        affects: keyword.affects ?? 'ally'
      }, timestamp);
    default:
      return createStatusInstance(keyword, timestamp);
  }
}

function applyCardKeywords(unit, card, lane, state, timestamp) {
  const keywords = card.keywords ?? [];
  if (!keywords.length) {
    return {
      ...unit,
      keywords: []
    };
  }

  const statuses = [...(unit.status ?? [])];
  for (const keyword of keywords) {
    const status = createStatusForKeyword(keyword, timestamp);
    if (status) {
      statuses.push(status);
    }
  }

  return {
    ...unit,
    status: statuses,
    keywords
  };
}

function applyCardOnPlay(state, card, lane, owner, timestamp) {
  if (!card?.onPlay) return state;
  const effect = card.onPlay;
  const combo = {
    id: `${card.id}-onplay`,
    name: card.name,
    cost: 0,
    effect
  };
  return executeComboEffect(state, combo, lane, timestamp, owner ?? 'player');
}

function hasActiveStatus(unit, type, timestamp) {
  if (!unit?.status) return false;
  return unit.status.some((status) => {
    if (status.type !== type) return false;
    if (status.expiresAt && timestamp >= status.expiresAt) return false;
    return true;
  });
}

function resolveOutgoingAttack(unit, state, timestamp) {
  if (!unit) return { attack: 0, unit };
  let attackValue = effectiveAttack(unit);
  let mutated = false;
  const statuses = [];
  for (const status of unit.status ?? []) {
    if (status.type === 'ambush' && !status.triggered) {
      const multiplier = state.activeTerrain === status.favoredTerrain
        ? status.terrainMultiplier ?? status.multiplier ?? 2
        : status.multiplier ?? 2;
      attackValue *= multiplier;
      mutated = true;
      continue;
    }
    statuses.push({ ...status });
  }
  const nextUnit = mutated
    ? {
        ...unit,
        status: statuses
      }
    : unit;
  return {
    attack: Math.max(0, Math.round(attackValue)),
    unit: nextUnit
  };
}

function applyPostCombatHealing(laneState) {
  const healLane = (units) => {
    if (!units?.length) return units;
    const nextUnits = units.map((unit) => ({ ...unit }));
    units.forEach((unit, index) => {
      const healStatus = unit.status?.find((status) => status.type === 'heal-adjacent');
      if (!healStatus) return;
      const amount = healStatus.value ?? 1;
      const targets = [];
      if (index > 0) targets.push(nextUnits[index - 1]);
      if (index < nextUnits.length - 1) targets.push(nextUnits[index + 1]);
      for (const target of targets) {
        const maxHealth = Math.max(target.maxHealth ?? target.health ?? 0, 0);
        const nextHealth = Math.min(maxHealth, (target.health ?? 0) + amount);
        target.health = nextHealth;
      }
    });
    return nextUnits;
  };

  return {
    player: healLane(laneState.player),
    ai: healLane(laneState.ai)
  };
}

function logTickTelemetry(state) {
  const stats = state.stats ?? {};
  const tickCount = (stats.tickCount ?? 0) + 1;
  const floatingChakraTotal = (stats.floatingChakraTotal ?? 0) + (state.chakra?.current ?? 0);
  return {
    ...state,
    stats: {
      ...stats,
      tickCount,
      floatingChakraTotal
    }
  };
}

export function startMatch(baseState, timestamp) {
  const shuffledDeck = shuffle(baseState.deck);
  const hand = shuffledDeck.slice(0, INITIAL_HAND_SIZE);
  const deck = shuffledDeck.slice(INITIAL_HAND_SIZE);
  const activeTerrain = terrains[0]?.id ?? 'mountain';
  return {
    ...baseState,
    phase: 'battle',
    deck,
    hand,
    discard: [],
    combos: [...comboPool],
    chakra: {
      ...baseState.chakra,
      current: MAX_CHAKRA,
      lastTick: timestamp,
      overheatPenalty: 0,
      lastMeditateAt: null
    },
    battlefield: {
      mountain: { player: [], ai: [] },
      forest: { player: [], ai: [] },
      river: { player: [], ai: [] }
    },
    stats: {
      ...baseState.stats,
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
      firstStructureHitAt: null,
      firstStructureDestroyedAt: null,
      structureDamageEvents: []
    },
    activeTerrain,
    nextTerrainAt: timestamp + TERRAIN_ROTATION_SECONDS * 1000,
    clock: {
      durationSeconds: MATCH_DURATION_SECONDS,
      startedAt: timestamp,
      remainingSeconds: MATCH_DURATION_SECONDS
    },
    combat: {
      lastResolvedAt: timestamp
    },
    ai: {
      nextSpawnAt: timestamp + 4000,
      comboState: {
        recentPlays: [],
        strategy: 'balanced', // Can be 'aggressive', 'defensive', or 'balanced'
        lastExecuted: null
      }
    },
    comboState: defaultComboState()
  };
}

export function applyTick(state, timestamp) {
  if (state.phase !== 'battle') return state;
  const chakraDelta = (timestamp - state.chakra.lastTick) / 1000;
  const regenerated = chakraDelta > 0
    ? Math.min(
        state.chakra.current + chakraDelta * CHAKRA_REGEN_PER_SECOND,
        state.chakra.overflowMax ?? OVERFLOW_CHAKRA
      )
    : state.chakra.current;

  let activeTerrain = state.activeTerrain;
  let nextTerrainAt = state.nextTerrainAt;
  if (timestamp >= state.nextTerrainAt) {
    const ids = terrains.map((t) => t.id);
    const currentIndex = ids.indexOf(activeTerrain);
    activeTerrain = ids[(currentIndex + 1) % ids.length];
    nextTerrainAt = timestamp + TERRAIN_ROTATION_SECONDS * 1000;
  }

  let remainingSeconds = state.clock.remainingSeconds;
  if (state.clock.startedAt) {
    const elapsed = (timestamp - state.clock.startedAt) / 1000;
    remainingSeconds = Math.max(state.clock.durationSeconds - elapsed, 0);
  }

  let nextState = {
    ...state,
    chakra: {
      ...state.chakra,
      current: regenerated,
      lastTick: timestamp
    },
    activeTerrain,
    nextTerrainAt,
    clock: {
      ...state.clock,
      remainingSeconds
    }
  };

  nextState = processComboTick(nextState, timestamp);

  if (timestamp >= state.ai.nextSpawnAt) {
    nextState = spawnAiUnit(nextState, timestamp);
  }

  if (timestamp - state.combat.lastResolvedAt >= 1000) {
    nextState = resolveCombat(nextState, timestamp);
    nextState = {
      ...nextState,
      combat: {
        ...nextState.combat,
        lastResolvedAt: timestamp
      }
    };
  }

  return nextState;
}

export function canPlayCard(state, cardId) {
  const card = state.hand.find((c) => c.id === cardId);
  if (!card) return false;
  return state.chakra.current >= card.cost;
}

export function playCard(state, { cardId, lane, timestamp }) {
  if (state.phase !== 'battle') return state;
  const cardIndex = state.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;
  const card = state.hand[cardIndex];
  if (state.chakra.current < card.cost) return state;

  const hand = state.hand.filter((c) => c.id !== cardId);
  const unit = {
    id: createId('unit'),
    cardId: card.id,
    name: card.name,
    attack: card.attack,
    health: card.health,
    maxHealth: card.health,
    owner: 'player',
    lane,
    status: [],
    playedAt: timestamp,
    shields: 0
  };

  const battlefield = {
    mountain: { ...state.battlefield.mountain },
    forest: { ...state.battlefield.forest },
    river: { ...state.battlefield.river }
  };

  battlefield[lane] = {
    ...battlefield[lane],
    player: [...battlefield[lane].player, unit]
  };

  let nextState = {
    ...state,
    hand,
    discard: [...state.discard, card],
    chakra: {
      ...state.chakra,
      current: Math.max(state.chakra.current - card.cost, 0)
    },
    battlefield,
    stats: {
      ...state.stats,
      actions: state.stats.actions + 1
    }
  };

  nextState = registerComboPlay(nextState, { card, lane, timestamp });

  return nextState;
}

export function drawCard(state) {
  if (state.hand.length >= HAND_LIMIT) return state;
  let deck = state.deck;
  let discard = state.discard;
  if (!deck.length && discard.length) {
    deck = reshuffle([], discard);
    discard = [];
  }
  if (!deck.length) return state;
  const [next, ...rest] = deck;
  return {
    ...state,
    deck: rest,
    discard,
    hand: [...state.hand, next]
  };
}

export function resolveCombat(state, timestamp) {
  if (state.phase !== 'battle') return state;
  const battlefield = cloneBattlefield(state.battlefield);
  const strongholds = state.strongholds.map((stronghold) => ({ ...stronghold }));
  let strongholdsDestroyed = state.stats.strongholdsDestroyed;

  for (const lane of Object.keys(battlefield)) {
    const laneState = battlefield[lane];

    laneState.player = laneState.player
      .map((unit) => processUnitStatuses(unit, timestamp))
      .filter((unit) => unit.health > 0);
    laneState.ai = laneState.ai
      .map((unit) => processUnitStatuses(unit, timestamp))
      .filter((unit) => unit.health > 0);

    const playerFront = laneState.player[0];
    const aiFront = laneState.ai[0];

    if (playerFront && aiFront) {
      const [playerResult, aiResult] = exchangeDamage(playerFront, aiFront);
      laneState.player = applyUnitOutcome(laneState.player, playerResult);
      laneState.ai = applyUnitOutcome(laneState.ai, aiResult);
    } else if (playerFront) {
      const targetStronghold = findStronghold(strongholds, lane, 'ai');
      const attackValue = effectiveAttack(playerFront);
      if (targetStronghold && attackValue > 0) {
        targetStronghold.health = Math.max(targetStronghold.health - attackValue, 0);
        if (targetStronghold.health === 0) {
          strongholdsDestroyed += 1;
        }
      }
    } else if (aiFront) {
      const targetStronghold = findStronghold(strongholds, lane, 'player');
      const attackValue = effectiveAttack(aiFront);
      if (targetStronghold && attackValue > 0) {
        targetStronghold.health = Math.max(targetStronghold.health - attackValue, 0);
      }
    }

    laneState.player = laneState.player.filter((unit) => unit.health > 0);
    laneState.ai = laneState.ai.filter((unit) => unit.health > 0);
  }

  return {
    ...state,
    battlefield,
    strongholds,
    stats: {
      ...state.stats,
      strongholdsDestroyed
    }
  };
}

function processComboTick(state, timestamp) {
  const base = state.comboState ?? defaultComboState();
  const recentPlays = (base.recentPlays ?? []).filter(
    (play) => timestamp - play.timestamp <= COMBO_HISTORY_WINDOW_MS
  );
  let comboState = {
    ...base,
    recentPlays
  };
  let workingState = {
    ...state,
    comboState
  };

  if (!comboState.pending?.length) {
    return workingState;
  }

  const remainingPending = [];

  for (const entry of comboState.pending) {
    if (timestamp >= entry.expiresAt) {
      continue;
    }
    const combo = (workingState.combos ?? []).find((c) => c.id === entry.comboId);
    if (!combo) continue;
    if ((workingState.chakra.current ?? 0) >= (entry.cost ?? 0)) {
      const result = executeCombo(workingState, combo, entry.lane, timestamp, workingState.comboState);
      workingState = result.state;
      comboState = workingState.comboState;
    } else {
      remainingPending.push(entry);
    }
  }

  if (remainingPending.length !== (comboState.pending ?? []).length) {
    comboState = {
      ...comboState,
      pending: remainingPending
    };
    workingState = {
      ...workingState,
      comboState
    };
  }

  return workingState;
}

function registerComboPlay(state, { card, lane, timestamp }) {
  if (!card?.school) return state;
  const base = state.comboState ?? defaultComboState();
  const activePending = (base.pending ?? []).filter((entry) => entry.expiresAt > timestamp);
  const entry = {
    id: createId('combo-play'),
    cardId: card.id,
    school: card.school,
    lane,
    timestamp
  };
  let recentPlays = [
    ...(base.recentPlays ?? []).filter((play) => timestamp - play.timestamp <= COMBO_HISTORY_WINDOW_MS),
    entry
  ];

  const combos = [...(state.combos ?? [])].sort(
    (left, right) => (right.sequence?.length ?? 0) - (left.sequence?.length ?? 0)
  );
  const matches = [];
  const newPending = [];

  for (const combo of combos) {
    const sequence = combo.sequence ?? [];
    if (!sequence.length) continue;

    const lanePlays = recentPlays.filter((play) => play.lane === lane);
    if (lanePlays.length < sequence.length) continue;

    const candidate = lanePlays.slice(-sequence.length);
    const matchesSequence = sequence.every((school, index) => candidate[index].school === school);
    if (!matchesSequence) continue;

    const windowMs = combo.windowMs ?? DEFAULT_COMBO_WINDOW_MS;
    const windowStart = candidate[0].timestamp;
    if (timestamp - windowStart > windowMs) continue;

    const expiresAt = windowStart + windowMs;
    const cost = combo.cost ?? 0;

    if ((state.chakra.current ?? 0) < cost) {
      newPending.push({
        id: createId('combo-pending'),
        comboId: combo.id,
        lane,
        cost,
        expiresAt
      });
      continue;
    }

    matches.push({
      combo,
      lane,
      expiresAt
    });
  }

  let comboState = {
    ...base,
    recentPlays,
    pending: mergePendingEntries(activePending, newPending)
  };

  let workingState = {
    ...state,
    comboState
  };

  for (const match of matches) {
    if ((workingState.chakra.current ?? 0) < (match.combo.cost ?? 0)) {
      const pendingEntry = {
        id: createId('combo-pending'),
        comboId: match.combo.id,
        lane: match.lane,
        cost: match.combo.cost ?? 0,
        expiresAt: match.expiresAt
      };
      comboState = {
        ...workingState.comboState,
        pending: mergePendingEntries(workingState.comboState.pending ?? [], [pendingEntry])
      };
      workingState = {
        ...workingState,
        comboState
      };
      continue;
    }

    const result = executeCombo(workingState, match.combo, match.lane, timestamp, workingState.comboState);
    workingState = result.state;
    comboState = workingState.comboState;
  }

  return workingState;
}

function executeCombo(state, combo, lane, timestamp, comboState) {
  const baseComboState = comboState ?? defaultComboState();
  const withEffect = executeComboEffect(state, combo, lane, timestamp);
  const withCost = spendComboCost(withEffect, combo.cost ?? 0);

  const nextComboState = {
    ...baseComboState,
    pending: (baseComboState.pending ?? []).filter(
      (entry) => !(entry.comboId === combo.id && entry.lane === lane)
    ),
    lastTriggered: {
      comboId: combo.id,
      name: combo.name,
      lane,
      timestamp
    },
    history: updateComboHistory(baseComboState.history ?? [], {
      comboId: combo.id,
      name: combo.name,
      lane,
      timestamp
    })
  };

  const nextState = {
    ...withCost,
    comboState: {
      ...nextComboState,
      recentPlays: baseComboState.recentPlays ?? []
    },
    stats: {
      ...withCost.stats,
      combos: (withCost.stats?.combos ?? 0) + 1
    }
  };

  return { state: nextState, comboState: nextState.comboState };
}

function executeComboEffect(state, combo, lane, timestamp) {
  const effect = combo.effect;
  if (!effect) return state;

  switch (effect.type) {
    case 'summon': {
      const owner = effect.owner === 'ai' ? 'ai' : 'player';
      const targetKey = owner === 'ai' ? 'ai' : 'player';
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      const units = [...laneState[targetKey]];
      const count = Math.max(effect.count ?? 0, 0);
      for (let i = 0; i < count; i += 1) {
        let unit = {
          id: createId(owner === 'player' ? 'combo-unit' : 'combo-ai-unit'),
          cardId: combo.id,
          name: `${combo.name} ${owner === 'player' ? 'Clone' : 'Spirit'} ${i + 1}`,
          attack: effect.stats?.attack ?? 1,
          health: effect.stats?.health ?? effect.stats?.attack ?? 1,
          maxHealth: effect.stats?.health ?? effect.stats?.attack ?? 1,
          owner,
          lane,
          status: [],
          shields: 0,
          playedAt: timestamp
        };
        if (effect.status) {
          unit = attachStatus(unit, effect.status, timestamp);
        }
        units.push(unit);
      }
      laneState[targetKey] = units;
      battlefield[lane] = laneState;
      return {
        ...state,
        battlefield
      };
    }
    case 'damage-lane': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const damageBase = effect.damage ?? 0;
      const bonus =
        effect.bonusWhenTerrain && state.activeTerrain === effect.bonusWhenTerrain.terrain
          ? effect.bonusWhenTerrain.extra ?? 0
          : 0;
      const totalDamage = damageBase + bonus;
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      const updatedUnits = [];
      for (const unit of laneState[targetKey]) {
        const damaged = applyDamage(unit, totalDamage);
        if (damaged && damaged.health > 0) {
          const nextUnit = effect.status ? attachStatus(damaged, effect.status, timestamp) : damaged;
          updatedUnits.push(nextUnit);
        }
      }
      laneState[targetKey] = updatedUnits;
      battlefield[lane] = laneState;

      let strongholds = state.strongholds;
      let stats = state.stats;
      if (!updatedUnits.length) {
        const owner = targetKey === 'ai' ? 'ai' : 'player';
        const result = applyStrongholdDamage(state.strongholds, lane, owner, totalDamage);
        strongholds = result.strongholds;
        if (result.destroyed > 0) {
          stats = {
            ...stats,
            strongholdsDestroyed: stats.strongholdsDestroyed + result.destroyed
          };
        }
      }

      return {
        ...state,
        battlefield,
        strongholds,
        stats
      };
    }
    case 'heal-lane': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const healingBase = effect.healing ?? 0;
      const bonus =
        effect.bonusWhenTerrain && state.activeTerrain === effect.bonusWhenTerrain.terrain
          ? effect.bonusWhenTerrain.extra ?? 0
          : 0;
      const totalHealing = healingBase + bonus;
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      const updatedUnits = laneState[targetKey].map(unit => {
        const healed = {
          ...unit,
          health: Math.min(unit.health + totalHealing, unit.maxHealth)
        };
        return effect.status ? attachStatus(healed, effect.status, timestamp) : healed;
      });
      laneState[targetKey] = updatedUnits;
      battlefield[lane] = laneState;
      return {
        ...state,
        battlefield
      };
    }
    case 'status-front': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      if (!laneState[targetKey].length) return state;
      const [front, ...rest] = laneState[targetKey];
      const updatedFront = attachStatus(front, effect.status, timestamp);
      laneState[targetKey] = [updatedFront, ...rest];
      battlefield[lane] = laneState;
      return {
        ...state,
        battlefield
      };
    }
    case 'status-all': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      const updatedUnits = laneState[targetKey].map(unit => 
        attachStatus(unit, effect.status, timestamp)
      );
      laneState[targetKey] = updatedUnits;
      battlefield[lane] = laneState;
      return {
        ...state,
        battlefield
      };
    }
    case 'buff-lane': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      const updatedUnits = laneState[targetKey].map(unit => 
        attachStatus(unit, effect.status, timestamp)
      );
      laneState[targetKey] = updatedUnits;
      battlefield[lane] = laneState;
      return {
        ...state,
        battlefield
      };
    }
    case 'stealth-lane': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const battlefield = cloneBattlefield(state.battlefield);
      const laneState = battlefield[lane] ?? { player: [], ai: [] };
      const updatedUnits = laneState[targetKey].map(unit => 
        attachStatus(unit, effect.status, timestamp)
      );
      laneState[targetKey] = updatedUnits;
      battlefield[lane] = laneState;
      return {
        ...state,
        battlefield
      };
    }
    case 'fortify-stronghold': {
      const targetKey = effect.target === 'player' ? 'player' : 'ai';
      const fortificationBase = effect.fortification ?? 0;
      const bonus =
        effect.bonusWhenTerrain && state.activeTerrain === effect.bonusWhenTerrain.terrain
          ? effect.bonusWhenTerrain.extra ?? 0
          : 0;
      const totalFortification = fortificationBase + bonus;
      
      const strongholds = state.strongholds.map(stronghold => {
        if (stronghold.lane === lane && stronghold.owner === targetKey) {
          return {
            ...stronghold,
            health: stronghold.health + totalFortification,
            maxHealth: Math.max(stronghold.maxHealth || stronghold.health, stronghold.health + totalFortification)
          };
        }
        return stronghold;
      });

      let newState = {
        ...state,
        strongholds
      };

      if (effect.status) {
        const battlefield = cloneBattlefield(state.battlefield);
        const laneState = battlefield[lane] ?? { player: [], ai: [] };
        const updatedUnits = laneState[targetKey].map(unit => 
          attachStatus(unit, effect.status, timestamp)
        );
        laneState[targetKey] = updatedUnits;
        battlefield[lane] = laneState;
        newState = {
          ...newState,
          battlefield
        };
      }

      return newState;
    }
    default:
      return state;
  }
}

function spendComboCost(state, cost) {
  if (!cost) return state;
  const current = Math.max((state.chakra?.current ?? 0) - cost, 0);
  return {
    ...state,
    chakra: {
      ...state.chakra,
      current
    }
  };
}

function attachStatus(unit, statusTemplate, timestamp) {
  const nextUnit = {
    ...unit,
    status: [...(unit.status ?? [])]
  };
  const statusInstance = createStatusInstance(statusTemplate, timestamp);
  nextUnit.status.push(statusInstance);
  return nextUnit;
}

function createStatusInstance(template, timestamp) {
  const instance = {
    ...template,
    appliedAt: timestamp,
    expiresAt: template.durationMs ? timestamp + template.durationMs : template.expiresAt,
    remainingValue:
      template.type === 'shield'
        ? template.value ?? template.remainingValue ?? 0
        : template.remainingValue
  };
  if (template.type === 'damage-over-time') {
    const interval = template.tickIntervalMs ?? 1000;
    instance.nextTickAt = timestamp + interval;
  }
  if (template.type === 'shield-pulse') {
    const interval = Math.max(template.tickIntervalMs ?? 1000, 200);
    instance.tickIntervalMs = interval;
    instance.nextTickAt = timestamp + interval;
    instance.granted = 0;
  }
  if (template.type === 'delayed-damage') {
    const delay = Math.max(template.delayMs ?? 0, 0);
    instance.delayMs = delay;
    instance.triggerAt = timestamp + delay;
    if (!instance.expiresAt || instance.expiresAt < instance.triggerAt) {
      instance.expiresAt = instance.triggerAt;
    }
  }
  if (template.type === 'rupture') {
    instance.remainingStacks = Math.max(template.remainingStacks ?? template.stacks ?? 1, 0);
  }
  return instance;
}

function processUnitStatuses(unit, timestamp) {
  if (!unit?.status?.length) return unit;
  let health = unit.health;
  let shields = unit.shields ?? 0;
  const statuses = [];
  for (const status of unit.status) {
    if (status.expiresAt && timestamp >= status.expiresAt) {
      continue;
    }
    if (status.type === 'damage-over-time') {
      const interval = status.tickIntervalMs ?? 1000;
      let nextTickAt = status.nextTickAt ?? (status.appliedAt ?? timestamp) + interval;
      let totalTicks = 0;
      while (timestamp >= nextTickAt && (!status.expiresAt || nextTickAt <= status.expiresAt)) {
        totalTicks += 1;
        nextTickAt += interval;
      }
      if (totalTicks > 0) {
        const damage = totalTicks * (status.magnitude ?? 0);
        health = Math.max(health - damage, 0);
      }
      statuses.push({
        ...status,
        nextTickAt
      });
      continue;
    }
    if (status.type === 'heal-over-time') {
      const interval = status.tickIntervalMs ?? 1500;
      let nextTickAt = status.nextTickAt ?? (status.appliedAt ?? timestamp) + interval;
      let totalTicks = 0;
      while (timestamp >= nextTickAt && (!status.expiresAt || nextTickAt <= status.expiresAt)) {
        totalTicks += 1;
        nextTickAt += interval;
      }
      if (totalTicks > 0) {
        const healing = totalTicks * (status.magnitude ?? 0);
        health = Math.min(health + healing, unit.maxHealth);
      }
      statuses.push({
        ...status,
        nextTickAt
      });
      continue;
    }
    if (status.type === 'shield-pulse') {
      const interval = Math.max(status.tickIntervalMs ?? status.tickInterval ?? 1000, 200);
      let nextTickAt = status.nextTickAt ?? (status.appliedAt ?? timestamp) + interval;
      let totalTicks = 0;
      while (timestamp >= nextTickAt && (!status.expiresAt || nextTickAt <= status.expiresAt)) {
        totalTicks += 1;
        nextTickAt += interval;
      }
      const shieldValue = status.shieldValue ?? 0;
      const maxStacks = Math.max(status.maxStacks ?? 3, 0);
      const capacity = maxStacks > 0 ? maxStacks * shieldValue : Number.POSITIVE_INFINITY;
      let granted = status.granted ?? 0;
      if (totalTicks > 0 && shieldValue > 0 && capacity > 0) {
        const potentialGrant = totalTicks * shieldValue;
        const remainingCapacity = Number.isFinite(capacity) ? Math.max(capacity - granted, 0) : Number.POSITIVE_INFINITY;
        const grant = Number.isFinite(remainingCapacity)
          ? Math.min(potentialGrant, remainingCapacity)
          : potentialGrant;
        if (grant > 0) {
          shields += grant;
          granted += grant;
        }
      }
      statuses.push({
        ...status,
        granted,
        nextTickAt
      });
      continue;
    }
    if (status.type === 'delayed-damage') {
      const triggerAt = status.triggerAt ??
        (status.delayMs
          ? (status.appliedAt ?? timestamp) + status.delayMs
          : status.expiresAt ?? (status.appliedAt ?? timestamp));
      if (timestamp >= triggerAt) {
        const burstDamage = status.damage ?? status.magnitude ?? 0;
        health = Math.max(health - burstDamage, 0);
        if (status.onDetonate === 'linger') {
          statuses.push({
            ...status,
            triggerAt,
            detonatedAt: timestamp
          });
        }
        continue;
      }
      statuses.push({
        ...status,
        triggerAt
      });
      continue;
    }
    statuses.push({ ...status });
  }
  return {
    ...unit,
    health,
    shields,
    status: statuses
  };
}

function effectiveAttack(unit) {
  if (!unit) return 0;
  const statuses = unit.status ?? [];
  const controlled = statuses.some(
    (status) => status.type === 'crowd-control' && (status.crowdControl === 'stun' || status.crowdControl === 'freeze')
  );
  if (controlled) return 0;
  
  let attackValue = unit.attack ?? 0;
  let multiplier = 1;
  
  for (const status of statuses) {
    if (status.type === 'buff') {
      attackValue += status.attackBonus ?? 0;
      multiplier *= status.speedBonus ?? 1;
    }
    if (status.type === 'aura') {
      attackValue += status.attackBonus ?? 0;
      multiplier *= status.speedBonus ?? 1;
    }
    if (status.drawback?.type === 'vulnerability') {
      // Vulnerability affects defense, not attack directly
    }
  }

  return Math.max(0, Math.round(attackValue * multiplier));
}

function exchangeDamage(playerUnit, aiUnit) {
  const playerAttack = effectiveAttack(playerUnit);
  const aiAttack = effectiveAttack(aiUnit);
  return [applyDamage(playerUnit, aiAttack), applyDamage(aiUnit, playerAttack)];
}

function applyDamage(unit, damage) {
  if (!unit) return null;

  const baseDamage = Math.max(damage ?? 0, 0);
  const unitStatuses = unit.status ?? [];

  let ruptureBonus = 0;
  for (const status of unitStatuses) {
    if (status.type === 'rupture') {
      const stacks = Math.max(status.remainingStacks ?? status.stacks ?? 1, 0);
      if (stacks > 0) {
        ruptureBonus += status.bonusDamage ?? 0;
      }
    }
  }

  if (baseDamage <= 0 && ruptureBonus <= 0) {
    return {
      ...unit,
      status: unitStatuses.map((status) => ({ ...status }))
    };
  }

  let incoming = baseDamage + ruptureBonus;

  // Apply vulnerability multiplier
  const vulnerability = unitStatuses.find((status) => status.drawback?.type === 'vulnerability');
  if (vulnerability) {
    incoming *= vulnerability.drawback.damageMultiplier ?? 1;
  }

  const auraStatuses = unitStatuses.filter((status) => status.type === 'aura');
  if (auraStatuses.length) {
    const damageScale = auraStatuses.reduce((scale, aura) => {
      const reduction = Math.max(Math.min(aura.damageReduction ?? 0, 0.9), 0);
      return scale * (1 - reduction);
    }, 1);
    const flatReduction = auraStatuses.reduce(
      (sum, aura) => sum + Math.max(aura.flatReduction ?? 0, 0),
      0
    );
    incoming = Math.max(0, incoming * damageScale - flatReduction);
  }

  let remaining = incoming;
  const statuses = [];
  let reflectedDamage = 0;

  for (const status of unitStatuses) {
    if (status.type === 'shield' && remaining > 0) {
      const shieldValue = Math.max(status.remainingValue ?? status.value ?? 0, 0);
      if (shieldValue > 0) {
        const absorbed = Math.min(shieldValue, remaining);
        remaining -= absorbed;
        const remainingValue = shieldValue - absorbed;

        if (status.reflectDamage && absorbed > 0) {
          reflectedDamage += Math.round(absorbed * status.reflectDamage);
        }

        if (remainingValue > 0) {
          statuses.push({ ...status, remainingValue });
        }
        continue;
      }
    }
    if (status.type === 'rupture') {
      const stacks = Math.max(status.remainingStacks ?? status.stacks ?? 1, 0);
      const consumed = (baseDamage > 0 || ruptureBonus > 0) && stacks > 0 ? 1 : 0;
      const remainingStacks = stacks - consumed;
      if (remainingStacks > 0) {
        statuses.push({ ...status, remainingStacks });
      }
      continue;
    }
    statuses.push({ ...status });
  }

  let shields = Math.max(unit.shields ?? 0, 0);
  if (remaining > 0 && shields > 0) {
    const absorbed = Math.min(shields, remaining);
    shields -= absorbed;
    remaining -= absorbed;
  }

  const currentHealth = Math.max(unit.health - remaining, 0);
  const result = {
    ...unit,
    shields,
    health: currentHealth,
    status: statuses
  };

  if (reflectedDamage > 0) {
    result._reflectedDamage = reflectedDamage;
  }

  return result;
}

function applyUnitOutcome(units, unit) {
  if (!unit || unit.health <= 0) {
    return units.slice(1);
  }
  return [unit, ...units.slice(1)];
}

function cloneBattlefield(field) {
  return {
    mountain: cloneLane(field.mountain),
    forest: cloneLane(field.forest),
    river: cloneLane(field.river)
  };
}

function cloneLane(lane) {
  return {
    player: lane.player.map((unit) => cloneUnit(unit)),
    ai: lane.ai.map((unit) => cloneUnit(unit))
  };
}

function cloneUnit(unit) {
  return {
    ...unit,
    status: (unit.status ?? []).map((status) => ({ ...status }))
  };
}

function findStronghold(strongholds, lane, owner) {
  return strongholds.find((entry) => entry.lane === lane && entry.owner === owner) ?? null;
}

function applyStrongholdDamage(strongholds, lane, owner, damage) {
  const updated = strongholds.map((entry) => ({ ...entry }));
  let destroyed = 0;
  const target = updated.find((entry) => entry.lane === lane && entry.owner === owner);
  if (target) {
    const previous = target.health;
    target.health = Math.max(target.health - damage, 0);
    if (previous > 0 && target.health === 0 && owner === 'ai') {
      destroyed = 1;
    }
  }
  return { strongholds: updated, destroyed };
}

function mergePendingEntries(existing = [], additions = []) {
  const merged = [...existing];
  for (const entry of additions) {
    const index = merged.findIndex(
      (item) => item.comboId === entry.comboId && item.lane === entry.lane
    );
    if (index >= 0) {
      merged[index] = {
        ...merged[index],
        expiresAt: Math.max(merged[index].expiresAt, entry.expiresAt),
        cost: entry.cost
      };
    } else {
      merged.push(entry);
    }
  }
  return merged;
}

function updateComboHistory(history, entry) {
  const next = [...history, entry];
  const MAX_HISTORY = 5;
  return next.slice(-MAX_HISTORY);
}

function defaultComboState() {
  return {
    recentPlays: [],
    pending: [],
    lastTriggered: null,
    history: []
  };
}

function spawnAiUnit(state, timestamp) {
  let nextState = { ...state };

  // First, check if AI should attempt a combo
  nextState = tryAiCombo(nextState, timestamp);

  // Then spawn a regular unit
  const deck = state.deck.length ? state.deck : state.discard;
  const cardSource = deck.length ? deck : state.hand;
  const fallback = {
    id: 'ai-shadow-genin',
    name: 'AI Shadow',
    attack: 2,
    health: 2,
    school: 'Ninjutsu'
  };
  const template = cardSource[Math.floor(Math.random() * cardSource.length)] ?? fallback;
  
  // Strategic lane selection for AI
  const lane = selectAiLane(nextState, template);
  
  const unit = {
    id: createId('ai-unit'),
    cardId: template.id,
    name: template.name,
    attack: template.attack,
    health: template.health,
    maxHealth: template.health ?? template.attack,
    owner: 'ai',
    lane,
    status: [],
    playedAt: timestamp,
    shields: 0
  };

  const battlefield = cloneBattlefield(nextState.battlefield);
  battlefield[lane] = {
    ...battlefield[lane],
    ai: [...battlefield[lane].ai, unit]
  };

  // Register AI card play for combo tracking
  nextState = registerAiCardPlay(nextState, { 
    cardId: template.id, 
    school: template.school || 'Ninjutsu', 
    lane, 
    timestamp 
  });

  // Record AI card play in replay system if available
  if (nextState.replaySystem?.recordCardPlay) {
    nextState.replaySystem.recordCardPlay(template.id, lane, 'ai', nextState);
  }

  return {
    ...nextState,
    battlefield,
    ai: {
      ...nextState.ai,
      nextSpawnAt: timestamp + getAiSpawnDelay(nextState)
    }
  };
}

function tryAiCombo(state, timestamp) {
  const aiComboState = state.ai.comboState ?? { recentPlays: [], strategy: 'balanced' };
  const recentPlays = aiComboState.recentPlays.filter(
    play => timestamp - play.timestamp <= COMBO_HISTORY_WINDOW_MS
  );

  // Find potential combos the AI can execute
  const availableCombos = findAiComboOpportunities(state, recentPlays, timestamp);
  
  if (!availableCombos.length) {
    return {
      ...state,
      ai: {
        ...state.ai,
        comboState: { ...aiComboState, recentPlays }
      }
    };
  }

  // AI strategy for combo selection
  const selectedCombo = selectAiCombo(availableCombos, state, aiComboState.strategy);
  
  if (!selectedCombo) {
    return {
      ...state,
      ai: {
        ...state.ai,
        comboState: { ...aiComboState, recentPlays }
      }
    };
  }

  // Execute the selected combo
  const result = executeAiCombo(state, selectedCombo.combo, selectedCombo.lane, timestamp);
  
  // Record AI combo execution in replay system if available
  if (state.replaySystem?.recordComboExecution) {
    state.replaySystem.recordComboExecution(
      selectedCombo.combo.id,
      selectedCombo.combo.name,
      selectedCombo.lane,
      'ai',
      result.state
    );
  }
  
  return {
    ...result.state,
    ai: {
      ...result.state.ai,
      comboState: {
        ...aiComboState,
        recentPlays,
        lastExecuted: {
          comboId: selectedCombo.combo.id,
          lane: selectedCombo.lane,
          timestamp
        }
      }
    }
  };
}

function findAiComboOpportunities(state, recentPlays, timestamp) {
  const opportunities = [];
  const combos = state.combos ?? [];

  for (const combo of combos) {
    const sequence = combo.sequence ?? [];
    if (!sequence.length) continue;

    // Check each lane for potential combo completion
    for (const lane of ['mountain', 'forest', 'river']) {
      const lanePlays = recentPlays.filter(play => play.lane === lane);
      
      // Check if we have enough plays to potentially complete this combo
      if (lanePlays.length < sequence.length - 1) continue;

      // Find what school we need to complete the combo
      const candidate = lanePlays.slice(-(sequence.length - 1));
      const missingSchool = findMissingSchoolForCombo(sequence, candidate);
      
      if (!missingSchool) continue;

      const windowMs = combo.windowMs ?? DEFAULT_COMBO_WINDOW_MS;
      const oldestPlay = candidate[0];
      if (oldestPlay && timestamp - oldestPlay.timestamp > windowMs) continue;

      // Check if AI can afford this combo
      const cost = combo.cost ?? 0;
      if (cost <= 15) { // AI has virtual chakra budget
        opportunities.push({
          combo,
          lane,
          missingSchool,
          urgency: calculateComboUrgency(combo, state, lane),
          cost
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.urgency - a.urgency);
}

function findMissingSchoolForCombo(sequence, currentPlays) {
  if (currentPlays.length >= sequence.length) return null;
  
  // Check if current plays match the beginning of the sequence
  for (let i = 0; i < currentPlays.length; i++) {
    if (currentPlays[i].school !== sequence[i]) return null;
  }
  
  // Return the next required school
  return sequence[currentPlays.length];
}

function calculateComboUrgency(combo, state, lane) {
  let urgency = 50; // Base urgency
  
  // Higher urgency for defensive combos when AI is losing
  const aiUnits = state.battlefield[lane]?.ai?.length ?? 0;
  const playerUnits = state.battlefield[lane]?.player?.length ?? 0;
  
  if (playerUnits > aiUnits + 1) {
    urgency += 30; // Defensive priority
  }
  
  // Terrain synergy bonus
  if (combo.effect?.bonusWhenTerrain?.terrain === state.activeTerrain) {
    urgency += 25;
  }
  
  // Effect type priorities
  switch (combo.effect?.type) {
    case 'damage-lane':
      urgency += playerUnits * 15; // More urgent with more targets
      break;
    case 'summon':
      urgency += aiUnits < 2 ? 20 : 5; // Need units more when we have fewer
      break;
    case 'status-front':
    case 'status-all':
      urgency += playerUnits > 0 ? 25 : 0; // Only useful if enemies exist
      break;
    case 'heal-lane':
      const damagedAiUnits = (state.battlefield[lane]?.ai ?? [])
        .filter(unit => unit.health < unit.maxHealth).length;
      urgency += damagedAiUnits * 10;
      break;
  }
  
  // Cost efficiency (prefer lower cost combos when chakra is scarce)
  const cost = combo.cost ?? 0;
  if (cost > 8) urgency -= 15;
  if (cost > 12) urgency -= 20;
  
  return Math.max(0, urgency);
}

function selectAiCombo(opportunities, state, strategy = 'balanced') {
  if (!opportunities.length) return null;
  
  switch (strategy) {
    case 'aggressive':
      // Prefer damage and summon combos
      return opportunities.find(op => 
        op.combo.effect?.type === 'damage-lane' || 
        op.combo.effect?.type === 'summon'
      ) ?? opportunities[0];
      
    case 'defensive':
      // Prefer healing and status effects
      return opportunities.find(op => 
        op.combo.effect?.type === 'heal-lane' || 
        op.combo.effect?.type === 'status-front' ||
        op.combo.effect?.type === 'fortify-stronghold'
      ) ?? opportunities[0];
      
    case 'balanced':
    default:
      // Use urgency-based selection with some randomness
      const top3 = opportunities.slice(0, 3);
      const weights = top3.map((op, i) => Math.max(1, op.urgency - i * 10));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const random = Math.random() * totalWeight;
      
      let currentWeight = 0;
      for (let i = 0; i < top3.length; i++) {
        currentWeight += weights[i];
        if (random <= currentWeight) {
          return top3[i];
        }
      }
      return top3[0];
  }
}

function executeAiCombo(state, combo, lane, timestamp) {
  // Create AI combo execution (similar to player combos but for AI)
  const effect = adaptComboEffectForAi(combo.effect);
  const nextState = executeComboEffect(state, { ...combo, effect }, lane, timestamp);
  
  return {
    state: {
      ...nextState,
      stats: {
        ...nextState.stats,
        // Don't increment player combo stats for AI combos
      }
    }
  };
}

function adaptComboEffectForAi(effect) {
  if (!effect) return effect;
  
  // Flip targets for AI execution
  const adapted = { ...effect };
  
  switch (effect.type) {
    case 'damage-lane':
    case 'status-front':
    case 'status-all':
      adapted.target = 'player'; // AI targets player
      break;
    case 'heal-lane':
    case 'buff-lane':
    case 'stealth-lane':
    case 'fortify-stronghold':
      adapted.target = 'ai'; // AI helps itself
      break;
    case 'summon':
      adapted.owner = 'ai'; // AI summons for itself
      break;
  }
  
  return adapted;
}

function selectAiLane(state, template) {
  const lanes = ['mountain', 'forest', 'river'];
  const priorities = [];
  
  for (const lane of lanes) {
    let priority = Math.random() * 10; // Base randomness
    
    const aiUnits = state.battlefield[lane]?.ai?.length ?? 0;
    const playerUnits = state.battlefield[lane]?.player?.length ?? 0;
    
    // Prefer lanes where AI is outnumbered (defensive)
    if (playerUnits > aiUnits) {
      priority += 30;
    }
    
    // Slight preference for lanes with fewer AI units (spread out)
    priority += Math.max(0, 3 - aiUnits) * 5;
    
    // Terrain synergy
    if (template.school === 'Taijutsu' && lane === 'mountain') priority += 15;
    if (template.school === 'Ninjutsu' && lane === 'forest') priority += 15;
    if (template.school === 'Genjutsu' && lane === 'river') priority += 15;
    
    priorities.push({ lane, priority });
  }
  
  // Select lane based on weighted probability
  priorities.sort((a, b) => b.priority - a.priority);
  const weights = priorities.map((p, i) => Math.max(1, p.priority - i * 5));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (let i = 0; i < priorities.length; i++) {
    currentWeight += weights[i];
    if (random <= currentWeight) {
      return priorities[i].lane;
    }
  }
  
  return priorities[0].lane;
}

function registerAiCardPlay(state, { cardId, school, lane, timestamp }) {
  const aiComboState = state.ai.comboState ?? { recentPlays: [], strategy: 'balanced' };
  const entry = {
    id: createId('ai-combo-play'),
    cardId,
    school,
    lane,
    timestamp
  };
  
  const recentPlays = [
    ...aiComboState.recentPlays.filter(play => 
      timestamp - play.timestamp <= COMBO_HISTORY_WINDOW_MS
    ),
    entry
  ];
  
  return {
    ...state,
    ai: {
      ...state.ai,
      comboState: {
        ...aiComboState,
        recentPlays
      }
    }
  };
}

function getAiSpawnDelay(state) {
  const baseDelay = 5000;
  
  // Faster spawning when AI is losing
  let totalAiUnits = 0;
  let totalPlayerUnits = 0;
  
  for (const lane of ['mountain', 'forest', 'river']) {
    totalAiUnits += state.battlefield[lane]?.ai?.length ?? 0;
    totalPlayerUnits += state.battlefield[lane]?.player?.length ?? 0;
  }
  
  if (totalPlayerUnits > totalAiUnits + 2) {
    return baseDelay * 0.7; // 30% faster when behind
  }
  
  if (totalAiUnits > totalPlayerUnits + 2) {
    return baseDelay * 1.3; // 30% slower when ahead
  }
  
  return baseDelay;
}
