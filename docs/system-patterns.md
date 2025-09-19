# System Patterns

## Frontend
- **Lit + Vite (ES modules)** for web components and app shell
- **Three.js** isolated within canvas components for battlefield visualisations
- **PWA-first** configuration via `@vite-pwa/vite-plugin` with offline caching hooks
- **UI packages** consumed via workspace modules (`@clan-wars/ui-components`)
- **State orchestration** through immutable snapshots (`GameController`) to keep agent reasoning predictable

## Shared Domain Logic
- **packages/game-core** exposes serialisable state objects and pure helpers
- **Data-first design**: card, terrain, combo definitions reside in JSON-friendly JavaScript modules
- **Deterministic updates** designed for future multiplayer synchronisation
- **Event-driven effects**: combat engine will emit `onPlay`, `onTick`, `onBeforeCombat`, `onAfterCombat`, `onUnitDamaged`, `onUnitDeath`, `onTerrainChange` hooks so keyword statuses can respond predictably
- **Status schema**: unit statuses follow `{ type, value?, expiresAt?, stacks? }` convention to accommodate stealth/ambush/aura/heal/shield/regen and future extensions

## Documentation Workflow
- `docs/active-context.md` updated every session to maintain agent continuity
- `docs/progress.md` tracks vertical slices delivered and outstanding validation
- `docs/tech-context.md` captures architectural decisions + rationale
- `docs/PLAN.md` maintains milestone decomposition

## Testing & Quality (early scaffold)
- Biome (lint/format) configured via `biome.json`
- Vitest for unit coverage via Bun's test runner (`bun test packages/game-core/src/match.test.js` until Vitest/esbuild crash is resolved)
- Playwright scaffolding for E2E smoke tests (`bun run test:e2e`) – ensure the dev server is running
- GitHub Actions workflow for CI (pending setup)
- MCP servers defined in `.mcp.json` (currently Playwright) to keep AI agents in sync with tooling
