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
 * WORKFLOW:
 * 1. ChatGPT: init_parallel_reasoning_session → declares diversity axes
 * 2. ChatGPT: submit_reasoning_plan (Plan A, B, C...) → server validates diversity
 * 3. ChatGPT: execute_plan_step → invokes capabilities, server persists
 * 4. ChatGPT: submit_cross_plan_note → contamination between plans
 * 5. ChatGPT: submit_peer_critique → peer review (ChatGPT writes, server stores)
 * 6. ChatGPT: finalize_mediated_result → synthesis with decision map
 * 
 * References:
 * - Wang et al., Self-Consistency, 2022
 * - Yao et al., Tree of Thoughts, 2023
 * - Du et al., Improving Factuality via Debate, 2023
 */

import { z } from 'zod';

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
  if (taskLower.match(/\b(financial|investment|valuation|dcf|npv|roi|revenue|profit)\b/)) {
    suggested.push('analytical_models', 'time_horizons', 'risk_perspectives');
    rationale = 'Financial analysis benefits from different analytical models (DCF vs multiples), time horizons (short vs long-term), and risk perspectives (optimistic vs conservative).';
  }
  // Market analysis
  else if (taskLower.match(/\b(market|customer|segment|competitive|industry|tam|sam)\b/)) {
    suggested.push('data_sources', 'customer_segments', 'competitive_dynamics');
    rationale = 'Market analysis benefits from different data sources (primary vs secondary), customer segments, and competitive lenses.';
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
  // HR/Organizational
  else if (taskLower.match(/\b(hr|human resources|talent|organization|culture|workforce)\b/)) {
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
 * Reasoning plan submitted by ChatGPT
 */
export const ReasoningPlanSchema = z.object({
  plan_id: z.string(),
  description: z.string(),
  diversity_axes: z.array(DiversityAxisSchema).min(2), // Minimum 2 axes must differ
  capability_chain: z.array(z.string()).min(8).max(32).describe('Capability chain: 8-32 capabilities per workflow'),
  rationale: z.string(),
  expected_outputs: z.array(z.string())
});

export type ReasoningPlan = z.infer<typeof ReasoningPlanSchema>;

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

export type CrossPlanNote = z.infer<typeof CrossPlanNoteSchema>;

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

export type PeerCritique = z.infer<typeof PeerCritiqueSchema>;

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

export type MediationDecision = z.infer<typeof MediationDecisionSchema>;

/**
 * Parallel reasoning session state
 */
export interface ParallelReasoningSession {
  session_id: string;
  task_description: string;
  required_diversity_axes: DiversityAxis[];
  min_plans: number;
  plans: Map<string, ReasoningPlan>;
  plan_results: Map<string, any[]>; // plan_id -> array of capability results
  cross_plan_notes: CrossPlanNote[];
  peer_critiques: PeerCritique[];
  mediation_decisions: MediationDecision[];
  status: 'initialized' | 'plans_submitted' | 'executing' | 'peer_review' | 'mediation' | 'finalized' | 'terminated';
  created_at: number;
  updated_at: number;
}

/**
 * Parallel Reasoning Session Manager
 * 
 * Pure persistence and structural validation - NO intelligence
 */
export class ParallelReasoningSessionManager {
  private sessions: Map<string, ParallelReasoningSession> = new Map();

  /**
   * Initialize parallel reasoning session
   * IDEMPOTENT: If session already exists, returns existing session instead of overwriting
   * SPECIAL CASE: If session is terminated, resets it to initialized state
   */
  initSession(args: {
    session_id: string;
    task_description: string;
    required_diversity_axes: DiversityAxis[];
    min_plans: number;
  }): ParallelReasoningSession {
    console.log(`[ParallelReasoningSessionManager] Init request for session: ${args.session_id}`);
    console.log(`[ParallelReasoningSessionManager] Current sessions count: ${this.sessions.size}`);

    // Check if session already exists (IDEMPOTENT BEHAVIOR)
    const existingSession = this.sessions.get(args.session_id);
    if (existingSession) {
      console.log(`[ParallelReasoningSessionManager] Session ${args.session_id} already exists (status: ${existingSession.status})`);

      // SPECIAL CASE: If session is terminated, reset it to allow reuse
      if (existingSession.status === 'terminated') {
        console.log(`[ParallelReasoningSessionManager] Session ${args.session_id} is terminated - resetting to initialized state`);
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

      console.log(`[ParallelReasoningSessionManager] Returning existing session (idempotent behavior)`);

      // Update timestamp to indicate activity
      existingSession.updated_at = Date.now();

      return existingSession;
    }

    // Create new session
    console.log(`[ParallelReasoningSessionManager] Creating new session: ${args.session_id}`);
    const session: ParallelReasoningSession = {
      session_id: args.session_id,
      task_description: args.task_description,
      required_diversity_axes: args.required_diversity_axes,
      min_plans: args.min_plans,
      plans: new Map(),
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
          required_axes_satisfied: session.required_diversity_axes.every(axis => plan.diversity_axes.includes(axis)),
          required_axes: [...session.required_diversity_axes]
        }
      };
    }

    // Validate minimum axes
    const min_axes_met = plan.diversity_axes.length >= 2;
    const required_axes_satisfied = session.required_diversity_axes.every(axis =>
      plan.diversity_axes.includes(axis)
    );

    // Check if axes differ from existing plans by at least two unique axes overall
    let axes_unique = true;
    const newAxesSet = new Set(plan.diversity_axes);

    for (const [, existing_plan] of session.plans) {
      const existingAxesSet = new Set(existing_plan.diversity_axes);

      let symmetricDifferenceCount = 0;

      for (const axis of newAxesSet) {
        if (!existingAxesSet.has(axis)) {
          symmetricDifferenceCount++;
        }
      }

      for (const axis of existingAxesSet) {
        if (!newAxesSet.has(axis)) {
          symmetricDifferenceCount++;
        }
      }

      if (symmetricDifferenceCount < 2) {
        axes_unique = false;
        break;
      }
    }

    if (!min_axes_met) {
      return {
        accepted: false,
        reason: 'Plan must declare at least 2 diversity axes',
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
      return {
        accepted: false,
        reason: `Plan must include required diversity axes: ${session.required_diversity_axes.join(', ')}`,
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
      return {
        accepted: false,
        reason: 'Plan diversity axes too similar to existing plans (at least 2 axes must differ)',
        diversity_validation: {
          axes_declared: plan.diversity_axes,
          axes_unique_to_existing: false,
          min_axes_met: true,
          required_axes_satisfied: true,
          required_axes: [...session.required_diversity_axes]
        }
      };
    }

    // Accept plan
    session.plans.set(plan.plan_id, plan);
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

      return evidence_id;
    }

    throw new Error(`Plan ${plan_id} not found in session ${session_id}`);
  }

  /**
   * Submit cross-plan note (contamination)
   */
  submitCrossPlanNote(session_id: string, note: CrossPlanNote): void {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.plans.has(note.from_plan_id)) {
      throw new Error(`Plan ID \`${note.from_plan_id}\` not found in session \`${session_id}\``);
    }

    if (!session.plans.has(note.to_plan_id)) {
      throw new Error(`Plan ID \`${note.to_plan_id}\` not found in session \`${session_id}\``);
    }

    session.cross_plan_notes.push(note);
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

    session.peer_critiques.push(critique);
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

    session.mediation_decisions.push(decision);
    session.updated_at = Date.now();
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

    // Session is finalized if minimum plans are met and all plans are executed
    // Evidence IDs are recommended but not required (warning only)
    const finalized = min_plans_met && all_plans_executed;

    if (finalized) {
      session.status = 'finalized';
      session.updated_at = Date.now();
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
      warnings: decisions_without_evidence.length > 0 ? [
        `⚠️ ${decisions_without_evidence.length} mediation decision(s) lack evidence IDs. While not blocking finalization, evidence IDs improve traceability.`
      ] : []
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
}

/**
 * Global session manager (for non-DO environments)
 */
export const globalParallelReasoningManager = new ParallelReasoningSessionManager();
