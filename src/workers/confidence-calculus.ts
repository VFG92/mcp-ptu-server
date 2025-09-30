/**
 * Confidence Calculus Engine
 * 
 * Replaces magic percentages with function-based confidence derived from:
 * - Verification passes
 * - Cross-module coherence
 * - Disagreement index
 * - Evidence quality
 */

import type { CapabilityResult } from './capability-graph.js';
import type { EvidenceLedger, VerificationResult } from './evidence-ledger.js';

/**
 * Confidence components
 */
export interface ConfidenceComponents {
  verification_score: number;     // 0-1, based on verification passes
  coherence_score: number;        // 0-1, cross-module consistency
  evidence_quality: number;       // 0-1, quality of evidence
  disagreement_penalty: number;   // 0-1, penalty for disagreement
  base_precision: number;         // 0-1, capability's expected precision
}

/**
 * Confidence result
 */
export interface ConfidenceResult {
  confidence: number;             // 0-1, final confidence
  components: ConfidenceComponents;
  confidence_interval?: [number, number]; // Only when from simulation
  rationale: string;
  quality_flags: string[];        // Warnings about confidence
}

/**
 * Disagreement between results
 */
export interface DisagreementAnalysis {
  disagreement_index: number;     // 0-1, how much results disagree
  conflicting_fields: Array<{
    field: string;
    values: any[];
    variance: number;
  }>;
  consensus_fields: string[];
}

/**
 * Confidence Calculus Engine
 */
export class ConfidenceCalculus {
  /**
   * Calculate confidence for a single capability result
   */
  calculateConfidence(
    result: CapabilityResult,
    verificationResult: VerificationResult,
    evidenceQuality: number
  ): ConfidenceResult {
    const components: ConfidenceComponents = {
      verification_score: this.calculateVerificationScore(verificationResult),
      coherence_score: 1.0, // Default to 1.0 for single result
      evidence_quality: evidenceQuality,
      disagreement_penalty: 0,
      base_precision: result.confidence
    };

    // Calculate weighted confidence
    const confidence = this.weightedConfidence(components);

    // Generate quality flags
    const quality_flags = this.generateQualityFlags(components, verificationResult);

    return {
      confidence,
      components,
      rationale: this.generateRationale(components),
      quality_flags
    };
  }

  /**
   * Calculate confidence for multiple related results
   */
  calculateAggregateConfidence(
    results: CapabilityResult[],
    verificationResults: Map<string, VerificationResult>,
    evidenceQualities: Map<string, number>,
    ledger: EvidenceLedger
  ): ConfidenceResult {
    if (results.length === 0) {
      return {
        confidence: 0,
        components: {
          verification_score: 0,
          coherence_score: 0,
          evidence_quality: 0,
          disagreement_penalty: 0,
          base_precision: 0
        },
        rationale: 'No results to analyze',
        quality_flags: ['no_results']
      };
    }

    // Calculate average verification score
    const avgVerification = Array.from(verificationResults.values())
      .reduce((sum, vr) => sum + this.calculateVerificationScore(vr), 0) / verificationResults.size;

    // Calculate average evidence quality
    const avgEvidenceQuality = Array.from(evidenceQualities.values())
      .reduce((sum, eq) => sum + eq, 0) / evidenceQualities.size;

    // Calculate coherence across results
    const coherence = this.calculateCoherence(results);

    // Calculate disagreement
    const disagreement = this.analyzeDisagreement(results);

    // Average base precision
    const avgPrecision = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    const components: ConfidenceComponents = {
      verification_score: avgVerification,
      coherence_score: coherence,
      evidence_quality: avgEvidenceQuality,
      disagreement_penalty: disagreement.disagreement_index,
      base_precision: avgPrecision
    };

    const confidence = this.weightedConfidence(components);

    return {
      confidence,
      components,
      rationale: this.generateRationale(components),
      quality_flags: this.generateQualityFlags(components, null)
    };
  }

  /**
   * Calculate verification score from verification result
   */
  private calculateVerificationScore(verification: VerificationResult): number {
    if (verification.checks_run === 0) return 0.5; // Neutral if no checks

    const passRate = verification.checks_passed / verification.checks_run;
    
    // Penalize critical failures more heavily
    const criticalFailures = verification.failures.filter(f => f.severity === 'critical').length;
    const criticalPenalty = criticalFailures * 0.1;

    return Math.max(0, passRate - criticalPenalty);
  }

  /**
   * Calculate coherence across multiple results
   */
  private calculateCoherence(results: CapabilityResult[]): number {
    if (results.length < 2) return 1.0;

    // Check for logical consistency
    // For now, use a simple heuristic based on confidence variance
    const confidences = results.map(r => r.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    
    // Low variance = high coherence
    return Math.max(0, 1 - variance);
  }

  /**
   * Analyze disagreement between results
   */
  analyzeDisagreement(results: CapabilityResult[]): DisagreementAnalysis {
    if (results.length < 2) {
      return {
        disagreement_index: 0,
        conflicting_fields: [],
        consensus_fields: []
      };
    }

    // Simple disagreement based on confidence spread
    const confidences = results.map(r => r.confidence);
    const min = Math.min(...confidences);
    const max = Math.max(...confidences);
    const spread = max - min;

    return {
      disagreement_index: spread,
      conflicting_fields: [],
      consensus_fields: []
    };
  }

  /**
   * Calculate weighted confidence from components
   */
  private weightedConfidence(components: ConfidenceComponents): number {
    const weights = {
      verification: 0.25,
      coherence: 0.20,
      evidence: 0.20,
      disagreement: 0.15,
      precision: 0.20
    };

    const weighted = 
      components.verification_score * weights.verification +
      components.coherence_score * weights.coherence +
      components.evidence_quality * weights.evidence +
      (1 - components.disagreement_penalty) * weights.disagreement +
      components.base_precision * weights.precision;

    return Math.max(0, Math.min(1, weighted));
  }

  /**
   * Generate rationale for confidence score
   */
  private generateRationale(components: ConfidenceComponents): string {
    const parts: string[] = [];

    if (components.verification_score >= 0.8) {
      parts.push('strong verification');
    } else if (components.verification_score >= 0.6) {
      parts.push('moderate verification');
    } else {
      parts.push('weak verification');
    }

    if (components.evidence_quality >= 0.7) {
      parts.push('high-quality evidence');
    } else if (components.evidence_quality >= 0.5) {
      parts.push('moderate evidence quality');
    } else {
      parts.push('limited evidence');
    }

    if (components.coherence_score >= 0.8) {
      parts.push('high coherence');
    } else if (components.coherence_score < 0.6) {
      parts.push('low coherence');
    }

    if (components.disagreement_penalty > 0.3) {
      parts.push('significant disagreement');
    }

    return `Confidence based on: ${parts.join(', ')}`;
  }

  /**
   * Generate quality flags
   */
  private generateQualityFlags(
    components: ConfidenceComponents,
    verification: VerificationResult | null
  ): string[] {
    const flags: string[] = [];

    if (components.verification_score < 0.5) {
      flags.push('low_verification');
    }

    if (components.evidence_quality < 0.5) {
      flags.push('weak_evidence');
    }

    if (components.coherence_score < 0.6) {
      flags.push('low_coherence');
    }

    if (components.disagreement_penalty > 0.3) {
      flags.push('high_disagreement');
    }

    if (verification && verification.failures.some(f => f.severity === 'critical')) {
      flags.push('critical_verification_failures');
    }

    if (components.base_precision < 0.6) {
      flags.push('low_base_precision');
    }

    return flags;
  }

  /**
   * Calculate confidence interval (only for simulation-based results)
   */
  calculateConfidenceInterval(
    samples: number[],
    confidenceLevel: number = 0.95
  ): [number, number] {
    if (samples.length === 0) return [0, 0];

    // Sort samples
    const sorted = [...samples].sort((a, b) => a - b);
    
    // Calculate percentiles
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor(sorted.length * (alpha / 2));
    const upperIndex = Math.ceil(sorted.length * (1 - alpha / 2)) - 1;

    return [sorted[lowerIndex], sorted[upperIndex]];
  }

  /**
   * Should show confidence interval?
   */
  shouldShowConfidenceInterval(result: CapabilityResult): boolean {
    // Only show CI if result came from simulation or has sensitivity data
    return result.evidence && Object.values(result.evidence).some(
      evidenceArray => evidenceArray.some(e => e.type === 'simulation' && e.confidence !== undefined)
    );
  }
}

/**
 * Global confidence calculus instance
 */
export const globalConfidenceCalculus = new ConfidenceCalculus();

