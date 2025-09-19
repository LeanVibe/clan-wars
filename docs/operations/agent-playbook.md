# Agent Playbook

This playbook distils the guidance from `docs/init/` into a lightweight checklist that Codex/Claude agents can follow without re-reading the full manuals each session.

## Startup Ritual
1. **Load Context**
   - `docs/project-brief.md`
   - `docs/active-context.md`
   - `docs/PLAN.md`
   - `docs/progress.md`
   - `docs/system-patterns.md` / `docs/tech-context.md`
2. **Confirm Environment**
   - `bun install`
   - `bun run dev` (PWA shell) – user may already have the app running; verify before starting another instance
   - Playwright MCP available via `.mcp.json` (`npx @playwright/mcp@latest`)
3. **Synchronise Tests**
   - `bun run lint`
- `npx vitest run` (unit domain coverage)
- `bun run test:e2e` (Playwright MCP after every milestone slice per user directive)

## Work Cadence
- **Plan first**: break feature into a vertical slice; update `docs/PLAN.md` if scope changes.
- **TDD Discipline**: write/extend tests in `packages/game-core/src/match.test.js` or Playwright specs before implementing mechanics.
- **Validate in-engine**: after code changes, launch the Lit PWA and manually verify lane interactions + battlefield renders.
- **Log progress**: append concise notes to `docs/progress.md`; adjust `docs/active-context.md` with new context, blockers, or follow-ups.

## Collaboration Rules
- Use `docs/reference/` for durable knowledge extracted from exploration or external docs.
- Preserve raw artefacts under `docs/raw/`; don’t edit originals—curate learnings instead.
- Follow combo/status naming guidelines from `docs/combo-system-reference.md` to keep tooling consistent.
- For significant architectural decisions, record a short ADR-style entry in `docs/tech-context.md`.

## Definition of Done (per slice)
1. Code + tests ✅
2. Playwright MCP scenario executed if UI is touched ✅
3. Lint/tests green ✅
4. Docs updated (context + reference if knowledge changed) ✅
5. Next steps & blockers captured in `active-context.md` ✅

Keep this playbook short and actionable—update it when rituals evolve so new agents inherit the latest workflow without spelunking through historical docs.
