import { LitElement, css, html } from 'lit';
import { getActiveReactiveWindows, reactiveJutsu } from '@clan-wars/game-core';

export class NinjaReactiveJutsuWindow extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-fast), visibility var(--transition-fast);
    }

    :host([active]) {
      opacity: 1;
      visibility: visible;
    }

    .reactive-window {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(236, 72, 153, 0.95));
      border: 2px solid rgba(248, 250, 252, 0.2);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      padding: var(--space-16);
      min-width: 300px;
      text-align: center;
      backdrop-filter: blur(8px);
      animation: pulse-glow 0.5s ease-in-out infinite alternate;
    }

    @keyframes pulse-glow {
      0% {
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.6), var(--shadow-xl);
      }
      100% {
        box-shadow: 0 0 30px rgba(236, 72, 153, 0.8), var(--shadow-xl);
      }
    }

    .window-title {
      font-size: var(--font-size-lg);
      font-weight: 700;
      color: rgba(248, 250, 252, 0.95);
      margin-bottom: var(--space-8);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .countdown-timer {
      font-size: 48px;
      font-weight: 900;
      color: rgba(248, 250, 252, 1);
      margin: var(--space-12) 0;
      font-family: 'Courier New', monospace;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    }

    .countdown-timer.urgent {
      color: rgba(248, 113, 113, 1);
      animation: countdown-urgent 0.5s ease-in-out infinite alternate;
    }

    @keyframes countdown-urgent {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.1);
      }
    }

    .jutsu-options {
      display: grid;
      gap: var(--space-8);
      margin-top: var(--space-12);
    }

    .jutsu-button {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(248, 250, 252, 0.2);
      color: rgba(248, 250, 252, 0.9);
      padding: var(--space-12);
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .jutsu-button:hover {
      background: rgba(15, 23, 42, 1);
      border-color: rgba(168, 85, 247, 0.6);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
    }

    .jutsu-button:active {
      transform: translateY(0);
    }

    .jutsu-name {
      font-size: var(--font-size-md);
    }

    .jutsu-cost {
      font-size: var(--font-size-sm);
      color: rgba(59, 130, 246, 0.9);
      font-weight: 500;
    }

    .jutsu-description {
      font-size: var(--font-size-xs);
      color: rgba(148, 163, 184, 0.8);
      line-height: 1.3;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 2px;
      overflow: hidden;
      margin-top: var(--space-8);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, rgba(34, 197, 94, 0.9), rgba(168, 85, 247, 0.9));
      border-radius: 2px;
      transition: width 0.1s linear;
    }

    .skip-button {
      background: rgba(71, 85, 105, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: rgba(148, 163, 184, 0.8);
      padding: var(--space-6) var(--space-12);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      cursor: pointer;
      margin-top: var(--space-8);
      transition: all var(--transition-fast);
    }

    .skip-button:hover {
      background: rgba(71, 85, 105, 0.8);
      color: rgba(148, 163, 184, 1);
    }
  `;

  static properties = {
    gameState: { type: Object },
    currentTime: { type: Number },
    active: { type: Boolean, reflect: true }
  };

  constructor() {
    super();
    this.gameState = null;
    this.currentTime = 0;
    this.active = false;
    this.activeWindows = [];
    this._updateInterval = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._startUpdateLoop();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopUpdateLoop();
  }

  _startUpdateLoop() {
    this._updateInterval = setInterval(() => {
      this.currentTime = performance.now();
      this._checkActiveWindows();
    }, 100); // Update 10 times per second for smooth countdown
  }

  _stopUpdateLoop() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  _checkActiveWindows() {
    const windows = getActiveReactiveWindows();
    this.activeWindows = windows;
    this.active = windows.length > 0;
  }

  _getTimeRemaining(window) {
    if (!window || !window.expiresAt) return 0;
    const remaining = Math.max(0, window.expiresAt - this.currentTime);
    return Math.ceil(remaining / 1000); // Convert to seconds
  }

  _getProgressPercentage(window) {
    if (!window || !window.createdAt || !window.expiresAt) return 0;
    const total = window.expiresAt - window.createdAt;
    const elapsed = this.currentTime - window.createdAt;
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return 100 - progress; // Invert so it counts down
  }

  _handleJutsuActivation(windowId, jutsuId) {
    this.dispatchEvent(new CustomEvent('activate-jutsu', {
      detail: { windowId, jutsuId, timestamp: this.currentTime },
      bubbles: true
    }));
  }

  _handleSkip() {
    // Just close the window without activating anything
    this.active = false;
  }

  _getAvailableJutsu(window) {
    // Filter reactive jutsu based on the window's trigger type
    return reactiveJutsu.filter(jutsu => 
      jutsu.triggers.includes(window.triggerType) &&
      (this.gameState?.chakra?.current ?? 0) >= jutsu.cost
    );
  }

  render() {
    if (!this.active || !this.activeWindows.length) {
      return html``;
    }

    // For now, handle the first active window
    const window = this.activeWindows[0];
    const timeRemaining = this._getTimeRemaining(window);
    const progressPercentage = this._getProgressPercentage(window);
    const availableJutsu = this._getAvailableJutsu(window);

    return html`
      <div class="reactive-window">
        <div class="window-title">⚡ Reactive Jutsu ⚡</div>
        
        <div class="countdown-timer ${timeRemaining <= 1 ? 'urgent' : ''}">
          ${timeRemaining}
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercentage}%"></div>
        </div>

        ${availableJutsu.length > 0 ? html`
          <div class="jutsu-options">
            ${availableJutsu.map(jutsu => html`
              <button 
                class="jutsu-button"
                @click=${() => this._handleJutsuActivation(window.id, jutsu.id)}
              >
                <div class="jutsu-name">${jutsu.name}</div>
                <div class="jutsu-cost">${jutsu.cost} Chakra</div>
                <div class="jutsu-description">${jutsu.description}</div>
              </button>
            `)}
          </div>
        ` : html`
          <div style="color: rgba(248, 113, 113, 0.8); margin-top: var(--space-8);">
            Not enough chakra for any reactive jutsu
          </div>
        `}

        <button class="skip-button" @click=${this._handleSkip}>
          Skip Reaction
        </button>
      </div>
    `;
  }
}

customElements.define('ninja-reactive-jutsu-window', NinjaReactiveJutsuWindow);