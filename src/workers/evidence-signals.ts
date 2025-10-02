/**
 * Evidence Signals - Lightweight Analytics for Content Quality
 * 
 * Calculates cheap signals on submitted content (plans, critiques, decisions)
 * to flag potentially weak entries without blocking the workflow.
 * 
 * Design Principles:
 * - No blocking: All signals are warnings/badges, never hard errors
 * - Cheap computation: Simple regex, counting, length checks
 * - Actionable feedback: Clear what's missing and why it matters
 * - Persistent: Signals stored with content for traceability
 */

import type { ReasoningPlan, PeerCritique, MediationDecision, CrossPlanNote } from './parallel-reasoning-mcp.js';

/**
 * Signal types for content quality indicators
 */
export type SignalType = 
  | 'evidence_low'        // Less than 2 unique evidence references
  | 'no_quantitative'     // No numbers/metrics in content
  | 'too_brief'           // Content below minimum length threshold
  | 'no_cross_refs'       // No references to other plans/evidence
  | 'weak_rationale'      // Rationale too short or generic
  | 'missing_falsification'; // Critique lacks falsification test

/**
 * Signal severity levels
 */
export type SignalSeverity = 'info' | 'warning' | 'critical';

/**
 * A quality signal with metadata
 */
export interface QualitySignal {
  type: SignalType;
  severity: SignalSeverity;
  message: string;
  metric_value?: number;
  threshold?: number;
}

/**
 * Aggregated signals for an artifact
 */
export interface SignalSummary {
  unique_evidence_count: number;
  numeric_ratio: number;
  avg_sentence_length: number;
  cross_refs_count: number;
  total_length: number;
  signals: QualitySignal[];
  computed_at: number;
}

/**
 * Thresholds for signal detection (soft limits)
 */
export const SIGNAL_THRESHOLDS = {
  min_evidence_refs: 2,
  min_numeric_ratio: 0.05, // 5% of content should contain numbers
  min_plan_length: 200,
  min_rationale_length: 50,
  min_critique_length: 100,
  min_cross_refs: 1,
  min_avg_sentence_length: 10,
  max_avg_sentence_length: 50
};

/**
 * Extract unique evidence IDs from text
 * Looks for patterns like: evidence_id, sess-xxx:plan-xxx:stepN, [evidence:xxx]
 */
function extractEvidenceRefs(text: string): Set<string> {
  const refs = new Set<string>();
  
  // Pattern 1: sess-xxx:plan-xxx:stepN
  const pattern1 = /sess-[a-zA-Z0-9-]+:[a-zA-Z0-9_-]+:step\d+/g;
  const matches1 = text.match(pattern1);
  if (matches1) {
    matches1.forEach(m => refs.add(m));
  }
  
  // Pattern 2: [evidence:xxx] or (evidence:xxx)
  const pattern2 = /[\[\(]evidence:[a-zA-Z0-9_-]+[\]\)]/g;
  const matches2 = text.match(pattern2);
  if (matches2) {
    matches2.forEach(m => refs.add(m));
  }
  
  // Pattern 3: evidence_id: xxx
  const pattern3 = /evidence_id:\s*[a-zA-Z0-9_:-]+/g;
  const matches3 = text.match(pattern3);
  if (matches3) {
    matches3.forEach(m => refs.add(m));
  }
  
  return refs;
}

/**
 * Calculate numeric ratio (percentage of content containing numbers)
 */
function calculateNumericRatio(text: string): number {
  if (!text || text.length === 0) return 0;
  
  // Count words containing numbers
  const words = text.split(/\s+/);
  const numericWords = words.filter(w => /\d/.test(w));
  
  return numericWords.length / words.length;
}

/**
 * Calculate average sentence length
 */
function calculateAvgSentenceLength(text: string): number {
  if (!text || text.length === 0) return 0;
  
  // Split by sentence terminators
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const totalWords = sentences.reduce((sum, s) => {
    return sum + s.trim().split(/\s+/).length;
  }, 0);
  
  return totalWords / sentences.length;
}

/**
 * Count cross-references to other plans/artifacts
 */
function countCrossRefs(text: string): number {
  let count = 0;
  
  // Pattern 1: plan_xxx or plan-xxx
  const planRefs = text.match(/plan[_-][a-zA-Z0-9_-]+/g);
  if (planRefs) count += new Set(planRefs).size;
  
  // Pattern 2: @plan_xxx or @plan-xxx
  const atRefs = text.match(/@plan[_-][a-zA-Z0-9_-]+/g);
  if (atRefs) count += new Set(atRefs).size;
  
  // Pattern 3: "from plan X" or "in plan Y"
  const fromRefs = text.match(/(?:from|in)\s+plan\s+[a-zA-Z0-9_-]+/gi);
  if (fromRefs) count += new Set(fromRefs).size;
  
  return count;
}

/**
 * Analyze reasoning plan and generate quality signals
 */
export function analyzePlan(plan: ReasoningPlan): SignalSummary {
  const fullText = `${plan.description} ${plan.rationale} ${plan.expected_outputs.join(' ')}`;
  
  const evidenceRefs = extractEvidenceRefs(fullText);
  const numericRatio = calculateNumericRatio(fullText);
  const avgSentenceLength = calculateAvgSentenceLength(fullText);
  const crossRefsCount = countCrossRefs(fullText);
  const totalLength = fullText.length;
  
  const signals: QualitySignal[] = [];
  
  // Check evidence references
  if (evidenceRefs.size < SIGNAL_THRESHOLDS.min_evidence_refs) {
    signals.push({
      type: 'evidence_low',
      severity: 'warning',
      message: `Plan references only ${evidenceRefs.size} evidence item(s). Consider adding more specific evidence references.`,
      metric_value: evidenceRefs.size,
      threshold: SIGNAL_THRESHOLDS.min_evidence_refs
    });
  }
  
  // Check numeric content
  if (numericRatio < SIGNAL_THRESHOLDS.min_numeric_ratio) {
    signals.push({
      type: 'no_quantitative',
      severity: 'info',
      message: `Plan lacks quantitative data (${(numericRatio * 100).toFixed(1)}% numeric). Consider adding metrics, targets, or measurements.`,
      metric_value: numericRatio,
      threshold: SIGNAL_THRESHOLDS.min_numeric_ratio
    });
  }
  
  // Check length
  if (totalLength < SIGNAL_THRESHOLDS.min_plan_length) {
    signals.push({
      type: 'too_brief',
      severity: 'warning',
      message: `Plan is brief (${totalLength} chars). Consider expanding with more detail.`,
      metric_value: totalLength,
      threshold: SIGNAL_THRESHOLDS.min_plan_length
    });
  }
  
  return {
    unique_evidence_count: evidenceRefs.size,
    numeric_ratio: numericRatio,
    avg_sentence_length: avgSentenceLength,
    cross_refs_count: crossRefsCount,
    total_length: totalLength,
    signals,
    computed_at: Date.now()
  };
}

/**
 * Analyze peer critique and generate quality signals
 */
export function analyzeCritique(critique: PeerCritique): SignalSummary {
  const fullText = `${critique.claims_challenged.map(c => `${c.claim} ${c.challenge} ${c.falsification_test || ''}`).join(' ')} ${critique.residual_risks.join(' ')}`;
  
  const evidenceRefs = new Set<string>();
  critique.claims_challenged.forEach(c => {
    c.evidence_ids.forEach(id => evidenceRefs.add(id));
  });
  
  const numericRatio = calculateNumericRatio(fullText);
  const avgSentenceLength = calculateAvgSentenceLength(fullText);
  const crossRefsCount = countCrossRefs(fullText);
  const totalLength = fullText.length;
  
  const signals: QualitySignal[] = [];
  
  // Check evidence references
  if (evidenceRefs.size < SIGNAL_THRESHOLDS.min_evidence_refs) {
    signals.push({
      type: 'evidence_low',
      severity: 'warning',
      message: `Critique cites only ${evidenceRefs.size} evidence item(s). Strengthen claims with more evidence.`,
      metric_value: evidenceRefs.size,
      threshold: SIGNAL_THRESHOLDS.min_evidence_refs
    });
  }
  
  // Check for falsification tests
  const missingFalsification = critique.claims_challenged.filter(c => !c.falsification_test || c.falsification_test.length < 20);
  if (missingFalsification.length > 0) {
    signals.push({
      type: 'missing_falsification',
      severity: 'warning',
      message: `${missingFalsification.length} claim(s) lack falsification tests. Add testable conditions to strengthen critique.`,
      metric_value: missingFalsification.length
    });
  }
  
  // Check length
  if (totalLength < SIGNAL_THRESHOLDS.min_critique_length) {
    signals.push({
      type: 'too_brief',
      severity: 'warning',
      message: `Critique is brief (${totalLength} chars). Consider more detailed analysis.`,
      metric_value: totalLength,
      threshold: SIGNAL_THRESHOLDS.min_critique_length
    });
  }
  
  return {
    unique_evidence_count: evidenceRefs.size,
    numeric_ratio: numericRatio,
    avg_sentence_length: avgSentenceLength,
    cross_refs_count: crossRefsCount,
    total_length: totalLength,
    signals,
    computed_at: Date.now()
  };
}

/**
 * Analyze mediation decision and generate quality signals
 */
export function analyzeMediationDecision(decision: MediationDecision): SignalSummary {
  const fullText = `${decision.decision_point} ${decision.rationale}`;
  
  const evidenceRefs = new Set(decision.evidence_ids);
  const numericRatio = calculateNumericRatio(fullText);
  const avgSentenceLength = calculateAvgSentenceLength(fullText);
  const crossRefsCount = countCrossRefs(fullText);
  const totalLength = fullText.length;
  
  const signals: QualitySignal[] = [];
  
  // Check evidence references
  if (evidenceRefs.size === 0) {
    signals.push({
      type: 'evidence_low',
      severity: 'critical',
      message: `Decision lacks evidence references. Add evidence IDs to support the decision.`,
      metric_value: 0,
      threshold: SIGNAL_THRESHOLDS.min_evidence_refs
    });
  } else if (evidenceRefs.size < SIGNAL_THRESHOLDS.min_evidence_refs) {
    signals.push({
      type: 'evidence_low',
      severity: 'warning',
      message: `Decision cites only ${evidenceRefs.size} evidence item(s). Consider additional supporting evidence.`,
      metric_value: evidenceRefs.size,
      threshold: SIGNAL_THRESHOLDS.min_evidence_refs
    });
  }
  
  // Check rationale length
  if (decision.rationale.length < SIGNAL_THRESHOLDS.min_rationale_length) {
    signals.push({
      type: 'weak_rationale',
      severity: 'warning',
      message: `Rationale is brief (${decision.rationale.length} chars). Expand with more justification.`,
      metric_value: decision.rationale.length,
      threshold: SIGNAL_THRESHOLDS.min_rationale_length
    });
  }
  
  // Check cross-references
  if (crossRefsCount === 0) {
    signals.push({
      type: 'no_cross_refs',
      severity: 'info',
      message: `Decision doesn't reference other plans. Consider comparing alternatives.`,
      metric_value: 0,
      threshold: SIGNAL_THRESHOLDS.min_cross_refs
    });
  }
  
  return {
    unique_evidence_count: evidenceRefs.size,
    numeric_ratio: numericRatio,
    avg_sentence_length: avgSentenceLength,
    cross_refs_count: crossRefsCount,
    total_length: totalLength,
    signals,
    computed_at: Date.now()
  };
}

/**
 * Analyze cross-plan note and generate quality signals
 */
export function analyzeCrossPlanNote(note: CrossPlanNote): SignalSummary {
  const fullText = note.note;
  
  const evidenceRefs = extractEvidenceRefs(fullText);
  const numericRatio = calculateNumericRatio(fullText);
  const avgSentenceLength = calculateAvgSentenceLength(fullText);
  const crossRefsCount = countCrossRefs(fullText);
  const totalLength = fullText.length;
  
  const signals: QualitySignal[] = [];
  
  // Check for references (should reference evidence or other content)
  if (note.references.length === 0 && evidenceRefs.size === 0) {
    signals.push({
      type: 'no_cross_refs',
      severity: 'warning',
      message: `Note lacks references to evidence or other plans. Add specific references.`,
      metric_value: 0,
      threshold: SIGNAL_THRESHOLDS.min_cross_refs
    });
  }
  
  return {
    unique_evidence_count: evidenceRefs.size,
    numeric_ratio: numericRatio,
    avg_sentence_length: avgSentenceLength,
    cross_refs_count: crossRefsCount,
    total_length: totalLength,
    signals,
    computed_at: Date.now()
  };
}

/**
 * Format signals as human-readable badges/warnings
 */
export function formatSignals(signals: QualitySignal[]): string {
  if (signals.length === 0) {
    return '✅ No quality concerns detected';
  }
  
  const critical = signals.filter(s => s.severity === 'critical');
  const warnings = signals.filter(s => s.severity === 'warning');
  const info = signals.filter(s => s.severity === 'info');
  
  let output = '';
  
  if (critical.length > 0) {
    output += `\n🔴 **Critical Issues** (${critical.length}):\n`;
    critical.forEach(s => {
      output += `   - ${s.message}\n`;
    });
  }
  
  if (warnings.length > 0) {
    output += `\n⚠️ **Warnings** (${warnings.length}):\n`;
    warnings.forEach(s => {
      output += `   - ${s.message}\n`;
    });
  }
  
  if (info.length > 0) {
    output += `\n💡 **Suggestions** (${info.length}):\n`;
    info.forEach(s => {
      output += `   - ${s.message}\n`;
    });
  }
  
  return output;
}

