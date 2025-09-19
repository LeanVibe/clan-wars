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
  {
    id: 'shadow-genin',
    name: 'Shadow Genin',
    school: 'Ninjutsu',
    cost: 2,
    attack: 2,
    health: 2,
    rarity: 'common',
    ability: 'Stealth (3s).',
    keywords: [
      {
        type: 'stealth',
        durationMs: 3000
      }
    ]
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
    keywords: [
      {
        type: 'regen',
        magnitude: 1,
        tickIntervalMs: 1000
      }
    ]
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
    keywords: [
      {
        type: 'heal-adjacent',
        value: 2
      }
    ]
  },
  {
    id: 'earth-style-chunin',
    name: 'Earth Style Chunin',
    school: 'Taijutsu',
    cost: 5,
    attack: 3,
    health: 4,
    rarity: 'uncommon',
    ability: 'Stoneguard: Shield 2.',
    keywords: [
      {
        type: 'shield',
        value: 2
      }
    ]
  },
  {
    id: 'ember-adept',
    name: 'Ember Adept',
    school: 'Taijutsu',
    cost: 5,
    attack: 4,
    health: 4,
    rarity: 'uncommon',
    ability: 'Aura: allies in lane gain +1 attack while Ember Adept survives.',
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
    keywords: [
      {
        type: 'aura',
        attackBonus: -1,
        affects: 'enemy'
      }
    ]
  },
  {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    school: 'Ninjutsu',
    cost: 7,
    attack: 5,
    health: 6,
    rarity: 'rare',
    ability: 'Regenerate 2 per tick.',
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
    onPlay: {
      type: 'damage-lane',
      target: 'ai',
      damage: 2
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
