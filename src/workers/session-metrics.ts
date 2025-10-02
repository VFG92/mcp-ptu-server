/**
 * Session Quality Metrics
 * 
 * Calculates dynamic quality metrics for parallel reasoning sessions:
 * - Confidence: Based on evidence density and quality signals
 * - Coverage: Ratio of executed vs declared capability steps
 * - Consensus: Derived from peer critique agreement scores
 */

import type { ParallelReasoningSession } from './parallel-reasoning-mcp.js';

export interface SessionMetrics {
  confidence: number;  // 0-1, threshold: 0.6
  coverage: number;    // 0-1, threshold: 0.8
  consensus: number;   // 0-1, threshold: 0.5
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
 * Formula: confidence = base + evidence_bonus - quality_penalty
 * - base: 0.5
 * - evidence_bonus: +0.1 per unique evidence ID (max +0.3)
 * - quality_penalty: -0.2 per evidence_low signal (max -0.4)
 * - Clamped to [0, 1]
 */
export function calculateConfidence(session: ParallelReasoningSession): {
  score: number;
  details: SessionMetrics['details']['confidence'];
} {
  const baseConfidence = 0.5;
  
  // Count unique evidence IDs across all artifacts
  const uniqueEvidenceIds = new Set<string>();
  
  // From plan results
  for (const results of session.plan_results.values()) {
    for (const result of results) {
      if (result.evidence_id) {
        uniqueEvidenceIds.add(result.evidence_id);
      }
    }
  }
  
  // From mediation decisions
  for (const decision of session.mediation_decisions) {
    for (const evidenceId of decision.evidence_ids) {
      uniqueEvidenceIds.add(evidenceId);
    }
  }
  
  const evidenceBonus = Math.min(0.3, uniqueEvidenceIds.size * 0.1);
  
  // Count evidence_low signals
  let evidenceLowCount = 0;
  
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
  
  const qualityPenalty = Math.min(0.4, evidenceLowCount * 0.2);
  
  const score = Math.max(0, Math.min(1, baseConfidence + evidenceBonus - qualityPenalty));
  
  return {
    score,
    details: {
      unique_evidence_count: uniqueEvidenceIds.size,
      evidence_low_count: evidenceLowCount,
      base: baseConfidence,
      bonus: evidenceBonus,
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
 * Formula: consensus = (agreements - conflicts) / total_interactions
 * - agreements: critiques with agreement_score > 0.7
 * - conflicts: critiques with agreement_score < 0.4
 * - total_interactions: peer_critiques + cross_plan_notes
 * - Normalized to [0, 1]
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
  
  let agreements = 0;
  let conflicts = 0;
  
  for (const critique of session.peer_critiques) {
    if (critique.agreement_score > 0.7) {
      agreements++;
    } else if (critique.agreement_score < 0.4) {
      conflicts++;
    }
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
  
  const rawScore = (agreements - conflicts) / totalInteractions;
  
  // Normalize to [0, 1]
  const score = Math.max(0, Math.min(1, (rawScore + 1) / 2));
  
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
 * Generate metric warnings for values below thresholds
 */
export function generateMetricWarnings(metrics: SessionMetrics): string[] {
  const warnings: string[] = [];
  
  if (metrics.confidence < 0.6) {
    const needed = Math.ceil((0.6 - metrics.confidence) / 0.1);
    warnings.push(
      `⚠️ Low Confidence (${(metrics.confidence * 100).toFixed(1)}%): ` +
      `Add ${needed} more evidence references or improve quality signals to reach 60% threshold`
    );
  }
  
  if (metrics.coverage < 0.8) {
    const needed = Math.ceil(
      (0.8 - metrics.coverage) * metrics.details.coverage.total_declared_steps
    );
    warnings.push(
      `⚠️ Low Coverage (${(metrics.coverage * 100).toFixed(1)}%): ` +
      `Execute ${needed} more capability steps to reach 80% threshold ` +
      `(${metrics.details.coverage.executed_steps}/${metrics.details.coverage.total_declared_steps} completed)`
    );
  }
  
  if (metrics.consensus < 0.5) {
    warnings.push(
      `⚠️ Low Consensus (${(metrics.consensus * 100).toFixed(1)}%): ` +
      `Resolve conflicts through additional peer reviews or mediation ` +
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
  output += metrics.confidence >= 0.6 ? '✅' : '⚠️';
  output += ` (${metrics.details.confidence.unique_evidence_count} evidence, `;
  output += `${metrics.details.confidence.evidence_low_count} quality issues)\n`;
  
  output += `- **Coverage**: ${(metrics.coverage * 100).toFixed(1)}% `;
  output += metrics.coverage >= 0.8 ? '✅' : '⚠️';
  output += ` (${metrics.details.coverage.executed_steps}/${metrics.details.coverage.total_declared_steps} steps)\n`;
  
  output += `- **Consensus**: ${(metrics.consensus * 100).toFixed(1)}% `;
  output += metrics.consensus >= 0.5 ? '✅' : '⚠️';
  output += ` (${metrics.details.consensus.agreements} agreements, `;
  output += `${metrics.details.consensus.conflicts} conflicts)\n`;
  
  return output;
}

