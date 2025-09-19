import { LitElement, css, html } from 'lit';
import { createInitialState, terrains, startMatch, applyTick, playCard, canPlayCard, drawCard } from '@clan-wars/game-core';
import './ninja-battle-canvas';
import './ninja-hand';
import './ninja-chakra-meter';
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
  `;

  static properties = {
    game: { state: true },
    selectedLane: { state: true }
  };

  #raf;

  constructor() {
    super();
    this.game = createInitialState(currentTime());
    this.selectedLane = this.game.activeTerrain;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#beginLoop();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopLoop();
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
  }

  #returnToMenu() {
    this.game = createInitialState(currentTime());
    this.selectedLane = this.game.activeTerrain;
  }

  #handleLaneSelected(event) {
    const { lane } = event.detail;
    this.selectedLane = lane;
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

  render() {
    const rotationCountdown = Math.max(
      0,
      Math.round((this.game.nextTerrainAt - currentTime()) / 1000)
    );
    return html`
      <div class="app-shell">
        <header>
          <div>
            <span class="badge">Prototype</span>
            <h1>Ninja Clan Wars</h1>
          </div>
          <button class="primary" @click=${() => this.#startMatch()}>
            ${this.game.phase === 'battle' ? 'Restart' : 'Start Match'}
          </button>
        </header>
        <main>
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
            <div class="actions">
              <button class="primary" @click=${() => this.#handleDrawCard()}>
                Draw
              </button>
            </div>
            <ninja-hand
              .cards=${this.game.hand}
              .canPlay=${(cardId) => canPlayCard(this.game, cardId)}
              @play-card=${(event) => this.#handlePlayCard(event)}
            ></ninja-hand>
          </section>
        </main>
        <footer>
          <small>Terrain rotation in ${rotationCountdown}s</small>
          <ninja-chakra-meter
            .current=${this.game.chakra.current}
            .max=${this.game.chakra.max}
            .overflow=${this.game.chakra.overflowMax}
          ></ninja-chakra-meter>
        </footer>
      </div>
    `;
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
