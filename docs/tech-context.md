# Tech Context & Decisions

## Frontend Stack
- **Lit 3** chosen for standards-based components with minimal runtime overhead.
- **Three.js** powers battlefield rendering; isolated within `ninja-battle-canvas` to keep side effects contained.
- **Vite** provides fast bundling and PWA plugin integration.
- **Bun** selected as package manager/runtime to align with existing agent workflows.

## Workspace Layout
- Monorepo with `apps/` and `packages/` directories for clarity when delegating tasks to agents.
- Native ES module JavaScript across packages keeps the toolchain lightweight—no TypeScript compilation required.
- Workspace dependencies (`workspace:*`) allow instant linkage between app and packages without manual publishing.

## Agent Enablement
- `tools/scripts/setup.sh` standardises environment bootstrapping for new sessions.
- Documentation suite mirrors prompts referenced in `docs/init`, allowing agents to load context quickly.
- `GameController` wrapper enforces immutable updates to simplify state reasoning for AI collaborators.
- Tooling: Biome (`bun lint`), Vitest (currently invoke via `bun test packages/...` while investigating esbuild config crash), and Playwright (`bun run test:e2e`). Playwright MCP is configured via `.mcp.json` (launches `npx @playwright/mcp@latest` against `tests/e2e`).

## Combat Integrity Roadmap (New)
- **Effect Engine v1**: add event hooks + status schema so keyworded cards (stealth, ambush, aura, heal, shield, regen) execute as authored
- **Structure Damage Tuning**: stronghold HP bump, structure damage multiplier, and flat armor to avoid 2–3s melts
- **Reactive Jutsu Windows**: 3s combo windows + counter timing, with Substitution / Smoke Bomb instants as first-class lane interaction
- **Telemetry & UI**: log structure/telemetry metrics and surface terrain rotation countdowns + status pips in the PWA

## Pending Decisions
- Choose lint/test stack (Biome vs ESLint, Vitest integration timeline).
- Define networking/back-end architecture (FastAPI vs Go real-time service) for multiplayer expansion.
- Determine content pipeline for 128-card dataset (JSON vs CMS).
