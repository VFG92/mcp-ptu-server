/**
 * UI Structured Content Types
 * 
 * TypeScript interfaces for structured data returned by MCP tools
 * to enable rich UI visualization in ChatGPT Apps SDK.
 * 
 * ARCHITECTURE PRINCIPLE:
 * - Tools return BOTH text (for conversation) AND structuredContent (for UI)
 * - UI components are passive observers that consume structured data
 * - No modification to orchestration logic - ChatGPT remains sole agent
 */

import type { DiversityAxis, ReasoningPlan, CrossPlanNote, PeerCritique, MediationDecision } from './parallel-reasoning-mcp.js';

/**
 * Base interface for all structured content
 */
export interface BaseStructuredContent {
  type: string;
  session_id: string;
  timestamp: number;
}

/**
 * Workflow Initialized Event
 * Returned by: init_parallel_reasoning
 */
export interface WorkflowInitializedContent extends BaseStructuredContent {
  type: 'workflow_initialized';
  task_description: string;
  required_diversity_axes: DiversityAxis[];
  min_plans: number;
  suggested_axes?: DiversityAxis[];
}

/**
 * Plan Submitted Event
 * Returned by: submit_reasoning_plan
 */
export interface PlanSubmittedContent extends BaseStructuredContent {
  type: 'plan_submitted';
  plan: {
    plan_id: string;
    description: string;
    diversity_axes: DiversityAxis[];
    capability_chain: string[];
    rationale: string;
    expected_outputs: string[];
  };
  accepted: boolean;
  reason?: string;
  diversity_validation?: {
    axes_different: number;
    required_minimum: number;
    compared_with: string[];
  };
}

/**
 * Plan Execution Step Event
 * Returned by: execute_plan_step
 */
export interface PlanExecutionContent extends BaseStructuredContent {
  type: 'plan_execution';
  plan_id: string;
  step_number: number;
  total_steps: number;
  capability_name: string;
  adapter_id: string;
  evidence_id: string;
  result: {
    guardrails?: any;
    output?: any;
    metadata?: {
      execution_time_ms?: number;
      tokens_used?: number;
    };
  };
  quality_signals?: {
    signals: Array<{
      type: string;
      severity: 'info' | 'warning' | 'critical';
      message: string;
    }>;
    flagged_count: number;
  };
}

/**
 * Cross-Plan Note Event
 * Returned by: submit_cross_plan_note
 */
export interface CrossPlanNoteContent extends BaseStructuredContent {
  type: 'cross_plan_note';
  note: CrossPlanNote;
}

/**
 * Peer Critique Event
 * Returned by: submit_peer_critique
 */
export interface PeerCritiqueContent extends BaseStructuredContent {
  type: 'peer_critique';
  critique: PeerCritique & {
    reviewer_plan_id: string;
    reviewed_plan_id: string;
  };
}

/**
 * Mediation Decision Event
 * Returned by: submit_mediation_decision
 */
export interface MediationDecisionContent extends BaseStructuredContent {
  type: 'mediation_decision';
  decision: MediationDecision;
  evidence_validation?: {
    valid_evidence_ids: string[];
    invalid_evidence_ids: string[];
  };
}

/**
 * Workflow Status Snapshot
 * Returned by: list_plan_status
 */
export interface WorkflowStatusContent extends BaseStructuredContent {
  type: 'workflow_status';
  status: 'initialized' | 'plans_submitted' | 'executing' | 'peer_review' | 'mediation' | 'finalized' | 'terminated';
  task_description: string;
  plans: Array<{
    plan_id: string;
    description: string;
    diversity_axes: DiversityAxis[];
    capability_chain: string[];
    executed_steps: number;
    total_steps: number;
    progress_percentage: number;
  }>;
  cross_plan_notes: CrossPlanNote[];
  peer_critiques: Array<{
    reviewer_plan_id: string;
    reviewed_plan_id: string;
    agreement_score: number;
    timestamp: number;
  }>;
  mediation_decisions: MediationDecision[];
  metrics?: {
    confidence: number;
    coverage: number;
    consensus: number;
    computed_at: number;
  };
  completeness: {
    min_plans_met: boolean;
    all_plans_executed: boolean;
    has_peer_reviews: boolean;
    has_mediation_decisions: boolean;
  };
}

/**
 * Workflow Finalized Event
 * Returned by: finalize_parallel_reasoning
 */
export interface WorkflowFinalizedContent extends BaseStructuredContent {
  type: 'workflow_finalized';
  finalized: boolean;
  metrics: {
    confidence: number;
    coverage: number;
    consensus: number;
    computed_at: number;
  };
  quality_summary: {
    total_artifacts: number;
    flagged_artifacts: number;
    critical_issues: number;
    warnings: number;
  };
  decision_map: Array<{
    decision_point: string;
    chosen_from_plan: string;
    confidence: number;
    evidence_count: number;
  }>;
  recommendations?: string[];
  warnings?: string[];
}

/**
 * Union type of all structured content
 */
export type StructuredContent =
  | WorkflowInitializedContent
  | PlanSubmittedContent
  | PlanExecutionContent
  | CrossPlanNoteContent
  | PeerCritiqueContent
  | MediationDecisionContent
  | WorkflowStatusContent
  | WorkflowFinalizedContent;

/**
 * Helper to create structured content with common fields
 */
export function createStructuredContent<T extends StructuredContent>(
  type: T['type'],
  session_id: string,
  data: Omit<T, 'type' | 'session_id' | 'timestamp'>
): T {
  return {
    type,
    session_id,
    timestamp: Date.now(),
    ...data
  } as T;
}

/**
 * Type guard to check if content is structured
 */
export function isStructuredContent(content: any): content is StructuredContent {
  return (
    content &&
    typeof content === 'object' &&
    'type' in content &&
    'session_id' in content &&
    'timestamp' in content
  );
}

/**
 * Extract structured content from MCP tool response
 */
export function extractStructuredContent(response: any): StructuredContent | null {
  if (response && typeof response === 'object' && 'structuredContent' in response) {
    const content = response.structuredContent;
    return isStructuredContent(content) ? content : null;
  }
  return null;
}

