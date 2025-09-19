# CLAUDE.md – Agent Operating Manual

Welcome to the Ninja Clan Wars workspace. Follow this playbook when using Claude Code, Codex CLI, or similar coding agents.

## 1. Load Context
Always read:
- `docs/project-brief.md`
- `docs/PLAN.md`
- `docs/active-context.md`
- `docs/system-patterns.md`
- `docs/tech-context.md`
- `docs/progress.md`
- `README.md`

## 2. Development Principles
- **TDD bias**: add or update tests alongside feature work (Vitest/Playwright scaffolding pending).
- **Vertical slices**: implement complete gameplay flows before refactoring frameworks.
- **State purity**: mutate game state via dedicated controllers/helpers to preserve determinism.
- **Documentation**: update relevant docs when scope, architecture, or blockers change.

## 3. Tooling Cheat Sheet
```bash
# Install dependencies
bash tools/scripts/setup.sh

# Run the Lit PWA (Bun required)
bun run dev

# Build production bundle
bun run build
```

## 4. Collaboration Protocol
1. Update `docs/active-context.md` with progress and next steps before hand-off.
2. Log new insights or decisions in `docs/tech-context.md`.
3. If introducing or modifying processes, adjust `docs/system-patterns.md`.
4. Commit frequently with descriptive messages referencing checklist items from `docs/PLAN.md`.

## 5. When Stuck
- Review `packages/game-core` for deterministic state helpers.
- Sketch the intended gameplay event sequence in `docs/progress.md` before coding.
- Question assumptions: does the change deliver tournament value now?
- Escalate issues by annotating `Blockers` in `docs/active-context.md`.

You are empowered to ship value quickly while preserving competitive integrity. Stay pragmatic, document as you go, and keep the prototype playable after every session.
