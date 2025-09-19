import { LitElement, css, html } from 'lit';
import '@clan-wars/ui-components';

export class NinjaHand extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .hand-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--space-12);
    }

    button.card {
      all: unset;
      cursor: pointer;
      display: block;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }

    button.card:focus-visible {
      outline: 2px solid var(--color-primary);
    }

    button.card.playable:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    button.card.unplayable {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  static properties = {
    cards: { type: Array },
    canPlay: { attribute: false }
  };

  constructor() {
    super();
    this.cards = [];
    this.canPlay = () => true;
  }

  #play(cardId) {
    this.dispatchEvent(
      new CustomEvent('play-card', {
        detail: { cardId },
        bubbles: true,
        composed: true
      })
    );
  }

  render() {
    if (!this.cards.length) {
      return html`<p style="color: var(--color-text-muted); font-size: var(--font-size-sm); text-align: center;" data-testid="empty-hand">
        No cards in hand. Tap Draw to pull from your deck.
      </p>`;
    }

    return html`
      <div class="hand-grid">
        ${this.cards.map((card) => {
          const playable = this.canPlay(card.id);
          return html`
            <button
              class="card ${playable ? 'playable' : 'unplayable'}"
              @click=${() => playable && this.#play(card.id)}
              aria-disabled=${!playable}
              data-school=${card.school}
              data-card-id=${card.id}
              data-testid="hand-card"
            >
              <ninja-card-frame
                name=${card.name}
                school=${card.school}
                cost=${card.cost}
                attack=${card.attack}
                health=${card.health}
                ability=${card.ability}
              ></ninja-card-frame>
            </button>
          `;
        })}
      </div>
    `;
  }
}

customElements.define('ninja-hand', NinjaHand);
