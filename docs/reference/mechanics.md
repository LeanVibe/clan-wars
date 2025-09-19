# Core Mechanics Cheat Sheet

Summaries below map the conceptual design from the raw docs to our current implementation layers (Lit PWA + Three.js + `packages/game-core`). Update when mechanics change.

## Chakra System
- **Base / Max**: 12 chakra, overflow cap 15 (`packages/game-core/src/state.js`)
- **Regeneration**: 0.5 chakra/second (handled in `applyTick`)
- **Overflow Risk**: Concept calls for decay; plan to add *Overheat* (next card +1 cost when casting at cap)
- **Flow Tweaks (planned)**: Meditate action (discard 1 → draw 1, 5s cooldown); Forest bonus becomes regen multiplier instead of +1 flat
- **UI Hooks**: `apps/pwa/src/components/ninja-chakra-meter.js`

## Terrain Rotation
- **Terrains**: Mountain (Taijutsu buff), Forest (extra chakra), River (stealth/confusion)
- **Timing**: Rotates every 90s (see `applyTick` in `match.js`)
- **Visualization**: Lane mesh emissive pulses in `ninja-battle-canvas`
- **Backlog**: Need to surface upcoming terrain rotation countdown in UI

## Battlefield
- **Lanes**: Mountain, Forest, River – each with `player` and `ai` unit arrays
- **Strongholds**: 3 per side (10 HP baseline; plan to raise to 15 with 0.5× damage multiplier + flat armor)
- **Combat**: Resolved each second; crowd control (stun/freeze) nullifies attack
- **Status Effects**: Shield, DoT, HoT, Stealth, Ethereal, Aura, Delayed Damage, Rupture, Shield Pulse (see `applyDamage` / `processUnitStatuses`)
- **Effect Engine (in progress)**: Event hooks (`onPlay`, `onTick`, `onBeforeCombat`, `onAfterCombat`, `onUnitDamaged`, `onUnitDeath`, `onTerrainChange`) will drive keyword logic for stealth/ambush/aura/heal/shield/regen

## Combo & Jutsu Engine
- **Detection Window**: 6s default; sequences stored per-lane
- **Pending Queue**: If chakra insufficient, combo enters `comboState.pending` until affordable or expired
- **Execution**: `executeComboEffect` covers summon/damage/heal/buff/stealth/fortify etc.
- **Reactive Jutsu (planned)**: 3s `comboWindow` enabling instants (Substitution Jutsu, Smoke Bomb) with optional counter window
- **Implemented Combos**: 14 (detailed in `docs/combo-system-reference.md`)
- **AI Usage**: `spawnAiUnit` → `tryAiCombo` heuristics (urgency based on lane state)

## Replay & Telemetry
- **Metrics**: `stats` track actions, combos, terrain utilisation, strongholds destroyed
- **Upcoming Logs**: time to first structure damage/destruction, lane contest %, floating chakra averages, combo conversion rate, card dead-time
- **Replays**: JSON event logs under `packages/game-core/src/replay.js` (WIP for Phase 1)

## Testing Hooks
- **Unit Tests**: `packages/game-core/src/match.test.js`
- **E2E**: `tests/e2e/` (execute via Playwright MCP as per playbook; required after each milestone per user directive)

Refer to this sheet while implementing or reviewing mechanics to ensure new work remains consistent with the competitive design.
