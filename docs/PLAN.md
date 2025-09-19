# Execution Plan – Ninja Clan Wars Prototype

## Phase 0 – Foundation (Week 1)
- ✅ Establish monorepo with Lit PWA + Three.js shell
- ✅ Add Biome linting and Vitest scaffolding (Bun runner in place; Vitest config TBD)
- ✅ Implement chakra regeneration UI + meter component
- ✅ Wire deck draw + discard flows using `GameController`

## Phase 1 – Core Loop (Weeks 2-3) ✅ **COMPLETED**
- ✅ Deploy units to lanes with collision/combat resolution
- ✅ Model jutsu combo execution window and resource checks
- ✅ Track match clock, terrain rotation, and end-state transitions
- ✅ Capture replays locally (event log JSON) for later analysis

### **Phase 1 Extensions Completed:**
- ✅ Expanded combo library (10 diverse archetypes with advanced effects)
- ✅ Advanced status system (heal-over-time, freeze, stealth, ethereal, vulnerability)
- ✅ Enhanced visual feedback (color-coded units, animations, status badges)
- ✅ Comprehensive E2E test coverage with Playwright MCP
- ✅ PWA compliance (manifest icons, proper configuration)
- ✅ AI combo usage patterns with strategic lane selection
- ✅ Three.js rendering optimization and responsive canvas

## Phase 1.5 – Combat Integrity (Current Sprint)
- ☐ **Effect Engine v1**
  - Add lightweight event bus (`onPlay`, `onTick`, `onBeforeCombat`, `onAfterCombat`, `onUnitDamaged`, `onUnitDeath`, `onTerrainChange`)
  - Implement evergreen statuses: `stealth`, `ambush`, `aura`, `healAdj`, `shield`, `regen`
  - Wire `applyModifiers` invocation in `applyTick` and `resolveCombat`
- ☐ **Structure Resilience Pass**
  - Raise stronghold HP (10 → 15) and apply 0.5× damage multiplier + flat armor when hit directly
  - Capture telemetry: time to first stronghold hit / destruction
- ☐ **Reactive Jutsu Slice**
  - Add `comboWindow` state, 3s execution, and `playJutsu` helper
  - Ship two instants: Substitution Jutsu (prevent/counter) and Smoke Bomb (skip lane combat)
- ☐ **Terrain & UI Feedback**
  - Surface “Next terrain in Xs” countdown + crescendo highlight in `ninja-battle-canvas`
  - Display status pips for stealth/shield/ambush and damage floaters
- ☐ **Economy & Flow Tweaks**
  - Add Meditate action (discard 1→draw 1, 5s cooldown) and overflow overheat penalty (+1 cost next card)
  - Plan mulligan & cycle hooks (design spec + backlog entry)
- ☐ **Telemetry Logging**
  - Record APM (existing), floating chakra, lane contest %, combo conversion rate, card dead-time
- 🔁 **Validation**: After each bullet above, execute Playwright MCP smoke test suite (app already running)

## Phase 2 – Competitive UX (Weeks 4-5)
- ☐ Build ranked queue mock + training AI stub
- ✅ Implement spectator overlays (lane stats, stronghold health, frontline preview)
- ☐ Optimise mobile controls + haptics (PWA focus)
- ✅ Integrate Playwright scenarios for golden-path validation (MCP + smoke spec)

## Phase 3 – Pre-Beta Polish (Weeks 6-7)
- ☐ Expand card dataset (starter 32 cards) with balance metadata
- ☐ Add progression scaffolding (ranks, rewards placeholders)
- ☐ Finalise branding assets (icons, splash, card frames)
- ☐ Prepare deployment pipeline + smoke tests

> Update checklist items as milestones progress. Keep this plan aligned with `docs/active-context.md` and log adjustments in `docs/progress.md`.
