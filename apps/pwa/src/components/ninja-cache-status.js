/**
 * Cache Status Component for Ninja Clan Wars
 * Displays cache usage, statistics, and management controls
 */

import { LitElement, html, css } from 'lit';
import cacheManager from '../services/cache-manager.js';

export class NinjaCacheStatus extends LitElement {
  static properties = {
    cacheStats: { type: Object },
    recommendations: { type: Array },
    isLoading: { type: Boolean },
    isExpanded: { type: Boolean },
    lastUpdate: { type: Number },
    operationInProgress: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }

    .cache-widget {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      margin: 12px 0;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .cache-header {
      padding: 16px 20px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(139, 92, 246, 0.1);
      transition: background 0.2s ease;
    }

    .cache-header:hover {
      background: rgba(139, 92, 246, 0.15);
    }

    .cache-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: white;
      margin: 0;
    }

    .cache-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .storage-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .storage-bar {
      width: 60px;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .storage-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .expand-icon {
      transition: transform 0.3s ease;
      color: rgba(255, 255, 255, 0.6);
    }

    .cache-widget.expanded .expand-icon {
      transform: rotate(180deg);
    }

    .cache-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .cache-widget.expanded .cache-content {
      max-height: 600px;
    }

    .cache-details {
      padding: 20px;
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 4px;
      color: #8b5cf6;
    }

    .stat-label {
      font-size: 0.75rem;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cache-list {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .cache-list-title {
      font-weight: 600;
      margin-bottom: 12px;
      color: #8b5cf6;
    }

    .cache-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .cache-item:last-child {
      border-bottom: none;
    }

    .cache-name {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .cache-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .recommendations {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .recommendations-title {
      font-weight: 600;
      margin-bottom: 12px;
      color: #f59e0b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .recommendation-item {
      background: rgba(245, 158, 11, 0.1);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .recommendation-text {
      font-size: 0.875rem;
      flex: 1;
    }

    .recommendation-action {
      background: rgba(245, 158, 11, 0.8);
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .recommendation-action:hover {
      background: #f59e0b;
      transform: translateY(-1px);
    }

    .cache-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .cache-button {
      background: rgba(139, 92, 246, 0.8);
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }

    .cache-button:hover {
      background: #8b5cf6;
      transform: translateY(-1px);
    }

    .cache-button:disabled {
      background: rgba(107, 114, 128, 0.5);
      cursor: not-allowed;
      transform: none;
    }

    .cache-button.danger {
      background: rgba(239, 68, 68, 0.8);
    }

    .cache-button.danger:hover {
      background: #ef4444;
    }

    .cache-button.success {
      background: rgba(16, 185, 129, 0.8);
    }

    .cache-button.success:hover {
      background: #10b981;
    }

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .warning-badge {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .last-update {
      font-size: 0.75rem;
      opacity: 0.6;
      text-align: center;
      margin-top: 16px;
    }

    @media (max-width: 768px) {
      .cache-header {
        padding: 12px 16px;
      }

      .cache-details {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .cache-actions {
        flex-direction: column;
      }

      .cache-button {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  constructor() {
    super();
    this.cacheStats = null;
    this.recommendations = [];
    this.isLoading = false;
    this.isExpanded = false;
    this.lastUpdate = 0;
    this.operationInProgress = null;
    this.unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadCacheStats();
    
    // Listen for cache manager events
    this.unsubscribe = cacheManager.addListener((event) => {
      this.handleCacheEvent(event);
    });

    // Auto-refresh every 30 seconds when expanded
    this.refreshInterval = setInterval(() => {
      if (this.isExpanded) {
        this.loadCacheStats();
      }
    }, 30000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadCacheStats() {
    this.isLoading = true;
    this.requestUpdate();

    try {
      const [stats, recommendations] = await Promise.all([
        cacheManager.getCacheStats(),
        cacheManager.getCacheRecommendations()
      ]);

      this.cacheStats = stats;
      this.recommendations = recommendations;
      this.lastUpdate = Date.now();

    } catch (error) {
      console.error('[NinjaCacheStatus] Failed to load cache stats:', error);
      this.cacheStats = { error: error.message, warnings: [] };
    } finally {
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  handleCacheEvent(event) {
    console.log('[NinjaCacheStatus] Cache event:', event);
    
    // Refresh stats after cache operations
    if (['cache-cleared', 'all-caches-cleared', 'cleanup-completed'].includes(event.type)) {
      this.operationInProgress = null;
      setTimeout(() => this.loadCacheStats(), 1000);
    }
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded && (!this.cacheStats || Date.now() - this.lastUpdate > 60000)) {
      this.loadCacheStats();
    }
  }

  async clearCache(cacheName) {
    this.operationInProgress = `clear-${cacheName}`;
    this.requestUpdate();

    try {
      await cacheManager.clearCache(cacheName);
    } catch (error) {
      console.error(`Failed to clear cache ${cacheName}:`, error);
    }
  }

  async clearAllCaches() {
    this.operationInProgress = 'clear-all';
    this.requestUpdate();

    try {
      await cacheManager.clearAllCaches();
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  }

  async cleanupOldEntries() {
    this.operationInProgress = 'cleanup';
    this.requestUpdate();

    try {
      await cacheManager.cleanupOldEntries();
    } catch (error) {
      console.error('Failed to cleanup old entries:', error);
    }
  }

  async preloadAssets() {
    this.operationInProgress = 'preload';
    this.requestUpdate();

    try {
      await cacheManager.preloadCriticalAssets();
    } catch (error) {
      console.error('Failed to preload assets:', error);
    } finally {
      this.operationInProgress = null;
      this.requestUpdate();
    }
  }

  formatBytes(bytes) {
    return cacheManager.formatBytes(bytes);
  }

  getStoragePercentage() {
    if (!this.cacheStats || !this.cacheStats.storageQuota) return 0;
    return (this.cacheStats.storageUsage / this.cacheStats.storageQuota) * 100;
  }

  render() {
    const hasWarnings = this.cacheStats?.warnings?.length > 0;
    const storagePercentage = this.getStoragePercentage();

    return html`
      <div class="cache-widget ${this.isExpanded ? 'expanded' : ''}">
        <div class="cache-header" @click=${this.toggleExpanded}>
          <h3 class="cache-title">
            🗄️ Cache Status
            ${hasWarnings ? html`<span class="warning-badge">!</span>` : ''}
          </h3>
          
          <div class="cache-summary">
            ${this.cacheStats ? html`
              <div class="storage-indicator">
                <span>${this.formatBytes(this.cacheStats.totalSize || 0)}</span>
                <div class="storage-bar">
                  <div class="storage-fill" style="width: ${Math.min(storagePercentage, 100)}%"></div>
                </div>
                <span>${storagePercentage.toFixed(1)}%</span>
              </div>
            ` : ''}
            
            <span class="expand-icon">▼</span>
          </div>
        </div>

        <div class="cache-content">
          <div class="cache-details">
            ${this.isLoading ? html`
              <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 8px;">Loading cache statistics...</p>
              </div>
            ` : this.renderCacheDetails()}
          </div>
        </div>
      </div>
    `;
  }

  renderCacheDetails() {
    if (!this.cacheStats) {
      return html`<p>No cache data available</p>`;
    }

    if (this.cacheStats.error) {
      return html`
        <div style="color: #ef4444; text-align: center;">
          <p>Error loading cache data: ${this.cacheStats.error}</p>
          <button class="cache-button" @click=${this.loadCacheStats}>
            🔄 Retry
          </button>
        </div>
      `;
    }

    return html`
      ${this.renderStatsGrid()}
      ${this.renderRecommendations()}
      ${this.renderCacheList()}
      ${this.renderActions()}
      ${this.renderLastUpdate()}
    `;
  }

  renderStatsGrid() {
    return html`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${this.cacheStats.totalEntries}</div>
          <div class="stat-label">Total Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.formatBytes(this.cacheStats.totalSize)}</div>
          <div class="stat-label">Cache Size</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Object.keys(this.cacheStats.caches).length}</div>
          <div class="stat-label">Active Caches</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.formatBytes(this.cacheStats.storageAvailable || 0)}</div>
          <div class="stat-label">Available</div>
        </div>
      </div>
    `;
  }

  renderRecommendations() {
    if (this.recommendations.length === 0) return '';

    return html`
      <div class="recommendations">
        <div class="recommendations-title">
          💡 Recommendations
        </div>
        ${this.recommendations.map(rec => html`
          <div class="recommendation-item">
            <div class="recommendation-text">${rec.message}</div>
            <button 
              class="recommendation-action"
              @click=${() => this.handleRecommendationAction(rec.action)}
              ?disabled=${this.operationInProgress}
            >
              ${this.getActionButtonText(rec.action)}
            </button>
          </div>
        `)}
      </div>
    `;
  }

  renderCacheList() {
    const caches = Object.entries(this.cacheStats.caches);
    if (caches.length === 0) return '';

    return html`
      <div class="cache-list">
        <div class="cache-list-title">Cache Breakdown</div>
        ${caches.map(([name, cache]) => html`
          <div class="cache-item">
            <div class="cache-name">${name}</div>
            <div class="cache-info">
              <span>${cache.entries} entries</span>
              <span>${this.formatBytes(cache.size)}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  renderActions() {
    return html`
      <div class="cache-actions">
        <button 
          class="cache-button"
          @click=${this.loadCacheStats}
          ?disabled=${this.isLoading}
        >
          ${this.isLoading ? html`<span class="loading-spinner"></span>` : '🔄'} Refresh
        </button>
        
        <button 
          class="cache-button success"
          @click=${this.preloadAssets}
          ?disabled=${this.operationInProgress === 'preload'}
        >
          ${this.operationInProgress === 'preload' ? html`<span class="loading-spinner"></span>` : '⚡'} Preload
        </button>
        
        <button 
          class="cache-button"
          @click=${this.cleanupOldEntries}
          ?disabled=${this.operationInProgress === 'cleanup'}
        >
          ${this.operationInProgress === 'cleanup' ? html`<span class="loading-spinner"></span>` : '🧹'} Cleanup
        </button>
        
        <button 
          class="cache-button danger"
          @click=${this.clearAllCaches}
          ?disabled=${this.operationInProgress === 'clear-all'}
        >
          ${this.operationInProgress === 'clear-all' ? html`<span class="loading-spinner"></span>` : '🗑️'} Clear All
        </button>
      </div>
    `;
  }

  renderLastUpdate() {
    if (!this.lastUpdate) return '';
    
    const timeSince = Math.floor((Date.now() - this.lastUpdate) / 1000);
    const timeText = timeSince < 60 ? `${timeSince}s ago` : `${Math.floor(timeSince / 60)}m ago`;
    
    return html`
      <div class="last-update">
        Last updated: ${timeText}
      </div>
    `;
  }

  handleRecommendationAction(action) {
    switch (action) {
      case 'cleanup-old-entries':
        this.cleanupOldEntries();
        break;
      case 'clear-all':
        this.clearAllCaches();
        break;
      default:
        if (action.startsWith('clear-cache:')) {
          const cacheName = action.replace('clear-cache:', '');
          this.clearCache(cacheName);
        }
        break;
    }
  }

  getActionButtonText(action) {
    switch (action) {
      case 'cleanup-old-entries': return 'Cleanup';
      case 'clear-all': return 'Clear All';
      default: return 'Fix';
    }
  }
}

customElements.define('ninja-cache-status', NinjaCacheStatus);