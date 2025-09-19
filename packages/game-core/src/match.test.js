import { describe, it, expect } from 'vitest';
import { createInitialState } from './state.js';
import { startMatch, playCard, canPlayCard, drawCard, resolveCombat, applyTick } from './match.js';

const now = 1_000;

function setupMatch() {
  const base = createInitialState(now);
  return startMatch(base, now);
}

describe('match helpers', () => {
  it('draws opening hand and reduces chakra on play', () => {
    let state = setupMatch();
    expect(state.hand).toHaveLength(4);
    const card = state.hand[0];
    expect(canPlayCard(state, card.id)).toBe(true);
    state = playCard(state, { cardId: card.id, lane: 'mountain', timestamp: now + 1000 });
    expect(state.hand.find((c) => c.id === card.id)).toBeUndefined();
    expect(state.chakra.current).toBeLessThan(state.chakra.max);
  });

  it('removes unit when health reaches zero during combat', () => {
    let state = setupMatch();
    const card = state.hand[0];
    state = playCard(state, { cardId: card.id, lane: 'mountain', timestamp: now + 1000 });
    state = {
      ...state,
      battlefield: {
        ...state.battlefield,
        mountain: {
          player: [
            {
              id: 'player-1',
              name: 'Test',
              cardId: card.id,
              attack: 3,
              health: 1,
              owner: 'player',
              lane: 'mountain',
              status: [],
              shields: 0
            }
          ],
          ai: [
            {
              id: 'ai-1',
              name: 'Dummy',
              cardId: 'ai',
              attack: 5,
              health: 2,
              owner: 'ai',
              lane: 'mountain',
              status: [],
              shields: 0
            }
          ]
        }
      }
    };
    state = resolveCombat(state, now + 2000);
    expect(state.battlefield.mountain.player.length).toBe(0);
  });

  it('executes shadow clone combo and spawns shielded allies', () => {
    let state = setupMatch();
    const ninjutsuCard = {
      id: 'test-ninjutsu',
      name: 'Test Ninjutsu',
      school: 'Ninjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };
    const taijutsuCard = {
      id: 'test-taijutsu',
      name: 'Test Taijutsu',
      school: 'Taijutsu',
      cost: 1,
      attack: 2,
      health: 2
    };

    state = {
      ...state,
      hand: [ninjutsuCard, taijutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 10
      }
    };

    state = playCard(state, { cardId: ninjutsuCard.id, lane: 'mountain', timestamp: now + 50 });
    state = playCard(state, { cardId: taijutsuCard.id, lane: 'mountain', timestamp: now + 100 });

    const laneUnits = state.battlefield.mountain.player;
    expect(laneUnits.length).toBeGreaterThan(2);

    const cloneStatuses = laneUnits.slice(1).flatMap((unit) => unit.status ?? []);
    expect(cloneStatuses.some((status) => status.type === 'shield')).toBe(true);
    expect(state.stats.combos).toBeGreaterThan(0);
    const lastHistory = state.comboState.history[state.comboState.history.length - 1];
    expect(lastHistory.comboId).toBe('shadow-clone-barrage');
  });

  it('queues combo when chakra is low and resolves after regeneration', () => {
    let state = setupMatch();
    const ninjutsuCard = {
      id: 'test-ninjutsu-low',
      name: 'Test Ninjutsu Low',
      school: 'Ninjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const taijutsuCard = {
      id: 'test-taijutsu-low',
      name: 'Test Taijutsu Low',
      school: 'Taijutsu',
      cost: 1,
      attack: 1,
      health: 1
    };

    state = {
      ...state,
      hand: [ninjutsuCard, taijutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 2,
        lastTick: now
      }
    };

    state = playCard(state, { cardId: ninjutsuCard.id, lane: 'mountain', timestamp: now + 10 });
    state = playCard(state, { cardId: taijutsuCard.id, lane: 'mountain', timestamp: now + 20 });

    expect(state.comboState.pending.length).toBeGreaterThan(0);
    expect(state.stats.combos).toBe(0);

    state = {
      ...state,
      chakra: {
        ...state.chakra,
        current: 10,
        lastTick: now + 20
      }
    };

    state = applyTick(state, now + 21);

    expect(state.comboState.pending.length).toBe(0);
    expect(state.stats.combos).toBe(1);
    const historyEntry = state.comboState.history[state.comboState.history.length - 1];
    expect(historyEntry.comboId).toBe('shadow-clone-barrage');
  });

  it('applies stun via genjutsu combo and negates enemy attack', () => {
    let state = setupMatch();
    const genjutsuCard = {
      id: 'test-genjutsu',
      name: 'Test Genjutsu',
      school: 'Genjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };
    const ninjutsuCard = {
      id: 'test-ninjutsu-follow',
      name: 'Test Ninjutsu Follow',
      school: 'Ninjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };

    state = {
      ...state,
      hand: [genjutsuCard, ninjutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 10
      },
      battlefield: {
        ...state.battlefield,
        mountain: {
          player: [],
          ai: [
            {
              id: 'ai-front',
              name: 'Dummy',
              cardId: 'ai',
              attack: 5,
              health: 5,
              maxHealth: 5,
              owner: 'ai',
              lane: 'mountain',
              status: [],
              shields: 0
            }
          ]
        }
      }
    };

    state = playCard(state, { cardId: genjutsuCard.id, lane: 'mountain', timestamp: now + 60 });
    state = playCard(state, { cardId: ninjutsuCard.id, lane: 'mountain', timestamp: now + 120 });

    const aiFront = state.battlefield.mountain.ai[0];
    expect(aiFront.status.some((status) => status.type === 'crowd-control' && status.crowdControl === 'stun')).toBe(true);

    const playerFront = state.battlefield.mountain.player[0];
    const originalHealth = playerFront.health;

    const postCombat = resolveCombat(state, now + 200);
    const playerAfter = postCombat.battlefield.mountain.player[0];
    expect(playerAfter?.health).toBe(originalHealth);
  });

  it('executes forest regeneration combo with heal-over-time effect', () => {
    let state = setupMatch();
    const ninjutsuCard = {
      id: 'test-regen-ninjutsu',
      name: 'Regen Ninjutsu',
      school: 'Ninjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };
    const genjutsuCard = {
      id: 'test-regen-genjutsu',
      name: 'Regen Genjutsu',
      school: 'Genjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };

    state = {
      ...state,
      hand: [ninjutsuCard, genjutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 10
      },
      battlefield: {
        ...state.battlefield,
        forest: {
          player: [
            {
              id: 'player-wounded',
              name: 'Wounded',
              cardId: 'test',
              attack: 3,
              health: 2,
              maxHealth: 5,
              owner: 'player',
              lane: 'forest',
              status: [],
              shields: 0
            }
          ],
          ai: []
        }
      }
    };

    state = playCard(state, { cardId: ninjutsuCard.id, lane: 'forest', timestamp: now + 10 });
    state = playCard(state, { cardId: genjutsuCard.id, lane: 'forest', timestamp: now + 20 });

    const healedUnit = state.battlefield.forest.player[0];
    expect(healedUnit.health).toBeGreaterThan(2);
    expect(healedUnit.status.some((status) => status.type === 'heal-over-time')).toBe(true);
  });

  it('executes water style prison combo with freeze effect on all enemies', () => {
    let state = setupMatch();
    const genjutsuCard1 = {
      id: 'test-water-1',
      name: 'Water Genjutsu 1',
      school: 'Genjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };
    const genjutsuCard2 = {
      id: 'test-water-2',
      name: 'Water Genjutsu 2',
      school: 'Genjutsu',
      cost: 1,
      attack: 2,
      health: 2
    };

    state = {
      ...state,
      hand: [genjutsuCard1, genjutsuCard2],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 10
      },
      battlefield: {
        ...state.battlefield,
        river: {
          player: [],
          ai: [
            {
              id: 'ai-1',
              name: 'Enemy 1',
              cardId: 'ai',
              attack: 3,
              health: 3,
              maxHealth: 3,
              owner: 'ai',
              lane: 'river',
              status: [],
              shields: 0
            },
            {
              id: 'ai-2',
              name: 'Enemy 2',
              cardId: 'ai',
              attack: 4,
              health: 4,
              maxHealth: 4,
              owner: 'ai',
              lane: 'river',
              status: [],
              shields: 0
            }
          ]
        }
      }
    };

    state = playCard(state, { cardId: genjutsuCard1.id, lane: 'river', timestamp: now + 10 });
    state = playCard(state, { cardId: genjutsuCard2.id, lane: 'river', timestamp: now + 20 });

    const aiUnits = state.battlefield.river.ai;
    expect(aiUnits.every(unit => 
      unit.status.some(status => status.type === 'crowd-control' && status.crowdControl === 'freeze')
    )).toBe(true);
  });

  it('applies berserker fury buff with vulnerability drawback', () => {
    let state = setupMatch();
    const taijutsuCard1 = {
      id: 'test-fury-1',
      name: 'Fury Taijutsu 1',
      school: 'Taijutsu',
      cost: 1,
      attack: 2,
      health: 2
    };
    const taijutsuCard2 = {
      id: 'test-fury-2',
      name: 'Fury Taijutsu 2',
      school: 'Taijutsu',
      cost: 1,
      attack: 2,
      health: 2
    };

    state = {
      ...state,
      hand: [taijutsuCard1, taijutsuCard2],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 10
      },
      battlefield: {
        ...state.battlefield,
        mountain: {
          player: [
            {
              id: 'player-fighter',
              name: 'Fighter',
              cardId: 'test',
              attack: 2,
              health: 3,
              maxHealth: 3,
              owner: 'player',
              lane: 'mountain',
              status: [],
              shields: 0
            }
          ],
          ai: []
        }
      }
    };

    state = playCard(state, { cardId: taijutsuCard1.id, lane: 'mountain', timestamp: now + 10 });
    state = playCard(state, { cardId: taijutsuCard2.id, lane: 'mountain', timestamp: now + 20 });

    const buffedUnit = state.battlefield.mountain.player[0];
    expect(buffedUnit.status.some(status => 
      status.type === 'buff' && status.attackBonus > 0
    )).toBe(true);
    expect(buffedUnit.status.some(status => 
      status.drawback?.type === 'vulnerability'
    )).toBe(true);
  });

  it('applies crimson bloom detonation marks that burst after the delay', () => {
    let state = setupMatch();
    const ninjutsuCard1 = {
      id: 'crimson-nin-1',
      name: 'Crimson Nin 1',
      school: 'Ninjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const genjutsuCard = {
      id: 'crimson-gen',
      name: 'Crimson Gen',
      school: 'Genjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const ninjutsuCard2 = {
      id: 'crimson-nin-2',
      name: 'Crimson Nin 2',
      school: 'Ninjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };

    state = {
      ...state,
      hand: [ninjutsuCard1, genjutsuCard, ninjutsuCard2],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 24,
        overflowMax: 30
      },
      battlefield: {
        ...state.battlefield,
        river: {
          player: [],
          ai: [
            {
              id: 'ai-mark-target',
              name: 'Target',
              cardId: 'ai',
              attack: 2,
              health: 8,
              maxHealth: 8,
              owner: 'ai',
              lane: 'river',
              status: [],
              shields: 0
            }
          ]
        }
      }
    };

    state = playCard(state, { cardId: ninjutsuCard1.id, lane: 'river', timestamp: now + 50 });
    state = playCard(state, { cardId: genjutsuCard.id, lane: 'river', timestamp: now + 100 });
    state = playCard(state, { cardId: ninjutsuCard2.id, lane: 'river', timestamp: now + 150 });

    const markedUnit = state.battlefield.river.ai[0];
    expect(markedUnit.status.some((status) => status.type === 'delayed-damage')).toBe(true);

    const isolatedState = {
      ...state,
      battlefield: {
        ...state.battlefield,
        river: {
          player: [],
          ai: state.battlefield.river.ai
        }
      }
    };

    const postDetonation = resolveCombat(isolatedState, now + 3100);
    const detonatedUnit = postDetonation.battlefield.river.ai[0];
    expect(detonatedUnit.health).toBeCloseTo(4, 5);
    expect(detonatedUnit.status.some((status) => status.type === 'delayed-damage')).toBe(false);
  });

  it('grants guardian spirit aura to allies reducing incoming damage', () => {
    let state = setupMatch();
    const genjutsuCard = {
      id: 'guardian-gen',
      name: 'Guardian Gen',
      school: 'Genjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const taijutsuCard = {
      id: 'guardian-tai',
      name: 'Guardian Tai',
      school: 'Taijutsu',
      cost: 1,
      attack: 1,
      health: 1
    };

    const alliedFront = {
      id: 'ally-front',
      name: 'Allied Vanguard',
      cardId: 'ally-front',
      attack: 4,
      health: 10,
      maxHealth: 10,
      owner: 'player',
      lane: 'forest',
      status: [],
      shields: 0
    };

    const enemyFront = {
      id: 'enemy-front',
      name: 'Enemy Vanguard',
      cardId: 'enemy-front',
      attack: 6,
      health: 12,
      maxHealth: 12,
      owner: 'ai',
      lane: 'forest',
      status: [],
      shields: 0
    };

    state = {
      ...state,
      hand: [genjutsuCard, taijutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 24,
        overflowMax: 30
      },
      battlefield: {
        ...state.battlefield,
        forest: {
          player: [alliedFront],
          ai: [enemyFront]
        }
      }
    };

    state = playCard(state, { cardId: genjutsuCard.id, lane: 'forest', timestamp: now + 60 });
    state = playCard(state, { cardId: taijutsuCard.id, lane: 'forest', timestamp: now + 120 });

    const buffedFront = state.battlefield.forest.player[0];
    expect(buffedFront.status.some((status) => status.type === 'aura')).toBe(true);

    const postCombat = resolveCombat(state, now + 1500);
    const allyAfter = postCombat.battlefield.forest.player[0];
    const enemyAfter = postCombat.battlefield.forest.ai[0];

    expect(allyAfter.health).toBeCloseTo(7.1, 1);
    expect(enemyAfter.health).toBe(6);
  });

  it('applies tempest rupture dance and amplifies damage twice', () => {
    let state = setupMatch();
    const ninjutsuCard = {
      id: 'rupture-nin',
      name: 'Rupture Nin',
      school: 'Ninjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const taijutsuCard = {
      id: 'rupture-tai',
      name: 'Rupture Tai',
      school: 'Taijutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const genjutsuCard = {
      id: 'rupture-gen',
      name: 'Rupture Gen',
      school: 'Genjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };

    const alliedFront = {
      id: 'ally-rupture-front',
      name: 'Ally Vanguard',
      cardId: 'ally-rupture-front',
      attack: 4,
      health: 12,
      maxHealth: 12,
      owner: 'player',
      lane: 'mountain',
      status: [],
      shields: 0
    };

    const enemyFront = {
      id: 'enemy-rupture-front',
      name: 'Enemy Vanguard',
      cardId: 'enemy-rupture-front',
      attack: 2,
      health: 12,
      maxHealth: 12,
      owner: 'ai',
      lane: 'mountain',
      status: [],
      shields: 0
    };

    state = {
      ...state,
      hand: [ninjutsuCard, taijutsuCard, genjutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 24,
        overflowMax: 30
      },
      battlefield: {
        ...state.battlefield,
        mountain: {
          player: [alliedFront],
          ai: [enemyFront]
        }
      }
    };

    state = playCard(state, { cardId: ninjutsuCard.id, lane: 'mountain', timestamp: now + 50 });
    state = playCard(state, { cardId: taijutsuCard.id, lane: 'mountain', timestamp: now + 100 });
    state = playCard(state, { cardId: genjutsuCard.id, lane: 'mountain', timestamp: now + 150 });

    const applied = state.battlefield.mountain.ai[0];
    expect(applied.status.some((status) => status.type === 'rupture')).toBe(true);
    expect(state.stats.combos).toBeGreaterThanOrEqual(1);

    const afterFirst = resolveCombat(state, now + 1150);
    const enemyAfterFirst = afterFirst.battlefield.mountain.ai[0];
    expect(Math.round(enemyAfterFirst.health)).toBe(6);
    const ruptureStatus = enemyAfterFirst.status.find((status) => status.type === 'rupture');
    expect(ruptureStatus?.remainingStacks ?? 0).toBe(1);

    const afterSecond = resolveCombat(afterFirst, now + 2150);
    expect(afterSecond.battlefield.mountain.ai.length).toBe(0);
  });

  it('applies celestial ward bloom to pulse shields over time', () => {
    let state = setupMatch();
    const genjutsuCard = {
      id: 'ward-gen',
      name: 'Ward Gen',
      school: 'Genjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const ninjutsuCard = {
      id: 'ward-nin',
      name: 'Ward Nin',
      school: 'Ninjutsu',
      cost: 1,
      attack: 1,
      health: 1
    };
    const taijutsuCard = {
      id: 'ward-tai',
      name: 'Ward Tai',
      school: 'Taijutsu',
      cost: 1,
      attack: 1,
      health: 1
    };

    const alliedFront = {
      id: 'ally-ward-front',
      name: 'Ally Sentinel',
      cardId: 'ally-ward-front',
      attack: 2,
      health: 10,
      maxHealth: 10,
      owner: 'player',
      lane: 'forest',
      status: [],
      shields: 0
    };

    state = {
      ...state,
      hand: [genjutsuCard, ninjutsuCard, taijutsuCard],
      deck: [],
      discard: [],
      chakra: {
        ...state.chakra,
        current: 24,
        overflowMax: 30
      },
      battlefield: {
        ...state.battlefield,
        forest: {
          player: [alliedFront],
          ai: []
        }
      }
    };

    state = playCard(state, { cardId: genjutsuCard.id, lane: 'forest', timestamp: now + 60 });
    state = playCard(state, { cardId: ninjutsuCard.id, lane: 'forest', timestamp: now + 110 });
    state = playCard(state, { cardId: taijutsuCard.id, lane: 'forest', timestamp: now + 160 });

    const warded = state.battlefield.forest.player[0];
    expect(warded.status.some((status) => status.type === 'shield-pulse')).toBe(true);

    const afterFirst = resolveCombat(state, now + 1600);
    const allyAfterFirst = afterFirst.battlefield.forest.player[0];
    expect(allyAfterFirst.shields).toBeGreaterThan(0);
    const pulseStatus = allyAfterFirst.status.find((status) => status.type === 'shield-pulse');
    expect(pulseStatus?.granted ?? 0).toBeGreaterThan(0);

    const afterSecond = resolveCombat(afterFirst, now + 2800);
    const allyAfterSecond = afterSecond.battlefield.forest.player[0];
    expect(allyAfterSecond.shields).toBeLessThanOrEqual(6);
    expect(allyAfterSecond.shields).toBeGreaterThanOrEqual(allyAfterFirst.shields);
  });
});
