import { LitElement, css, html } from 'lit';
import { createInitialState, terrains, startMatch, applyTick, playCard, canPlayCard, drawCard, meditate, canMeditate, combatEvents, playReactiveJutsu } from '@clan-wars/game-core';
import './ninja-battle-canvas';
import './ninja-hand';
import './ninja-chakra-meter';
import './ninja-combat-log';
import './ninja-lane-composition';
import './ninja-reactive-jutsu-window';
import './ninja-ranked-queue';
import './ninja-match-history';
import '@clan-wars/ui-components';

export class NinjaClanWarsApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex: 1 1 auto;
      min-height: 100vh;
    }

    .app-shell {
      width: min(100%, 520px);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      background: linear-gradient(140deg, rgba(30, 154, 176, 0.12), rgba(15, 23, 42, 0.9));
      backdrop-filter: blur(18px);
    }

    header,
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-12);
      gap: var(--space-12);
    }

    main {
      flex: 1;
      padding: var(--space-12);
      display: grid;
      gap: var(--space-12);
    }

    .surface {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: var(--space-12);
    }

    .actions {
      display: flex;
      gap: var(--space-8);
      justify-content: center;
      margin-top: var(--space-16);
    }

    button.primary {
      background: var(--color-primary);
      color: var(--color-text);
      padding: var(--space-8) var(--space-16);
      border-radius: var(--radius-pill);
      font-weight: 600;
      letter-spacing: 0.04em;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }

    button.primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    footer ninja-chakra-meter {
      margin-left: auto;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0 var(--space-6);
      border-radius: var(--radius-pill);
      background: rgba(30, 154, 176, 0.18);
      font-size: var(--font-size-xs);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .meta {
      display: grid;
      gap: var(--space-8);
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .nav-tabs {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-16);
    }

    .nav-tab {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-md);
      padding: var(--space-8) var(--space-12);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-tab:hover {
      background: rgba(255, 255, 255, 0.2);
      color: var(--color-text);
    }

    .nav-tab.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-text);
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-16);
    }

    .menu-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      padding: var(--space-16);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .menu-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary);
    }

    .menu-card h3 {
      margin: 0 0 var(--space-8) 0;
      font-size: var(--font-size-lg);
      font-weight: 700;
    }

    .menu-card p {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: 1.5;
    }
  `;

  static properties = {
    game: { state: true },
    selectedLane: { state: true },
    combatEvents: { state: true },
    showLaneComposition: { state: true },
    laneCompositionLane: { state: true },
    currentView: { state: true },
    playerId: { state: true }
  };

  #raf;
  #combatEventUnsubscribe;

  constructor() {
    super();
    this.game = createInitialState(currentTime());
    this.selectedLane = this.game.activeTerrain;
    this.combatEvents = [];
    this.showLaneComposition = false;
    this.laneCompositionLane = '';
    this.currentView = 'menu'; // menu, practice, ranked, history
    this.playerId = 'player-1'; // In a real app, this would come from auth
  }

  connectedCallback() {
    super.connectedCallback();
    this.#beginLoop();
    this.#combatEventUnsubscribe = combatEvents.subscribe((event, allEvents) => {
      this.combatEvents = [...allEvents];
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopLoop();
    if (this.#combatEventUnsubscribe) {
      this.#combatEventUnsubscribe();
    }
  }

  #beginLoop() {
    const loop = (timestamp) => {
      this.#tick(timestamp);
      this.#raf = requestAnimationFrame(loop);
    };
    this.#raf = requestAnimationFrame(loop);
  }

  #stopLoop() {
    if (this.#raf) {
      cancelAnimationFrame(this.#raf);
      this.#raf = undefined;
    }
  }

  #tick(timestamp) {
    if (!this.game || this.game.phase !== 'battle') return;
    this.game = applyTick(this.game, timestamp);
  }

  #startMatch() {
    const now = currentTime();
    const base = createInitialState(now);
    this.game = startMatch(base, now);
    this.selectedLane = this.game.activeTerrain;
    combatEvents.clear();
    this.currentView = 'practice';
  }

  #returnToMenu() {
    this.game = createInitialState(currentTime());
    this.selectedLane = this.game.activeTerrain;
    this.currentView = 'menu';
  }

  #setView(view) {
    this.currentView = view;
    if (view === 'practice' && this.game.phase !== 'battle') {
      this.#startMatch();
    }
  }

  #handleLaneSelected(event) {
    const { lane } = event.detail;
    this.selectedLane = lane;
    // Show lane composition when lane is selected
    this.laneCompositionLane = lane;
    this.showLaneComposition = true;
  }

  #handleCloseLaneComposition() {
    this.showLaneComposition = false;
    this.laneCompositionLane = '';
  }

  #handlePlayCard(event) {
    if (!this.game || this.game.phase !== 'battle') return;
    const { cardId } = event.detail;
    const lane = this.selectedLane ?? this.game.activeTerrain;
    const now = currentTime();
    if (!canPlayCard(this.game, cardId)) return;
    this.game = playCard(this.game, { cardId, lane, timestamp: now });
    this.game = drawCard(this.game);
  }

  #handleDrawCard() {
    if (!this.game || this.game.phase !== 'battle') return;
    this.game = drawCard(this.game);
  }

  #handleMeditate(event) {
    if (!this.game || this.game.phase !== 'battle') return;
    const { cardId } = event.detail;
    const now = currentTime();
    if (!canMeditate(this.game, now)) return;
    
    const result = meditate(this.game, { cardId, timestamp: now });
    if (result.success) {
      this.game = result.state;
    }
  }

  #handleActivateJutsu(event) {
    if (!this.game || this.game.phase !== 'battle') return;
    const { windowId, jutsuId, timestamp } = event.detail;
    const now = timestamp ?? currentTime();
    
    try {
      this.game = playReactiveJutsu(this.game, { windowId, jutsuId, timestamp: now });
    } catch (error) {
      console.warn('Failed to activate reactive jutsu:', error);
    }
  }

  render() {
    return html`
      <div class="app-shell">
        <header>
          <div>
            <span class="badge">Prototype</span>
            <h1>Ninja Clan Wars</h1>
          </div>
          ${this.currentView === 'practice' ? html`
            <button class="primary" @click=${() => this.#returnToMenu()}>
              ← Menu
            </button>
          ` : ''}
        </header>
        <main>
          ${this.currentView === 'menu' ? this.#renderMenu() : ''}
          ${this.currentView === 'practice' ? this.#renderGame() : ''}
          ${this.currentView === 'ranked' ? this.#renderRanked() : ''}
          ${this.currentView === 'history' ? this.#renderHistory() : ''}
        </main>
        ${this.currentView === 'practice' ? html`
          <footer>
            <ninja-chakra-meter
              .current=${this.game.chakra.current}
              .max=${this.game.chakra.max}
              .overflow=${this.game.chakra.overflowMax}
              .overheatPenalty=${this.game.chakra.overheatPenalty ?? 0}
            ></ninja-chakra-meter>
          </footer>
        ` : ''}
        
        <!-- Lane Composition Modal -->
        <ninja-lane-composition
          ?open=${this.showLaneComposition}
          .lane=${this.laneCompositionLane}
          .gameState=${this.game}
          @close=${() => this.#handleCloseLaneComposition()}
        ></ninja-lane-composition>

        <!-- Reactive Jutsu Window -->
        <ninja-reactive-jutsu-window
          .gameState=${this.game}
          .currentTime=${currentTime()}
          @activate-jutsu=${(event) => this.#handleActivateJutsu(event)}
        ></ninja-reactive-jutsu-window>
      </div>
    `;
  }

  #renderMenu() {
    return html`
      <section class="surface">
        <div class="nav-tabs">
          <button 
            class="nav-tab ${this.currentView === 'menu' ? 'active' : ''}"
            @click=${() => this.#setView('menu')}
          >
            🏠 Main Menu
          </button>
          <button 
            class="nav-tab"
            @click=${() => this.#setView('ranked')}
          >
            🏆 Ranked
          </button>
          <button 
            class="nav-tab"
            @click=${() => this.#setView('history')}
          >
            📊 History
          </button>
        </div>

        <div class="menu-grid">
          <div class="menu-card" @click=${() => this.#setView('practice')}>
            <h3>🥷 Practice Mode</h3>
            <p>Train your ninja skills against AI opponents. Perfect your combos and master terrain strategies.</p>
          </div>
          
          <div class="menu-card" @click=${() => this.#setView('ranked')}>
            <h3>🏆 Ranked Queue</h3>
            <p>Test your abilities in competitive matches. Climb the ninja ranks and prove your mastery.</p>
          </div>
          
          <div class="menu-card" @click=${() => this.#setView('history')}>
            <h3>📊 Match History</h3>
            <p>Review your past battles, analyze your performance, and track your progression.</p>
          </div>
        </div>
      </section>
    `;
  }

  #renderGame() {
    return html`
      <section class="surface">
        <ninja-battle-canvas
          .state=${this.game}
          .selectedLane=${this.selectedLane}
          @exit=${() => this.#returnToMenu()}
          @lane-selected=${(event) => this.#handleLaneSelected(event)}
        ></ninja-battle-canvas>
      </section>
      <section class="surface meta">
        ${this.#renderMeta()}
      </section>
      <section class="surface">
        <h3>Combat Events</h3>
        <ninja-combat-log .events=${this.combatEvents}></ninja-combat-log>
      </section>
      <section class="surface">
        <div class="actions">
          <button class="primary" @click=${() => this.#handleDrawCard()}>
            Draw
          </button>
        </div>
        <ninja-hand
          .cards=${this.game.hand}
          .canPlay=${(cardId) => canPlayCard(this.game, cardId)}
          .canMeditate=${() => canMeditate(this.game, currentTime())}
          @play-card=${(event) => this.#handlePlayCard(event)}
          @meditate=${(event) => this.#handleMeditate(event)}
        ></ninja-hand>
      </section>
    `;
  }

  #renderRanked() {
    return html`
      <section class="surface">
        <div class="nav-tabs">
          <button 
            class="nav-tab"
            @click=${() => this.#setView('menu')}
          >
            🏠 Main Menu
          </button>
          <button 
            class="nav-tab ${this.currentView === 'ranked' ? 'active' : ''}"
            @click=${() => this.#setView('ranked')}
          >
            🏆 Ranked
          </button>
          <button 
            class="nav-tab"
            @click=${() => this.#setView('history')}
          >
            📊 History
          </button>
        </div>

        <ninja-ranked-queue
          .playerId=${this.playerId}
          @queue-joined=${(event) => this.#handleQueueJoined(event)}
          @queue-left=${(event) => this.#handleQueueLeft(event)}
          @match-accepted=${(event) => this.#handleMatchAccepted(event)}
          @match-declined=${(event) => this.#handleMatchDeclined(event)}
        ></ninja-ranked-queue>
      </section>
    `;
  }

  #renderHistory() {
    return html`
      <section class="surface">
        <div class="nav-tabs">
          <button 
            class="nav-tab"
            @click=${() => this.#setView('menu')}
          >
            🏠 Main Menu
          </button>
          <button 
            class="nav-tab"
            @click=${() => this.#setView('ranked')}
          >
            🏆 Ranked
          </button>
          <button 
            class="nav-tab ${this.currentView === 'history' ? 'active' : ''}"
            @click=${() => this.#setView('history')}
          >
            📊 History
          </button>
        </div>

        <ninja-match-history .playerId=${this.playerId}></ninja-match-history>
      </section>
    `;
  }

  #handleQueueJoined(event) {
    console.log('Player joined queue:', event.detail);
  }

  #handleQueueLeft(event) {
    console.log('Player left queue:', event.detail);
  }

  #handleMatchAccepted(event) {
    console.log('Match accepted:', event.detail);
    // In a real implementation, this would start the ranked match
    this.#setView('practice'); // For now, go to practice mode
  }

  #handleMatchDeclined(event) {
    console.log('Match declined:', event.detail);
  }

  #renderMeta() {
    const activeTerrain = terrains.find((t) => t.id === this.game.activeTerrain);
    const featuredCard = this.game.deck[0];
    const timeLeft = Math.max(0, Math.floor(this.game.clock.remainingSeconds ?? 0));
    const combosMap = new Map((this.game.combos ?? []).map((combo) => [combo.id, combo]));
    const history = this.game.comboState?.history ?? [];
    const lastComboEntry = history.length ? history[history.length - 1] : null;
    const lastComboName = lastComboEntry
      ? combosMap.get(lastComboEntry.comboId)?.name ?? lastComboEntry.comboId
      : '—';
    const pendingCount = this.game.comboState?.pending?.length ?? 0;
    return html`
      <div class="meta-row">
        <span>Phase</span>
        <strong>${this.game.phase}</strong>
      </div>
      <div class="meta-row">
        <span>Active Terrain</span>
        <strong>${activeTerrain?.name ?? 'Unknown'}</strong>
      </div>
      <div class="meta-row">
        <span>Selected Lane</span>
        <strong>${(this.selectedLane ?? this.game.activeTerrain).toUpperCase()}</strong>
      </div>
      <div class="meta-row">
        <span>Chakra Overflow</span>
        <strong>${this.game.chakra.overflowMax}</strong>
      </div>
      <div class="meta-row">
        <span>Combos Triggered</span>
        <strong>${this.game.stats?.combos ?? 0}</strong>
      </div>
      <div class="meta-row">
        <span>Combo Queue</span>
        <strong>${pendingCount}</strong>
      </div>
      <div class="meta-row">
        <span>Last Combo</span>
        <strong>${lastComboName}</strong>
      </div>
      <div class="meta-row">
        <span>Deck Remaining</span>
        <strong>${this.game.deck.length}</strong>
      </div>
      <div class="meta-row">
        <span>Time Left</span>
        <strong>${timeLeft}s</strong>
      </div>
      ${featuredCard
        ? html`<ninja-card-frame
            name=${featuredCard.name}
            school=${featuredCard.school}
            cost=${featuredCard.cost}
            attack=${featuredCard.attack}
            health=${featuredCard.health}
            ability=${featuredCard.ability}
          ></ninja-card-frame>`
        : html`<small>No cards loaded yet.</small>`}
    `;
  }
}

customElements.define('ninja-clan-wars-app', NinjaClanWarsApp);

function currentTime() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}
