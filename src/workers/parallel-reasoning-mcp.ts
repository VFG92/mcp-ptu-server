/**
 * Parallel Reasoning MCP Tools
 * 
 * MCP as "guardrails + persistent memory" for ChatGPT-driven parallel reasoning.
 * 
 * ARCHITECTURE:
 * - MCP exposes typed frames (contracts) and persistence
 * - ChatGPT generates plans, diversifies, contaminates, mediates
 * - No intelligence in server: only structural validation and storage
 * 
 * WORKFLOW (Manifest-based):
 * 1. ChatGPT: init_parallel_reasoning → declares diversity axes
 * 2. ChatGPT: submit_reasoning_plan (Plan A, B, C...) → server validates diversity
 * 3. ChatGPT: execute_reasoning_manifest → generates manifest with execution token
 * 4. ChatGPT: executes ALL steps using native tools (web search, Python, etc.)
 * 5. ChatGPT: register_execution_results → batch registers all evidence
 * 6. ChatGPT: submit_peer_critique → peer review with falsification tests
 * 7. ChatGPT: submit_mediation_decision → mediation with evidence
 * 8. ChatGPT: generate_meta_reflection → analyzes patterns and gaps
 * 9. ChatGPT: finalize_parallel_reasoning → synthesis with quality metrics
 * 
 * References:
 * - Wang et al., Self-Consistency, 2022
 * - Yao et al., Tree of Thoughts, 2023
 * - Du et al., Improving Factuality via Debate, 2023
 */

import { z } from 'zod';
import type { SignalSummary } from './evidence-signals.js';
import { analyzePlan, analyzeCritique, analyzeMediationDecision, analyzeCrossPlanNote } from './evidence-signals.js';
import {
  computeSessionMetrics,
  meetsThresholds,
  generateMetricWarnings,
  CONFIDENCE_THRESHOLD,
  COVERAGE_THRESHOLD,
  CONSENSUS_THRESHOLD,
  type SessionMetrics
} from './session-metrics.js';

/**
 * Diversity axes for plan differentiation
 * Now accepts any string to allow dynamic, context-specific axes
 */
export const DiversityAxisSchema = z.string().min(1).describe('Diversity axis for plan differentiation');

export type DiversityAxis = z.infer<typeof DiversityAxisSchema>;

/**
 * Common diversity axes (for reference, not exhaustive)
 */
export const COMMON_DIVERSITY_AXES = {
  // Universal axes (applicable to most tasks)
  data_sources: 'Different data sources (official stats vs industry reports vs expert interviews)',
  analytical_models: 'Different analytical approaches (quantitative vs qualitative vs hybrid)',
  time_horizons: 'Different time frames (short-term vs medium-term vs long-term)',
  quality_metrics: 'Different quality criteria (precision vs recall vs robustness vs speed)',
  risk_perspectives: 'Different risk lenses (market vs regulatory vs operational vs reputational)',
  stakeholder_views: 'Different stakeholder perspectives (customer vs investor vs employee vs regulator)',

  // Domain-specific axes (suggested based on task context)
  geographic_scope: 'Different geographic scopes (local vs regional vs global)',
  customer_segments: 'Different customer segments (enterprise vs SMB vs consumer)',
  technology_stacks: 'Different technology approaches (cloud-native vs hybrid vs on-premise)',
  regulatory_frameworks: 'Different regulatory contexts (GDPR vs CCPA vs sector-specific)',
  cost_drivers: 'Different cost perspectives (capex vs opex vs total cost of ownership)',
  implementation_approaches: 'Different implementation strategies (phased vs big-bang vs pilot)',
  competitive_dynamics: 'Different competitive lenses (direct vs indirect vs substitute competition)',
  value_propositions: 'Different value angles (cost savings vs revenue growth vs risk reduction)',
  organizational_levels: 'Different organizational perspectives (strategic vs tactical vs operational)',
  measurement_frameworks: 'Different measurement approaches (leading vs lagging vs predictive indicators)'
} as const;

/**
 * Suggest diversity axes based on task description
 * Returns contextually relevant axes for the given task
 */
export function suggestDiversityAxes(task_description: string): {
  suggested_axes: string[];
  rationale: string;
} {
  const taskLower = task_description.toLowerCase();
  const suggested: string[] = [];
  let rationale = '';

  // Financial/Investment analysis
  if (taskLower.match(/\b(financial|investment|valuation|dcf|npv|roi|revenue|profit|portfolio|risk)\b/)) {
    suggested.push('analytical_models', 'time_horizons', 'risk_perspectives');
    rationale = 'Financial analysis benefits from different analytical models (DCF vs multiples), time horizons (short vs long-term), and risk perspectives (optimistic vs conservative).';
  }
  // Market analysis
  else if (taskLower.match(/\b(market|customer|segment|competitive|industry|tam|sam)\b/)) {
    suggested.push('data_sources', 'customer_segments', 'competitive_dynamics');
    rationale = 'Market analysis benefits from different data sources (primary vs secondary), customer segments, and competitive lenses.';
  }
  // Security/Cybersecurity (check before technology to catch "cybersecurity architecture")
  else if (taskLower.match(/\b(security|cybersecurity|cyber|threat|vulnerability|zero-trust)\b/)) {
    suggested.push('risk_perspectives', 'technology_stacks', 'implementation_approaches');
    rationale = 'Security analysis benefits from different risk perspectives, technology approaches, and implementation strategies.';
  }
  // Technology/Architecture
  else if (taskLower.match(/\b(technology|architecture|cloud|infrastructure|software|platform)\b/)) {
    suggested.push('technology_stacks', 'implementation_approaches', 'cost_drivers');
    rationale = 'Technology decisions benefit from different technology approaches, implementation strategies, and cost perspectives.';
  }
  // Regulatory/Compliance
  else if (taskLower.match(/\b(regulatory|compliance|legal|gdpr|privacy|audit)\b/)) {
    suggested.push('regulatory_frameworks', 'stakeholder_views', 'risk_perspectives');
    rationale = 'Regulatory analysis benefits from different regulatory contexts, stakeholder perspectives, and risk lenses.';
  }
  // Supply Chain/Operations
  else if (taskLower.match(/\b(supply chain|operations|logistics|procurement|inventory)\b/)) {
    suggested.push('geographic_scope', 'cost_drivers', 'risk_perspectives');
    rationale = 'Supply chain analysis benefits from different geographic scopes, cost drivers, and risk perspectives.';
  }
  // HR/Organizational (check before strategy to catch "organizational transformation")
  else if (taskLower.match(/\b(hr|human resources|talent|organization|organizational|culture|workforce)\b/)) {
    suggested.push('stakeholder_views', 'organizational_levels', 'time_horizons');
    rationale = 'HR analysis benefits from different stakeholder perspectives, organizational levels, and time horizons.';
  }
  // Strategy/Planning
  else if (taskLower.match(/\b(strategy|strategic|planning|roadmap|vision|transformation)\b/)) {
    suggested.push('time_horizons', 'stakeholder_views', 'value_propositions');
    rationale = 'Strategic planning benefits from different time horizons, stakeholder perspectives, and value propositions.';
  }
  // Default: Universal axes
  else {
    suggested.push('data_sources', 'analytical_models', 'stakeholder_views');
    rationale = 'General analysis benefits from different data sources, analytical models, and stakeholder perspectives.';
  }

  return { suggested_axes: suggested, rationale };
}

/**
 * Parsed diversity axis with key-value structure
 */
export interface ParsedAxis {
  key: string;      // Normalized axis key (e.g., "tech_stack")
  value: string;    // Axis value (e.g., "hybrid")
  original: string; // Original string for reference
}

/**
 * Parse a diversity axis string into key-value structure
 *
 * Supports formats:
 * - "Key: Value" → {key: "key", value: "value"}
 * - "Key (Value)" → {key: "key", value: "value"}
 * - "Key" → {key: "key", value: ""}
 * - "Key: Value1 vs Value2 vs Value3" → {key: "key", value: "value1 vs value2 vs value3"}
 * - "Key (Value1 vs Value2)" → {key: "key", value: "value1 vs value2"}
 *
 * Examples:
 * - "Tech Stack: Hybrid" → {key: "tech_stack", value: "hybrid"}
 * - "Metodologia (econometrico)" → {key: "metodologia", value: "econometrico"}
 * - "data_sources" → {key: "data_sources", value: ""}
 * - "Risk: Market vs Operational" → {key: "risk", value: "market vs operational"}
 * - "Postura: accettazione" → {key: "postura", value: "accettazione"}
 * - "Narrativa di scenario (baseline ISTAT)" → {key: "narrativa_scenario", value: "baseline istat"}
 * - "Rimedio: ampio" → {key: "rimedio", value: "ampio"}
 */
export function parseAxisString(axis: string): ParsedAxis {
  const trimmed = axis.trim();

  // Try to match "Key: Value" pattern first (explicit key-value)
  const colonMatch = trimmed.match(/^([^:]+):\s*(.+)$/);

  if (colonMatch) {
    // Extract key from the part before colon, removing parentheses and extra words
    const keyPart = colonMatch[1].trim();
    const key = extractMainKey(keyPart);
    const value = colonMatch[2].trim().toLowerCase();
    return { key, value, original: trimmed };
  }

  // Try to match "Key (value)" pattern (value in parentheses)
  const parenMatch = trimmed.match(/^([^(]+)\(([^)]+)\)$/);

  if (parenMatch) {
    // Extract key from the part before parentheses
    const keyPart = parenMatch[1].trim();
    const key = extractMainKey(keyPart);
    const value = parenMatch[2].trim().toLowerCase();
    return { key, value, original: trimmed };
  }

  // No colon or parentheses found - extract main key from entire string
  const key = extractMainKey(trimmed);
  return { key, value: '', original: trimmed };
}

/**
 * Extract the main key from a string, removing parentheses, "verso", "del/della/dei", etc.
 *
 * Strategy: Extract all significant nouns and create multiple possible keys.
 * This allows matching both "Grado di apertura" with "Grado" or "Apertura".
 *
 * Note: This function is called AFTER parseAxisString has already extracted values from
 * "Key (value)" or "Key: value" patterns, so parentheses here are only for descriptions,
 * not values.
 *
 * Examples:
 * - "Postura verso l'AGCM" → "postura"
 * - "Ampiezza del rimedio economico" → "ampiezza_rimedio"
 * - "Velocità di implementazione vs robustezza" → "velocità_implementazione"
 * - "Tonalità della comunicazione" → "tonalità_comunicazione"
 * - "Grado di apertura dei dati" → "grado_apertura"
 * - "Propensione al rischio" → "propensione_rischio"
 * - "Tech Stack" → "tech_stack"
 */
function extractMainKey(text: string): string {
  let cleaned = text.trim();

  // Remove everything in parentheses (only for descriptions, not values)
  cleaned = cleaned.replace(/\([^)]*\)/g, '');

  // Remove "vs" and everything after it
  cleaned = cleaned.replace(/\s+vs\s+.*/i, '');

  // Trim
  cleaned = cleaned.trim();

  // Split into words
  const words = cleaned.split(/\s+/);

  // Italian prepositions and articles to skip
  const skipWords = new Set(['verso', 'del', 'della', 'dei', 'degli', 'di', 'al', 'alla', 'ai', 'agli', 'a', 'per', 'con', 'su', 'in', 'da', 'e', 'ed', 'l\'', 'il', 'lo', 'la', 'i', 'gli', 'le']);

  // Extract significant words (nouns, not prepositions)
  const significantWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    const cleanWord = word.replace(/^l'/, ''); // Remove l' prefix

    // Skip if it's a preposition/article
    if (skipWords.has(word) || skipWords.has(cleanWord)) {
      continue;
    }

    // Skip very short words (likely articles)
    if (cleanWord.length <= 1) {
      continue;
    }

    significantWords.push(cleanWord);

    // Stop after collecting 2-3 significant words
    if (significantWords.length >= 3) {
      break;
    }
  }

  // If we have multiple significant words, join them with underscore
  // This creates a compound key like "grado_apertura" or "tech_stack"
  if (significantWords.length === 0) {
    // Fallback: use first word
    return words[0].toLowerCase().replace(/\s+/g, '_');
  }

  // Join all significant words with underscore
  return significantWords.join('_');
}

/**
 * Compare two diversity axes semantically
 *
 * Returns true if axes are semantically different:
 * - Different keys → different
 * - Same key, different values → different
 * - Same key, same value → same
 * - Same key, one has no value → considered same (key match is sufficient)
 */
export function compareAxesSemantically(axis1: string, axis2: string): boolean {
  const parsed1 = parseAxisString(axis1);
  const parsed2 = parseAxisString(axis2);

  // Different keys → different axes
  if (parsed1.key !== parsed2.key) {
    return true;
  }

  // Same key, both have values → compare values
  if (parsed1.value && parsed2.value) {
    return parsed1.value !== parsed2.value;
  }

  // Same key, at least one has no value → consider same
  // (key match is sufficient for required axes validation)
  return false;
}

/**
 * Check if a plan's axes satisfy required axes semantically
 *
 * A plan satisfies required axes if for each required axis key,
 * there exists at least one plan axis that matches.
 *
 * Matching rules:
 * - Exact match: "postura" matches "postura"
 * - Partial match: "apertura" matches "grado_apertura_dati" (substring)
 * - Partial match: "rimedio" matches "ampiezza_rimedio_economico" (substring)
 *
 * This allows flexible axis naming where:
 * - Required: "Grado di apertura dei dati" → key: "grado_apertura_dati"
 * - Plan: "Apertura: radicale" → key: "apertura"
 * - Match: "apertura" is contained in "grado_apertura_dati" ✓
 */
export function satisfiesRequiredAxes(
  planAxes: string[],
  requiredAxes: string[]
): boolean {
  const planKeys = planAxes.map(axis => parseAxisString(axis).key);
  const requiredKeys = requiredAxes.map(axis => parseAxisString(axis).key);

  // For each required key, check if any plan key matches (exact or partial)
  return requiredKeys.every(reqKey => {
    return planKeys.some(planKey => {
      // Exact match
      if (planKey === reqKey) {
        return true;
      }

      // Partial match: plan key is substring of required key
      // e.g., "apertura" matches "grado_apertura_dati"
      if (reqKey.includes(planKey)) {
        return true;
      }

      // Partial match: required key is substring of plan key
      // e.g., "grado_apertura_dati" matches "apertura"
      if (planKey.includes(reqKey)) {
        return true;
      }

      return false;
    });
  });
}

/**
 * Calculate semantic diversity between two plans
 *
 * Returns the number of axes that differ semantically:
 * - Axes with different keys count as different
 * - Axes with same key but different values count as different
 * - Axes with same key and same value (or no value) count as same
 */
export function calculateSemanticDiversity(
  plan1Axes: string[],
  plan2Axes: string[]
): number {
  const parsed1 = plan1Axes.map(parseAxisString);
  const parsed2 = plan2Axes.map(parseAxisString);

  // Create maps by key for efficient lookup
  const map1 = new Map(parsed1.map(p => [p.key, p.value]));
  const map2 = new Map(parsed2.map(p => [p.key, p.value]));

  // Get all unique keys
  const allKeys = new Set([...map1.keys(), ...map2.keys()]);

  let differenceCount = 0;

  for (const key of allKeys) {
    const value1 = map1.get(key);
    const value2 = map2.get(key);

    // Key exists in only one plan → different
    if (value1 === undefined || value2 === undefined) {
      differenceCount++;
      continue;
    }

    // Both have the key - compare values
    // If both have values and they differ → different
    if (value1 && value2 && value1 !== value2) {
      differenceCount++;
    }
    // If same value or at least one has no value → same (don't count)
  }

  return differenceCount;
}

/**
 * Reasoning plan submitted by ChatGPT
 */
export const ReasoningPlanSchema = z.object({
  plan_id: z.string(),
  description: z.string(),
  diversity_axes: z.array(DiversityAxisSchema).min(2), // Minimum 2 axes must differ
  capability_chain: z.array(z.string()).min(3).max(32).describe('Capability chain: 3-32 capabilities per workflow (optimal: 5-10 for robustness based on diversity research)'),
  rationale: z.string(),
  expected_outputs: z.array(z.string())
});

export type ReasoningPlan = z.infer<typeof ReasoningPlanSchema> & {
  signals?: SignalSummary; // Quality signals computed after submission
  status?: 'accepted' | 'rejected'; // Plan acceptance status
  rejection_reason?: string; // Reason for rejection (if status is 'rejected')
};

/**
 * Cross-plan note (contamination)
 */
export const CrossPlanNoteSchema = z.object({
  from_plan_id: z.string(),
  to_plan_id: z.string(),
  note: z.string(),
  references: z.array(z.string()), // Evidence IDs referenced
  timestamp: z.number()
});

export type CrossPlanNote = z.infer<typeof CrossPlanNoteSchema> & {
  signals?: SignalSummary; // Quality signals computed after submission
};

/**
 * Peer critique (ChatGPT-generated)
 */
export const PeerCritiqueSchema = z.object({
  reviewer_plan_id: z.string(),
  reviewed_plan_id: z.string(),
  claims_challenged: z.array(z.object({
    claim: z.string(),
    evidence_ids: z.array(z.string()),
    challenge: z.string(),
    falsification_test: z.string().optional()
  })),
  residual_risks: z.array(z.string()),
  agreement_score: z.number().min(0).max(1),
  timestamp: z.number()
});

export type PeerCritique = z.infer<typeof PeerCritiqueSchema> & {
  signals?: SignalSummary; // Quality signals computed after submission
};

/**
 * Mediation decision map
 */
export const MediationDecisionSchema = z.object({
  decision_point: z.string(),
  chosen_from_plan: z.string(),
  rationale: z.string(),
  evidence_ids: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

export type MediationDecision = z.infer<typeof MediationDecisionSchema> & {
  signals?: SignalSummary; // Quality signals computed after submission
};

/**
 * Parallel reasoning session state
 */
export interface ParallelReasoningSession {
  session_id: string;
  task_description: string;
  required_diversity_axes: DiversityAxis[];
  min_plans: number;
  plans: Map<string, ReasoningPlan>; // Accepted plans
  rejected_plans: Map<string, ReasoningPlan>; // Rejected plans (for reference and cross-contamination)
  plan_results: Map<string, any[]>; // plan_id -> array of capability results
  cross_plan_notes: CrossPlanNote[];
  peer_critiques: PeerCritique[];
  mediation_decisions: MediationDecision[];
  status: 'initialized' | 'plans_submitted' | 'executing' | 'peer_review' | 'mediation' | 'finalized' | 'terminated';
  created_at: number;
  updated_at: number;
  // NEW: Computed quality metrics (cached)
  metrics?: {
    confidence: number;
    coverage: number;
    consensus: number;
    computed_at: number;
  };
  // NEW: Execution tokens for manifest-based execution
  execution_tokens?: Array<{
    token: string;
    session_id: string;
    created_at: number;
    expires_at: number;
    used: boolean;
  }>;
  // NEW: Saliency report for evidence quality guidance
  saliency_report?: any; // SaliencyReport from manifest-execution
}

/**
 * Parallel Reasoning Session Manager
 *
 * Pure persistence and structural validation - NO intelligence
 */
export class ParallelReasoningSessionManager {
  private sessions: Map<string, ParallelReasoningSession> = new Map();
  private evidenceLedger?: any; // EvidenceLedger instance (optional)

  /**
   * Set evidence ledger for automatic evidence registration
   */
  setEvidenceLedger(ledger: any): void {
    this.evidenceLedger = ledger;
  }

  /**
   * Initialize parallel reasoning session
   * BEHAVIOR: Always creates a new session or resets existing one
   * This allows ChatGPT to start fresh workflows even if a session_id was previously used
   */
  initSession(args: {
    session_id: string;
    task_description: string;
    required_diversity_axes: DiversityAxis[];
    min_plans: number;
  }): ParallelReasoningSession {
    console.log(`[ParallelReasoningSessionManager] Init request for session: ${args.session_id}`);
    console.log(`[ParallelReasoningSessionManager] Current sessions count: ${this.sessions.size}`);

    // Check if session already exists
    const existingSession = this.sessions.get(args.session_id);
    if (existingSession) {
      console.log(`[ParallelReasoningSessionManager] Session ${args.session_id} already exists (status: ${existingSession.status})`);
      console.log(`[ParallelReasoningSessionManager] Resetting session to allow new workflow initialization`);

      // Always reset to allow ChatGPT to start a new workflow
      this.resetSession(args.session_id);
      const resetSession = this.sessions.get(args.session_id);
      if (resetSession) {
        // Update with new parameters
        resetSession.task_description = args.task_description;
        resetSession.required_diversity_axes = args.required_diversity_axes;
        resetSession.min_plans = args.min_plans;
        resetSession.updated_at = Date.now();
        console.log(`[ParallelReasoningSessionManager] Session ${args.session_id} reset and updated with new parameters`);
        return resetSession;
      }
    }

    console.log(`[ParallelReasoningSessionManager] Creating new session: ${args.session_id}`);
    const session: ParallelReasoningSession = {
      session_id: args.session_id,
      task_description: args.task_description,
      required_diversity_axes: args.required_diversity_axes,
      min_plans: args.min_plans,
      plans: new Map(),
      rejected_plans: new Map(),
      plan_results: new Map(),
      cross_plan_notes: [],
      peer_critiques: [],
      mediation_decisions: [],
      status: 'initialized',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    this.sessions.set(args.session_id, session);
    console.log(`[ParallelReasoningSessionManager] Session created. New sessions count: ${this.sessions.size}`);
    return session;
  }

  /**
   * Submit reasoning plan (ChatGPT-generated)
   *
   * Validates:
   * - Plan has minimum diversity axes
   * - Diversity axes differ from existing plans
   *
   * @throws Error if session not found
   */
  submitPlan(session_id: string, plan: ReasoningPlan): {
    accepted: boolean;
    reason?: string;
    diversity_validation: {
      axes_declared: DiversityAxis[];
      axes_unique_to_existing: boolean;
      min_axes_met: boolean;
      required_axes_satisfied: boolean;
      required_axes: DiversityAxis[];
    };
  } {
    console.log(`[ParallelReasoningSessionManager] Looking for session: ${session_id}`);
    console.log(`[ParallelReasoningSessionManager] Available sessions: ${Array.from(this.sessions.keys()).join(', ')}`);
    console.log(`[ParallelReasoningSessionManager] Total sessions count: ${this.sessions.size}`);

    const session = this.sessions.get(session_id);
    if (!session) {
      console.log(`[ParallelReasoningSessionManager] Session not found: ${session_id}`);
      throw new Error(`Session ${session_id} not found`);
    }

    console.log(`[ParallelReasoningSessionManager] Session found: ${session_id}`);
    console.log(`[ParallelReasoningSessionManager] Plan diversity_axes: ${plan.diversity_axes.join(', ')}`);
    console.log(`[ParallelReasoningSessionManager] Plan diversity_axes length: ${plan.diversity_axes.length}`);

    if (session.plans.has(plan.plan_id)) {
      return {
        accepted: false,
        reason: `Plan ID \`${plan.plan_id}\` already exists. Plan IDs must be unique per session.`,
        diversity_validation: {
          axes_declared: plan.diversity_axes,
          axes_unique_to_existing: true,
          min_axes_met: plan.diversity_axes.length >= 2,
          required_axes_satisfied: satisfiesRequiredAxes(plan.diversity_axes, session.required_diversity_axes),
          required_axes: [...session.required_diversity_axes]
        }
      };
    }

    // Validate minimum axes
    const min_axes_met = plan.diversity_axes.length >= 2;

    // Use semantic validation for required axes
    const required_axes_satisfied = satisfiesRequiredAxes(
      plan.diversity_axes,
      session.required_diversity_axes
    );

    // Check if axes differ from existing plans by at least two axes semantically
    let axes_unique = true;
    let minDiversityCount = Infinity;
    let mostSimilarPlanId = '';

    for (const [existingPlanId, existing_plan] of session.plans) {
      const diversityCount = calculateSemanticDiversity(
        plan.diversity_axes,
        existing_plan.diversity_axes
      );

      console.log(`[ParallelReasoningSessionManager] Semantic diversity between ${plan.plan_id} and ${existingPlanId}: ${diversityCount}`);

      if (diversityCount < minDiversityCount) {
        minDiversityCount = diversityCount;
        mostSimilarPlanId = existingPlanId;
      }

      if (diversityCount < 2) {
        axes_unique = false;
        break;
      }
    }

    if (!axes_unique) {
      console.log(`[ParallelReasoningSessionManager] Plan ${plan.plan_id} rejected: too similar to ${mostSimilarPlanId} (diversity: ${minDiversityCount})`);
    }

    // Helper function to store rejected plan
    const storeRejectedPlan = (reason: string) => {
      const rejectedPlan: ReasoningPlan = {
        ...plan,
        status: 'rejected',
        rejection_reason: reason
      };
      session.rejected_plans.set(plan.plan_id, rejectedPlan);
      session.updated_at = Date.now();
      console.log(`[ParallelReasoningSessionManager] Stored rejected plan: ${plan.plan_id}`);
    };

    if (!min_axes_met) {
      const reason = 'Plan must declare at least 2 diversity axes';
      storeRejectedPlan(reason);
      return {
        accepted: false,
        reason,
        diversity_validation: {
          axes_declared: plan.diversity_axes,
          axes_unique_to_existing: axes_unique,
          min_axes_met: false,
          required_axes_satisfied,
          required_axes: [...session.required_diversity_axes]
        }
      };
    }

    if (!required_axes_satisfied) {
      const reason = `Plan must include required diversity axes: ${session.required_diversity_axes.join(', ')}`;
      storeRejectedPlan(reason);
      return {
        accepted: false,
        reason,
        diversity_validation: {
          axes_declared: plan.diversity_axes,
          axes_unique_to_existing: axes_unique,
          min_axes_met: true,
          required_axes_satisfied: false,
          required_axes: [...session.required_diversity_axes]
        }
      };
    }

    if (!axes_unique && session.plans.size > 0) {
      const reason = 'Plan diversity axes too similar to existing plans (at least 2 axes must differ)';
      storeRejectedPlan(reason);
      return {
        accepted: false,
        reason,
        diversity_validation: {
          axes_declared: plan.diversity_axes,
          axes_unique_to_existing: false,
          min_axes_met: true,
          required_axes_satisfied: true,
          required_axes: [...session.required_diversity_axes]
        }
      };
    }

    // Compute quality signals for the plan
    const signals = analyzePlan(plan);
    const planWithSignals: ReasoningPlan = { ...plan, signals };

    // Accept plan with signals
    session.plans.set(plan.plan_id, planWithSignals);
    session.plan_results.set(plan.plan_id, []);
    session.updated_at = Date.now();

    if (session.plans.size >= session.min_plans) {
      session.status = 'plans_submitted';
    }

    return {
      accepted: true,
      diversity_validation: {
        axes_declared: plan.diversity_axes,
        axes_unique_to_existing: true,
        min_axes_met: true,
        required_axes_satisfied: true,
        required_axes: [...session.required_diversity_axes]
      }
    };
  }

  /**
   * Record capability result for a plan
   * Returns the generated evidence ID for this result
   *
   * @throws Error if session not found
   */
  recordPlanResult(session_id: string, plan_id: string, result: any): string {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }

    const results = session.plan_results.get(plan_id);
    if (results) {
      // Generate evidence ID: session_id:plan_id:step_index
      const evidence_id = `${session_id}:${plan_id}:step${results.length + 1}`;

      // Store result with evidence ID
      const resultWithEvidence = {
        ...result,
        evidence_id
      };

      results.push(resultWithEvidence);
      session.updated_at = Date.now();

      // Register evidence in ledger if available
      if (this.evidenceLedger) {
        try {
          // Extract claim from result (use task description or summary)
          const claim = result.task || result.summary || `Execution result for ${plan_id}`;

          // Create evidence entry with minimal structure
          const evidence = [{
            type: 'CALCULATION', // Default type for capability results
            value: result,
            confidence: result.confidence || 0.7,
            source: `Plan ${plan_id} execution`,
            timestamp: Date.now()
          }];

          // Register in evidence ledger with custom ID
          this.evidenceLedger.addEvidence(
            evidence_id,           // Use evidence_id as artifact_id
            'capability_result',   // Field path
            claim,                 // Claim
            evidence,              // Evidence array
            evidence_id            // Use evidence_id as entry ID (custom ID)
          );

          console.log(`[ParallelReasoningSessionManager] Registered evidence ${evidence_id} in ledger`);
        } catch (error) {
          // Non-blocking: log error but don't fail the operation
          console.warn(`[ParallelReasoningSessionManager] Failed to register evidence ${evidence_id}:`, error);
        }
      }

      return evidence_id;
    }

    throw new Error(`Plan ${plan_id} not found in session ${session_id}`);
  }

  /**
   * Submit cross-plan note (contamination)
   * Now supports references to rejected plans (with warning)
   */
  submitCrossPlanNote(session_id: string, note: CrossPlanNote): void {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if plans exist (in either accepted or rejected)
    const fromPlanExists = session.plans.has(note.from_plan_id) || session.rejected_plans.has(note.from_plan_id);
    const toPlanExists = session.plans.has(note.to_plan_id) || session.rejected_plans.has(note.to_plan_id);

    if (!fromPlanExists) {
      throw new Error(`Plan ID \`${note.from_plan_id}\` not found in session \`${session_id}\` (neither accepted nor rejected)`);
    }

    if (!toPlanExists) {
      throw new Error(`Plan ID \`${note.to_plan_id}\` not found in session \`${session_id}\` (neither accepted nor rejected)`);
    }

    // Log warning if referencing rejected plans
    const fromRejected = session.rejected_plans.has(note.from_plan_id);
    const toRejected = session.rejected_plans.has(note.to_plan_id);

    if (fromRejected || toRejected) {
      console.warn(`[ParallelReasoningSessionManager] Cross-plan note references rejected plan(s): from=${note.from_plan_id} (rejected=${fromRejected}), to=${note.to_plan_id} (rejected=${toRejected})`);
    }

    // Compute quality signals for the note
    const signals = analyzeCrossPlanNote(note);
    const noteWithSignals: CrossPlanNote = { ...note, signals };

    session.cross_plan_notes.push(noteWithSignals);
    session.updated_at = Date.now();
  }

  /**
   * Submit peer critique (ChatGPT-generated)
   */
  submitPeerCritique(session_id: string, critique: PeerCritique): void {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.plans.has(critique.reviewer_plan_id)) {
      throw new Error(`Reviewer plan ID \`${critique.reviewer_plan_id}\` not found in session \`${session_id}\``);
    }

    if (!session.plans.has(critique.reviewed_plan_id)) {
      throw new Error(`Reviewed plan ID \`${critique.reviewed_plan_id}\` not found in session \`${session_id}\``);
    }

    // Compute quality signals for the critique
    const signals = analyzeCritique(critique);
    const critiqueWithSignals: PeerCritique = { ...critique, signals };

    session.peer_critiques.push(critiqueWithSignals);
    session.status = 'peer_review';
    session.updated_at = Date.now();
  }

  /**
   * Submit mediation decision
   *
   * Validates:
   * - Plan exists
   * - Evidence IDs are not empty (structural validation only)
   *
   * NOTE: Evidence ID existence validation against evidence ledger should be done
   * at a higher level where the evidence ledger is available
   */
  submitMediationDecision(session_id: string, decision: MediationDecision, validateEvidenceIds?: (ids: string[]) => boolean): void {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.plans.has(decision.chosen_from_plan)) {
      throw new Error(`Plan ID \`${decision.chosen_from_plan}\` not found in session \`${session_id}\``);
    }

    // Validate evidence IDs if validator provided
    if (validateEvidenceIds && decision.evidence_ids.length > 0) {
      const allValid = validateEvidenceIds(decision.evidence_ids);
      if (!allValid) {
        throw new Error(`Mediation decision cites non-existent evidence IDs. All evidence must be recorded before citing in decisions.`);
      }
    }

    // Compute quality signals for the decision
    const signals = analyzeMediationDecision(decision);
    const decisionWithSignals: MediationDecision = { ...decision, signals };

    session.mediation_decisions.push(decisionWithSignals);
    session.updated_at = Date.now();
  }

  /**
   * Check if session is ready for finalization
   *
   * Validates:
   * - Minimum plans requirement
   * - All plans have execution results
   * - Quality metrics meet thresholds (75% confidence, 85% coverage, 70% consensus)
   */
  checkSessionReadiness(session_id: string): {
    ready: boolean;
    structural_check: {
      min_plans_met: boolean;
      all_plans_executed: boolean;
      plans_submitted: number;
      min_plans_required: number;
      missing_plans: string[];
    };
    quality_check: {
      confidence_met: boolean;
      coverage_met: boolean;
      consensus_met: boolean;
      all_thresholds_met: boolean;
    };
    metrics: SessionMetrics;
    blockers: string[];
    recommendations: string[];
  } {
    const session = this.sessions.get(session_id);
    if (!session) {
      return {
        ready: false,
        structural_check: {
          min_plans_met: false,
          all_plans_executed: false,
          plans_submitted: 0,
          min_plans_required: 0,
          missing_plans: []
        },
        quality_check: {
          confidence_met: false,
          coverage_met: false,
          consensus_met: false,
          all_thresholds_met: false
        },
        metrics: {
          confidence: 0,
          coverage: 0,
          consensus: 0,
          computed_at: Date.now(),
          details: {
            confidence: { unique_evidence_count: 0, evidence_low_count: 0, base: 0, bonus: 0, penalty: 0 },
            coverage: { total_declared_steps: 0, executed_steps: 0 },
            consensus: { agreements: 0, conflicts: 0, total_interactions: 0 }
          }
        },
        blockers: ['Session not found'],
        recommendations: []
      };
    }

    // Structural checks
    const plans_submitted = session.plans.size;
    const min_plans_met = plans_submitted >= session.min_plans;

    const missing_plans: string[] = [];
    for (const [plan_id, _] of session.plans) {
      const results = session.plan_results.get(plan_id);
      if (!results || results.length === 0) {
        missing_plans.push(plan_id);
      }
    }
    const all_plans_executed = missing_plans.length === 0;

    // Quality checks
    const metrics = this.computeMetrics(session_id);
    const thresholds = meetsThresholds(metrics);

    // Compile blockers
    const blockers: string[] = [];
    if (!min_plans_met) {
      blockers.push(`Need ${session.min_plans - plans_submitted} more plan(s) (${plans_submitted}/${session.min_plans} submitted)`);
    }
    if (!all_plans_executed) {
      blockers.push(`${missing_plans.length} plan(s) not executed: ${missing_plans.join(', ')}`);
    }
    if (!thresholds.confidence_met) {
      blockers.push(`Confidence below ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% threshold (current: ${(metrics.confidence * 100).toFixed(1)}%)`);
    }
    if (!thresholds.coverage_met) {
      blockers.push(`Coverage below ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% threshold (current: ${(metrics.coverage * 100).toFixed(1)}%)`);
    }
    if (!thresholds.consensus_met) {
      blockers.push(`Consensus below ${(CONSENSUS_THRESHOLD * 100).toFixed(0)}% threshold (current: ${(metrics.consensus * 100).toFixed(1)}%)`);
    }

    // Generate recommendations
    const recommendations = generateMetricWarnings(metrics);

    const ready = min_plans_met && all_plans_executed && thresholds.ready;

    return {
      ready,
      structural_check: {
        min_plans_met,
        all_plans_executed,
        plans_submitted,
        min_plans_required: session.min_plans,
        missing_plans
      },
      quality_check: {
        confidence_met: thresholds.confidence_met,
        coverage_met: thresholds.coverage_met,
        consensus_met: thresholds.consensus_met,
        all_thresholds_met: thresholds.ready
      },
      metrics,
      blockers,
      recommendations
    };
  }

  /**
   * Finalize session
   *
   * Validates completeness (structural only):
   * - Minimum number of plans submitted (min_plans)
   * - All submitted plans have execution results
   * - Evidence IDs are recommended but not required (warnings only)
   */
  finalizeSession(session_id: string): {
    finalized: boolean;
    completeness_check: {
      min_plans_met: boolean;
      all_plans_executed: boolean;
      all_decisions_have_evidence: boolean;
      plans_submitted: number;
      min_plans_required: number;
      missing_plans: string[];
      decisions_without_evidence: string[];
    };
    warnings?: string[];
    quality_summary?: {
      flagged_artifacts_count: number;
      flagged_artifacts: string[];
    };
    metrics?: SessionMetrics;
  } {
    const session = this.sessions.get(session_id);
    if (!session) {
      return {
        finalized: false,
        completeness_check: {
          min_plans_met: false,
          all_plans_executed: false,
          all_decisions_have_evidence: false,
          plans_submitted: 0,
          min_plans_required: 0,
          missing_plans: [],
          decisions_without_evidence: []
        },
        warnings: []
      };
    }

    // Check minimum plans requirement
    const plans_submitted = session.plans.size;
    const min_plans_met = plans_submitted >= session.min_plans;

    // Check all plans have results
    const missing_plans: string[] = [];
    for (const [plan_id, _] of session.plans) {
      const results = session.plan_results.get(plan_id);
      if (!results || results.length === 0) {
        missing_plans.push(plan_id);
      }
    }

    // Check all decisions have evidence (WARNING, not blocking)
    const decisions_without_evidence: string[] = [];
    for (const decision of session.mediation_decisions) {
      if (decision.evidence_ids.length === 0) {
        decisions_without_evidence.push(decision.decision_point);
      }
    }

    const all_plans_executed = missing_plans.length === 0;
    const all_decisions_have_evidence = decisions_without_evidence.length === 0;

    // Collect quality signals from all artifacts
    const quality_warnings: string[] = [];
    const flagged_artifacts: string[] = [];

    // Check plans for quality signals
    for (const [plan_id, plan] of session.plans) {
      if (plan.signals && plan.signals.signals.length > 0) {
        const criticalOrWarning = plan.signals.signals.filter(s => s.severity === 'critical' || s.severity === 'warning');
        if (criticalOrWarning.length > 0) {
          flagged_artifacts.push(`plan:${plan_id}`);
          quality_warnings.push(`Plan "${plan_id}": ${criticalOrWarning.length} quality concern(s)`);
        }
      }
    }

    // Check critiques for quality signals
    for (const critique of session.peer_critiques) {
      if (critique.signals && critique.signals.signals.length > 0) {
        const criticalOrWarning = critique.signals.signals.filter(s => s.severity === 'critical' || s.severity === 'warning');
        if (criticalOrWarning.length > 0) {
          flagged_artifacts.push(`critique:${critique.reviewer_plan_id}→${critique.reviewed_plan_id}`);
          quality_warnings.push(`Critique ${critique.reviewer_plan_id}→${critique.reviewed_plan_id}: ${criticalOrWarning.length} quality concern(s)`);
        }
      }
    }

    // Check decisions for quality signals
    for (const decision of session.mediation_decisions) {
      if (decision.signals && decision.signals.signals.length > 0) {
        const criticalOrWarning = decision.signals.signals.filter(s => s.severity === 'critical' || s.severity === 'warning');
        if (criticalOrWarning.length > 0) {
          flagged_artifacts.push(`decision:${decision.decision_point}`);
          quality_warnings.push(`Decision "${decision.decision_point}": ${criticalOrWarning.length} quality concern(s)`);
        }
      }
    }

    // Check cross-plan notes for quality signals
    for (const note of session.cross_plan_notes) {
      if (note.signals && note.signals.signals.length > 0) {
        const criticalOrWarning = note.signals.signals.filter(s => s.severity === 'critical' || s.severity === 'warning');
        if (criticalOrWarning.length > 0) {
          flagged_artifacts.push(`note:${note.from_plan_id}→${note.to_plan_id}`);
          quality_warnings.push(`Note ${note.from_plan_id}→${note.to_plan_id}: ${criticalOrWarning.length} quality concern(s)`);
        }
      }
    }

    // Compute quality metrics
    const metrics = this.computeMetrics(session_id);
    const thresholds = meetsThresholds(metrics);

    // Session is finalized if:
    // 1. Minimum plans are met
    // 2. All plans are executed
    // 3. Quality metrics meet thresholds (BLOCKING)
    const finalized = min_plans_met && all_plans_executed && thresholds.ready;

    // Compile all warnings
    const warnings: string[] = [];

    // BLOCKING: Quality metrics below thresholds
    if (!thresholds.ready) {
      warnings.push(`🚫 **FINALIZATION BLOCKED**: Quality metrics below required thresholds`);
      warnings.push(``);

      if (!thresholds.confidence_met) {
        const needed = Math.ceil((CONFIDENCE_THRESHOLD - metrics.confidence) / 0.1);
        warnings.push(
          `❌ **Confidence**: ${(metrics.confidence * 100).toFixed(1)}% (need ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%) - ` +
          `Add ${needed} more evidence references. Check \`list_plan_status\` for evidence quality report.`
        );
      }

      if (!thresholds.coverage_met) {
        const needed = Math.ceil(
          (COVERAGE_THRESHOLD - metrics.coverage) * metrics.details.coverage.total_declared_steps
        );
        warnings.push(
          `❌ **Coverage**: ${(metrics.coverage * 100).toFixed(1)}% (need ${(COVERAGE_THRESHOLD * 100).toFixed(0)}%) - ` +
          `Execute ${needed} more capability steps (${metrics.details.coverage.executed_steps}/${metrics.details.coverage.total_declared_steps} completed)`
        );
      }

      if (!thresholds.consensus_met) {
        warnings.push(
          `❌ **Consensus**: ${(metrics.consensus * 100).toFixed(1)}% (need ${(CONSENSUS_THRESHOLD * 100).toFixed(0)}%) - ` +
          `Submit more peer critiques using \`submit_peer_critique\` (${metrics.details.consensus.agreements} agreements, ${metrics.details.consensus.conflicts} conflicts)`
        );
      }

      warnings.push(``);
      warnings.push(`💡 **Next steps**: Use \`check_session_readiness\` to verify progress before attempting finalization again`);
    }

    if (finalized) {
      session.status = 'finalized';
      session.updated_at = Date.now();
    }

    // Non-blocking warnings
    if (decisions_without_evidence.length > 0) {
      warnings.push(`⚠️ ${decisions_without_evidence.length} mediation decision(s) lack evidence IDs. While not blocking finalization, evidence IDs improve traceability.`);
    }

    if (quality_warnings.length > 0) {
      warnings.push(`⚠️ ${flagged_artifacts.length} artifact(s) flagged with quality concerns:`);
      warnings.push(...quality_warnings.map(w => `   - ${w}`));
      warnings.push(`Review flagged artifacts before finalizing to ensure analysis depth.`);
    }

    return {
      finalized,
      completeness_check: {
        min_plans_met,
        all_plans_executed,
        all_decisions_have_evidence,
        plans_submitted,
        min_plans_required: session.min_plans,
        missing_plans,
        decisions_without_evidence
      },
      warnings,
      quality_summary: {
        flagged_artifacts_count: flagged_artifacts.length,
        flagged_artifacts
      },
      metrics
    };
  }

  /**
   * Get session status (passive listing)
   */
  getSessionStatus(session_id: string): {
    session: ParallelReasoningSession | null;
    pending_frames: string[];
  } {
    const session = this.sessions.get(session_id);
    if (!session) {
      return { session: null, pending_frames: [] };
    }

    const pending_frames: string[] = [];

    // Check for incomplete plans
    for (const [plan_id, _] of session.plans) {
      const results = session.plan_results.get(plan_id);
      if (!results || results.length === 0) {
        pending_frames.push(`plan_execution:${plan_id}`);
      }
    }

    // Check for missing peer reviews
    const num_plans = session.plans.size;
    const expected_critiques = num_plans * (num_plans - 1); // Each plan reviews all others
    if (session.peer_critiques.length < expected_critiques) {
      pending_frames.push(`peer_review:${expected_critiques - session.peer_critiques.length}_remaining`);
    }

    return {
      session,
      pending_frames
    };
  }

  /**
   * Get session (for export and debugging)
   */
  getSession(session_id: string): ParallelReasoningSession | null {
    console.log(`[ParallelReasoningSessionManager] getSession called for: ${session_id}`);
    console.log(`[ParallelReasoningSessionManager] Available sessions: ${Array.from(this.sessions.keys()).join(', ')}`);
    const session = this.sessions.get(session_id) || null;
    console.log(`[ParallelReasoningSessionManager] Session found: ${!!session}`);
    return session;
  }

  /**
   * Get all sessions (for persistence and debugging)
   */
  getAllSessions(): Map<string, ParallelReasoningSession> {
    return this.sessions;
  }

  /**
   * Serialize sessions for Durable Object storage
   * Converts nested Maps to arrays for JSON serialization
   */
  serializeSessions(): Array<[string, any]> {
    const serialized: Array<[string, any]> = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      // Convert nested Maps to arrays for JSON serialization
      const serializedSession = {
        ...session,
        plans: Array.from(session.plans.entries()),
        rejected_plans: Array.from(session.rejected_plans.entries()),
        plan_results: Array.from(session.plan_results.entries())
      };
      serialized.push([sessionId, serializedSession]);
    }

    return serialized;
  }

  /**
   * Deserialize sessions from Durable Object storage
   * Converts arrays back to Maps
   *
   * Handles corrupted/invalid input gracefully by skipping invalid entries
   */
  loadSessions(sessions: Array<[string, any]>): void {
    this.sessions.clear();

    // Handle null/undefined/non-iterable input gracefully
    if (!sessions || !Array.isArray(sessions)) {
      console.log(`[ParallelReasoningSessionManager] Invalid sessions input (not an array), skipping load`);
      return;
    }

    for (const entry of sessions) {
      try {
        // Validate entry structure
        if (!Array.isArray(entry) || entry.length !== 2) {
          console.warn(`[ParallelReasoningSessionManager] Skipping invalid session entry (not a [key, value] pair)`);
          continue;
        }

        const [sessionId, serializedSession] = entry;

        // Validate session ID
        if (typeof sessionId !== 'string') {
          console.warn(`[ParallelReasoningSessionManager] Skipping session with invalid ID (not a string)`);
          continue;
        }

        // Validate serialized session
        if (!serializedSession || typeof serializedSession !== 'object') {
          console.warn(`[ParallelReasoningSessionManager] Skipping session ${sessionId} with invalid data`);
          continue;
        }

        // Convert arrays back to Maps
        const session: ParallelReasoningSession = {
          ...serializedSession,
          plans: new Map(serializedSession.plans || []),
          rejected_plans: new Map(serializedSession.rejected_plans || []),
          plan_results: new Map(serializedSession.plan_results || [])
        };
        this.sessions.set(sessionId, session);
      } catch (error) {
        console.error(`[ParallelReasoningSessionManager] Error loading session entry:`, error);
        // Continue loading other sessions
      }
    }

    console.log(`[ParallelReasoningSessionManager] Loaded ${this.sessions.size} sessions from storage`);
    console.log(`[ParallelReasoningSessionManager] Session IDs: ${Array.from(this.sessions.keys()).join(', ')}`);
  }

  /**
   * Reset a session to initialized state (recovery mechanism)
   * Useful when a session is in an inconsistent state
   */
  resetSession(session_id: string): boolean {
    const session = this.sessions.get(session_id);
    if (!session) {
      return false;
    }

    console.log(`[ParallelReasoningSessionManager] Resetting session ${session_id} to initialized state`);

    // Keep session_id, task_description, required_diversity_axes, min_plans
    // Reset all execution state
    session.plans.clear();
    session.rejected_plans.clear();
    session.plan_results.clear();
    session.cross_plan_notes = [];
    session.peer_critiques = [];
    session.mediation_decisions = [];
    session.status = 'initialized';
    session.updated_at = Date.now();

    console.log(`[ParallelReasoningSessionManager] Session ${session_id} reset successfully`);
    return true;
  }

  /**
   * Terminate a session (mark as terminated)
   */
  terminateSession(session_id: string): void {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }
    session.status = 'terminated';
    session.updated_at = Date.now();
    console.log(`[ParallelReasoningSessionManager] Session ${session_id} terminated`);
  }

  /**
   * List all sessions
   */
  listSessions(): ParallelReasoningSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Delete a session completely (for cleanup)
   */
  deleteSession(session_id: string): boolean {
    const existed = this.sessions.has(session_id);
    if (existed) {
      this.sessions.delete(session_id);
      console.log(`[ParallelReasoningSessionManager] Session ${session_id} deleted`);
    }
    return existed;
  }

  /**
   * Clear all sessions (for testing)
   */
  clearSessions(): void {
    this.sessions.clear();
  }

  /**
   * Compute quality metrics for a session
   * Calculates confidence, coverage, and consensus based on session data
   */
  computeMetrics(session_id: string): SessionMetrics {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }

    const metrics = computeSessionMetrics(session);

    // Cache metrics in session
    session.metrics = {
      confidence: metrics.confidence,
      coverage: metrics.coverage,
      consensus: metrics.consensus,
      computed_at: metrics.computed_at
    };
    session.updated_at = Date.now();

    return metrics;
  }
}

/**
 * Global session manager (for non-DO environments)
 */
export const globalParallelReasoningManager = new ParallelReasoningSessionManager();
