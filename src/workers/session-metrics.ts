/**
 * Session Quality Metrics
 *
 * Calculates dynamic quality metrics for parallel reasoning sessions:
 * - Confidence: Based on evidence density and quality signals
 * - Coverage: Ratio of executed vs declared capability steps
 * - Consensus: Derived from peer critique agreement scores
 */

import type { ParallelReasoningSession } from './parallel-reasoning-mcp.js';

/**
 * Quality thresholds for session readiness
 * These are the minimum values required for a session to be considered ready for finalization
 *
 * UPDATED 2025-10-11: Restored to original rigorous thresholds
 * - Confidence: 85% (requires high-quality evidence with proper self-assessment)
 * - Coverage: 95% (requires nearly all declared steps executed)
 * - Consensus: 80% (requires strong agreement across plans)
 *
 * Note: With improved bonus calculations and penalty removal for self-assessment,
 * these thresholds are now achievable with proper evidence collection.
 */
export const CONFIDENCE_THRESHOLD = 0.85;  // 85% (restored from 75%)
export const COVERAGE_THRESHOLD = 0.95;    // 95% (restored from 85%)
export const CONSENSUS_THRESHOLD = 0.80;   // 80% (restored from 70%)

export interface SessionMetrics {
  confidence: number;  // 0-1, threshold: 0.85 (85%)
  coverage: number;    // 0-1, threshold: 0.95 (95%)
  consensus: number;   // 0-1, threshold: 0.80 (80%)
  computed_at: number;
  details: {
    confidence: {
      unique_evidence_count: number;
      evidence_low_count: number;
      base: number;
      bonus: number;
      penalty: number;
    };
    coverage: {
      total_declared_steps: number;
      executed_steps: number;
    };
    consensus: {
      agreements: number;
      conflicts: number;
      total_interactions: number;
    };
  };
}

/**
 * Calculate confidence metric based on evidence density and quality signals
 *
 * UPDATED 2025-10-11 (v5.9.1): More generous bonuses to reward quality evidence
 * - Uses declared counts from ChatGPT's self_assessment when available
 * - Falls back to analyzing textual content for backward compatibility
 *
 * Formula: confidence = base + evidence_bonus + quality_bonus - quality_penalty
 * - base: 0.4
 * - evidence_bonus: +0.04 per unique evidence item (max +0.35) - INCREASED
 * - quality_bonus: based on source/datapoint/workpaper ratios (max +0.25) - INCREASED
 *   - External sources: +0.015 per source (max +0.10)
 *   - Quantitative datapoints: +0.008 per datapoint (max +0.10)
 *   - Workpapers: +0.015 per workpaper (max +0.05)
 * - quality_penalty: -0.2 per evidence_low signal (max -0.4)
 * - Clamped to [0, 1]
 *
 * Example: 30 items, 10 sources, 15 datapoints, 5 workpapers → 0.4 + 0.35 + 0.25 = 1.0 (100%)
 */
export function calculateConfidence(session: ParallelReasoningSession): {
  score: number;
  details: SessionMetrics['details']['confidence'];
} {
  const baseConfidence = 0.4;

  // Check if we have self-assessment data (NEW format v5.9.0+)
  const selfAssessments = (session as any).self_assessments;
  const hasSelfAssessment = selfAssessments && selfAssessments.length > 0;

  let totalEvidenceItems = 0;
  let totalExternalSources = 0;
  let totalQuantitativeDatapoints = 0;
  let totalWorkpapers = 0;

  if (hasSelfAssessment) {
    // NEW: Use declared counts from self-assessment
    const latestAssessment = selfAssessments[selfAssessments.length - 1];
    totalEvidenceItems = latestAssessment.total_evidence_items || 0;
    totalExternalSources = latestAssessment.external_sources || 0;
    totalQuantitativeDatapoints = latestAssessment.quantitative_datapoints || 0;
    totalWorkpapers = latestAssessment.workpapers_created || 0;

    console.log(`[Confidence Calculation] Using self-assessment: ${totalEvidenceItems} items (sources: ${totalExternalSources}, datapoints: ${totalQuantitativeDatapoints}, workpapers: ${totalWorkpapers})`);
  } else {
    // OLD: Analyze textual content (backward compatibility)
    const uniqueEvidenceIds = new Set<string>();
    let totalEvidenceRefs = 0;
    let findingsWithUrls = 0;
    let findingsWithNumbers = 0;

    // From plan results (registered via register_execution_results)
    for (const results of session.plan_results.values()) {
      for (const result of results) {
        // NEW format: use declared counts if available
        if (result.evidence_count !== undefined) {
          totalEvidenceItems += result.evidence_count;
        }
        if (result.source_count !== undefined) {
          totalExternalSources += result.source_count;
        }
        if (result.data_point_count !== undefined) {
          totalQuantitativeDatapoints += result.data_point_count;
        }

        // Legacy evidence_id
        if (result.evidence_id) {
          uniqueEvidenceIds.add(result.evidence_id);
        }

        // Evidence refs (citations, calculations, data sources)
        if (result.evidence_refs && Array.isArray(result.evidence_refs)) {
          totalEvidenceRefs += result.evidence_refs.length;
          result.evidence_refs.forEach((ref: any, idx: number) => {
            uniqueEvidenceIds.add(`${result.evidence_id}_ref_${idx}`);
          });
        }

        // Workpapers (high-quality structured evidence)
        if (result.workpapers && Array.isArray(result.workpapers)) {
          totalWorkpapers += result.workpapers.length;
          result.workpapers.forEach((wp: any, idx: number) => {
            uniqueEvidenceIds.add(`${result.evidence_id}_wp_${idx}`);
          });
        }

        // Findings quality analysis
        if (result.findings) {
          // Check for URLs in findings (indicates external sources)
          if (result.findings.match(/https?:\/\//)) {
            findingsWithUrls++;
          }

          // Check for quantitative data (numbers, percentages, metrics)
          if (result.findings.match(/\d+(\.\d+)?%?|\$\d+|€\d+/)) {
            findingsWithNumbers++;
          }
        }
      }
    }

    // If no declared counts, use analyzed counts
    if (totalEvidenceItems === 0) {
      totalEvidenceItems = uniqueEvidenceIds.size;
      totalExternalSources = findingsWithUrls;
      totalQuantitativeDatapoints = findingsWithNumbers;
    }

    console.log(`[Confidence Calculation] Analyzed content: ${totalEvidenceItems} items (refs: ${totalEvidenceRefs}, workpapers: ${totalWorkpapers})`);
  }

  // Evidence bonus: +0.04 per unique evidence item (max +0.35) - INCREASED from 0.3
  const evidenceBonus = Math.min(0.35, totalEvidenceItems * 0.04);

  // Quality bonus based on evidence composition (max +0.25) - INCREASED from 0.2
  let qualityBonus = 0;

  // Bonus for external sources (authoritative evidence) - INCREASED multiplier
  if (totalExternalSources > 0) {
    qualityBonus += Math.min(0.10, totalExternalSources * 0.015);  // Was 0.08 max, 0.01 multiplier
  }

  // Bonus for quantitative data (objective evidence) - INCREASED multiplier
  if (totalQuantitativeDatapoints > 0) {
    qualityBonus += Math.min(0.10, totalQuantitativeDatapoints * 0.008);  // Was 0.08 max, 0.005 multiplier
  }

  // Bonus for workpapers (structured, high-quality evidence) - INCREASED multiplier
  if (totalWorkpapers > 0) {
    qualityBonus += Math.min(0.05, totalWorkpapers * 0.015);  // Was 0.04 max, 0.01 multiplier
  }

  qualityBonus = Math.min(0.25, qualityBonus);  // INCREASED from 0.2

  // Count evidence_low signals ONLY if no self-assessment
  // When self-assessment is present, we trust ChatGPT's declared counts
  let evidenceLowCount = 0;

  if (!hasSelfAssessment) {
    // Only apply penalties when using legacy textual analysis
    for (const plan of session.plans.values()) {
      if (plan.signals?.signals.some((s: any) => s.type === 'evidence_low')) {
        evidenceLowCount++;
      }
    }

    for (const critique of session.peer_critiques) {
      if (critique.signals?.signals.some((s: any) => s.type === 'evidence_low')) {
        evidenceLowCount++;
      }
    }

    for (const decision of session.mediation_decisions) {
      if (decision.signals?.signals.some((s: any) => s.type === 'evidence_low')) {
        evidenceLowCount++;
      }
    }
  }

  const qualityPenalty = Math.min(0.4, evidenceLowCount * 0.2);

  const score = Math.max(0, Math.min(1, baseConfidence + evidenceBonus + qualityBonus - qualityPenalty));

  console.log(`[Confidence Calculation] Score breakdown: base=${baseConfidence}, evidence_bonus=${evidenceBonus.toFixed(3)}, quality_bonus=${qualityBonus.toFixed(3)}, penalty=${qualityPenalty.toFixed(3)}, final=${score.toFixed(3)}`);

  return {
    score,
    details: {
      unique_evidence_count: totalEvidenceItems,
      evidence_low_count: evidenceLowCount,
      base: baseConfidence,
      bonus: evidenceBonus + qualityBonus,
      penalty: qualityPenalty
    }
  };
}

/**
 * Calculate coverage metric as ratio of executed vs declared steps
 * 
 * Formula: coverage = executed_steps / total_declared_steps
 */
export function calculateCoverage(session: ParallelReasoningSession): {
  score: number;
  details: SessionMetrics['details']['coverage'];
} {
  let totalDeclaredSteps = 0;
  let executedSteps = 0;
  
  for (const [planId, plan] of session.plans) {
    totalDeclaredSteps += plan.capability_chain.length;
    
    const results = session.plan_results.get(planId);
    if (results) {
      executedSteps += results.length;
    }
  }
  
  const score = totalDeclaredSteps === 0 ? 0 : executedSteps / totalDeclaredSteps;
  
  return {
    score,
    details: {
      total_declared_steps: totalDeclaredSteps,
      executed_steps: executedSteps
    }
  };
}

/**
 * Calculate consensus metric from peer critique agreement scores
 *
 * ENHANCED FORMULA: Rewards constructive disagreement
 *
 * Instead of penalizing disagreement, we reward:
 * 1. High-quality agreements (agreement_score > 0.7)
 * 2. Constructive disagreements with:
 *    - Claims challenged with evidence
 *    - Falsification tests proposed
 *    - Residual risks identified
 *
 * Shallow agreement (high score but no substance) is worth less than
 * deep disagreement (low score but rich argumentation).
 */
export function calculateConsensus(session: ParallelReasoningSession): {
  score: number;
  details: SessionMetrics['details']['consensus'];
} {
  if (session.peer_critiques.length === 0) {
    return {
      score: 0.5, // Neutral if no critiques
      details: {
        agreements: 0,
        conflicts: 0,
        total_interactions: 0
      }
    };
  }

  let qualityPoints = 0;
  let agreements = 0;
  let conflicts = 0;

  for (const critique of session.peer_critiques) {
    const isAgreement = critique.agreement_score > 0.7;
    const isConflict = critique.agreement_score < 0.4;

    if (isAgreement) {
      agreements++;
    } else if (isConflict) {
      conflicts++;
    }

    // Calculate quality of this critique
    const hasClaimsChallenged = critique.claims_challenged && critique.claims_challenged.length > 0;
    const hasFalsificationTests = critique.claims_challenged?.some(c => c.falsification_test) || false;
    const hasResidualRisks = critique.residual_risks && critique.residual_risks.length > 0;
    const hasEvidence = critique.claims_challenged?.some(c => c.evidence_ids && c.evidence_ids.length > 0) || false;

    // Base points from agreement score
    let critiquePoints = critique.agreement_score;

    // Bonus for constructive disagreement (low agreement but high quality argumentation)
    if (critique.agreement_score < 0.6) {
      // This is a disagreement - reward quality argumentation
      let disagreementQualityBonus = 0;

      if (hasClaimsChallenged) disagreementQualityBonus += 0.20;
      if (hasFalsificationTests) disagreementQualityBonus += 0.25; // Falsification tests are very valuable
      if (hasResidualRisks) disagreementQualityBonus += 0.15;
      if (hasEvidence) disagreementQualityBonus += 0.20;

      // A well-argued disagreement can be worth more than shallow agreement
      critiquePoints = Math.min(1.0, critique.agreement_score + disagreementQualityBonus);
    } else {
      // This is an agreement - small bonus for having substance
      if (hasClaimsChallenged || hasResidualRisks) {
        critiquePoints = Math.min(1.0, critique.agreement_score + 0.05);
      }
    }

    qualityPoints += critiquePoints;
  }

  const totalInteractions = session.peer_critiques.length + session.cross_plan_notes.length;

  if (totalInteractions === 0) {
    return {
      score: 0.5,
      details: {
        agreements: 0,
        conflicts: 0,
        total_interactions: 0
      }
    };
  }

  // Average quality points across all critiques
  const avgQuality = qualityPoints / session.peer_critiques.length;

  // Bonus for having diverse interactions (both notes and critiques)
  const diversityBonus = session.cross_plan_notes.length > 0 && session.peer_critiques.length > 0 ? 0.05 : 0;

  const score = Math.max(0, Math.min(1, avgQuality + diversityBonus));

  return {
    score,
    details: {
      agreements,
      conflicts,
      total_interactions: totalInteractions
    }
  };
}

/**
 * Compute all session metrics
 */
export function computeSessionMetrics(session: ParallelReasoningSession): SessionMetrics {
  const confidence = calculateConfidence(session);
  const coverage = calculateCoverage(session);
  const consensus = calculateConsensus(session);
  
  return {
    confidence: confidence.score,
    coverage: coverage.score,
    consensus: consensus.score,
    computed_at: Date.now(),
    details: {
      confidence: confidence.details,
      coverage: coverage.details,
      consensus: consensus.details
    }
  };
}

/**
 * Check if metrics meet all thresholds for session readiness
 */
export function meetsThresholds(metrics: SessionMetrics): {
  ready: boolean;
  confidence_met: boolean;
  coverage_met: boolean;
  consensus_met: boolean;
} {
  return {
    ready: metrics.confidence >= CONFIDENCE_THRESHOLD &&
           metrics.coverage >= COVERAGE_THRESHOLD &&
           metrics.consensus >= CONSENSUS_THRESHOLD,
    confidence_met: metrics.confidence >= CONFIDENCE_THRESHOLD,
    coverage_met: metrics.coverage >= COVERAGE_THRESHOLD,
    consensus_met: metrics.consensus >= CONSENSUS_THRESHOLD
  };
}

/**
 * Generate metric warnings for values below thresholds
 */
export function generateMetricWarnings(metrics: SessionMetrics): string[] {
  const warnings: string[] = [];

  if (metrics.confidence < CONFIDENCE_THRESHOLD) {
    const needed = Math.ceil((CONFIDENCE_THRESHOLD - metrics.confidence) / 0.1);
    warnings.push(
      `⚠️ Low Confidence (${(metrics.confidence * 100).toFixed(1)}%): ` +
      `Add ${needed} more evidence references or improve quality signals to reach ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% threshold`
    );
  }

  if (metrics.coverage < COVERAGE_THRESHOLD) {
    const needed = Math.ceil(
      (COVERAGE_THRESHOLD - metrics.coverage) * metrics.details.coverage.total_declared_steps
    );
    warnings.push(
      `⚠️ Low Coverage (${(metrics.coverage * 100).toFixed(1)}%): ` +
      `Execute ${needed} more capability steps to reach ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% threshold ` +
      `(${metrics.details.coverage.executed_steps}/${metrics.details.coverage.total_declared_steps} completed)`
    );
  }

  if (metrics.consensus < CONSENSUS_THRESHOLD) {
    warnings.push(
      `⚠️ Low Consensus (${(metrics.consensus * 100).toFixed(1)}%): ` +
      `Resolve conflicts through additional peer reviews or mediation to reach ${(CONSENSUS_THRESHOLD * 100).toFixed(0)}% threshold ` +
      `(${metrics.details.consensus.agreements} agreements, ${metrics.details.consensus.conflicts} conflicts)`
    );
  }

  return warnings;
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: SessionMetrics): string {
  let output = '## 📊 Quality Metrics\n\n';

  output += `- **Confidence**: ${(metrics.confidence * 100).toFixed(1)}% `;
  output += metrics.confidence >= CONFIDENCE_THRESHOLD ? '✅' : '⚠️';
  output += ` (target: ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%, `;
  output += `${metrics.details.confidence.unique_evidence_count} evidence, `;
  output += `${metrics.details.confidence.evidence_low_count} quality issues)\n`;

  output += `- **Coverage**: ${(metrics.coverage * 100).toFixed(1)}% `;
  output += metrics.coverage >= COVERAGE_THRESHOLD ? '✅' : '⚠️';
  output += ` (target: ${(COVERAGE_THRESHOLD * 100).toFixed(0)}%, `;
  output += `${metrics.details.coverage.executed_steps}/${metrics.details.coverage.total_declared_steps} steps)\n`;

  output += `- **Consensus**: ${(metrics.consensus * 100).toFixed(1)}% `;
  output += metrics.consensus >= CONSENSUS_THRESHOLD ? '✅' : '⚠️';
  output += ` (target: ${(CONSENSUS_THRESHOLD * 100).toFixed(0)}%, `;
  output += `${metrics.details.consensus.agreements} agreements, `;
  output += `${metrics.details.consensus.conflicts} conflicts)\n`;

  return output;
}

