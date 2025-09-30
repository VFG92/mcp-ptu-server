/**
 * Peer Review Kernel
 * 
 * Enables critical peer review between agents acting as reviewers.
 * Agents don't just generate parallel scenarios - they critique each other,
 * creating an internal self-evaluation mechanism where consensus/conflict
 * becomes a measure of result robustness.
 * 
 * Key Features:
 * - Cross-agent critique generation
 * - Consensus/conflict measurement
 * - Robustness scoring based on peer agreement
 * - Integration with tournament and confidence systems
 */

import type { CapabilityResult } from './capability-graph.js';
import type { VerificationResult } from './evidence-ledger.js';

/**
 * Critique from one agent reviewing another's result
 */
export interface PeerCritique {
  reviewer_id: string;           // ID of the reviewing capability/agent
  reviewed_id: string;           // ID of the capability/agent being reviewed
  agreement_score: number;       // 0-1, how much reviewer agrees with result
  critique_points: CritiquePoint[];
  overall_assessment: 'strong_agree' | 'agree' | 'neutral' | 'disagree' | 'strong_disagree';
  confidence_in_critique: number; // 0-1, reviewer's confidence in their critique
  timestamp: number;
}

/**
 * Individual critique point
 */
export interface CritiquePoint {
  aspect: string;                // What aspect is being critiqued (e.g., "methodology", "assumptions", "evidence")
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  description: string;
  suggested_improvement?: string;
  evidence_reference?: string;   // Reference to evidence that supports the critique
}

/**
 * Consensus analysis result
 */
export interface ConsensusAnalysis {
  consensus_score: number;       // 0-1, overall agreement level
  conflict_score: number;        // 0-1, level of disagreement
  robustness_score: number;      // 0-1, how robust results are based on peer review
  agreement_matrix: number[][];  // NxN matrix of pairwise agreement scores
  clusters: ResultCluster[];     // Groups of results that agree with each other
  outliers: string[];            // Result IDs that are outliers
  critical_disagreements: CriticalDisagreement[];
}

/**
 * Cluster of results that agree with each other
 */
export interface ResultCluster {
  cluster_id: string;
  member_ids: string[];
  avg_internal_agreement: number;
  representative_id: string;     // Most central result in cluster
  cluster_size: number;
}

/**
 * Critical disagreement between results
 */
export interface CriticalDisagreement {
  result_1_id: string;
  result_2_id: string;
  disagreement_score: number;    // 0-1
  key_differences: string[];
  impact: 'high' | 'medium' | 'low';
}

/**
 * Peer review result for a single capability result
 */
export interface PeerReviewResult {
  result_id: string;
  received_critiques: PeerCritique[];
  given_critiques: PeerCritique[];
  avg_peer_agreement: number;    // Average agreement from all reviewers
  peer_confidence: number;       // Confidence based on peer reviews
  controversy_score: number;     // 0-1, how controversial this result is
  strengths: string[];           // Identified by peers
  weaknesses: string[];          // Identified by peers
}

/**
 * Complete peer review session result
 */
export interface PeerReviewSession {
  session_id: string;
  results_reviewed: number;
  peer_reviews: Map<string, PeerReviewResult>;
  consensus_analysis: ConsensusAnalysis;
  overall_robustness: number;    // 0-1, overall robustness of all results
  review_quality: number;        // 0-1, quality of the review process itself
  timestamp: number;
}

/**
 * Peer Review Kernel
 */
export class PeerReviewKernel {
  /**
   * Conduct peer review session for multiple capability results
   */
  async conductPeerReview(
    results: CapabilityResult[],
    verifications: Map<string, VerificationResult>
  ): Promise<PeerReviewSession> {
    if (results.length < 2) {
      // Need at least 2 results for peer review
      return this.createEmptySession(results);
    }

    // Step 1: Generate critiques (each result reviews all others)
    const critiques = this.generateCritiques(results, verifications);

    // Step 2: Build peer review results for each capability
    const peerReviews = new Map<string, PeerReviewResult>();
    for (const result of results) {
      const peerReview = this.buildPeerReviewResult(result, critiques);
      peerReviews.set(result.capability_id, peerReview);
    }

    // Step 3: Analyze consensus and conflicts
    const consensusAnalysis = this.analyzeConsensus(results, critiques);

    // Step 4: Calculate overall robustness
    const overallRobustness = this.calculateOverallRobustness(consensusAnalysis, peerReviews);

    // Step 5: Assess review quality
    const reviewQuality = this.assessReviewQuality(critiques, results);

    return {
      session_id: `peer_review_${Date.now()}`,
      results_reviewed: results.length,
      peer_reviews: peerReviews,
      consensus_analysis: consensusAnalysis,
      overall_robustness: overallRobustness,
      review_quality: reviewQuality,
      timestamp: Date.now()
    };
  }

  /**
   * Generate critiques between all pairs of results
   */
  private generateCritiques(
    results: CapabilityResult[],
    verifications: Map<string, VerificationResult>
  ): PeerCritique[] {
    const critiques: PeerCritique[] = [];

    // Each result reviews all other results
    for (let i = 0; i < results.length; i++) {
      for (let j = 0; j < results.length; j++) {
        if (i === j) continue; // Don't review yourself

        const reviewer = results[i];
        const reviewed = results[j];

        const critique = this.generateSingleCritique(
          reviewer,
          reviewed,
          verifications.get(reviewer.capability_id),
          verifications.get(reviewed.capability_id)
        );

        critiques.push(critique);
      }
    }

    return critiques;
  }

  /**
   * Generate a single critique from one result reviewing another
   */
  private generateSingleCritique(
    reviewer: CapabilityResult,
    reviewed: CapabilityResult,
    reviewerVerification?: VerificationResult,
    reviewedVerification?: VerificationResult
  ): PeerCritique {
    const critiquePoints: CritiquePoint[] = [];

    // Critique 1: Confidence comparison
    if (Math.abs(reviewer.confidence - reviewed.confidence) > 0.3) {
      critiquePoints.push({
        aspect: 'confidence_level',
        severity: 'major',
        description: `Significant confidence gap: reviewer has ${(reviewer.confidence * 100).toFixed(0)}% confidence vs reviewed ${(reviewed.confidence * 100).toFixed(0)}%`,
        suggested_improvement: 'Re-evaluate assumptions and evidence quality'
      });
    }

    // Critique 2: Evidence quality comparison
    if (reviewerVerification && reviewedVerification) {
      const reviewerEvidence = reviewerVerification.checks_passed / Math.max(1, reviewerVerification.checks_run);
      const reviewedEvidence = reviewedVerification.checks_passed / Math.max(1, reviewedVerification.checks_run);

      if (reviewerEvidence > reviewedEvidence + 0.2) {
        critiquePoints.push({
          aspect: 'evidence_quality',
          severity: 'critical',
          description: `Evidence quality concern: ${(reviewedEvidence * 100).toFixed(0)}% checks passed vs reviewer's ${(reviewerEvidence * 100).toFixed(0)}%`,
          suggested_improvement: 'Strengthen evidence backing for key claims'
        });
      }
    }

    // Critique 3: Output similarity (simple heuristic based on confidence alignment)
    const outputSimilarity = this.calculateOutputSimilarity(reviewer.output, reviewed.output);
    if (outputSimilarity < 0.3) {
      critiquePoints.push({
        aspect: 'methodology',
        severity: 'major',
        description: 'Significantly different approach or conclusions',
        suggested_improvement: 'Consider alternative perspectives or validate assumptions'
      });
    }

    // Calculate agreement score based on critiques
    const agreementScore = this.calculateAgreementScore(critiquePoints, reviewer, reviewed);

    // Determine overall assessment
    const overallAssessment = this.determineOverallAssessment(agreementScore);

    return {
      reviewer_id: reviewer.capability_id,
      reviewed_id: reviewed.capability_id,
      agreement_score: agreementScore,
      critique_points: critiquePoints,
      overall_assessment: overallAssessment,
      confidence_in_critique: reviewer.confidence,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate similarity between two outputs (simplified heuristic)
   */
  private calculateOutputSimilarity(output1: any, output2: any): number {
    // Simple heuristic: if both outputs are objects, compare their structure
    if (typeof output1 === 'object' && typeof output2 === 'object') {
      const keys1 = Object.keys(output1 || {});
      const keys2 = Object.keys(output2 || {});
      const commonKeys = keys1.filter(k => keys2.includes(k));
      return commonKeys.length / Math.max(keys1.length, keys2.length, 1);
    }

    // For non-objects, assume moderate similarity
    return 0.5;
  }

  /**
   * Calculate agreement score based on critique points
   */
  private calculateAgreementScore(
    critiquePoints: CritiquePoint[],
    reviewer: CapabilityResult,
    reviewed: CapabilityResult
  ): number {
    // Start with base agreement from confidence similarity
    const confidenceSimilarity = 1 - Math.abs(reviewer.confidence - reviewed.confidence);

    // Penalize for critical/major issues
    let penalty = 0;
    for (const point of critiquePoints) {
      if (point.severity === 'critical') penalty += 0.3;
      else if (point.severity === 'major') penalty += 0.15;
      else if (point.severity === 'minor') penalty += 0.05;
    }

    return Math.max(0, Math.min(1, confidenceSimilarity - penalty));
  }

  /**
   * Determine overall assessment from agreement score
   */
  private determineOverallAssessment(agreementScore: number): PeerCritique['overall_assessment'] {
    if (agreementScore >= 0.8) return 'strong_agree';
    if (agreementScore >= 0.6) return 'agree';
    if (agreementScore >= 0.4) return 'neutral';
    if (agreementScore >= 0.2) return 'disagree';
    return 'strong_disagree';
  }

  /**
   * Build peer review result for a single capability result
   */
  private buildPeerReviewResult(
    result: CapabilityResult,
    allCritiques: PeerCritique[]
  ): PeerReviewResult {
    const receivedCritiques = allCritiques.filter(c => c.reviewed_id === result.capability_id);
    const givenCritiques = allCritiques.filter(c => c.reviewer_id === result.capability_id);

    // Calculate average peer agreement
    const avgPeerAgreement = receivedCritiques.length > 0
      ? receivedCritiques.reduce((sum, c) => sum + c.agreement_score, 0) / receivedCritiques.length
      : 1.0;

    // Calculate peer confidence (weighted by reviewer confidence)
    const peerConfidence = receivedCritiques.length > 0
      ? receivedCritiques.reduce((sum, c) => sum + c.agreement_score * c.confidence_in_critique, 0) /
        receivedCritiques.reduce((sum, c) => sum + c.confidence_in_critique, 0)
      : result.confidence;

    // Calculate controversy score (variance in agreement)
    const controversyScore = this.calculateControversyScore(receivedCritiques);

    // Extract strengths and weaknesses
    const { strengths, weaknesses } = this.extractStrengthsWeaknesses(receivedCritiques);

    return {
      result_id: result.capability_id,
      received_critiques: receivedCritiques,
      given_critiques: givenCritiques,
      avg_peer_agreement: avgPeerAgreement,
      peer_confidence: peerConfidence,
      controversy_score: controversyScore,
      strengths,
      weaknesses
    };
  }

  /**
   * Calculate controversy score from critiques
   */
  private calculateControversyScore(critiques: PeerCritique[]): number {
    if (critiques.length < 2) return 0;

    const agreements = critiques.map(c => c.agreement_score);
    const mean = agreements.reduce((a, b) => a + b, 0) / agreements.length;
    const variance = agreements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / agreements.length;

    return Math.sqrt(variance); // Standard deviation as controversy measure
  }

  /**
   * Extract strengths and weaknesses from critiques
   */
  private extractStrengthsWeaknesses(critiques: PeerCritique[]): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const critique of critiques) {
      if (critique.overall_assessment === 'strong_agree' || critique.overall_assessment === 'agree') {
        strengths.push(`High agreement from ${critique.reviewer_id}`);
      }

      for (const point of critique.critique_points) {
        if (point.severity === 'critical' || point.severity === 'major') {
          weaknesses.push(`${point.aspect}: ${point.description}`);
        }
      }
    }

    return { strengths, weaknesses };
  }

  /**
   * Analyze consensus and conflicts across all results
   */
  private analyzeConsensus(
    results: CapabilityResult[],
    critiques: PeerCritique[]
  ): ConsensusAnalysis {
    // Build agreement matrix
    const n = results.length;
    const agreementMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      agreementMatrix[i][i] = 1.0; // Perfect self-agreement
    }

    for (const critique of critiques) {
      const reviewerIdx = results.findIndex(r => r.capability_id === critique.reviewer_id);
      const reviewedIdx = results.findIndex(r => r.capability_id === critique.reviewed_id);

      if (reviewerIdx >= 0 && reviewedIdx >= 0) {
        agreementMatrix[reviewerIdx][reviewedIdx] = critique.agreement_score;
      }
    }

    // Calculate consensus score (average of all pairwise agreements)
    let totalAgreement = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          totalAgreement += agreementMatrix[i][j];
          count++;
        }
      }
    }
    const consensusScore = count > 0 ? totalAgreement / count : 1.0;

    // Calculate conflict score (inverse of consensus)
    const conflictScore = 1 - consensusScore;

    // Identify clusters using simple threshold-based clustering
    const clusters = this.identifyClusters(results, agreementMatrix, 0.6);

    // Identify outliers (results with low average agreement)
    const outliers = this.identifyOutliers(results, agreementMatrix, 0.4);

    // Identify critical disagreements
    const criticalDisagreements = this.identifyCriticalDisagreements(results, agreementMatrix, critiques);

    // Calculate robustness score
    const robustnessScore = this.calculateRobustnessScore(consensusScore, clusters, outliers);

    return {
      consensus_score: consensusScore,
      conflict_score: conflictScore,
      robustness_score: robustnessScore,
      agreement_matrix: agreementMatrix,
      clusters,
      outliers,
      critical_disagreements: criticalDisagreements
    };
  }

  /**
   * Identify clusters of results that agree with each other
   */
  private identifyClusters(
    results: CapabilityResult[],
    agreementMatrix: number[][],
    threshold: number
  ): ResultCluster[] {
    const n = results.length;
    const visited = new Set<number>();
    const clusters: ResultCluster[] = [];

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;

      const cluster: number[] = [i];
      visited.add(i);

      // Find all results that agree with this one above threshold
      for (let j = 0; j < n; j++) {
        if (i !== j && !visited.has(j) && agreementMatrix[i][j] >= threshold) {
          cluster.push(j);
          visited.add(j);
        }
      }

      // Calculate average internal agreement
      let internalAgreement = 0;
      let count = 0;
      for (const idx1 of cluster) {
        for (const idx2 of cluster) {
          if (idx1 !== idx2) {
            internalAgreement += agreementMatrix[idx1][idx2];
            count++;
          }
        }
      }
      const avgInternalAgreement = count > 0 ? internalAgreement / count : 1.0;

      // Find representative (most central result in cluster)
      let bestRepresentative = cluster[0];
      let bestAvgAgreement = 0;
      for (const idx of cluster) {
        const avgAgreement = cluster.reduce((sum, otherIdx) => sum + agreementMatrix[idx][otherIdx], 0) / cluster.length;
        if (avgAgreement > bestAvgAgreement) {
          bestAvgAgreement = avgAgreement;
          bestRepresentative = idx;
        }
      }

      clusters.push({
        cluster_id: `cluster_${clusters.length + 1}`,
        member_ids: cluster.map(idx => results[idx].capability_id),
        avg_internal_agreement: avgInternalAgreement,
        representative_id: results[bestRepresentative].capability_id,
        cluster_size: cluster.length
      });
    }

    return clusters;
  }

  /**
   * Identify outlier results with low peer agreement
   */
  private identifyOutliers(
    results: CapabilityResult[],
    agreementMatrix: number[][],
    threshold: number
  ): string[] {
    const outliers: string[] = [];

    for (let i = 0; i < results.length; i++) {
      // Calculate average agreement for this result
      let totalAgreement = 0;
      for (let j = 0; j < results.length; j++) {
        if (i !== j) {
          totalAgreement += agreementMatrix[i][j];
        }
      }
      const avgAgreement = totalAgreement / (results.length - 1);

      if (avgAgreement < threshold) {
        outliers.push(results[i].capability_id);
      }
    }

    return outliers;
  }

  /**
   * Identify critical disagreements between results
   */
  private identifyCriticalDisagreements(
    results: CapabilityResult[],
    agreementMatrix: number[][],
    critiques: PeerCritique[]
  ): CriticalDisagreement[] {
    const disagreements: CriticalDisagreement[] = [];

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const disagreementScore = 1 - agreementMatrix[i][j];

        if (disagreementScore >= 0.6) { // High disagreement threshold
          // Find critiques between these two results
          const relevantCritiques = critiques.filter(
            c => (c.reviewer_id === results[i].capability_id && c.reviewed_id === results[j].capability_id) ||
                 (c.reviewer_id === results[j].capability_id && c.reviewed_id === results[i].capability_id)
          );

          const keyDifferences = relevantCritiques.flatMap(c =>
            c.critique_points
              .filter(p => p.severity === 'critical' || p.severity === 'major')
              .map(p => p.description)
          );

          disagreements.push({
            result_1_id: results[i].capability_id,
            result_2_id: results[j].capability_id,
            disagreement_score: disagreementScore,
            key_differences: keyDifferences,
            impact: disagreementScore >= 0.8 ? 'high' : disagreementScore >= 0.7 ? 'medium' : 'low'
          });
        }
      }
    }

    return disagreements;
  }

  /**
   * Calculate robustness score based on consensus analysis
   */
  private calculateRobustnessScore(
    consensusScore: number,
    clusters: ResultCluster[],
    outliers: string[]
  ): number {
    // Base robustness from consensus
    let robustness = consensusScore;

    // Bonus for having clear clusters (indicates structured agreement)
    if (clusters.length > 0 && clusters.length < 4) {
      const largestCluster = Math.max(...clusters.map(c => c.cluster_size));
      robustness += 0.1 * (largestCluster / (largestCluster + outliers.length));
    }

    // Penalty for outliers
    const outlierPenalty = outliers.length * 0.05;
    robustness -= outlierPenalty;

    return Math.max(0, Math.min(1, robustness));
  }

  /**
   * Calculate overall robustness across all results
   */
  private calculateOverallRobustness(
    consensusAnalysis: ConsensusAnalysis,
    peerReviews: Map<string, PeerReviewResult>
  ): number {
    // Weight consensus analysis heavily
    let robustness = consensusAnalysis.robustness_score * 0.6;

    // Add average peer confidence
    const avgPeerConfidence = Array.from(peerReviews.values())
      .reduce((sum, pr) => sum + pr.peer_confidence, 0) / peerReviews.size;
    robustness += avgPeerConfidence * 0.3;

    // Penalize high controversy
    const avgControversy = Array.from(peerReviews.values())
      .reduce((sum, pr) => sum + pr.controversy_score, 0) / peerReviews.size;
    robustness -= avgControversy * 0.1;

    return Math.max(0, Math.min(1, robustness));
  }

  /**
   * Assess the quality of the review process itself
   */
  private assessReviewQuality(
    critiques: PeerCritique[],
    results: CapabilityResult[]
  ): number {
    if (critiques.length === 0) return 0;

    // Quality factor 1: Reviewer confidence
    const avgReviewerConfidence = critiques.reduce((sum, c) => sum + c.confidence_in_critique, 0) / critiques.length;

    // Quality factor 2: Critique depth (number of critique points)
    const avgCritiqueDepth = critiques.reduce((sum, c) => sum + c.critique_points.length, 0) / critiques.length;
    const depthScore = Math.min(1, avgCritiqueDepth / 3); // Normalize to 0-1

    // Quality factor 3: Coverage (all results reviewed by all others)
    const expectedCritiques = results.length * (results.length - 1);
    const coverageScore = critiques.length / expectedCritiques;

    return (avgReviewerConfidence * 0.4 + depthScore * 0.3 + coverageScore * 0.3);
  }

  /**
   * Create empty session for cases with insufficient results
   */
  private createEmptySession(results: CapabilityResult[]): PeerReviewSession {
    return {
      session_id: `peer_review_${Date.now()}`,
      results_reviewed: results.length,
      peer_reviews: new Map(),
      consensus_analysis: {
        consensus_score: 1.0,
        conflict_score: 0,
        robustness_score: results.length === 1 ? 0.5 : 0, // Single result has moderate robustness
        agreement_matrix: [[1.0]],
        clusters: [],
        outliers: [],
        critical_disagreements: []
      },
      overall_robustness: results.length === 1 ? 0.5 : 0,
      review_quality: 0,
      timestamp: Date.now()
    };
  }
}

/**
 * Global peer review kernel instance
 */
export const globalPeerReviewKernel = new PeerReviewKernel();

