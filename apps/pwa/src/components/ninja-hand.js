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

    .meditate-controls {
      display: flex;
      justify-content: center;
      gap: var(--space-8);
      margin-bottom: var(--space-12);
      padding: var(--space-8);
      background: rgba(15, 23, 42, 0.7);
      border-radius: var(--radius-md);
    }

    .meditate-mode .hand-grid {
      opacity: 0.8;
    }

    .meditate-mode button.card {
      border: 2px solid transparent;
    }

    .meditate-mode button.card:hover {
      border-color: rgba(250, 204, 21, 0.6);
      box-shadow: 0 0 12px rgba(250, 204, 21, 0.3);
    }

    .meditate-mode button.card.selected {
      border-color: rgba(250, 204, 21, 0.9);
      box-shadow: 0 0 16px rgba(250, 204, 21, 0.5);
      transform: translateY(-2px);
    }

    .meditate-button {
      background: rgba(250, 204, 21, 0.25);
      border: 1px solid rgba(250, 204, 21, 0.4);
      color: rgba(253, 224, 71, 0.95);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .meditate-button:hover {
      background: rgba(250, 204, 21, 0.35);
      transform: translateY(-1px);
    }

    .meditate-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .cancel-button {
      background: rgba(71, 85, 105, 0.25);
      border: 1px solid rgba(71, 85, 105, 0.4);
      color: rgba(203, 213, 225, 0.95);
    }
  `;

  static properties = {
    cards: { type: Array },
    canPlay: { attribute: false },
    canMeditate: { attribute: false }
  };

  constructor() {
    super();
    this.cards = [];
    this.canPlay = () => true;
    this.canMeditate = () => false;
    this.meditateMode = false;
  }

  #play(cardId) {
    if (this.meditateMode) {
      this.selectedCardId = this.selectedCardId === cardId ? null : cardId;
      this.requestUpdate();
      return;
    }

    this.dispatchEvent(
      new CustomEvent('play-card', {
        detail: { cardId },
        bubbles: true,
        composed: true
      })
    );
  }

  #startMeditate() {
    this.meditateMode = true;
    this.selectedCardId = null;
    this.requestUpdate();
  }

  #cancelMeditate() {
    this.meditateMode = false;
    this.selectedCardId = null;
    this.requestUpdate();
  }

  #confirmMeditate() {
    if (!this.selectedCardId) return;

    this.dispatchEvent(
      new CustomEvent('meditate', {
        detail: { cardId: this.selectedCardId },
        bubbles: true,
        composed: true
      })
    );

    this.meditateMode = false;
    this.selectedCardId = null;
    this.requestUpdate();
  }

  render() {
    if (!this.cards.length) {
      const canMed = this.canMeditate();
      return html`
        <div>
          <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); text-align: center;" data-testid="empty-hand">
            No cards in hand. Tap Draw to pull from your deck.
          </p>
          ${canMed ? html`
            <div style="text-align: center; margin-top: var(--space-8);">
              <p style="color: var(--color-text-muted); font-size: var(--font-size-xs);">
                Need cards to meditate.
              </p>
            </div>
          ` : ''}
        </div>
      `;
    }

    const canMed = this.canMeditate();
    const containerClasses = this.meditateMode ? 'meditate-mode' : '';

    return html`
      <div class="${containerClasses}">
        ${!this.meditateMode && canMed ? html`
          <div class="meditate-controls">
            <button 
              class="meditate-button" 
              @click=${this.#startMeditate}
              title="Discard 1 card to draw 1 card (+1 chakra, 5s cooldown)"
            >
              Meditate
            </button>
          </div>
        ` : ''}

        ${this.meditateMode ? html`
          <div class="meditate-controls">
            <p style="color: var(--color-text); margin: 0;">Select a card to discard for meditation:</p>
            <button 
              class="meditate-button" 
              @click=${this.#confirmMeditate}
              ?disabled=${!this.selectedCardId}
            >
              Confirm (+1 Chakra)
            </button>
            <button 
              class="meditate-button cancel-button" 
              @click=${this.#cancelMeditate}
            >
              Cancel
            </button>
          </div>
        ` : ''}

        <div class="hand-grid">
          ${this.cards.map((card) => {
            const playable = !this.meditateMode && this.canPlay(card.id);
            const selectable = this.meditateMode;
            const selected = this.meditateMode && this.selectedCardId === card.id;
            
            let cardClasses = 'card';
            if (this.meditateMode) {
              cardClasses += selected ? ' selected' : '';
            } else {
              cardClasses += playable ? ' playable' : ' unplayable';
            }

            return html`
              <button
                class="${cardClasses}"
                @click=${() => (selectable || playable) && this.#play(card.id)}
                aria-disabled=${!playable && !selectable}
                data-school=${card.school}
                data-card-id=${card.id}
                data-testid="hand-card"
                title=${this.meditateMode ? 'Click to select for meditation' : ''}
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
      </div>
    `;
  }
}

customElements.define('ninja-hand', NinjaHand);
