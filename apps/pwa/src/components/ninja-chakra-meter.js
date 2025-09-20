import { LitElement, css, html } from 'lit';

export class NinjaChakraMeter extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-6);
      font-size: var(--font-size-sm);
      color: var(--color-text);
    }

    .bar {
      position: relative;
      width: 160px;
      height: 10px;
      border-radius: var(--radius-pill);
      background: rgba(248, 250, 252, 0.12);
      overflow: hidden;
    }

    .fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: linear-gradient(90deg, #34d399, #0ea5e9);
      transition: width var(--transition-medium);
    }

    .overflow {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: 2px;
      background: rgba(248, 250, 252, 0.6);
    }

    .overheat-warning {
      color: rgba(248, 113, 113, 0.9);
      font-weight: 600;
      animation: pulse-warning 1s ease-in-out infinite alternate;
    }

    @keyframes pulse-warning {
      0% {
        opacity: 0.7;
      }
      100% {
        opacity: 1;
      }
    }

    .fill.overheated {
      background: linear-gradient(90deg, #f97316, #ef4444);
      animation: overheat-glow 0.8s ease-in-out infinite alternate;
    }

    @keyframes overheat-glow {
      0% {
        box-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
      }
      100% {
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
      }
    }
  `;

  static properties = {
    current: { type: Number },
    max: { type: Number },
    overflow: { type: Number },
    overheatPenalty: { type: Number }
  };

  constructor() {
    super();
    this.current = 0;
    this.max = 0;
    this.overflow = 0;
    this.overheatPenalty = 0;
  }

  render() {
    const maxValue = this.max || 1;
    const overflowCap = this.overflow > this.max ? this.overflow : this.max;
    const fillPercent = Math.min(this.current / overflowCap, 1);
    const overflowMarker = this.max / overflowCap;
    const isOverheated = this.overheatPenalty > 0;
    const isAtOverflowCap = this.current >= overflowCap;

    const chakraClasses = isOverheated ? 'overheat-warning' : '';
    const fillClasses = isOverheated ? 'fill overheated' : 'fill';

    return html`
      <span class="${chakraClasses}">
        Chakra ${Math.floor(this.current)}/${this.max}
        ${isOverheated ? html` ⚠️ +${Math.round(this.overheatPenalty)} cost` : ''}
      </span>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax=${overflowCap} aria-valuenow=${this.current}>
        <div class="${fillClasses}" style="width: ${fillPercent * 100}%"></div>
        <div class="overflow" style="left: ${overflowMarker * 100}%"></div>
      </div>
    `;
  }
}

customElements.define('ninja-chakra-meter', NinjaChakraMeter);
