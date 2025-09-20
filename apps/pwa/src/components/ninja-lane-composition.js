import { LitElement, css, html } from 'lit';

export class NinjeLaneComposition extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-normal), visibility var(--transition-normal);
    }

    :host([open]) {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: transform var(--transition-normal);
    }

    :host([open]) .modal {
      transform: scale(1);
    }

    .header {
      padding: var(--space-16);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h2 {
      margin: 0;
      font-size: var(--font-size-lg);
      color: var(--color-text);
      text-transform: capitalize;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 4px;
      border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }

    .close-btn:hover {
      color: var(--color-text);
    }

    .content {
      padding: var(--space-16);
    }

    .team-section {
      margin-bottom: var(--space-16);
    }

    .team-section:last-child {
      margin-bottom: 0;
    }

    .team-title {
      font-size: var(--font-size-md);
      font-weight: 600;
      margin-bottom: var(--space-8);
      padding: var(--space-6) var(--space-8);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: var(--space-6);
    }

    .team-title.player {
      background: rgba(56, 189, 248, 0.15);
      color: rgba(56, 189, 248, 0.95);
    }

    .team-title.ai {
      background: rgba(248, 113, 113, 0.15);
      color: rgba(248, 113, 113, 0.95);
    }

    .unit-list {
      display: grid;
      gap: var(--space-8);
    }

    .unit-card {
      background: rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(248, 250, 252, 0.1);
      border-radius: var(--radius-md);
      padding: var(--space-12);
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-8);
      align-items: center;
    }

    .unit-info {
      display: grid;
      gap: var(--space-4);
    }

    .unit-name {
      font-weight: 500;
      color: var(--color-text);
      font-size: var(--font-size-sm);
    }

    .unit-stats {
      display: flex;
      gap: var(--space-12);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .stat-icon {
      width: 12px;
      height: 12px;
    }

    .unit-position {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      background: rgba(71, 85, 105, 0.3);
      padding: 2px 6px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .empty-lane {
      text-align: center;
      color: var(--color-text-muted);
      font-style: italic;
      padding: var(--space-16);
    }

    .lane-stats {
      background: rgba(71, 85, 105, 0.2);
      border-radius: var(--radius-sm);
      padding: var(--space-12);
      margin-bottom: var(--space-16);
    }

    .lane-stats-title {
      font-size: var(--font-size-sm);
      font-weight: 500;
      margin-bottom: var(--space-8);
      color: var(--color-text);
    }

    .lane-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-8);
      font-size: var(--font-size-xs);
    }

    .lane-stat {
      display: flex;
      justify-content: space-between;
    }

    .stronghold-status {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-top: var(--space-8);
      text-align: center;
    }
  `;

  static properties = {
    open: { type: Boolean, reflect: true },
    lane: { type: String },
    gameState: { type: Object }
  };

  constructor() {
    super();
    this.open = false;
    this.lane = '';
    this.gameState = null;
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close'));
  }

  _handleBackdropClick(event) {
    if (event.target === this) {
      this.close();
    }
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown.bind(this));
  }

  getLaneData() {
    if (!this.gameState || !this.lane) return null;
    
    const playerUnits = this.gameState.battlefield[this.lane]?.player || [];
    const aiUnits = this.gameState.battlefield[this.lane]?.ai || [];
    const playerStronghold = this.gameState.strongholds[this.lane]?.player || { health: 10, maxHealth: 10 };
    const aiStronghold = this.gameState.strongholds[this.lane]?.ai || { health: 10, maxHealth: 10 };

    return {
      playerUnits,
      aiUnits,
      playerStronghold,
      aiStronghold,
      totalUnits: playerUnits.length + aiUnits.length
    };
  }

  renderUnit(unit, index) {
    return html`
      <div class="unit-card">
        <div class="unit-info">
          <div class="unit-name">${unit.name}</div>
          <div class="unit-stats">
            <div class="stat">
              <span class="stat-icon">⚔️</span>
              <span>${unit.attack}</span>
            </div>
            <div class="stat">
              <span class="stat-icon">❤️</span>
              <span>${unit.health}/${unit.maxHealth || unit.health}</span>
            </div>
            ${unit.cost ? html`
              <div class="stat">
                <span class="stat-icon">💎</span>
                <span>${unit.cost}</span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="unit-position">
          Pos ${index + 1}
        </div>
      </div>
    `;
  }

  renderTeamSection(title, units, className) {
    return html`
      <div class="team-section">
        <div class="team-title ${className}">
          <span>${className === 'player' ? '🥷' : '🤖'}</span>
          ${title} (${units.length})
        </div>
        <div class="unit-list">
          ${units.length > 0 
            ? units.map((unit, index) => this.renderUnit(unit, index))
            : html`<div class="empty-lane">No units deployed</div>`
          }
        </div>
      </div>
    `;
  }

  render() {
    if (!this.open || !this.gameState || !this.lane) {
      return html``;
    }

    const laneData = this.getLaneData();
    if (!laneData) {
      return html``;
    }

    const { playerUnits, aiUnits, playerStronghold, aiStronghold, totalUnits } = laneData;

    return html`
      <div class="modal" @click=${this._handleBackdropClick}>
        <div class="modal" @click=${(e) => e.stopPropagation()}>
          <div class="header">
            <h2>${this.lane} Lane</h2>
            <button class="close-btn" @click=${this.close}>×</button>
          </div>
          <div class="content">
            <div class="lane-stats">
              <div class="lane-stats-title">Lane Overview</div>
              <div class="lane-stats-grid">
                <div class="lane-stat">
                  <span>Total Units:</span>
                  <strong>${totalUnits}</strong>
                </div>
                <div class="lane-stat">
                  <span>Player Units:</span>
                  <strong>${playerUnits.length}</strong>
                </div>
                <div class="lane-stat">
                  <span>AI Units:</span>
                  <strong>${aiUnits.length}</strong>
                </div>
                <div class="lane-stat">
                  <span>Battle Active:</span>
                  <strong>${totalUnits > 0 ? 'Yes' : 'No'}</strong>
                </div>
              </div>
              <div class="stronghold-status">
                Player Stronghold: ${playerStronghold.health}/${playerStronghold.maxHealth} HP | 
                AI Stronghold: ${aiStronghold.health}/${aiStronghold.maxHealth} HP
              </div>
            </div>

            ${this.renderTeamSection('Player Forces', playerUnits, 'player')}
            ${this.renderTeamSection('AI Forces', aiUnits, 'ai')}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('ninja-lane-composition', NinjeLaneComposition);