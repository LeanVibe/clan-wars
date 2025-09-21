# Phase 5 Beta Launch Sprint - Handoff Instructions

## 🎯 Current Status: Day 1 Complete → Day 2 Ready

**Phase 5 Progress: 1/7 days complete (14%)**

You are taking over the **Phase 5 Beta Launch Sprint** for Ninja Clan Wars. Day 1 (PWA Service Worker) has been **fully completed and tested**. The project is now ready for **Days 2-3: Tournament Infrastructure** implementation.

## ✅ Day 1 Completed Work (PWA Service Worker)

### PWA Service Worker Implementation ✅
- **vite-plugin-pwa Configuration**: Complete automated service worker generation
  - Multi-tier caching strategy (game-core, components, assets, fonts, CDN)
  - 754.82 KiB precached assets across 13 entries
  - Location: `apps/pwa/vite.config.js`

- **Offline Match Replay System**: Full offline functionality with smart caching
  - Service: `apps/pwa/src/services/offline-replay.js`
  - Integration: `apps/pwa/src/components/ninja-match-history.js` (replay buttons added)
  - Features: Cache/sync management, offline detection, background sync

- **PWA Installation Flow**: Smart app installation prompts
  - Service: `apps/pwa/src/services/pwa-install.js`
  - Component: `apps/pwa/src/components/ninja-pwa-install.js`  
  - Features: Auto-prompts, iOS instructions, dismissal tracking, analytics

- **Cache Management System**: Complete cache monitoring and optimization
  - Service: `apps/pwa/src/services/cache-manager.js`
  - Component: `apps/pwa/src/components/ninja-cache-status.js`
  - Features: Storage stats, cleanup tools, recommendations, preloading

### Build Status ✅
- **Build Successful**: `bun run build` passes with PWA generation
- **Service Worker**: Generated at `dist/sw.js` with workbox integration
- **Manifest**: Auto-generated from existing `public/manifest.webmanifest`
- **Components**: All PWA components integrated into main app

## 🎯 Next Priority: Days 2-3 Tournament Infrastructure

### **Critical Path: Tournament System Implementation**

**Goal**: Build competitive tournament infrastructure to differentiate from other card games

### Day 2 Tasks (HIGH PRIORITY)
1. **Bracket Generation System**
   - Create tournament bracket logic for single elimination
   - Generate visual bracket representation
   - Handle advancement/elimination logic
   - Integration points: Use existing `rankingSystem` from `packages/game-core/src/ranking.js`

2. **Tournament Matchmaking**
   - Extend existing ranked queue system (`apps/pwa/src/components/ninja-ranked-queue.js`)
   - Add tournament-specific queue type
   - Integrate with ELO ranking system
   - Manage tournament registration/scheduling

### Day 3 Tasks (MEDIUM PRIORITY)
3. **Enhanced Spectator Mode**
   - Extend existing battle canvas for spectator view
   - Real-time match progression display
   - Lane statistics and stronghold health monitoring
   - Build on existing components: `ninja-battle-canvas.js`, `ninja-lane-composition.js`

4. **Tournament UI Components**
   - Bracket visualization component
   - Tournament lobby interface
   - Match status tracking
   - Tournament history and results

## 🏗️ Technical Context

### Existing Infrastructure (LEVERAGE THESE)
- **ELO Ranking System**: `packages/game-core/src/ranking.js` (6 ninja ranks, professional rating system)
- **Match History**: `apps/pwa/src/components/ninja-match-history.js` (with replay integration)
- **Ranked Queue**: `apps/pwa/src/components/ninja-ranked-queue.js` (extends for tournaments)
- **Battle Canvas**: `apps/pwa/src/components/ninja-battle-canvas.js` (enhance for spectating)
- **Persistence System**: `packages/game-core/src/persistence.js` (8 object stores for tournaments)

### Code Patterns to Follow
```javascript
// Tournament structure should extend existing patterns
const tournament = {
  id: 'tournament-id',
  type: 'single-elimination',
  status: 'registration' | 'active' | 'completed',
  participants: [], // Array of player objects with rankings
  brackets: [], // Generated bracket structure
  matches: [], // Match results and progression
  createdAt: Date.now(),
  startTime: Date.now(),
  prizePool: { type: 'ranking-points', amount: 100 }
};
```

### Component Integration Pattern
```javascript
// Add to ninja-clan-wars-app.js
import './ninja-tournament-bracket';
import './ninja-tournament-lobby';

// Render in #renderTournament() method
// Follow existing view switching pattern
```

## 📁 File Structure for Tournament Implementation

### Required New Files
```
apps/pwa/src/components/
├── ninja-tournament-bracket.js     # Bracket visualization
├── ninja-tournament-lobby.js       # Tournament registration/lobby
├── ninja-tournament-spectator.js   # Enhanced spectator mode
└── ninja-tournament-history.js     # Tournament results/history

packages/game-core/src/
├── tournament.js                    # Tournament logic and bracket generation
└── tournament-matchmaking.js       # Tournament-specific matchmaking
```

### Files to Modify
```
apps/pwa/src/components/
├── ninja-clan-wars-app.js          # Add tournament view and routing
├── ninja-ranked-queue.js           # Extend for tournament registration
└── ninja-battle-canvas.js          # Add spectator mode capabilities

packages/game-core/src/
├── index.js                        # Export tournament modules
└── persistence.js                  # Add tournament object stores
```

## 🎮 Game Design Context

### Tournament Types to Implement
1. **Single Elimination** (Priority 1)
   - 4, 8, 16, 32 player brackets
   - Winner advances, loser eliminated
   - Fast-paced competitive format

2. **Swiss Format** (Future consideration)
   - Fixed number of rounds
   - Players paired by performance
   - More forgiving format

### Competitive Features
- **Entry Requirements**: Minimum rank (e.g., Chunin level)
- **Prize Structure**: Ranking points, special titles, badges
- **Schedule**: Regular tournaments (daily/weekly)
- **Spectator Features**: Real-time viewing, match analysis

## 🔧 Development Commands

### Critical Commands
```bash
# Development server
bun run dev

# Build testing (MUST PASS)
bun run build

# View build output
cd apps/pwa/dist && python -m http.server 8080
```

### Quality Gates
- ✅ Build must succeed without errors
- ✅ PWA service worker must generate correctly
- ✅ All tournament features must work offline
- ✅ Components must follow existing design patterns

## 📊 Success Metrics for Days 2-3

### Day 2 Success Criteria
- [ ] Tournament brackets generate correctly for 4-32 players
- [ ] Tournament registration integrates with existing ranking system
- [ ] Tournament matches advance players through brackets
- [ ] Tournament UI components match existing design system

### Day 3 Success Criteria  
- [ ] Spectator mode displays real-time match progression
- [ ] Tournament history tracks and displays results
- [ ] All tournament features work offline via PWA
- [ ] Tournament system integrates with existing analytics

## ⚠️ Important Notes

### Do NOT Modify These (Working Systems)
- PWA service worker configuration (`apps/pwa/vite.config.js`)
- Offline replay system (`apps/pwa/src/services/offline-replay.js`)
- Cache management system (`apps/pwa/src/services/cache-manager.js`)
- PWA installation flow (working correctly)

### Testing Strategy
- Use existing ELO system for tournament seeding
- Test tournament flow with AI opponents initially
- Ensure offline functionality for all tournament features
- Validate bracket generation with different player counts

### Architecture Principles
- Follow existing Lit component patterns
- Use event-driven architecture for tournament updates
- Leverage existing persistence layer for tournament data
- Maintain mobile-first responsive design

## 🚀 Phase 5 Roadmap Context

You are implementing **Days 2-3** of a **7-day critical path**:
- Day 1: ✅ PWA Service Worker (COMPLETE)
- **Days 2-3: 🎯 Tournament Infrastructure (CURRENT FOCUS)**
- Days 4-6: User Onboarding System
- Day 7: Performance Validation & Launch

**Business Goal**: Create competitive tournament system that differentiates Ninja Clan Wars from other card games and drives ≥30% competitive participation.

---

**Success Checkpoint**: By end of Day 3, users should be able to join tournaments, view live brackets, and spectate matches - all working offline via PWA.

Good luck! The foundation is solid and ready for tournament infrastructure. 🥷🏆