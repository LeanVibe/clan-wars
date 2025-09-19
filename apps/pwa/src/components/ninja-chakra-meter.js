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
  `;

  static properties = {
    current: { type: Number },
    max: { type: Number },
    overflow: { type: Number }
  };

  constructor() {
    super();
    this.current = 0;
    this.max = 0;
    this.overflow = 0;
  }

  render() {
    const maxValue = this.max || 1;
    const overflowCap = this.overflow > this.max ? this.overflow : this.max;
    const fillPercent = Math.min(this.current / overflowCap, 1);
    const overflowMarker = this.max / overflowCap;

    return html`
      <span>Chakra ${Math.floor(this.current)}/${this.max}</span>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax=${overflowCap} aria-valuenow=${this.current}>
        <div class="fill" style="width: ${fillPercent * 100}%"></div>
        <div class="overflow" style="left: ${overflowMarker * 100}%"></div>
      </div>
    `;
  }
}

customElements.define('ninja-chakra-meter', NinjaChakraMeter);
