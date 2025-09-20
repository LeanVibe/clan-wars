/**
 * Matchmaking Queue System for Ninja Clan Wars
 * Handles competitive queue, match creation, and player matching
 */

import { rankingSystem } from './ranking.js';
import { createId } from './utils.js';

export const QUEUE_TYPES = {
  RANKED: 'ranked',
  CASUAL: 'casual',
  PRACTICE: 'practice'
};

export const QUEUE_STATUS = {
  WAITING: 'waiting',
  MATCHED: 'matched',
  IN_GAME: 'in_game',
  CANCELLED: 'cancelled'
};

export const MAX_QUEUE_TIME = 300000; // 5 minutes max queue time
export const MATCHMAKING_INTERVAL = 2000; // Check for matches every 2 seconds

export class MatchmakingQueue {
  constructor() {
    this.queues = new Map(); // queueType -> QueueEntry[]
    this.activeMatches = new Map(); // matchId -> MatchData
    this.playerQueue = new Map(); // playerId -> QueueEntry
    this.matchmakingInterval = null;
    
    // Initialize queue types
    Object.values(QUEUE_TYPES).forEach(type => {
      this.queues.set(type, []);
    });
  }

  /**
   * Add player to matchmaking queue
   * @param {string} playerId - Player identifier
   * @param {string} queueType - Type of queue (ranked, casual, practice)
   * @param {Object} playerData - Additional player information
   * @returns {QueueEntry} Queue entry information
   */
  joinQueue(playerId, queueType = QUEUE_TYPES.RANKED, playerData = {}) {
    // Remove player from any existing queue
    this.leaveQueue(playerId);

    const queueEntry = {
      playerId,
      queueType,
      status: QUEUE_STATUS.WAITING,
      joinedAt: Date.now(),
      estimatedWaitTime: this.estimateWaitTime(queueType),
      playerData: {
        rating: rankingSystem.getPlayerRating(playerId).rating,
        ...playerData
      }
    };

    // Add to appropriate queue
    const queue = this.queues.get(queueType);
    queue.push(queueEntry);
    this.playerQueue.set(playerId, queueEntry);

    // Start matchmaking if not already running
    this.startMatchmaking();

    return queueEntry;
  }

  /**
   * Remove player from queue
   * @param {string} playerId - Player identifier
   * @returns {boolean} Whether player was successfully removed
   */
  leaveQueue(playerId) {
    const queueEntry = this.playerQueue.get(playerId);
    if (!queueEntry) return false;

    // Remove from queue
    const queue = this.queues.get(queueEntry.queueType);
    const index = queue.findIndex(entry => entry.playerId === playerId);
    if (index >= 0) {
      queue.splice(index, 1);
    }

    // Update status and cleanup
    queueEntry.status = QUEUE_STATUS.CANCELLED;
    this.playerQueue.delete(playerId);

    // Stop matchmaking if no players in any queue
    if (this.getTotalQueueSize() === 0) {
      this.stopMatchmaking();
    }

    return true;
  }

  /**
   * Get player's current queue status
   * @param {string} playerId - Player identifier
   * @returns {QueueEntry|null} Queue entry or null if not in queue
   */
  getQueueStatus(playerId) {
    return this.playerQueue.get(playerId) || null;
  }

  /**
   * Get queue statistics
   * @param {string} queueType - Queue type to check
   * @returns {QueueStats} Queue statistics
   */
  getQueueStats(queueType) {
    const queue = this.queues.get(queueType) || [];
    const waitingPlayers = queue.filter(entry => entry.status === QUEUE_STATUS.WAITING);
    
    return {
      queueType,
      playersWaiting: waitingPlayers.length,
      averageWaitTime: this.calculateAverageWaitTime(queueType),
      estimatedWaitTime: this.estimateWaitTime(queueType),
      activeMatches: this.getActiveMatchCount()
    };
  }

  /**
   * Start the matchmaking process
   */
  startMatchmaking() {
    if (this.matchmakingInterval) return; // Already running

    this.matchmakingInterval = setInterval(() => {
      this.processMatchmaking();
    }, MATCHMAKING_INTERVAL);
  }

  /**
   * Stop the matchmaking process
   */
  stopMatchmaking() {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }
  }

  /**
   * Process matchmaking for all queue types
   */
  processMatchmaking() {
    // Clean up expired queue entries
    this.cleanupExpiredEntries();

    // Process each queue type
    for (const [queueType, queue] of this.queues) {
      if (queue.length >= 2) {
        this.attemptMatches(queueType);
      }
    }
  }

  /**
   * Attempt to create matches in a specific queue
   * @param {string} queueType - Queue type to process
   */
  attemptMatches(queueType) {
    const queue = this.queues.get(queueType);
    const waitingPlayers = queue.filter(entry => entry.status === QUEUE_STATUS.WAITING);

    while (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers.shift();
      
      // Find best opponent for player1
      const opponentCandidates = rankingSystem.findMatchmakingOpponents(
        player1.playerId,
        waitingPlayers.map(entry => entry.playerId),
        this.getMaxRatingDiff(player1)
      );

      if (opponentCandidates.length === 0) {
        // No suitable opponent found, player1 stays in queue
        continue;
      }

      // Get the best opponent
      const opponentId = opponentCandidates[0];
      const player2Index = waitingPlayers.findIndex(entry => entry.playerId === opponentId);
      const player2 = waitingPlayers.splice(player2Index, 1)[0];

      // Create match
      const match = this.createMatch(player1, player2, queueType);
      
      // Update player statuses
      player1.status = QUEUE_STATUS.MATCHED;
      player2.status = QUEUE_STATUS.MATCHED;
      player1.matchId = match.id;
      player2.matchId = match.id;
    }
  }

  /**
   * Create a new match between two players
   * @param {QueueEntry} player1 - First player
   * @param {QueueEntry} player2 - Second player
   * @param {string} queueType - Type of queue
   * @returns {MatchData} Created match data
   */
  createMatch(player1, player2, queueType) {
    const matchId = createId('match');
    const match = {
      id: matchId,
      queueType,
      players: [
        {
          playerId: player1.playerId,
          rating: player1.playerData.rating,
          status: 'waiting'
        },
        {
          playerId: player2.playerId,
          rating: player2.playerData.rating,
          status: 'waiting'
        }
      ],
      createdAt: Date.now(),
      status: 'created',
      ratingChanges: null,
      result: null
    };

    this.activeMatches.set(matchId, match);
    return match;
  }

  /**
   * Accept a match for a player
   * @param {string} playerId - Player accepting the match
   * @returns {MatchData|null} Match data if successful
   */
  acceptMatch(playerId) {
    const queueEntry = this.playerQueue.get(playerId);
    if (!queueEntry || !queueEntry.matchId) return null;

    const match = this.activeMatches.get(queueEntry.matchId);
    if (!match) return null;

    // Update player status in match
    const player = match.players.find(p => p.playerId === playerId);
    if (player) {
      player.status = 'accepted';
    }

    // Check if both players have accepted
    const allAccepted = match.players.every(p => p.status === 'accepted');
    if (allAccepted) {
      match.status = 'ready';
      
      // Remove players from queue
      match.players.forEach(p => {
        this.leaveQueue(p.playerId);
      });
    }

    return match;
  }

  /**
   * Decline a match for a player
   * @param {string} playerId - Player declining the match
   * @returns {boolean} Whether decline was successful
   */
  declineMatch(playerId) {
    const queueEntry = this.playerQueue.get(playerId);
    if (!queueEntry || !queueEntry.matchId) return false;

    const match = this.activeMatches.get(queueEntry.matchId);
    if (!match) return false;

    // Cancel the match
    match.status = 'cancelled';
    
    // Return players to queue
    match.players.forEach(p => {
      const playerQueueEntry = this.playerQueue.get(p.playerId);
      if (playerQueueEntry) {
        playerQueueEntry.status = QUEUE_STATUS.WAITING;
        playerQueueEntry.matchId = null;
      }
    });

    this.activeMatches.delete(queueEntry.matchId);
    return true;
  }

  /**
   * Complete a match and update ratings
   * @param {string} matchId - Match identifier
   * @param {string} winnerId - Winner player ID (null for draw)
   * @param {Object} matchResult - Additional match data
   * @returns {MatchResult} Match completion data
   */
  completeMatch(matchId, winnerId, matchResult = {}) {
    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'ready') return null;

    const [player1, player2] = match.players;
    
    // Calculate outcomes
    let player1Outcome, player2Outcome;
    if (!winnerId) {
      // Draw
      player1Outcome = player2Outcome = 0.5;
    } else if (winnerId === player1.playerId) {
      // Player 1 wins
      player1Outcome = 1;
      player2Outcome = 0;
    } else {
      // Player 2 wins
      player1Outcome = 0;
      player2Outcome = 1;
    }

    // Update ratings for ranked matches
    let ratingChanges = null;
    if (match.queueType === QUEUE_TYPES.RANKED) {
      const player1Update = rankingSystem.updatePlayerRating(
        player1.playerId,
        player2.rating,
        player1Outcome,
        { ...matchResult, matchId, opponentId: player2.playerId }
      );
      
      const player2Update = rankingSystem.updatePlayerRating(
        player2.playerId,
        player1.rating,
        player2Outcome,
        { ...matchResult, matchId, opponentId: player1.playerId }
      );

      ratingChanges = {
        [player1.playerId]: player1Update,
        [player2.playerId]: player2Update
      };
    }

    // Update match
    match.status = 'completed';
    match.completedAt = Date.now();
    match.winnerId = winnerId;
    match.result = matchResult;
    match.ratingChanges = ratingChanges;

    // Remove match from active matches after a delay (for UI display)
    setTimeout(() => {
      this.activeMatches.delete(matchId);
    }, 30000);

    return {
      matchId,
      winnerId,
      ratingChanges,
      matchResult,
      duration: match.completedAt - match.createdAt
    };
  }

  /**
   * Get maximum rating difference for matchmaking based on wait time
   * @param {QueueEntry} queueEntry - Player's queue entry
   * @returns {number} Maximum rating difference
   */
  getMaxRatingDiff(queueEntry) {
    const waitTime = Date.now() - queueEntry.joinedAt;
    const baseRatingDiff = 200;
    const timeExpansion = Math.floor(waitTime / 30000) * 50; // +50 per 30 seconds
    return Math.min(baseRatingDiff + timeExpansion, 500);
  }

  /**
   * Clean up expired queue entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    
    for (const [queueType, queue] of this.queues) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const entry = queue[i];
        if (now - entry.joinedAt > MAX_QUEUE_TIME) {
          entry.status = QUEUE_STATUS.CANCELLED;
          queue.splice(i, 1);
          this.playerQueue.delete(entry.playerId);
        }
      }
    }
  }

  /**
   * Calculate average wait time for a queue type
   * @param {string} queueType - Queue type
   * @returns {number} Average wait time in milliseconds
   */
  calculateAverageWaitTime(queueType) {
    // Simplified calculation - in production this would use historical data
    const queueSize = this.queues.get(queueType)?.length || 0;
    const baseWaitTime = 30000; // 30 seconds base
    return Math.max(baseWaitTime, baseWaitTime * Math.log(queueSize + 1));
  }

  /**
   * Estimate wait time for joining a queue
   * @param {string} queueType - Queue type
   * @returns {number} Estimated wait time in milliseconds
   */
  estimateWaitTime(queueType) {
    return this.calculateAverageWaitTime(queueType);
  }

  /**
   * Get total number of players across all queues
   * @returns {number} Total queue size
   */
  getTotalQueueSize() {
    return Array.from(this.queues.values()).reduce((total, queue) => total + queue.length, 0);
  }

  /**
   * Get number of active matches
   * @returns {number} Number of active matches
   */
  getActiveMatchCount() {
    return Array.from(this.activeMatches.values())
      .filter(match => match.status === 'ready' || match.status === 'created').length;
  }

  /**
   * Get match by ID
   * @param {string} matchId - Match identifier
   * @returns {MatchData|null} Match data
   */
  getMatch(matchId) {
    return this.activeMatches.get(matchId) || null;
  }

  /**
   * Export queue data for persistence
   * @returns {Object} Serializable queue data
   */
  exportData() {
    return {
      queues: Object.fromEntries(this.queues),
      activeMatches: Object.fromEntries(this.activeMatches),
      playerQueue: Object.fromEntries(this.playerQueue)
    };
  }

  /**
   * Import queue data from persistence
   * @param {Object} data - Serialized queue data
   */
  importData(data) {
    if (data.queues) {
      this.queues = new Map(Object.entries(data.queues));
    }
    if (data.activeMatches) {
      this.activeMatches = new Map(Object.entries(data.activeMatches));
    }
    if (data.playerQueue) {
      this.playerQueue = new Map(Object.entries(data.playerQueue));
    }
  }
}

// Singleton instance for global access
export const matchmakingQueue = new MatchmakingQueue();