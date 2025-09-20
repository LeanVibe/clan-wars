/**
 * Match History Component for Ninja Clan Wars
 * Displays player's recent matches, rating changes, and statistics
 */

import { LitElement, html, css } from 'lit';
import { RANKS, rankingSystem } from '../../../../packages/game-core/src/ranking.js';

export class NinjaMatchHistory extends LitElement {
  static properties = {
    playerId: { type: String },
    matchHistory: { type: Array },
    playerRating: { type: Object },
    showDetails: { type: Boolean },
    selectedMatch: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
    }

    .history-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 24px;
    }

    .history-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(45deg, #f59e0b, #dc2626);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.75rem;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .win-rate {
      color: #10b981;
    }

    .loss-rate {
      color: #ef4444;
    }

    .rating-change {
      color: #f59e0b;
    }

    .streak {
      color: #8b5cf6;
    }

    .match-list {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .match-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .match-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .match-item.win {
      border-left: 4px solid #10b981;
    }

    .match-item.loss {
      border-left: 4px solid #ef4444;
    }

    .match-item.draw {
      border-left: 4px solid #6b7280;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .match-result {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .match-result.win {
      color: #10b981;
    }

    .match-result.loss {
      color: #ef4444;
    }

    .match-result.draw {
      color: #6b7280;
    }

    .match-date {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .match-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .opponent-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .opponent-rank {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .rating-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rating-change-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.7rem;
    }

    .rating-gain {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .rating-loss {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .placement-badge {
      background: rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6rem;
      font-weight: 600;
    }

    .match-detail-view {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 20px;
      margin-top: 16px;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .close-btn:hover {
      opacity: 1;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .detail-item {
      text-align: center;
    }

    .detail-value {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .detail-label {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      opacity: 0.7;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .filter-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: white;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .filter-btn.active {
      background: linear-gradient(45deg, #059669, #10b981);
      border-color: #10b981;
    }

    @media (max-width: 768px) {
      .stats-summary {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .match-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `;

  constructor() {
    super();
    this.playerId = 'player-1';
    this.matchHistory = [];
    this.playerRating = null;
    this.showDetails = false;
    this.selectedMatch = null;
    this.filterType = 'all'; // all, wins, losses, ranked, casual
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadMatchHistory();
  }

  loadMatchHistory() {
    this.playerRating = rankingSystem.getPlayerRating(this.playerId);
    this.matchHistory = rankingSystem.getMatchHistory(this.playerId, 20);
    this.requestUpdate();
  }

  setFilter(filterType) {
    this.filterType = filterType;
    this.requestUpdate();
  }

  getFilteredMatches() {
    switch (this.filterType) {
      case 'wins':
        return this.matchHistory.filter(match => match.outcome === 1);
      case 'losses':
        return this.matchHistory.filter(match => match.outcome === 0);
      case 'ranked':
        return this.matchHistory.filter(match => match.queueType === 'ranked');
      case 'casual':
        return this.matchHistory.filter(match => match.queueType === 'casual');
      default:
        return this.matchHistory;
    }
  }

  showMatchDetails(match) {
    this.selectedMatch = match;
    this.showDetails = true;
    this.requestUpdate();
  }

  hideMatchDetails() {
    this.showDetails = false;
    this.selectedMatch = null;
    this.requestUpdate();
  }

  getRankFromRating(rating) {
    return RANKS.find(rank => rating >= rank.minRating && rating <= rank.maxRating) || RANKS[0];
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  }

  calculateWinRate() {
    if (this.playerRating.wins + this.playerRating.losses === 0) return 0;
    return (this.playerRating.wins / (this.playerRating.wins + this.playerRating.losses) * 100);
  }

  render() {
    if (!this.playerRating) {
      return html`<div>Loading match history...</div>`;
    }

    const filteredMatches = this.getFilteredMatches();

    return html`
      <div class="history-header">
        <h2 class="history-title">Match History</h2>
      </div>

      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-value win-rate">${this.playerRating.wins}</div>
          <div class="stat-label">Wins</div>
        </div>
        <div class="stat-card">
          <div class="stat-value loss-rate">${this.playerRating.losses}</div>
          <div class="stat-label">Losses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value rating-change">${this.calculateWinRate().toFixed(1)}%</div>
          <div class="stat-label">Win Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value streak">${this.playerRating.winStreak}</div>
          <div class="stat-label">Win Streak</div>
        </div>
      </div>

      <div class="filter-controls">
        <button 
          class="filter-btn ${this.filterType === 'all' ? 'active' : ''}"
          @click=${() => this.setFilter('all')}
        >
          All Matches
        </button>
        <button 
          class="filter-btn ${this.filterType === 'wins' ? 'active' : ''}"
          @click=${() => this.setFilter('wins')}
        >
          Wins Only
        </button>
        <button 
          class="filter-btn ${this.filterType === 'losses' ? 'active' : ''}"
          @click=${() => this.setFilter('losses')}
        >
          Losses Only
        </button>
        <button 
          class="filter-btn ${this.filterType === 'ranked' ? 'active' : ''}"
          @click=${() => this.setFilter('ranked')}
        >
          Ranked
        </button>
      </div>

      ${this.showDetails ? this.renderMatchDetails() : ''}

      <div class="match-list">
        ${filteredMatches.length > 0 ? html`
          ${filteredMatches.map(match => this.renderMatchItem(match))}
        ` : html`
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <div>No matches found for the selected filter.</div>
          </div>
        `}
      </div>
    `;
  }

  renderMatchItem(match) {
    const resultClass = match.outcome === 1 ? 'win' : match.outcome === 0 ? 'loss' : 'draw';
    const resultText = match.outcome === 1 ? 'Victory' : match.outcome === 0 ? 'Defeat' : 'Draw';
    const opponentRank = this.getRankFromRating(match.opponentRating);
    const ratingChange = match.ratingChange || 0;

    return html`
      <div 
        class="match-item ${resultClass}" 
        @click=${() => this.showMatchDetails(match)}
      >
        <div class="match-header">
          <span class="match-result ${resultClass}">${resultText}</span>
          <span class="match-date">${this.formatDate(match.timestamp)}</span>
        </div>
        <div class="match-details">
          <div class="opponent-info">
            <span class="opponent-rank" style="background-color: ${opponentRank.color}">
              ${opponentRank.name}
            </span>
            <span>vs ${match.opponentRating} Rating</span>
            ${match.isPlacement ? html`
              <span class="placement-badge">Placement</span>
            ` : ''}
          </div>
          <div class="rating-info">
            <span>${match.oldRating} → ${match.newRating}</span>
            <span class="rating-change-badge ${ratingChange >= 0 ? 'rating-gain' : 'rating-loss'}">
              ${ratingChange >= 0 ? '+' : ''}${ratingChange}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderMatchDetails() {
    if (!this.selectedMatch) return '';

    const match = this.selectedMatch;
    const resultClass = match.outcome === 1 ? 'win' : match.outcome === 0 ? 'loss' : 'draw';
    const resultText = match.outcome === 1 ? 'Victory' : match.outcome === 0 ? 'Defeat' : 'Draw';
    const opponentRank = this.getRankFromRating(match.opponentRating);

    return html`
      <div class="match-detail-view">
        <div class="detail-header">
          <h3>Match Details</h3>
          <button class="close-btn" @click=${this.hideMatchDetails}>×</button>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-value ${resultClass}">${resultText}</div>
            <div class="detail-label">Result</div>
          </div>
          <div class="detail-item">
            <div class="detail-value">${match.opponentRating}</div>
            <div class="detail-label">Opponent Rating</div>
          </div>
          <div class="detail-item">
            <div class="detail-value" style="color: ${opponentRank.color}">
              ${opponentRank.name}
            </div>
            <div class="detail-label">Opponent Rank</div>
          </div>
          <div class="detail-item">
            <div class="detail-value">${match.oldRating} → ${match.newRating}</div>
            <div class="detail-label">Rating Change</div>
          </div>
          <div class="detail-item">
            <div class="detail-value ${match.ratingChange >= 0 ? 'win-rate' : 'loss-rate'}">
              ${match.ratingChange >= 0 ? '+' : ''}${match.ratingChange}
            </div>
            <div class="detail-label">Points</div>
          </div>
          <div class="detail-item">
            <div class="detail-value">${this.formatDate(match.timestamp)}</div>
            <div class="detail-label">Date</div>
          </div>
        </div>

        ${match.isPlacement ? html`
          <div style="text-align: center; color: #8b5cf6; font-weight: 600;">
            🎯 Placement Match
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('ninja-match-history', NinjaMatchHistory);