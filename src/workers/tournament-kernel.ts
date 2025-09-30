/**
 * Tournament Kernel
 * 
 * Replaces theatrical debate with tournament-of-programs:
 * - Best-of-N with forced diversification
 * - Multi-criteria judging panel
 * - Evidence verification
 * - Bandit allocation for budget optimization
 */

import type { CapabilityResult } from './capability-graph.js';
import type { VerificationResult } from './evidence-ledger.js';

/**
 * Tournament contestant
 */
export interface Contestant {
  id: string;
  result: CapabilityResult;
  verification: VerificationResult;
  diversity_score: number;      // 0-1, how different from others
  wins: number;
  losses: number;
  elo_rating: number;
}

/**
 * Judging criteria
 */
export interface JudgingCriteria {
  name: string;
  weight: number;               // 0-1
  evaluate: (result: CapabilityResult, verification: VerificationResult) => number; // 0-1
}

/**
 * Tournament round
 */
export interface TournamentRound {
  round_number: number;
  matchups: Array<{
    contestant_1: string;
    contestant_2: string;
    winner: string;
    scores: Record<string, number>; // criteria -> score
    margin: number;
  }>;
}

/**
 * Tournament result
 */
export interface TournamentResult {
  winner: Contestant;
  finalists: Contestant[];
  rounds: TournamentRound[];
  final_rankings: Array<{
    rank: number;
    contestant_id: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  diversity_analysis: {
    avg_diversity: number;
    min_diversity: number;
    orthogonality_achieved: boolean;
  };
}

/**
 * Bandit arm for budget allocation
 */
export interface BanditArm {
  capability_id: string;
  pulls: number;
  total_reward: number;
  avg_reward: number;
  confidence_bound: number;
}

/**
 * Tournament Kernel
 */
export class TournamentKernel {
  private criteria: JudgingCriteria[];
  private diversityThreshold: number;

  constructor(
    criteria?: JudgingCriteria[],
    diversityThreshold: number = 0.3
  ) {
    this.criteria = criteria || this.getDefaultCriteria();
    this.diversityThreshold = diversityThreshold;
  }

  /**
   * Run tournament with N contestants
   */
  async runTournament(
    results: CapabilityResult[],
    verifications: Map<string, VerificationResult>,
    maxRounds: number = 3
  ): Promise<TournamentResult> {
    // Create contestants
    const contestants = this.createContestants(results, verifications);

    // Enforce diversity
    const diverseContestants = this.enforceDiversity(contestants);

    // Run tournament rounds
    const rounds: TournamentRound[] = [];
    let activeContestants = diverseContestants;

    for (let i = 0; i < maxRounds && activeContestants.length > 1; i++) {
      const round = await this.runRound(activeContestants, i + 1);
      rounds.push(round);

      // Advance winners
      const winners = new Set(round.matchups.map(m => m.winner));
      activeContestants = activeContestants.filter(c => winners.has(c.id));
    }

    // Final rankings
    const rankings = this.calculateRankings(diverseContestants);

    // Diversity analysis
    const diversity = this.analyzeDiversity(diverseContestants);

    return {
      winner: activeContestants[0],
      finalists: activeContestants.slice(0, 3),
      rounds,
      final_rankings: rankings,
      diversity_analysis: diversity
    };
  }

  /**
   * Create contestants from results
   */
  private createContestants(
    results: CapabilityResult[],
    verifications: Map<string, VerificationResult>
  ): Contestant[] {
    return results.map(result => ({
      id: result.capability_id,
      result,
      verification: verifications.get(result.capability_id) || {
        passed: false,
        checks_run: 0,
        checks_passed: 0,
        failures: [],
        confidence_adjustment: 0
      },
      diversity_score: 0,
      wins: 0,
      losses: 0,
      elo_rating: 1500 // Starting ELO
    }));
  }

  /**
   * Enforce diversity - remove similar contestants
   */
  private enforceDiversity(contestants: Contestant[]): Contestant[] {
    if (contestants.length <= 1) return contestants;

    const diverse: Contestant[] = [contestants[0]];

    for (let i = 1; i < contestants.length; i++) {
      const candidate = contestants[i];
      
      // Calculate diversity from existing diverse set
      let minDiversity = 1.0;
      for (const existing of diverse) {
        const diversity = this.calculateDiversity(candidate, existing);
        minDiversity = Math.min(minDiversity, diversity);
      }

      candidate.diversity_score = minDiversity;

      // Only add if sufficiently diverse
      if (minDiversity >= this.diversityThreshold) {
        diverse.push(candidate);
      }
    }

    return diverse;
  }

  /**
   * Calculate diversity between two contestants
   */
  private calculateDiversity(a: Contestant, b: Contestant): number {
    // Simple diversity based on output differences
    // In practice, would use semantic similarity, approach differences, etc.
    
    const aConfidence = a.result.confidence;
    const bConfidence = b.result.confidence;
    const confidenceDiff = Math.abs(aConfidence - bConfidence);

    const aQuality = a.result.quality_score;
    const bQuality = b.result.quality_score;
    const qualityDiff = Math.abs(aQuality - bQuality);

    // Average of differences
    return (confidenceDiff + qualityDiff) / 2;
  }

  /**
   * Run a single tournament round
   */
  private async runRound(
    contestants: Contestant[],
    roundNumber: number
  ): Promise<TournamentRound> {
    const matchups: TournamentRound['matchups'] = [];

    // Pair contestants
    for (let i = 0; i < contestants.length; i += 2) {
      if (i + 1 >= contestants.length) break;

      const c1 = contestants[i];
      const c2 = contestants[i + 1];

      // Judge the matchup
      const scores1 = this.judge(c1);
      const scores2 = this.judge(c2);

      const totalScore1 = Object.values(scores1).reduce((a, b) => a + b, 0);
      const totalScore2 = Object.values(scores2).reduce((a, b) => a + b, 0);

      const winner = totalScore1 > totalScore2 ? c1 : c2;
      const loser = winner === c1 ? c2 : c1;

      winner.wins++;
      loser.losses++;

      // Update ELO ratings
      this.updateElo(winner, loser);

      matchups.push({
        contestant_1: c1.id,
        contestant_2: c2.id,
        winner: winner.id,
        scores: totalScore1 > totalScore2 ? scores1 : scores2,
        margin: Math.abs(totalScore1 - totalScore2)
      });
    }

    return {
      round_number: roundNumber,
      matchups
    };
  }

  /**
   * Judge a contestant using all criteria
   */
  private judge(contestant: Contestant): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const criterion of this.criteria) {
      const score = criterion.evaluate(contestant.result, contestant.verification);
      scores[criterion.name] = score * criterion.weight;
    }

    return scores;
  }

  /**
   * Update ELO ratings
   */
  private updateElo(winner: Contestant, loser: Contestant, k: number = 32): void {
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo_rating - winner.elo_rating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo_rating - loser.elo_rating) / 400));

    winner.elo_rating += k * (1 - expectedWinner);
    loser.elo_rating += k * (0 - expectedLoser);
  }

  /**
   * Calculate final rankings
   */
  private calculateRankings(contestants: Contestant[]): TournamentResult['final_rankings'] {
    const sorted = [...contestants].sort((a, b) => {
      // Primary: wins
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Secondary: ELO
      return b.elo_rating - a.elo_rating;
    });

    return sorted.map((c, index) => {
      const scores = this.judge(c);
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      for (const [criterion, score] of Object.entries(scores)) {
        if (score > 0.7) {
          strengths.push(criterion);
        } else if (score < 0.4) {
          weaknesses.push(criterion);
        }
      }

      return {
        rank: index + 1,
        contestant_id: c.id,
        score: c.elo_rating,
        strengths,
        weaknesses
      };
    });
  }

  /**
   * Analyze diversity of contestant pool
   */
  private analyzeDiversity(contestants: Contestant[]): TournamentResult['diversity_analysis'] {
    if (contestants.length < 2) {
      return {
        avg_diversity: 1.0,
        min_diversity: 1.0,
        orthogonality_achieved: true
      };
    }

    let totalDiversity = 0;
    let minDiversity = 1.0;
    let comparisons = 0;

    for (let i = 0; i < contestants.length; i++) {
      for (let j = i + 1; j < contestants.length; j++) {
        const diversity = this.calculateDiversity(contestants[i], contestants[j]);
        totalDiversity += diversity;
        minDiversity = Math.min(minDiversity, diversity);
        comparisons++;
      }
    }

    const avgDiversity = comparisons > 0 ? totalDiversity / comparisons : 0;

    return {
      avg_diversity: avgDiversity,
      min_diversity: minDiversity,
      orthogonality_achieved: minDiversity >= this.diversityThreshold
    };
  }

  /**
   * Default judging criteria
   */
  private getDefaultCriteria(): JudgingCriteria[] {
    return [
      {
        name: 'factuality',
        weight: 0.3,
        evaluate: (result, verification) => {
          return verification.checks_run > 0
            ? verification.checks_passed / verification.checks_run
            : 0.5;
        }
      },
      {
        name: 'decision_utility',
        weight: 0.25,
        evaluate: (result) => {
          // Has actionable recommendations?
          return result.output.recommendations?.length > 0 ? 0.8 : 0.4;
        }
      },
      {
        name: 'specificity',
        weight: 0.2,
        evaluate: (result) => {
          // Has specific numbers and evidence?
          return result.evidence && Object.keys(result.evidence).length > 0 ? 0.9 : 0.3;
        }
      },
      {
        name: 'cost_efficiency',
        weight: 0.15,
        evaluate: (result) => {
          // Lower cost is better
          const totalTokens = result.cost_actual.expected_tokens_in + result.cost_actual.expected_tokens_out;
          return Math.max(0, 1 - (totalTokens / 10000));
        }
      },
      {
        name: 'quality',
        weight: 0.1,
        evaluate: (result) => {
          return result.quality_score;
        }
      }
    ];
  }
}

/**
 * Multi-Armed Bandit for budget allocation
 */
export class BudgetBandit {
  private arms: Map<string, BanditArm> = new Map();
  private explorationRate: number;

  constructor(capabilityIds: string[], explorationRate: number = 0.1) {
    this.explorationRate = explorationRate;
    
    // Initialize arms
    for (const id of capabilityIds) {
      this.arms.set(id, {
        capability_id: id,
        pulls: 0,
        total_reward: 0,
        avg_reward: 0,
        confidence_bound: Infinity
      });
    }
  }

  /**
   * Select next capability to allocate budget to (UCB1 algorithm)
   */
  selectArm(): string {
    // Exploration: random selection
    if (Math.random() < this.explorationRate) {
      const arms = Array.from(this.arms.keys());
      return arms[Math.floor(Math.random() * arms.length)];
    }

    // Exploitation: select arm with highest UCB
    let bestArm: string | null = null;
    let bestUcb = -Infinity;

    const totalPulls = Array.from(this.arms.values()).reduce((sum, arm) => sum + arm.pulls, 0);

    for (const [id, arm] of this.arms) {
      if (arm.pulls === 0) {
        return id; // Always try untested arms first
      }

      // UCB1 formula
      const ucb = arm.avg_reward + Math.sqrt((2 * Math.log(totalPulls)) / arm.pulls);
      
      if (ucb > bestUcb) {
        bestUcb = ucb;
        bestArm = id;
      }
    }

    return bestArm || Array.from(this.arms.keys())[0];
  }

  /**
   * Update arm with reward
   */
  updateArm(capabilityId: string, reward: number): void {
    const arm = this.arms.get(capabilityId);
    if (!arm) return;

    arm.pulls++;
    arm.total_reward += reward;
    arm.avg_reward = arm.total_reward / arm.pulls;
  }

  /**
   * Get arm statistics
   */
  getStats(): Array<{ capability_id: string; avg_reward: number; pulls: number }> {
    return Array.from(this.arms.values())
      .map(arm => ({
        capability_id: arm.capability_id,
        avg_reward: arm.avg_reward,
        pulls: arm.pulls
      }))
      .sort((a, b) => b.avg_reward - a.avg_reward);
  }
}

/**
 * Global tournament kernel instance
 */
export const globalTournamentKernel = new TournamentKernel();

