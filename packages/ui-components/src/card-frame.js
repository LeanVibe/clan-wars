import { LitElement, css, html } from 'lit';

export class NinjaCardFrame extends LitElement {
  static styles = css`
    :host {
      display: block;
      border-radius: 18px;
      padding: 12px;
      background: linear-gradient(140deg, rgba(30, 154, 176, 0.16), rgba(15, 23, 42, 0.8));
      border: 1px solid rgba(248, 250, 252, 0.08);
      min-width: 140px;
      box-shadow: 0 24px 36px rgba(3, 7, 18, 0.35);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }

    .name {
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(248, 250, 252, 0.08);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .stat-line {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      font-size: 0.9rem;
    }

    .ability {
      margin-top: 12px;
      font-size: 0.8rem;
      color: rgba(248, 250, 252, 0.7);
      line-height: 1.4;
    }
  `;

  static properties = {
    name: { type: String },
    school: { type: String },
    cost: { type: Number },
    attack: { type: Number },
    health: { type: Number },
    ability: { type: String }
  };

  constructor() {
    super();
    this.name = '';
    this.school = 'Ninjutsu';
    this.cost = 0;
    this.attack = 0;
    this.health = 0;
    this.ability = '';
  }

  render() {
    return html`
      <div class="header">
        <span class="name">${this.name}</span>
        <span class="badge">${this.school}</span>
      </div>
      <slot name="art"></slot>
      <div class="stat-line">
        <span>Cost ${this.cost}</span>
        <span>${this.attack}/${this.health}</span>
      </div>
      <div class="ability">${this.ability}</div>
    `;
  }
}

customElements.define('ninja-card-frame', NinjaCardFrame);
