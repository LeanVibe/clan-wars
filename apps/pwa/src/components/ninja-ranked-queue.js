/**
 * Ranked Queue Component for Ninja Clan Wars
 * Handles competitive matchmaking UI, rank display, and queue status
 */

import { LitElement, html, css } from 'lit';
import { RANKS, rankingSystem } from '../../../../packages/game-core/src/ranking.js';
import { QUEUE_TYPES, QUEUE_STATUS, matchmakingQueue } from '../../../../packages/game-core/src/matchmaking.js';

export class NinjaRankedQueue extends LitElement {
  static properties = {
    playerId: { type: String },
    queueStatus: { type: Object },
    playerRating: { type: Object },
    queueStats: { type: Object },
    matchFound: { type: Object },
    isInQueue: { type: Boolean },
    selectedQueueType: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
      min-height: 400px;
    }

    .queue-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .queue-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      background: linear-gradient(45deg, #f59e0b, #dc2626);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .queue-subtitle {
      font-size: 0.875rem;
      opacity: 0.7;
      margin: 0;
    }

    .player-rank {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .rank-icon {
      font-size: 2rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .rank-info {
      text-align: left;
    }

    .rank-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .rank-rating {
      font-size: 0.875rem;
      opacity: 0.8;
      margin: 4px 0 0 0;
    }

    .rank-progress {
      font-size: 0.75rem;
      opacity: 0.6;
      margin: 2px 0 0 0;
    }

    .placement-matches {
      background: linear-gradient(45deg, #7c3aed, #a855f7);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 16px;
    }

    .queue-selection {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .queue-type-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 12px 8px;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .queue-type-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .queue-type-btn.selected {
      background: linear-gradient(45deg, #059669, #10b981);
      border-color: #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .queue-action {
      text-align: center;
      margin-bottom: 24px;
    }

    .queue-btn {
      background: linear-gradient(45deg, #dc2626, #ef4444);
      border: none;
      border-radius: 8px;
      padding: 16px 32px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 200px;
    }

    .queue-btn:hover {
      background: linear-gradient(45deg, #b91c1c, #dc2626);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
    }

    .queue-btn:disabled {
      background: rgba(255, 255, 255, 0.2);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .queue-btn.join {
      background: linear-gradient(45deg, #059669, #10b981);
    }

    .queue-btn.join:hover {
      background: linear-gradient(45deg, #047857, #059669);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
    }

    .queue-status {
      text-align: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .queue-timer {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .queue-info {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .match-found {
      background: linear-gradient(45deg, #059669, #10b981);
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      animation: pulse 2s infinite;
    }

    .match-found h3 {
      margin: 0 0 16px 0;
      font-size: 1.25rem;
    }

    .match-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 16px;
    }

    .match-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .accept-btn {
      background: #10b981;
      color: white;
    }

    .decline-btn {
      background: #ef4444;
      color: white;
    }

    .match-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .queue-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 12px;
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .stat-item {
      text-align: center;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
    }

    .stat-value {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 2px;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  constructor() {
    super();
    this.playerId = 'player-1'; // Default player ID
    this.queueStatus = null;
    this.playerRating = null;
    this.queueStats = null;
    this.matchFound = null;
    this.isInQueue = false;
    this.selectedQueueType = QUEUE_TYPES.RANKED;
    this.queueUpdateInterval = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadPlayerData();
    this.startQueueUpdates();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopQueueUpdates();
  }

  loadPlayerData() {
    this.playerRating = rankingSystem.getPlayerRating(this.playerId);
    this.queueStats = matchmakingQueue.getQueueStats(this.selectedQueueType);
    this.queueStatus = matchmakingQueue.getQueueStatus(this.playerId);
    this.isInQueue = !!this.queueStatus;
    
    // Check for match
    if (this.queueStatus?.matchId) {
      this.matchFound = matchmakingQueue.getMatch(this.queueStatus.matchId);
    }
  }

  startQueueUpdates() {
    this.queueUpdateInterval = setInterval(() => {
      this.loadPlayerData();
      this.requestUpdate();
    }, 1000);
  }

  stopQueueUpdates() {
    if (this.queueUpdateInterval) {
      clearInterval(this.queueUpdateInterval);
      this.queueUpdateInterval = null;
    }
  }

  selectQueueType(queueType) {
    if (this.isInQueue) return; // Can't change while in queue
    
    this.selectedQueueType = queueType;
    this.queueStats = matchmakingQueue.getQueueStats(queueType);
    this.requestUpdate();
  }

  joinQueue() {
    if (this.isInQueue) return;
    
    matchmakingQueue.joinQueue(this.playerId, this.selectedQueueType);
    this.loadPlayerData();
    
    // Dispatch event for parent components
    this.dispatchEvent(new CustomEvent('queue-joined', {
      detail: { playerId: this.playerId, queueType: this.selectedQueueType },
      bubbles: true
    }));
  }

  leaveQueue() {
    if (!this.isInQueue) return;
    
    matchmakingQueue.leaveQueue(this.playerId);
    this.loadPlayerData();
    
    this.dispatchEvent(new CustomEvent('queue-left', {
      detail: { playerId: this.playerId },
      bubbles: true
    }));
  }

  acceptMatch() {
    if (!this.matchFound) return;
    
    matchmakingQueue.acceptMatch(this.playerId);
    this.loadPlayerData();
    
    this.dispatchEvent(new CustomEvent('match-accepted', {
      detail: { matchId: this.matchFound.id },
      bubbles: true
    }));
  }

  declineMatch() {
    if (!this.matchFound) return;
    
    matchmakingQueue.declineMatch(this.playerId);
    this.loadPlayerData();
    
    this.dispatchEvent(new CustomEvent('match-declined', {
      detail: { matchId: this.matchFound.id },
      bubbles: true
    }));
  }

  getRankFromRating(rating) {
    return RANKS.find(rank => rating >= rank.minRating && rating <= rank.maxRating) || RANKS[0];
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  render() {
    if (!this.playerRating) {
      return html`<div class="loading"></div>`;
    }

    const rank = this.getRankFromRating(this.playerRating.rating);
    const isPlacement = this.playerRating.placementMatches < 10;

    return html`
      <div class="queue-header">
        <h2 class="queue-title">Competitive Queue</h2>
        <p class="queue-subtitle">Join ranked matches and climb the ninja ranks</p>
      </div>

      <div class="player-rank">
        <div class="rank-icon" style="color: ${rank.color}">${this.getRankIcon(rank.id)}</div>
        <div class="rank-info">
          <h3 class="rank-name" style="color: ${rank.color}">${rank.name}</h3>
          <p class="rank-rating">${this.playerRating.rating} Rating</p>
          ${isPlacement ? html`
            <p class="rank-progress">Peak: ${this.playerRating.peakRating}</p>
          ` : html`
            <p class="rank-progress">${rank.minRating} - ${rank.maxRating}</p>
          `}
        </div>
      </div>

      ${isPlacement ? html`
        <div class="placement-matches">
          🎯 Placement Matches: ${this.playerRating.placementMatches}/10 Complete
        </div>
      ` : ''}

      ${this.matchFound ? this.renderMatchFound() : this.renderQueueInterface()}

      ${this.queueStats ? html`
        <div class="queue-stats">
          <div class="stat-item">
            <div class="stat-value">${this.queueStats.playersWaiting}</div>
            <div>In Queue</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.formatTime(this.queueStats.estimatedWaitTime)}</div>
            <div>Est. Wait</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.queueStats.activeMatches}</div>
            <div>Active Games</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.playerRating.wins}W ${this.playerRating.losses}L</div>
            <div>Record</div>
          </div>
        </div>
      ` : ''}
    `;
  }

  renderQueueInterface() {
    return html`
      ${!this.isInQueue ? html`
        <div class="queue-selection">
          ${Object.values(QUEUE_TYPES).map(queueType => html`
            <button
              class="queue-type-btn ${this.selectedQueueType === queueType ? 'selected' : ''}"
              @click=${() => this.selectQueueType(queueType)}
            >
              ${this.getQueueTypeName(queueType)}
            </button>
          `)}
        </div>
      ` : ''}

      <div class="queue-action">
        ${this.isInQueue ? html`
          <div class="queue-status">
            <div class="queue-timer">
              ${this.formatTime(Date.now() - this.queueStatus.joinedAt)}
            </div>
            <div class="queue-info">
              <div class="loading"></div>
              Searching for opponent...
            </div>
          </div>
          <button class="queue-btn" @click=${this.leaveQueue}>
            Leave Queue
          </button>
        ` : html`
          <button class="queue-btn join" @click=${this.joinQueue}>
            Join ${this.getQueueTypeName(this.selectedQueueType)} Queue
          </button>
        `}
      </div>
    `;
  }

  renderMatchFound() {
    const opponent = this.matchFound.players.find(p => p.playerId !== this.playerId);
    const opponentRank = this.getRankFromRating(opponent.rating);

    return html`
      <div class="match-found">
        <h3>🎯 Match Found!</h3>
        <div>
          <strong>Opponent:</strong> ${opponentRank.name} (${opponent.rating} Rating)
        </div>
        <div class="match-actions">
          <button class="match-btn accept-btn" @click=${this.acceptMatch}>
            ✓ Accept
          </button>
          <button class="match-btn decline-btn" @click=${this.declineMatch}>
            ✗ Decline
          </button>
        </div>
      </div>
    `;
  }

  getRankIcon(rankId) {
    const icons = {
      genin: '🥉',
      chunin: '🥈', 
      jonin: '🥇',
      anbu: '⭐',
      kage: '👑',
      legendary: '💎'
    };
    return icons[rankId] || '🥉';
  }

  getQueueTypeName(queueType) {
    const names = {
      [QUEUE_TYPES.RANKED]: 'Ranked',
      [QUEUE_TYPES.CASUAL]: 'Casual',
      [QUEUE_TYPES.PRACTICE]: 'Practice'
    };
    return names[queueType] || queueType;
  }
}

customElements.define('ninja-ranked-queue', NinjaRankedQueue);