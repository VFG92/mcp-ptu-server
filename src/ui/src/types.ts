/**
 * Shared types for UI components
 * These mirror the structured content types from the MCP server
 */

export type DiversityAxis = string;

export interface BaseStructuredContent {
  type: string;
  session_id: string;
  timestamp: number;
}

export interface WorkflowInitializedContent extends BaseStructuredContent {
  type: 'workflow_initialized';
  task_description: string;
  required_diversity_axes: DiversityAxis[];
  min_plans: number;
  suggested_axes?: DiversityAxis[];
}

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

export interface PlanExecutionContent extends BaseStructuredContent {
  type: 'plan_execution';
  plan_id: string;
  step_number: number;
  total_steps: number;
  capability_name: string;
  adapter_id: string;
  evidence_id: string;
  result: {
    guardrails: any;
    output: any;
    metadata: {
      execution_time_ms: number;
      tokens_used: number;
    };
  };
}

export interface WorkflowStatusContent extends BaseStructuredContent {
  type: 'workflow_status';
  status: string;
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
  cross_plan_notes: any[];
  peer_critiques: Array<{
    reviewer_plan_id: string;
    reviewed_plan_id: string;
    agreement_score: number;
    timestamp: number;
  }>;
  mediation_decisions: any[];
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
  recommendations: string[];
  warnings?: string[];
}

export type StructuredContent =
  | WorkflowInitializedContent
  | PlanSubmittedContent
  | PlanExecutionContent
  | WorkflowStatusContent
  | WorkflowFinalizedContent;

/**
 * Props for the main WorkflowVisualizer component
 */
export interface WorkflowVisualizerProps {
  structuredContent: StructuredContent;
  mode?: 'inline' | 'pip' | 'fullscreen';
}

