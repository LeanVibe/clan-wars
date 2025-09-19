# Ninja Clan Wars Prototype Workspace

This repository hosts the **Ninja Clan Wars** competitive card game prototype. The current focus is a Lit-powered Progressive Web App that integrates Three.js for visual battle renders while keeping the codebase friendly to AI coding agents (Codex CLI, Claude Code, etc.).

## Workspace Layout

- `apps/pwa/` – mobile-first Lit PWA shell with Three.js battlefield visualiser
- `packages/game-core/` – shared JavaScript domain models and match state helpers
- `packages/ui-components/` – reusable Lit-based UI primitives
- `docs/` – living project context (onboarding, plans, active status, reference material)
- `tools/` – automation scripts for setup and continuous workflows

## Quick Start

```bash
# install dependencies (requires bun)
bash tools/scripts/setup.sh

# run the PWA locally
bun run dev

# lint & tests
bun lint
bun test packages/game-core/src/match.test.js
bun run test:e2e # requires dev server running in another terminal

## MCP Servers
- `.mcp.json` configures the Playwright MCP server via `npx @playwright/mcp@latest` with tests under `tests/e2e/`.
```

The development server will launch the Lit application at `http://localhost:5173`, rendering a basic battlefield view backed by shared game state primitives.

## Development Principles

- **Work in vertical slices** – wire gameplay loops end-to-end before polishing visuals.
- **Codify decisions** – update `docs/tech-context.md` and `docs/system-patterns.md` whenever architecture evolves.
- **Automate context** – keep `docs/active-context.md` up to date so coding agents can resume seamlessly.
- **Prototype rapidly** – treat the PWA as a sandbox for testing mechanics, assets, and UX before deeper implementation.

Refer to `docs/project-brief.md` for the product vision and `docs/PLAN.md` for the current execution roadmap.
