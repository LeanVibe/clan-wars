import { LitElement, css, html } from 'lit';

export class NinjaCombatLog extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 200px;
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(248, 250, 252, 0.1);
      border-radius: var(--radius-md);
      padding: var(--space-8);
    }

    .log-entry {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      padding: 4px 0;
      font-size: var(--font-size-sm);
      line-height: 1.3;
      border-bottom: 1px solid rgba(248, 250, 252, 0.05);
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .timestamp {
      color: rgba(148, 163, 184, 0.7);
      font-size: var(--font-size-xs);
      min-width: 40px;
    }

    .icon {
      font-size: 16px;
      min-width: 20px;
      text-align: center;
    }

    .message {
      flex: 1;
    }

    .damage {
      color: rgba(248, 113, 113, 0.95);
    }

    .heal {
      color: rgba(34, 197, 94, 0.95);
    }

    .death {
      color: rgba(239, 68, 68, 0.95);
      font-weight: 600;
    }

    .spawn {
      color: rgba(59, 130, 246, 0.95);
    }

    .combo {
      color: rgba(168, 85, 247, 0.95);
      font-weight: 600;
    }

    .stronghold {
      color: rgba(245, 158, 11, 0.95);
      font-weight: 600;
    }

    .terrain {
      color: rgba(14, 165, 233, 0.95);
      font-weight: 600;
    }

    .unit-name {
      font-weight: 500;
      color: rgba(248, 250, 252, 0.9);
    }

    .player-unit {
      color: rgba(56, 189, 248, 0.95);
    }

    .ai-unit {
      color: rgba(248, 113, 113, 0.95);
    }

    .lane-tag {
      background: rgba(71, 85, 105, 0.3);
      padding: 2px 6px;
      border-radius: 999px;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .lane-mountain { background: rgba(217, 119, 6, 0.3); }
    .lane-forest { background: rgba(34, 197, 94, 0.3); }
    .lane-river { background: rgba(56, 189, 248, 0.3); }

    .empty-state {
      text-align: center;
      color: rgba(148, 163, 184, 0.7);
      font-style: italic;
      margin-top: var(--space-16);
    }
  `;

  static properties = {
    events: { type: Array }
  };

  constructor() {
    super();
    this.events = [];
  }

  updated() {
    // Auto-scroll to bottom when new events are added
    this.scrollTop = this.scrollHeight;
  }

  formatTime(timestamp) {
    const seconds = Math.floor(timestamp / 1000) % 60;
    return `${seconds}s`;
  }

  getEventIcon(event) {
    const icons = {
      damage: '⚔️',
      heal: '💚',
      death: '💀',
      spawn: '✨',
      combo: '🌟',
      stronghold: '🏰',
      terrain: '🌍',
      meditate: '🧘',
      reactive: '⚡'
    };
    return icons[event.type] || '📝';
  }

  renderEvent(event) {
    const icon = this.getEventIcon(event);
    const time = this.formatTime(event.timestamp);
    
    return html`
      <div class="log-entry">
        <span class="timestamp">${time}</span>
        <span class="icon">${icon}</span>
        <div class="message ${event.type}">
          ${this.formatEventMessage(event)}
        </div>
      </div>
    `;
  }

  formatEventMessage(event) {
    const { type, data } = event;
    
    switch (type) {
      case 'damage':
        return html`
          <span class="unit-name ${data.attacker.owner === 'player' ? 'player-unit' : 'ai-unit'}">
            ${data.attacker.name}
          </span>
          deals <strong>${data.damage}</strong> damage to
          <span class="unit-name ${data.target.owner === 'player' ? 'player-unit' : 'ai-unit'}">
            ${data.target.name}
          </span>
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
        `;
        
      case 'heal':
        return html`
          <span class="unit-name ${data.target.owner === 'player' ? 'player-unit' : 'ai-unit'}">
            ${data.target.name}
          </span>
          heals <strong>${data.amount}</strong> HP
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
        `;
        
      case 'death':
        return html`
          <span class="unit-name ${data.unit.owner === 'player' ? 'player-unit' : 'ai-unit'}">
            ${data.unit.name}
          </span>
          is defeated
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
        `;
        
      case 'spawn':
        return html`
          <span class="unit-name ${data.unit.owner === 'player' ? 'player-unit' : 'ai-unit'}">
            ${data.unit.name}
          </span>
          enters the battlefield
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
        `;
        
      case 'combo':
        return html`
          <strong>${data.comboName}</strong> activated
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
        `;
        
      case 'stronghold':
        return html`
          ${data.owner === 'player' ? 'Player' : 'AI'} stronghold takes <strong>${data.damage}</strong> damage
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
          (${data.remainingHealth}/${data.maxHealth} HP)
        `;
        
      case 'terrain':
        return html`
          Terrain rotated to <strong>${data.terrainName}</strong>
        `;
        
      case 'meditate':
        return html`
          Player meditates: discarded <strong>${data.discardedCard}</strong>, gained <strong>+1 chakra</strong>
        `;
        
      case 'reactive':
        return html`
          <strong>${data.jutsuName}</strong> activated!
          <span class="lane-tag lane-${data.lane}">${data.lane}</span>
        `;
        
      default:
        return html`${event.message || 'Unknown event'}`;
    }
  }

  render() {
    if (!this.events.length) {
      return html`
        <div class="empty-state">
          Combat events will appear here...
        </div>
      `;
    }

    return html`
      ${this.events.map(event => this.renderEvent(event))}
    `;
  }
}

customElements.define('ninja-combat-log', NinjaCombatLog);