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
 */
export const DiversityAxisSchema = z.enum([
  'data_sources',        // Different data sources (official stats vs industry reports)
  'analytical_models',   // Different models (regression vs Monte Carlo vs normative)
  'time_horizons',       // Different time frames (short-term vs long-term)
  'quality_metrics',     // Different quality criteria (precision vs recall vs robustness)
  'risk_perspectives',   // Different risk lenses (market vs regulatory vs operational)
  'stakeholder_views'    // Different stakeholder perspectives (customer vs investor vs regulator)
]);

export type DiversityAxis = z.infer<typeof DiversityAxisSchema>;

/**
 * Reasoning plan submitted by ChatGPT
 */
export const ReasoningPlanSchema = z.object({
  plan_id: z.string(),
  description: z.string(),
  diversity_axes: z.array(DiversityAxisSchema).min(2), // Minimum 2 axes must differ
  capability_chain: z.array(z.string()),
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
  status: 'initialized' | 'plans_submitted' | 'executing' | 'peer_review' | 'mediation' | 'finalized';
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
   */
  initSession(args: {
    session_id: string;
    task_description: string;
    required_diversity_axes: DiversityAxis[];
    min_plans: number;
  }): ParallelReasoningSession {
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
    return session;
  }

  /**
   * Submit reasoning plan (ChatGPT-generated)
   * 
   * Validates:
   * - Plan has minimum diversity axes
   * - Diversity axes differ from existing plans
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
    const session = this.sessions.get(session_id);
    if (!session) {
      return {
        accepted: false,
        reason: 'Session not found',
        diversity_validation: {
          axes_declared: [],
          axes_unique_to_existing: false,
          min_axes_met: false,
          required_axes_satisfied: false,
          required_axes: []
        }
      };
    }

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
   */
  recordPlanResult(session_id: string, plan_id: string, result: any): void {
    const session = this.sessions.get(session_id);
    if (!session) return;

    const results = session.plan_results.get(plan_id);
    if (results) {
      results.push(result);
      session.updated_at = Date.now();
    }
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
   */
  submitMediationDecision(session_id: string, decision: MediationDecision): void {
    const session = this.sessions.get(session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.plans.has(decision.chosen_from_plan)) {
      throw new Error(`Plan ID \`${decision.chosen_from_plan}\` not found in session \`${session_id}\``);
    }

    session.mediation_decisions.push(decision);
    session.updated_at = Date.now();
  }

  /**
   * Finalize session
   * 
   * Validates completeness (structural only):
   * - All plans have results
   * - All decision points reference evidence IDs
   */
  finalizeSession(session_id: string): {
    finalized: boolean;
    completeness_check: {
      all_plans_executed: boolean;
      all_decisions_have_evidence: boolean;
      missing_plans: string[];
      decisions_without_evidence: string[];
    };
  } {
    const session = this.sessions.get(session_id);
    if (!session) {
      return {
        finalized: false,
        completeness_check: {
          all_plans_executed: false,
          all_decisions_have_evidence: false,
          missing_plans: [],
          decisions_without_evidence: []
        }
      };
    }

    // Check all plans have results
    const missing_plans: string[] = [];
    for (const [plan_id, _] of session.plans) {
      const results = session.plan_results.get(plan_id);
      if (!results || results.length === 0) {
        missing_plans.push(plan_id);
      }
    }

    // Check all decisions have evidence
    const decisions_without_evidence: string[] = [];
    for (const decision of session.mediation_decisions) {
      if (decision.evidence_ids.length === 0) {
        decisions_without_evidence.push(decision.decision_point);
      }
    }

    const all_plans_executed = missing_plans.length === 0;
    const all_decisions_have_evidence = decisions_without_evidence.length === 0;

    if (all_plans_executed && all_decisions_have_evidence) {
      session.status = 'finalized';
      session.updated_at = Date.now();
    }

    return {
      finalized: all_plans_executed && all_decisions_have_evidence,
      completeness_check: {
        all_plans_executed,
        all_decisions_have_evidence,
        missing_plans,
        decisions_without_evidence
      }
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
   * Get session (for export)
   */
  getSession(session_id: string): ParallelReasoningSession | null {
    return this.sessions.get(session_id) || null;
  }

  /**
   * Get all sessions (for persistence)
   */
  getAllSessions(): Map<string, ParallelReasoningSession> {
    return this.sessions;
  }

  /**
   * Serialize sessions for Durable Object storage
   */
  serializeSessions(): Array<[string, ParallelReasoningSession]> {
    return Array.from(this.sessions.entries());
  }

  /**
   * Deserialize sessions from Durable Object storage
   */
  loadSessions(sessions: Array<[string, ParallelReasoningSession]>): void {
    this.sessions = new Map(sessions);
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
