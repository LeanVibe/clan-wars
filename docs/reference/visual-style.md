# Visual & UX Direction

Reference distilled from raw concept art notes to guide UI/FX implementation and ensure spectator clarity.

## Art Language
- **Schools**
  - Taijutsu: Orange/Red highlights, kinetic strike VFX
  - Ninjutsu: Blue/Cyan energy, elemental particles
  - Genjutsu: Purple/Pink glows, distortion effects
- **Villages**: Distinct palettes for Flame (embers/brass), Mist (aqua/muted steel), Forest (emerald/earth)
- **Rarity**: Commons subdued, legendaries incorporate animated frames and emissive accents

## Battlefield Presentation
- **Three.js Canvas**: Three lanes rendered with emissive tints for active terrain
- **Status Feedback**: Badges for shield, burn, regen, stealth, ethereal, mark, aura, rupture, ward (see `ninja-battle-canvas` CSS classes)
- **Combo Telegraphs**: Lane-level emissive pulses + countdown chips for pending combos
- **Spectator Overlay**: Always display unit counts, stronghold HP, frontline matchup, lane FX (marks/auras/ruptures/wards)

## UI Guidelines
- Primary font sizes tuned for mobile readability (≤520px width target)
- Panels use frosted-glass backgrounds with subtle borders to remain legible over the 3D scene
- Controls (Start, Exit, hand interactions) maintain high-contrast theming and large tap targets for mobile
- Provide countdown timers for terrain rotation and combo expirations in overlays (Backlog: terrain timer integration)

## Asset TODOs
- Replace placeholder cube in Three.js scene with branded centerpiece once production art arrives
- Incorporate animated card frames and haptic cues for major events (Playwright baseline ensures no regression)
- Formalise iconography set for status effects to align UI badges and card text (coordinate with `docs/combo-system-reference.md` naming)

Consult this guide when introducing new UI components or FX to ensure consistency with the competitive, spectator-friendly aesthetic.
