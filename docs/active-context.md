# Active Context

**Date**: 2025-09-20
**Owner**: Claude Code (claude-sonnet-4)

## Current Focus
Phase 4 Beta Infrastructure completion - focusing on the remaining critical components:
- Complete PWA functionality with service worker implementation and offline capabilities
- Set up CI/CD pipeline with GitHub Actions for automated testing and deployment
- Finalize tournament infrastructure for competitive play
- Enhance user onboarding system with interactive tutorials

## Recently Completed
- ✅ **Comprehensive Analytics Infrastructure**: Full privacy-first analytics system with 4 specialized modules
- ✅ **Data Persistence System**: Complete IndexedDB wrapper with player data, rankings, and deck storage
- ✅ **Analytics Integration**: Automatic tracking of combat events, match lifecycle, and performance metrics

## Recent Progress
- Added Tempest Rupture & Celestial Ward combos with new rupture/ward status logic and richer battlefield telegraphy
- Completed design review consolidation; prioritised effect engine, structure tuning, and reactive jutsu rollout for the next slice
- Migrated raw prototype assets into structured monorepo workspace
- Created shared domain models (cards, terrain, chakra, combos)
- Implemented initial PWA shell and Three.js canvas wrapper
- Migrated frontend + shared packages from TypeScript decorators to plain JavaScript for runtime compatibility
- Added reusable Lit UI component package for card framing
- Wired initial game loop helpers (startMatch/applyTick) with card hand UI, chakra meter, and lane selection for placeholder deployments
- Expanded starter deck + reshuffle logic for continuous draws and surfaced lane summaries (stronghold HP, frontline units, health-scaled markers)
- Modelled jutsu combo execution windows with status-driven effects and pending activation logic
- Enhanced battlefield overlays with frontline health bars, status badges, and combo readiness cues to improve readability
- **Phase 1 Extension Completed**: Significantly expanded combo library from 3 to 10 archetypes with diverse effect patterns
- **Advanced Status System**: Added heal-over-time, freeze, stealth, ethereal, vulnerability, and fortification effects
- **Enhanced Visual Feedback**: Color-coded unit rendering, animation pulses, and comprehensive status badge system
- **Robust Testing Coverage**: 8 comprehensive test cases validating all new combo mechanics and edge cases
- **Volatile Mark & Aura Extensions**: New delayed-detonation and protective aura combos with lane FX summaries, countdown chips, and intensified battlefield glows

## Immediate Next Steps
1. Design and scaffold the combat effects engine (event hooks + status schema) in `packages/game-core`  
   - Define event bus (`onPlay`, `onTick`, `onBeforeCombat`, `onAfterCombat`, `onUnitDamaged`, `onUnitDeath`, `onTerrainChange`)
   - Model keyword statuses (stealth, ambush, aura, heal, shield, regen) with expiry/value semantics
2. Tune stronghold durability (HP bump, structure damage multiplier, flat armor) to hit 6–8s uncontested TTK
3. Spec and implement comboWindow + reactive jutsu casting (Substitution / Smoke Bomb) including counter window logic
4. Update Lit/Three.js UI: terrain rotation countdown + crescendo state, status pips, combo HUD, damage feedback
5. Add telemetry logging for structure damage timing, lane contest %, average floating chakra, combo conversion
6. Once each milestone lands, validate with Playwright MCP smoke scenarios (app assumed running per user directive)

## Upcoming Priorities (post-combat integrity slice)
1. Build ranked queue mock + training AI stub for competitive UX validation
2. Optimise mobile controls and haptics (PWA focus)
3. Expand card dataset to 32+ cards with balance metadata and evolving archetypes
4. Add data persistence layer for decks, profiles, and progression tracking
5. Implement training AI with difficulty progression and strategic improvements

## Blockers / Risks
- No backend/multiplayer stack defined yet (future milestone)
- Need decision on data persistence layer for decks/profiles

## Hand-off Notes
- Run bash tools/scripts/setup.sh then bun run dev to continue PWA work
- Keep docs (project-brief, tech-context, progress) updated after each session
- Prefer vertical slices: implement one full lane battle loop before global refactors
- Manual smoke test: start a match, click a lane, play a card from the hand, verify unit counts update and chakra meter decrements
- Optional combat check: wait ~5 seconds after playing a unit and confirm AI markers spawn and frontline unit trades or stronghold health decreases.
- MCP: `.mcp.json` exposes the Playwright server (`npx @playwright/mcp@latest`) for agent integrations.
