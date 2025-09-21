/**
 * PWA Install Component for Ninja Clan Wars
 * Provides user-friendly interface for app installation
 */

import { LitElement, html, css } from 'lit';
import pwaInstallService from '../services/pwa-install.js';

export class NinjaPWAInstall extends LitElement {
  static properties = {
    installStatus: { type: Object },
    showPrompt: { type: Boolean },
    promptType: { type: String }, // 'banner', 'modal', 'hint'
    isInstalling: { type: Boolean },
    lastResult: { type: Object },
    autoHide: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }

    .install-banner {
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      margin: 16px 0;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
      position: relative;
      overflow: hidden;
    }

    .install-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
      pointer-events: none;
    }

    .install-banner-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .install-info {
      flex: 1;
    }

    .install-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .install-description {
      font-size: 0.875rem;
      opacity: 0.9;
      margin: 0;
      line-height: 1.4;
    }

    .install-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .install-button {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 12px 20px;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .install-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .install-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .install-button.primary {
      background: rgba(255, 255, 255, 0.9);
      color: #8b5cf6;
      font-weight: 700;
    }

    .install-button.primary:hover {
      background: white;
    }

    .close-button {
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      padding: 4px;
      border-radius: 4px;
    }

    .close-button:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }

    .install-hint {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0;
      color: #8b5cf6;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .install-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      color: white;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .modal-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      display: block;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      background: linear-gradient(45deg, #f59e0b, #dc2626);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .modal-subtitle {
      font-size: 1rem;
      opacity: 0.8;
      margin: 0;
    }

    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 24px 0;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 0.875rem;
    }

    .benefit-icon {
      background: rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .ios-instructions {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .instruction-steps {
      list-style: none;
      padding: 0;
      margin: 12px 0 0 0;
    }

    .instruction-step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 0.875rem;
    }

    .step-number {
      background: #8b5cf6;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .modal-actions .install-button {
      flex: 1;
      text-align: center;
      justify-content: center;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .success-message {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .install-banner-content {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .install-actions {
        flex-direction: column;
        width: 100%;
      }

      .install-button {
        width: 100%;
        text-align: center;
      }

      .modal-content {
        margin: 20px;
        padding: 24px;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `;

  constructor() {
    super();
    this.installStatus = {};
    this.showPrompt = false;
    this.promptType = 'banner';
    this.isInstalling = false;
    this.lastResult = null;
    this.autoHide = true;
    this.unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateInstallStatus();
    
    // Listen for install service events
    this.unsubscribe = pwaInstallService.addListener((event) => {
      this.handleInstallEvent(event);
    });

    // Set session start time for auto-prompt evaluation
    if (!sessionStorage.getItem('pwa-session-start')) {
      sessionStorage.setItem('pwa-session-start', Date.now().toString());
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  updateInstallStatus() {
    this.installStatus = pwaInstallService.getInstallationStatus();
    
    // Show prompt if appropriate
    if (this.installStatus.shouldShowHint && !this.showPrompt) {
      this.showInstallPrompt('banner');
    }
  }

  handleInstallEvent(event) {
    console.log('[NinjaPWAInstall] Install event:', event);
    
    switch (event.type) {
      case 'installable':
        this.updateInstallStatus();
        break;
      case 'installed':
        this.handleInstallSuccess();
        break;
      case 'promptResult':
        this.handlePromptResult(event);
        break;
    }
  }

  handleInstallSuccess() {
    this.showPrompt = false;
    this.isInstalling = false;
    this.lastResult = { outcome: 'installed' };
    this.updateInstallStatus();
    
    // Show success message briefly
    setTimeout(() => {
      this.lastResult = null;
      this.requestUpdate();
    }, 5000);
  }

  handlePromptResult(event) {
    this.isInstalling = false;
    this.lastResult = event;
    
    if (event.outcome === 'dismissed') {
      // Auto-hide after dismissal
      if (this.autoHide) {
        setTimeout(() => {
          this.showPrompt = false;
          this.requestUpdate();
        }, 2000);
      }
    }
    
    this.requestUpdate();
  }

  showInstallPrompt(type = 'banner') {
    this.promptType = type;
    this.showPrompt = true;
    this.requestUpdate();
  }

  hidePrompt() {
    this.showPrompt = false;
    this.requestUpdate();
  }

  async triggerInstall() {
    if (this.isInstalling || !this.installStatus.canInstall) {
      return;
    }

    this.isInstalling = true;
    this.requestUpdate();

    try {
      const result = await pwaInstallService.showInstallPrompt({ 
        trigger: 'manual' 
      });
      
      console.log('[NinjaPWAInstall] Install result:', result);
      
    } catch (error) {
      console.error('[NinjaPWAInstall] Install error:', error);
      this.isInstalling = false;
      this.requestUpdate();
    }
  }

  render() {
    if (this.installStatus.isInstalled) {
      return this.renderInstalledState();
    }

    if (!this.showPrompt) {
      return html``;
    }

    switch (this.promptType) {
      case 'modal':
        return this.renderModal();
      case 'hint':
        return this.renderHint();
      default:
        return this.renderBanner();
    }
  }

  renderBanner() {
    return html`
      <div class="install-banner">
        <div class="install-banner-content">
          <div class="install-info">
            <h3 class="install-title">
              📱 Install Ninja Clan Wars
            </h3>
            <p class="install-description">
              Get the full app experience with offline play, faster loading, and desktop access.
            </p>
          </div>
          <div class="install-actions">
            <button 
              class="install-button primary"
              @click=${this.triggerInstall}
              ?disabled=${this.isInstalling || !this.installStatus.canInstall}
            >
              ${this.isInstalling ? html`
                <span class="loading-spinner"></span>Installing...
              ` : 'Install'}
            </button>
            <button 
              class="close-button"
              @click=${this.hidePrompt}
              title="Maybe later"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderModal() {
    return html`
      <div class="install-modal" @click=${this.handleModalBackdrop}>
        <div class="modal-content" @click=${(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-icon">🥷</span>
            <h2 class="modal-title">Install Ninja Clan Wars</h2>
            <p class="modal-subtitle">Get the ultimate ninja gaming experience</p>
          </div>

          <ul class="benefits-list">
            <li class="benefit-item">
              <span class="benefit-icon">⚡</span>
              <span>Lightning-fast performance</span>
            </li>
            <li class="benefit-item">
              <span class="benefit-icon">📱</span>
              <span>Full offline support</span>
            </li>
            <li class="benefit-item">
              <span class="benefit-icon">🎮</span>
              <span>Immersive fullscreen gaming</span>
            </li>
            <li class="benefit-item">
              <span class="benefit-icon">🔔</span>
              <span>Tournament notifications</span>
            </li>
          </ul>

          ${this.installStatus.isIOSSafari ? this.renderIOSInstructions() : ''}

          <div class="modal-actions">
            ${this.installStatus.canInstall ? html`
              <button 
                class="install-button primary"
                @click=${this.triggerInstall}
                ?disabled=${this.isInstalling}
              >
                ${this.isInstalling ? html`
                  <span class="loading-spinner"></span>Installing...
                ` : '📱 Install Now'}
              </button>
            ` : ''}
            <button 
              class="install-button"
              @click=${this.hidePrompt}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderHint() {
    return html`
      <div class="install-hint">
        <span>💡</span>
        <span>
          Install Ninja Clan Wars as an app for better performance and offline play.
          <button 
            class="install-button" 
            @click=${() => this.showInstallPrompt('modal')}
            style="margin-left: 8px; padding: 4px 8px; font-size: 0.75rem;"
          >
            Learn More
          </button>
        </span>
      </div>
    `;
  }

  renderIOSInstructions() {
    const instructions = pwaInstallService.getIOSInstallInstructions();
    
    return html`
      <div class="ios-instructions">
        <p style="margin: 0 0 8px 0; font-weight: 600;">📱 To install on iOS Safari:</p>
        <ol class="instruction-steps">
          ${instructions.steps.map((step, index) => html`
            <li class="instruction-step">
              <span class="step-number">${index + 1}</span>
              <span>${step}</span>
            </li>
          `)}
        </ol>
        <p style="margin: 8px 0 0 0; font-size: 0.75rem; opacity: 0.8;">
          ${instructions.note}
        </p>
      </div>
    `;
  }

  renderInstalledState() {
    if (this.lastResult?.outcome === 'installed') {
      return html`
        <div class="success-message">
          <span>✅</span>
          <span>Ninja Clan Wars has been installed! You can now launch it from your home screen or desktop.</span>
        </div>
      `;
    }
    return html``;
  }

  handleModalBackdrop(e) {
    if (e.target === e.currentTarget) {
      this.hidePrompt();
    }
  }
}

customElements.define('ninja-pwa-install', NinjaPWAInstall);