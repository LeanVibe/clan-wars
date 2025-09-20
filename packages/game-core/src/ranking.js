/**
 * Ranking System for Ninja Clan Wars
 * Implements ELO-based competitive rating with seasonal progression
 */

export const RANKS = [
  { id: 'genin', name: 'Genin', minRating: 0, maxRating: 1199, color: '#8B5A2B' },
  { id: 'chunin', name: 'Chunin', minRating: 1200, maxRating: 1499, color: '#4B5563' },
  { id: 'jonin', name: 'Jonin', minRating: 1500, maxRating: 1799, color: '#059669' },
  { id: 'anbu', name: 'ANBU', minRating: 1800, maxRating: 2099, color: '#7C3AED' },
  { id: 'kage', name: 'Kage', minRating: 2100, maxRating: 2499, color: '#DC2626' },
  { id: 'legendary', name: 'Legendary', minRating: 2500, maxRating: 9999, color: '#F59E0B' }
];

export const INITIAL_RATING = 1200;
export const K_FACTOR = 32; // ELO K-factor for rating changes
export const PLACEMENT_MATCHES = 10; // Number of placement matches for new players

export class RankingSystem {
  constructor() {
    this.seasons = new Map(); // seasonId -> SeasonData
    this.playerRatings = new Map(); // playerId -> PlayerRating
    this.matchHistory = new Map(); // playerId -> MatchRecord[]
    this.currentSeason = this.createSeason('season-1', 'Ninja Academy', Date.now());
  }

  /**
   * Calculate ELO rating change after a match
   * @param {number} playerRating - Current player rating
   * @param {number} opponentRating - Opponent rating
   * @param {number} outcome - 1 for win, 0.5 for draw, 0 for loss
   * @param {boolean} isPlacement - Whether this is a placement match
   * @returns {number} Rating change
   */
  calculateRatingChange(playerRating, opponentRating, outcome, isPlacement = false) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const kFactor = isPlacement ? K_FACTOR * 2 : K_FACTOR; // Double K-factor for placement
    return Math.round(kFactor * (outcome - expectedScore));
  }

  /**
   * Get player's current rating and rank information
   * @param {string} playerId - Player identifier
   * @returns {PlayerRating} Rating data
   */
  getPlayerRating(playerId) {
    if (!this.playerRatings.has(playerId)) {
      this.playerRatings.set(playerId, {
        playerId,
        rating: INITIAL_RATING,
        seasonId: this.currentSeason.id,
        placementMatches: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        peakRating: INITIAL_RATING,
        createdAt: Date.now(),
        lastMatchAt: null
      });
    }
    return this.playerRatings.get(playerId);
  }

  /**
   * Update player rating after a match
   * @param {string} playerId - Player identifier
   * @param {number} opponentRating - Opponent's rating
   * @param {number} outcome - Match outcome (1=win, 0=loss, 0.5=draw)
   * @param {Object} matchData - Additional match data
   * @returns {RatingUpdate} Updated rating information
   */
  updatePlayerRating(playerId, opponentRating, outcome, matchData = {}) {
    const playerRating = this.getPlayerRating(playerId);
    const isPlacement = playerRating.placementMatches < PLACEMENT_MATCHES;
    
    const ratingChange = this.calculateRatingChange(
      playerRating.rating,
      opponentRating,
      outcome,
      isPlacement
    );

    const oldRating = playerRating.rating;
    const newRating = Math.max(0, oldRating + ratingChange);
    const oldRank = this.getRankFromRating(oldRating);
    const newRank = this.getRankFromRating(newRating);

    // Update player rating
    playerRating.rating = newRating;
    playerRating.peakRating = Math.max(playerRating.peakRating, newRating);
    playerRating.lastMatchAt = Date.now();

    if (isPlacement) {
      playerRating.placementMatches++;
    }

    if (outcome === 1) {
      playerRating.wins++;
      playerRating.winStreak++;
    } else if (outcome === 0) {
      playerRating.losses++;
      playerRating.winStreak = 0;
    }

    // Record match in history
    this.recordMatch(playerId, {
      ...matchData,
      opponentRating,
      outcome,
      ratingChange,
      oldRating,
      newRating,
      isPlacement,
      timestamp: Date.now()
    });

    return {
      playerId,
      oldRating,
      newRating,
      ratingChange,
      oldRank,
      newRank,
      rankChanged: oldRank.id !== newRank.id,
      isPlacement,
      placementMatchesRemaining: Math.max(0, PLACEMENT_MATCHES - playerRating.placementMatches)
    };
  }

  /**
   * Find suitable opponents for matchmaking
   * @param {string} playerId - Player looking for match
   * @param {string[]} queuePool - Available players in queue
   * @param {number} maxRatingDiff - Maximum rating difference (default 200)
   * @returns {string[]} Sorted list of suitable opponents
   */
  findMatchmakingOpponents(playerId, queuePool, maxRatingDiff = 200) {
    const playerRating = this.getPlayerRating(playerId);
    const candidates = [];

    for (const opponentId of queuePool) {
      if (opponentId === playerId) continue;
      
      const opponentRating = this.getPlayerRating(opponentId);
      const ratingDiff = Math.abs(playerRating.rating - opponentRating.rating);
      
      if (ratingDiff <= maxRatingDiff) {
        candidates.push({
          playerId: opponentId,
          rating: opponentRating.rating,
          ratingDiff,
          priority: this.calculateMatchmakingPriority(playerRating, opponentRating)
        });
      }
    }

    // Sort by priority (lower is better)
    return candidates
      .sort((a, b) => a.priority - b.priority)
      .map(candidate => candidate.playerId);
  }

  /**
   * Calculate matchmaking priority (lower = better match)
   * @param {PlayerRating} playerRating - Player's rating data
   * @param {PlayerRating} opponentRating - Opponent's rating data
   * @returns {number} Priority score
   */
  calculateMatchmakingPriority(playerRating, opponentRating) {
    const ratingDiff = Math.abs(playerRating.rating - opponentRating.rating);
    const placementBonus = (playerRating.placementMatches < PLACEMENT_MATCHES) ? -50 : 0;
    const streakPenalty = Math.abs(playerRating.winStreak - opponentRating.winStreak) * 10;
    
    return ratingDiff + streakPenalty + placementBonus;
  }

  /**
   * Get rank from rating value
   * @param {number} rating - Player rating
   * @returns {Rank} Rank information
   */
  getRankFromRating(rating) {
    return RANKS.find(rank => rating >= rank.minRating && rating <= rank.maxRating) || RANKS[0];
  }

  /**
   * Record match in player's history
   * @param {string} playerId - Player identifier
   * @param {Object} matchRecord - Match data to record
   */
  recordMatch(playerId, matchRecord) {
    if (!this.matchHistory.has(playerId)) {
      this.matchHistory.set(playerId, []);
    }
    
    const history = this.matchHistory.get(playerId);
    history.push(matchRecord);
    
    // Keep last 50 matches
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  /**
   * Get player's match history
   * @param {string} playerId - Player identifier
   * @param {number} limit - Maximum number of matches to return
   * @returns {MatchRecord[]} Recent matches
   */
  getMatchHistory(playerId, limit = 10) {
    const history = this.matchHistory.get(playerId) || [];
    return history.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get leaderboard for current season
   * @param {number} limit - Number of players to return
   * @returns {LeaderboardEntry[]} Top players
   */
  getLeaderboard(limit = 100) {
    const players = Array.from(this.playerRatings.values())
      .filter(player => player.seasonId === this.currentSeason.id)
      .filter(player => player.placementMatches >= PLACEMENT_MATCHES || player.wins + player.losses >= 5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return players.map((player, index) => ({
      rank: index + 1,
      playerId: player.playerId,
      rating: player.rating,
      rankInfo: this.getRankFromRating(player.rating),
      wins: player.wins,
      losses: player.losses,
      winRate: player.wins + player.losses > 0 ? player.wins / (player.wins + player.losses) : 0,
      winStreak: player.winStreak,
      peakRating: player.peakRating
    }));
  }

  /**
   * Create a new competitive season
   * @param {string} seasonId - Unique season identifier
   * @param {string} name - Season display name
   * @param {number} startTime - Season start timestamp
   * @returns {Season} Season data
   */
  createSeason(seasonId, name, startTime) {
    const season = {
      id: seasonId,
      name,
      startTime,
      endTime: null,
      isActive: true,
      rewards: {
        genin: { icon: '🥉', title: 'Academy Graduate' },
        chunin: { icon: '🥈', title: 'Skilled Ninja' },
        jonin: { icon: '🥇', title: 'Elite Warrior' },
        anbu: { icon: '⭐', title: 'Shadow Operative' },
        kage: { icon: '👑', title: 'Village Leader' },
        legendary: { icon: '💎', title: 'Legend of the Ninja World' }
      }
    };
    
    this.seasons.set(seasonId, season);
    return season;
  }

  /**
   * Get current season information
   * @returns {Season} Current season
   */
  getCurrentSeason() {
    return this.currentSeason;
  }

  /**
   * Export player data for persistence
   * @returns {Object} Serializable ranking data
   */
  exportData() {
    return {
      seasons: Object.fromEntries(this.seasons),
      playerRatings: Object.fromEntries(this.playerRatings),
      matchHistory: Object.fromEntries(this.matchHistory),
      currentSeasonId: this.currentSeason.id
    };
  }

  /**
   * Import player data from persistence
   * @param {Object} data - Serialized ranking data
   */
  importData(data) {
    if (data.seasons) {
      this.seasons = new Map(Object.entries(data.seasons));
    }
    if (data.playerRatings) {
      this.playerRatings = new Map(Object.entries(data.playerRatings));
    }
    if (data.matchHistory) {
      this.matchHistory = new Map(Object.entries(data.matchHistory));
    }
    if (data.currentSeasonId && this.seasons.has(data.currentSeasonId)) {
      this.currentSeason = this.seasons.get(data.currentSeasonId);
    }
  }
}

// Singleton instance for global access
export const rankingSystem = new RankingSystem();