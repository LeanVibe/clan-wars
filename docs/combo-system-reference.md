# Combo System Reference

## Overview
The Ninja Clan Wars combo system allows players to chain cards of different schools to execute powerful jutsu techniques. Combos are triggered by playing cards in specific sequence patterns within time windows.

## Combo Mechanics

### Basic Structure
```javascript
{
  id: 'combo-identifier',
  name: 'Display Name',
  sequence: ['School1', 'School2', 'School3'], // Required card schools in order
  windowMs: 6000,                               // Time window for completion
  cost: 8,                                      // Chakra cost to execute
  effect: { /* Effect definition */ }
}
```

### Execution Flow
1. **Card Play Detection**: Each card play is tracked with school and timestamp
2. **Sequence Matching**: System checks if recent plays match any combo sequence
3. **Resource Check**: Validates sufficient chakra for combo cost
4. **Immediate vs Queued**: Execute immediately or queue if resources insufficient  
5. **Effect Application**: Apply combo effect to battlefield state

### Status Effect Types

#### Damage/Healing
- **damage-over-time**: Periodic damage (burn, poison, lightning)
- **heal-over-time**: Periodic healing (regeneration, blessing)
- **delayed-damage**: Volatile marks that detonate after a short delay and deal burst damage

#### Crowd Control  
- **stun**: Prevents unit from attacking
- **freeze**: Alternative crowd control with visual distinction

#### Buffs/Debuffs
- **buff**: Increases attack, speed, or other attributes
- **vulnerability**: Increases incoming damage via drawback system
- **rupture**: Stores explosive charges that amplify the next incoming hits before expiring

#### Support Auras
- **aura**: Lane-wide discipline that boosts allied attack/speed while reducing incoming damage (percent + flat absorb)

#### Defensive
- **shield**: Absorbs damage before health, supports reflection
- **stealth**: Reduces opacity, grants evasion bonuses
- **ethereal**: Phase mechanics with partial transparency
- **shield-pulse**: Periodically grants stacking shield values up to a capped reserve

### Visual Feedback System

#### Unit Color Coding
- **Blue (#3b82f6)**: Frozen units
- **Orange (#f97316)**: Burning/damage-over-time
- **Green (#22c55e)**: Healing/regeneration  
- **Purple (#8b5cf6)**: Stealth effects
- **Violet (#a855f7)**: Ethereal forms
- **Grey (#94a3b8)**: Stunned units

#### Animation Effects
- **Burn Glow**: Pulsing emissive at 90ms intervals
- **Heal Pulse**: Gentle pulse at 150ms intervals  
- **Stun Flicker**: Intermittent flicker at 120ms intervals
- **Stealth Phase**: Opacity modulation for phasing effect
- **Ethereal Shimmer**: Combined opacity and emissive animation
- **Detonation Charge**: Intensifying pulse and scale swell as volatile marks near detonation
- **Aura Shimmer**: Turquoise breathing glow that conveys protective spirit wards
- **Rupture Gleam**: Golden pulse and lane tint when enemies are primed for amplified damage
- **Ward Surge**: Azure breathing glow and shield chip readouts when ward pulses are active

#### Overlay Enhancements
- **Lane FX Summary**: New row in lane overlays lists mark counts and aura coverage for quick combat reads
- **Combo Countdown Chips**: Pending combo chips now show seconds remaining and escalate styling when windows close
- **Urgency Highlighting**: Lane emissive glow ramps up for pending combos to signal timing pressure

## Current Combo Library

### 1. Shadow Clone Barrage
- **Sequence**: Ninjutsu → Taijutsu
- **Effect**: Summon 2 shielded clones (2/2 with 2-point shields)
- **Cost**: 6 chakra
- **Window**: 6 seconds

### 2. Fire Dragon Tornado  
- **Sequence**: Ninjutsu → Ninjutsu
- **Effect**: 4 damage to enemy lane, +2 on Mountain terrain, applies burn
- **Cost**: 8 chakra  
- **Window**: 5 seconds

### 3. Genjutsu Trap
- **Sequence**: Genjutsu → Ninjutsu
- **Effect**: Stun front enemy unit for 4 seconds
- **Cost**: 7 chakra
- **Window**: 7 seconds

### 4. Lightning Devastation
- **Sequence**: Taijutsu → Ninjutsu → Taijutsu  
- **Effect**: 6 damage (+3 on Mountain), chain lightning DoT
- **Cost**: 10 chakra
- **Window**: 8 seconds

### 5. Forest Regeneration
- **Sequence**: Ninjutsu → Genjutsu
- **Effect**: 3 healing (+2 on Forest), heal-over-time
- **Cost**: 5 chakra
- **Window**: 5 seconds

### 6. Water Style Prison
- **Sequence**: Genjutsu → Genjutsu
- **Effect**: Freeze all enemy units in lane with resistance reduction
- **Cost**: 6 chakra
- **Window**: 4 seconds

### 7. Berserker Fury
- **Sequence**: Taijutsu → Taijutsu
- **Effect**: +3 attack, +1.5x speed, but +25% vulnerability
- **Cost**: 4 chakra
- **Window**: 3 seconds

### 8. Mist Concealment  
- **Sequence**: Genjutsu → Ninjutsu → Genjutsu
- **Effect**: Apply stealth with 40% evasion (+60% on River terrain)
- **Cost**: 9 chakra
- **Window**: 9 seconds

### 9. Earth Wall Fortress
- **Sequence**: Taijutsu → Ninjutsu
- **Effect**: +5 stronghold fortification (+3 on Mountain), reflective shields
- **Cost**: 7 chakra
- **Window**: 4 seconds

### 10. Spirit Swarm
- **Sequence**: Genjutsu → Taijutsu → Ninjutsu
- **Effect**: Summon 4 ethereal spirits (1/1) with 30% phase chance
- **Cost**: 12 chakra
- **Window**: 10 seconds

### 11. Crimson Bloom Detonation
- **Sequence**: Ninjutsu → Genjutsu → Ninjutsu
- **Effect**: Applies volatile blossom marks to all enemy units; marks detonate for 4 burst damage after 2.5 seconds
- **Cost**: 9 chakra
- **Window**: 8 seconds

### 12. Guardian Spirit Anthem
- **Sequence**: Genjutsu → Taijutsu
- **Effect**: Bathes allied lane in a protective aura granting +1 attack, +10% speed, 35% damage reduction, and a flat 1 damage absorb for 5 seconds
- **Cost**: 6 chakra
- **Window**: 6 seconds

### 13. Tempest Rupture Dance
- **Sequence**: Ninjutsu → Taijutsu → Genjutsu
- **Effect**: Brands all enemy units in lane with rupture charges that add +2 bonus damage on the next two hits
- **Cost**: 9 chakra
- **Window**: 8 seconds

### 14. Celestial Ward Bloom
- **Sequence**: Genjutsu → Ninjutsu → Taijutsu
- **Effect**: Applies a ward pulse to allied units, adding 2 shield every 1.2s up to 6 total for 6 seconds
- **Cost**: 8 chakra
- **Window**: 9 seconds

## Technical Implementation

### Effect Processing
- Status effects are processed during `applyTick()` combat resolution
- Each status maintains expiration timers and tick intervals
- Effects stack additively for most attributes
- Crowd control effects are mutually exclusive (latest wins)

### Performance Considerations
- Combo history limited to 10 seconds to prevent memory growth
- Pending queue automatically expires outdated entries
- Visual animations use efficient interpolation for smooth 60fps rendering
- Status badge rendering optimized with conditional templates

### Testing Coverage
- Unit tests for all 10 combo effect types
- Edge case validation for resource constraints  
- Status interaction testing (shield absorption, vulnerability stacking)
- Animation state transition verification

## Balance Design Notes
- Short-sequence combos (2 cards) have lower costs and shorter windows
- Long-sequence combos (3 cards) provide powerful effects but require planning
- Terrain bonuses reward strategic lane selection
- Drawback effects balance powerful buffs to prevent dominance
- Resource costs scale with combo complexity and effect power
