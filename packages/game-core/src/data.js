export const terrains = [
  {
    id: 'mountain',
    name: 'Mountain Path',
    rotationOrder: 0,
    bonus: 'Taijutsu units gain +20% attack.'
  },
  {
    id: 'forest',
    name: 'Forest Grove',
    rotationOrder: 1,
    bonus: 'Ninjutsu decks regenerate +1 chakra every second.'
  },
  {
    id: 'river',
    name: 'River Valley',
    rotationOrder: 2,
    bonus: 'Genjutsu techniques apply stealth and confusion.'
  }
];

export const starterDeck = [
  // === AGGRO ARCHETYPE CARDS ===
  {
    id: 'academy-student',
    name: 'Academy Student',
    school: 'Taijutsu',
    cost: 1,
    attack: 1,
    health: 1,
    rarity: 'common',
    ability: 'Rush: Can attack immediately.',
    archetype: 'aggro',
    keywords: [
      {
        type: 'rush'
      }
    ]
  },
  {
    id: 'kunai-thrower',
    name: 'Kunai Thrower',
    school: 'Taijutsu',
    cost: 1,
    attack: 2,
    health: 1,
    rarity: 'common',
    ability: 'Fragile but fast.',
    archetype: 'aggro'
  },
  {
    id: 'shadow-genin',
    name: 'Shadow Genin',
    school: 'Ninjutsu',
    cost: 2,
    attack: 2,
    health: 2,
    rarity: 'common',
    ability: 'Stealth (3s).',
    archetype: 'aggro',
    keywords: [
      {
        type: 'stealth',
        durationMs: 3000
      }
    ]
  },
  {
    id: 'swift-striker',
    name: 'Swift Striker',
    school: 'Taijutsu',
    cost: 2,
    attack: 3,
    health: 1,
    rarity: 'common',
    ability: 'Rush.',
    archetype: 'aggro',
    keywords: [
      {
        type: 'rush'
      }
    ]
  },
  {
    id: 'blood-frenzy-ninja',
    name: 'Blood Frenzy Ninja',
    school: 'Genjutsu',
    cost: 2,
    attack: 1,
    health: 2,
    rarity: 'uncommon',
    ability: 'Gains +1 attack for each enemy killed this match.',
    archetype: 'aggro',
    keywords: [
      {
        type: 'growth',
        trigger: 'enemy-death',
        attackBonus: 1
      }
    ]
  },
  {
    id: 'flame-dash-warrior',
    name: 'Flame Dash Warrior',
    school: 'Taijutsu',
    cost: 3,
    attack: 4,
    health: 1,
    rarity: 'uncommon',
    ability: 'Rush. Dies at end of turn.',
    archetype: 'aggro',
    keywords: [
      {
        type: 'rush'
      },
      {
        type: 'temporary',
        expiresEndOfTurn: true
      }
    ]
  },
  {
    id: 'explosive-shuriken',
    name: 'Explosive Shuriken',
    school: 'Ninjutsu',
    cost: 3,
    attack: 0,
    health: 1,
    rarity: 'rare',
    ability: 'On death: Deal 3 damage to all enemies in lane.',
    archetype: 'aggro',
    onDeath: {
      type: 'damage-lane',
      target: 'ai',
      damage: 3
    }
  },

  // === CONTROL ARCHETYPE CARDS ===
  {
    id: 'healing-spring',
    name: 'Healing Spring',
    school: 'Ninjutsu',
    cost: 1,
    attack: 0,
    health: 3,
    rarity: 'common',
    ability: 'At end of turn: Heal all allies 1.',
    archetype: 'control',
    keywords: [
      {
        type: 'heal-all-end-turn',
        value: 1
      }
    ]
  },
  {
    id: 'chakra-siphon',
    name: 'Chakra Siphon',
    school: 'Genjutsu',
    cost: 2,
    attack: 1,
    health: 2,
    rarity: 'common',
    ability: 'Draw a card when played.',
    archetype: 'control',
    onPlay: {
      type: 'draw-card',
      count: 1
    }
  },
  {
    id: 'forest-scout',
    name: 'Forest Scout',
    school: 'Ninjutsu',
    cost: 3,
    attack: 2,
    health: 3,
    rarity: 'common',
    ability: 'Regenerate 1 health per tick.',
    archetype: 'control',
    keywords: [
      {
        type: 'regen',
        magnitude: 1,
        tickIntervalMs: 1000
      }
    ]
  },
  {
    id: 'void-barrier',
    name: 'Void Barrier',
    school: 'Genjutsu',
    cost: 3,
    attack: 0,
    health: 5,
    rarity: 'uncommon',
    ability: 'Taunt. Cannot attack.',
    archetype: 'control',
    keywords: [
      {
        type: 'taunt'
      },
      {
        type: 'cannot-attack'
      }
    ]
  },
  {
    id: 'storm-barrier',
    name: 'Storm Barrier',
    school: 'Ninjutsu',
    cost: 4,
    attack: 0,
    health: 1,
    rarity: 'rare',
    ability: 'On play: Deal 2 damage to all enemies.',
    archetype: 'control',
    onPlay: {
      type: 'damage-all',
      target: 'ai',
      damage: 2
    }
  },
  {
    id: 'chakra-monk',
    name: 'Chakra Monk',
    school: 'Taijutsu',
    cost: 3,
    attack: 3,
    health: 2,
    rarity: 'common',
    ability: 'Shield 1.',
    archetype: 'control',
    keywords: [
      {
        type: 'shield',
        value: 1
      }
    ]
  },
  {
    id: 'river-assassin',
    name: 'River Assassin',
    school: 'Genjutsu',
    cost: 4,
    attack: 4,
    health: 2,
    rarity: 'uncommon',
    ability: 'Ambush: first strike deals double damage (triples on River).',
    archetype: 'aggro',
    keywords: [
      {
        type: 'ambush',
        multiplier: 2,
        terrainMultiplier: 3,
        favoredTerrain: 'river'
      }
    ]
  },
  {
    id: 'medical-kunoichi',
    name: 'Medical Kunoichi',
    school: 'Ninjutsu',
    cost: 4,
    attack: 1,
    health: 3,
    rarity: 'uncommon',
    ability: 'Heal adjacent allies 2 after combat.',
    archetype: 'control',
    keywords: [
      {
        type: 'heal-adjacent',
        value: 2
      }
    ]
  },
  {
    id: 'mind-reader',
    name: 'Mind Reader',
    school: 'Genjutsu',
    cost: 4,
    attack: 2,
    health: 4,
    rarity: 'rare',
    ability: 'On play: Draw 2 cards.',
    archetype: 'control',
    onPlay: {
      type: 'draw-card',
      count: 2
    }
  },
  // === COMBO ARCHETYPE CARDS ===
  {
    id: 'scroll-keeper',
    name: 'Scroll Keeper',
    school: 'Ninjutsu',
    cost: 2,
    attack: 1,
    health: 3,
    rarity: 'common',
    ability: 'When you play a combo: Draw a card.',
    archetype: 'combo',
    keywords: [
      {
        type: 'combo-trigger',
        effect: 'draw-card'
      }
    ]
  },
  {
    id: 'jutsu-weaver',
    name: 'Jutsu Weaver',
    school: 'Genjutsu',
    cost: 3,
    attack: 2,
    health: 2,
    rarity: 'uncommon',
    ability: 'Reduce combo costs by 1.',
    archetype: 'combo',
    keywords: [
      {
        type: 'combo-cost-reduction',
        value: 1
      }
    ]
  },
  {
    id: 'elemental-conduit',
    name: 'Elemental Conduit',
    school: 'Taijutsu',
    cost: 4,
    attack: 2,
    health: 5,
    rarity: 'rare',
    ability: 'Your combos deal +2 damage.',
    archetype: 'combo',
    keywords: [
      {
        type: 'combo-amplifier',
        damageBonus: 2
      }
    ]
  },
  {
    id: 'sequence-master',
    name: 'Sequence Master',
    school: 'Ninjutsu',
    cost: 5,
    attack: 3,
    health: 3,
    rarity: 'rare',
    ability: 'When you complete a 3+ card combo: Summon a 3/3 clone.',
    archetype: 'combo',
    keywords: [
      {
        type: 'combo-payoff',
        minLength: 3,
        summon: { attack: 3, health: 3 }
      }
    ]
  },

  // === CONTROL LATE GAME ===
  {
    id: 'earth-style-chunin',
    name: 'Earth Style Chunin',
    school: 'Taijutsu',
    cost: 5,
    attack: 3,
    health: 4,
    rarity: 'uncommon',
    ability: 'Stoneguard: Shield 2.',
    archetype: 'control',
    keywords: [
      {
        type: 'shield',
        value: 2
      }
    ]
  },
  {
    id: 'chakra-well',
    name: 'Chakra Well',
    school: 'Ninjutsu',
    cost: 5,
    attack: 0,
    health: 8,
    rarity: 'rare',
    ability: 'Cannot attack. Gain +2 chakra per turn.',
    archetype: 'control',
    keywords: [
      {
        type: 'cannot-attack'
      },
      {
        type: 'chakra-generation',
        value: 2
      }
    ]
  },
  {
    id: 'frost-archon',
    name: 'Frost Archon',
    school: 'Genjutsu',
    cost: 6,
    attack: 2,
    health: 7,
    rarity: 'rare',
    ability: 'On play: Freeze all enemies for 3 seconds.',
    archetype: 'control',
    onPlay: {
      type: 'freeze-all',
      target: 'ai',
      durationMs: 3000
    }
  },

  // === COMBO SYNERGY CARDS ===
  {
    id: 'ember-adept',
    name: 'Ember Adept',
    school: 'Taijutsu',
    cost: 5,
    attack: 4,
    health: 4,
    rarity: 'uncommon',
    ability: 'Aura: allies in lane gain +1 attack while Ember Adept survives.',
    archetype: 'combo',
    keywords: [
      {
        type: 'aura',
        attackBonus: 1
      }
    ]
  },
  {
    id: 'mist-illusionist',
    name: 'Mist Illusionist',
    school: 'Genjutsu',
    cost: 6,
    attack: 3,
    health: 5,
    rarity: 'rare',
    ability: 'Veil Aura: enemies in lane suffer -1 attack.',
    archetype: 'control',
    keywords: [
      {
        type: 'aura',
        attackBonus: -1,
        affects: 'enemy'
      }
    ]
  },

  // === HIGH-COST FINISHERS ===
  {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    school: 'Ninjutsu',
    cost: 7,
    attack: 5,
    health: 6,
    rarity: 'rare',
    ability: 'Regenerate 2 per tick.',
    archetype: 'control',
    keywords: [
      {
        type: 'regen',
        magnitude: 2,
        tickIntervalMs: 1000
      }
    ]
  },
  {
    id: 'lightning-jonin',
    name: 'Lightning Jonin',
    school: 'Ninjutsu',
    cost: 8,
    attack: 6,
    health: 4,
    rarity: 'rare',
    ability: 'Chain Lightning: on play deal 2 damage to all enemies in lane.',
    archetype: 'combo',
    onPlay: {
      type: 'damage-lane',
      target: 'ai',
      damage: 2
    }
  },

  // === ADDITIONAL AGGRO CARDS ===
  {
    id: 'berserker-raider',
    name: 'Berserker Raider',
    school: 'Taijutsu',
    cost: 4,
    attack: 5,
    health: 2,
    rarity: 'uncommon',
    ability: 'Rush. Gains +1 attack when damaged.',
    archetype: 'aggro',
    keywords: [
      {
        type: 'rush'
      },
      {
        type: 'enrage',
        attackBonus: 1
      }
    ]
  },
  {
    id: 'shadow-step-assassin',
    name: 'Shadow Step Assassin',
    school: 'Genjutsu',
    cost: 5,
    attack: 6,
    health: 1,
    rarity: 'rare',
    ability: 'Stealth (5s). Dies if blocked.',
    archetype: 'aggro',
    keywords: [
      {
        type: 'stealth',
        durationMs: 5000
      },
      {
        type: 'fragile'
      }
    ]
  },

  // === ADDITIONAL CONTROL CARDS ===
  {
    id: 'sanctuary-guardian',
    name: 'Sanctuary Guardian',
    school: 'Taijutsu',
    cost: 6,
    attack: 1,
    health: 9,
    rarity: 'rare',
    ability: 'Taunt. Heal 1 at end of turn.',
    archetype: 'control',
    keywords: [
      {
        type: 'taunt'
      },
      {
        type: 'heal-self-end-turn',
        value: 1
      }
    ]
  },
  {
    id: 'purifying-wind',
    name: 'Purifying Wind',
    school: 'Ninjutsu',
    cost: 3,
    attack: 1,
    health: 1,
    rarity: 'uncommon',
    ability: 'On play: Remove all debuffs from allies.',
    archetype: 'control',
    onPlay: {
      type: 'cleanse-allies'
    }
  },

  // === ADDITIONAL COMBO CARDS ===
  {
    id: 'chakra-amplifier',
    name: 'Chakra Amplifier',
    school: 'Ninjutsu',
    cost: 2,
    attack: 1,
    health: 2,
    rarity: 'common',
    ability: 'When you gain chakra: Gain +1 extra.',
    archetype: 'combo',
    keywords: [
      {
        type: 'chakra-amplifier',
        bonus: 1
      }
    ]
  },
  {
    id: 'technique-savant',
    name: 'Technique Savant',
    school: 'Genjutsu',
    cost: 4,
    attack: 3,
    health: 3,
    rarity: 'rare',
    ability: 'The first combo each turn costs 0.',
    archetype: 'combo',
    keywords: [
      {
        type: 'first-combo-free'
      }
    ]
  },
  {
    id: 'grand-master',
    name: 'Grand Master',
    school: 'Taijutsu',
    cost: 9,
    attack: 7,
    health: 7,
    rarity: 'legendary',
    ability: 'On play: Trigger all your combo effects twice.',
    archetype: 'combo',
    onPlay: {
      type: 'double-combo-effects'
    }
  }
];

export const combos = [
  {
    id: 'shadow-clone-barrage',
    name: 'Shadow Clone Barrage',
    sequence: ['Ninjutsu', 'Taijutsu'],
    windowMs: 6000,
    cost: 6,
    effect: {
      type: 'summon',
      owner: 'player',
      count: 2,
      stats: { attack: 2, health: 2 },
      status: {
        id: 'clone-aegis',
        type: 'shield',
        value: 2,
        durationMs: 5000
      }
    }
  },
  {
    id: 'fire-dragon-tornado',
    name: 'Fire Dragon Tornado',
    sequence: ['Ninjutsu', 'Ninjutsu'],
    windowMs: 5000,
    cost: 8,
    effect: {
      type: 'damage-lane',
      target: 'ai',
      damage: 4,
      bonusWhenTerrain: { terrain: 'mountain', extra: 2 },
      status: {
        id: 'burning-embers',
        type: 'damage-over-time',
        magnitude: 1,
        tickIntervalMs: 1000,
        durationMs: 4000
      }
    }
  },
  {
    id: 'genjutsu-trap',
    name: 'Genjutsu Trap',
    sequence: ['Genjutsu', 'Ninjutsu'],
    windowMs: 7000,
    cost: 7,
    effect: {
      type: 'status-front',
      target: 'ai',
      status: {
        id: 'mind-snare',
        type: 'crowd-control',
        crowdControl: 'stun',
        durationMs: 4000
      }
    }
  },
  {
    id: 'lightning-devastation',
    name: 'Lightning Devastation',
    sequence: ['Taijutsu', 'Ninjutsu', 'Taijutsu'],
    windowMs: 8000,
    cost: 10,
    effect: {
      type: 'damage-lane',
      target: 'ai',
      damage: 6,
      bonusWhenTerrain: { terrain: 'mountain', extra: 3 },
      status: {
        id: 'chain-lightning',
        type: 'damage-over-time',
        magnitude: 2,
        tickIntervalMs: 800,
        durationMs: 3200
      }
    }
  },
  {
    id: 'forest-regeneration',
    name: 'Forest Regeneration',
    sequence: ['Ninjutsu', 'Genjutsu'],
    windowMs: 5000,
    cost: 5,
    effect: {
      type: 'heal-lane',
      target: 'player',
      healing: 3,
      bonusWhenTerrain: { terrain: 'forest', extra: 2 },
      status: {
        id: 'nature-blessing',
        type: 'heal-over-time',
        magnitude: 1,
        tickIntervalMs: 1500,
        durationMs: 6000
      }
    }
  },
  {
    id: 'water-style-prison',
    name: 'Water Style Prison',
    sequence: ['Genjutsu', 'Genjutsu'],
    windowMs: 4000,
    cost: 6,
    effect: {
      type: 'status-all',
      target: 'ai',
      status: {
        id: 'water-prison',
        type: 'crowd-control',
        crowdControl: 'freeze',
        durationMs: 3000,
        resistanceReduction: 0.5
      }
    }
  },
  {
    id: 'berserker-fury',
    name: 'Berserker Fury',
    sequence: ['Taijutsu', 'Taijutsu'],
    windowMs: 3000,
    cost: 4,
    effect: {
      type: 'buff-lane',
      target: 'player',
      status: {
        id: 'fury-rage',
        type: 'buff',
        attackBonus: 3,
        speedBonus: 1.5,
        durationMs: 4000,
        drawback: {
          type: 'vulnerability',
          damageMultiplier: 1.25
        }
      }
    }
  },
  {
    id: 'mist-concealment',
    name: 'Mist Concealment',
    sequence: ['Genjutsu', 'Ninjutsu', 'Genjutsu'],
    windowMs: 9000,
    cost: 9,
    effect: {
      type: 'stealth-lane',
      target: 'player',
      status: {
        id: 'hidden-mist',
        type: 'stealth',
        evasionBonus: 0.4,
        durationMs: 5000,
        bonusWhenTerrain: { terrain: 'river', evasionBonus: 0.6 }
      }
    }
  },
  {
    id: 'earth-wall-fortress',
    name: 'Earth Wall Fortress',
    sequence: ['Taijutsu', 'Ninjutsu'],
    windowMs: 4000,
    cost: 7,
    effect: {
      type: 'fortify-stronghold',
      target: 'player',
      fortification: 5,
      bonusWhenTerrain: { terrain: 'mountain', extra: 3 },
      status: {
        id: 'stone-barrier',
        type: 'shield',
        value: 4,
        durationMs: 8000,
        reflectDamage: 0.3
      }
    }
  },
  {
    id: 'spirit-swarm',
    name: 'Spirit Swarm',
    sequence: ['Genjutsu', 'Taijutsu', 'Ninjutsu'],
    windowMs: 10000,
    cost: 12,
    effect: {
      type: 'summon',
      owner: 'player',
      count: 4,
      stats: { attack: 1, health: 1 },
      status: {
        id: 'ethereal-form',
        type: 'ethereal',
        phaseChance: 0.3,
        durationMs: 6000
      }
    }
  },
  {
    id: 'crimson-bloom-detonation',
    name: 'Crimson Bloom Detonation',
    sequence: ['Ninjutsu', 'Genjutsu', 'Ninjutsu'],
    windowMs: 8000,
    cost: 9,
    effect: {
      type: 'status-all',
      target: 'ai',
      status: {
        id: 'volatile-blossom',
        type: 'delayed-damage',
        delayMs: 2500,
        damage: 4,
        durationMs: 2500
      }
    }
  },
  {
    id: 'guardian-spirit-anthem',
    name: 'Guardian Spirit Anthem',
    sequence: ['Genjutsu', 'Taijutsu'],
    windowMs: 6000,
    cost: 6,
    effect: {
      type: 'buff-lane',
      target: 'player',
      status: {
        id: 'spirit-ward',
        type: 'aura',
        attackBonus: 1,
        speedBonus: 1.1,
        damageReduction: 0.35,
        flatReduction: 1,
        durationMs: 5000
      }
    }
  },
  {
    id: 'tempest-rupture-dance',
    name: 'Tempest Rupture Dance',
    sequence: ['Ninjutsu', 'Taijutsu', 'Genjutsu'],
    windowMs: 8000,
    cost: 9,
    effect: {
      type: 'status-all',
      target: 'ai',
      status: {
        id: 'tempest-rupture',
        type: 'rupture',
        bonusDamage: 2,
        stacks: 2,
        durationMs: 6000
      }
    }
  },
  {
    id: 'celestial-ward-bloom',
    name: 'Celestial Ward Bloom',
    sequence: ['Genjutsu', 'Ninjutsu', 'Taijutsu'],
    windowMs: 9000,
    cost: 8,
    effect: {
      type: 'buff-lane',
      target: 'player',
      status: {
        id: 'celestial-ward',
        type: 'shield-pulse',
        shieldValue: 2,
        tickIntervalMs: 1200,
        durationMs: 6000,
        maxStacks: 3
      }
    }
  }
];
