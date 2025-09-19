# Game Design Overview

Condensed from the legacy concept decks (`docs/raw/beta-launch-guide.md`, `docs/raw/competitive-dev-guide.md`) to provide an agent-friendly snapshot of the intended experience.

## Core Identity
- **Format**: 5-minute competitive card battles (best-of-3 in tournaments)
- **Objective**: Destroy 2 of 3 opposing strongholds across Mountain / Forest / River lanes
- **Schools**: Taijutsu (physical burst), Ninjutsu (elemental versatility), Genjutsu (control/stealth)
- **Villages & Clans**
  - *Hidden Flame*: Ember (aggressive Taijutsu/Ninjutsu), Forge (equipment synergies)
  - *Hidden Mist*: Shadow (Genjutsu control/stealth), Tide (water sustain/resource denial)
  - *Hidden Forest*: Root (defensive growth / earth), Wind (mobility positioning)
- **Card Set**: 128 total (65 common, 36 uncommon, 18 rare, 6 epic, 3 legendary)
- **Deck Construction**: 30 cards, max 2 copies, village-aligned (draft formats allow mixing)

## Match Flow
1. **Start**: Both players at 12 chakra, initial terrain = Mountain Path
2. **Turns**: Real-time tick loop with 0.5 chakra/sec regeneration (overflow cap 15)
3. **Terrain Rotation**: Every 90s, rotates Mountain → Forest → River → …
4. **Combat**: Units advance lane-first; front units clash, excess damage hits stronghold
5. **Victory**: Destroy two strongholds or hold HP advantage at 5-minute mark (tiebreaker)

## Signature Systems
- **Chakra Overflow**: Risk/reward reserve (decays if mismanaged); fuels high-cost combos
- **Jutsu Combos**: Card school sequences within execution windows trigger lane-wide effects (see `docs/combo-system-reference.md` for implemented list)
- **Replay & Telemetry**: Matches logged for analysis; APM, combo usage, terrain utilization tracked
- **Spectator Readability**: Color-coded units, status badges, lane overlays to support streams

## Competitive Formats (for future roadmap)
- **Conquest**: 3 decks (different villages), opponent bans 1
- **Clan Wars**: Mono-clan requirement, Bo5
- **Draft / Sealed**: Limited pools; 25 card decks, singleton copies
- **Tournament Flow**: Regional qualifiers → group stage (dual tournament) → single-elim playoffs

Use this page when validating new features to ensure mechanics stay aligned with the intended competitive positioning.
