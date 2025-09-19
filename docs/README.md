# Ninja Clan Wars Documentation Map

This repository is organised to help coding agents (Codex CLI, Claude Code, etc.) ramp quickly, find authoritative references, and keep project state synchronized.

## Living Sources
- `docs/project-brief.md` – Product vision and success metrics
- `docs/active-context.md` – Current sprint status, blockers, immediate next steps
- `docs/PLAN.md` – Execution roadmap (update when priorities shift)
- `docs/progress.md` – Session-by-session journal of changes and learnings
- `docs/system-patterns.md` – Architecture and implementation patterns
- `docs/tech-context.md` – Concrete technical decisions
- `docs/threejs-troubleshooting.md` – Known issues and fixes for the 3D battlefield

## Operational Guides
- `docs/init/` – Bootstrap templates and delegation prompts
- `docs/operations/agent-playbook.md` – Practical checklist for agents working in this repo (update as rituals evolve)

## Reference Library
- `docs/reference/game-design.md` – Condensed game vision: clans, villages, match flow
- `docs/reference/mechanics.md` – Core systems (chakra, terrain, combos) with current implementation status
- `docs/reference/progression-and-monetization.md` – Ranking ladders, economy, F2P vs premium
- `docs/reference/visual-style.md` – Art direction, UI language, and spectator requirements
- `docs/combo-system-reference.md` – Authoritative list of implemented combos and effects
- `docs/raw/` – Original source material and assets (keep unchanged for provenance)

## Usage Notes
1. **Start every session** by skimming `active-context.md` and `PLAN.md`.
2. **Update** `progress.md` and `active-context.md` after substantive work.
3. **Append** new architectural decisions to `tech-context.md` and patterns to `system-patterns.md`.
4. **Archive** exploratory artifacts under `docs/raw/` and curate actionable insights into `docs/reference/`.

This structure is optimised for agent handoffs: living docs stay in the root, long-form references live under `docs/reference/`, and onboarding material remains in `docs/init/`.
