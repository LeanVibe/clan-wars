import { LitElement, css, html } from 'lit';
import '@clan-wars/ui-components';

export class NinjaHand extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .hand-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--space-16);
      padding: var(--space-8);
    }

    /* Mobile-first responsive card sizing */
    @media (max-width: 768px) {
      .hand-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-20);
        padding: var(--space-12);
      }
    }

    @media (max-width: 480px) {
      .hand-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--space-24);
        padding: var(--space-16);
      }
    }

    button.card {
      all: unset;
      cursor: pointer;
      display: block;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
      border-radius: var(--radius-lg);
      /* Improved touch target */
      min-height: 44px; /* iOS recommended minimum */
      position: relative;
      overflow: hidden;
    }

    button.card:focus-visible {
      outline: 3px solid var(--color-primary);
      outline-offset: 2px;
    }

    /* Enhanced mobile touch feedback */
    button.card.playable:hover,
    button.card.playable:active {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    /* Mobile touch states */
    @media (hover: none) and (pointer: coarse) {
      button.card.playable:active {
        transform: scale(0.98) translateY(-2px);
        box-shadow: var(--shadow-lg);
        transition: transform 0.1s ease-out;
      }
    }

    button.card.unplayable {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Touch ripple effect */
    button.card::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.3s ease-out, height 0.3s ease-out;
      pointer-events: none;
      opacity: 0;
    }

    button.card.playable:active::after {
      width: 100%;
      height: 100%;
      opacity: 1;
      transition: width 0.1s ease-out, height 0.1s ease-out, opacity 0.1s ease-out;
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
    // Haptic feedback for mobile devices
    this.#triggerHapticFeedback('light');

    if (this.meditateMode) {
      this.selectedCardId = this.selectedCardId === cardId ? null : cardId;
      this.requestUpdate();
      return;
    }

    // Stronger haptic feedback for actual card play
    this.#triggerHapticFeedback('medium');

    this.dispatchEvent(
      new CustomEvent('play-card', {
        detail: { cardId },
        bubbles: true,
        composed: true
      })
    );
  }

  #startMeditate() {
    this.#triggerHapticFeedback('light');
    this.meditateMode = true;
    this.selectedCardId = null;
    this.requestUpdate();
  }

  #cancelMeditate() {
    this.#triggerHapticFeedback('light');
    this.meditateMode = false;
    this.selectedCardId = null;
    this.requestUpdate();
  }

  #confirmMeditate() {
    if (!this.selectedCardId) return;

    // Success haptic feedback for meditation
    this.#triggerHapticFeedback('success');

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

  #triggerHapticFeedback(intensity = 'light') {
    // Check if vibration API is supported
    if (!navigator.vibrate) return;

    // Define vibration patterns for different intensities
    const patterns = {
      light: 10,      // Brief tap for selection/hover
      medium: [50],   // Single vibration for card play
      heavy: [100, 50, 100], // Pattern for special actions like combos
      success: [30, 20, 30, 20, 30], // Success pattern for meditation
      error: [200, 100, 200] // Error pattern for invalid plays
    };

    const pattern = patterns[intensity] || patterns.light;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if vibration is not available or permission denied
      console.debug('Haptic feedback unavailable:', error.message);
    }
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
