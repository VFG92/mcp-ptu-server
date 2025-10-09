/**
 * Type definitions for Manifest-Based Execution System
 * 
 * This system enables ChatGPT to execute all reasoning steps in a single
 * native reasoning session, then register results in batch.
 */

/**
 * Execution Manifest
 * 
 * Complete specification of all steps to execute across all plans.
 * ChatGPT receives this and executes using native reasoning + tools.
 */
export interface ExecutionManifest {
  session_id: string;
  execution_token: string;
  created_at: number;
  plans: ManifestPlan[];
  quality_targets: QualityTargets;
  guidance: string;
}

export interface ManifestPlan {
  plan_id: string;
  description: string;
  diversity_axes: string[];
  rationale: string;
  steps: ManifestStep[];
}

export interface ManifestStep {
  step_id: string;
  capability: string;
  context: string;
  expected_outputs: string[];
  quality_requirements: {
    requires_external_sources: boolean;
    requires_quantitative_data: boolean;
    requires_comparative_analysis: boolean;
    requires_workpapers: boolean;
  };
}

export interface QualityTargets {
  coverage: number;  // 0.95
  confidence: number;  // 0.85
  consensus: number;  // 0.80
}

/**
 * Execution Results
 * 
 * Results from ChatGPT's native reasoning session.
 * Includes findings, evidence refs, and workpapers.
 */
export interface ExecutionResults {
  execution_token: string;
  completed_at: number;
  results: StepResult[];
}

export interface StepResult {
  plan_id: string;
  step_id: string;
  findings: string;
  evidence_refs: EvidenceReference[];
  workpapers: Workpaper[];
  reasoning_trace?: string;  // Optional: ChatGPT's reasoning process
}

export interface EvidenceReference {
  type: 'url' | 'citation' | 'data_source' | 'calculation' | 'comparison';
  source: string;
  description: string;
  reliability_score?: number;  // 0-1, optional self-assessment
}

export interface Workpaper {
  type: 'dataset' | 'calculation' | 'comparison' | 'analysis' | 'visualization';
  title: string;
  content: string;
  format: 'markdown' | 'json' | 'csv' | 'python';
  metadata?: Record<string, any>;
}

/**
 * Saliency Report
 * 
 * Diagnostic report showing exactly what evidence is missing
 * and where quality can be improved.
 */
export interface SaliencyReport {
  session_id: string;
  generated_at: number;
  overall_quality_score: number;  // 0-1
  missing_evidence_types: MissingEvidenceType[];
  weak_steps: WeakStep[];
  consensus_gaps: ConsensusGap[];
  recommendations: string[];
}

export interface MissingEvidenceType {
  type: 'quantitative_data' | 'external_sources' | 'comparative_analysis' | 'workpapers' | 'citations';
  description: string;
  examples: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  affected_plans: string[];
  affected_steps: string[];
}

export interface WeakStep {
  plan_id: string;
  step_id: string;
  capability: string;
  issue: string;
  current_quality_score: number;  // 0-1
  suggestion: string;
  example?: string;
}

export interface ConsensusGap {
  topic: string;
  description: string;
  divergent_plans: string[];
  divergence_type: 'methodological' | 'interpretive' | 'evidential' | 'conclusive';
  requires_mediation: boolean;
  productive_disagreement: boolean;  // Is this a valuable disagreement?
}

/**
 * Enhanced Consensus Metrics
 * 
 * New consensus calculation that values productive disagreement.
 */
export interface EnhancedConsensusMetrics {
  agreement_score: number;  // 0-1
  productive_disagreement_score: number;  // 0-1, NEW
  convergence_quality: number;  // 0-1, NEW
  overall_consensus: number;  // Weighted combination
  
  details: {
    agreements: number;
    conflicts: number;
    productive_disagreements: number;  // Disagreements with evidence
    convergences: number;  // Disagreements that led to refinement
    superficial_agreements: number;  // Agreements without depth
  };
}

export interface ProductiveDisagreement {
  critique_id: string;
  reviewer_plan_id: string;
  reviewed_plan_id: string;
  disagreement_point: string;
  evidence_provided: string[];
  led_to_refinement: boolean;
  quality_score: number;  // 0-1
}

/**
 * Meta-Reflection
 * 
 * Post-mediation synthesis on what the process revealed.
 */
export interface MetaReflection {
  session_id: string;
  generated_at: number;
  key_insights: string[];
  judgment_categories_revealed: string[];
  process_learnings: string[];
  cognitive_patterns: string[];
  recommendations_for_future: string[];
  epistemic_gains: string[];  // What did we learn about how to know?
}

/**
 * Session Checkpoint
 * 
 * Persistent snapshot for resume capability.
 */
export interface SessionCheckpoint {
  session_id: string;
  checkpoint_id: string;
  resume_token: string;
  timestamp: number;
  phase: 'planning' | 'execution' | 'critique' | 'mediation' | 'reflection' | 'finalization';
  state_snapshot: string;  // Serialized session state
  next_steps: string[];
  context_summary: string;
}

/**
 * Quality Signals
 * 
 * Enhanced quality detection for evidence.
 */
export interface QualitySignals {
  has_external_sources: boolean;
  external_source_count: number;
  has_quantitative_data: boolean;
  quantitative_data_points: number;
  has_workpapers: boolean;
  workpaper_count: number;
  has_comparative_analysis: boolean;
  comparison_count: number;
  has_citations: boolean;
  citation_count: number;
  
  // Quality scores
  evidence_depth_score: number;  // 0-1
  evidence_breadth_score: number;  // 0-1
  evidence_reliability_score: number;  // 0-1
  
  // Flags
  evidence_low: boolean;  // Legacy flag
  evidence_high: boolean;  // NEW: High quality evidence
}

/**
 * Execution Token
 * 
 * Secure token for tracking execution sessions.
 */
export interface ExecutionToken {
  token: string;
  session_id: string;
  created_at: number;
  expires_at: number;
  used: boolean;
}

/**
 * Batch Registration Result
 * 
 * Result of registering execution results in batch.
 */
export interface BatchRegistrationResult {
  session_id: string;
  execution_token: string;
  registered_count: number;
  failed_count: number;
  quality_signals: QualitySignals;
  saliency_report: SaliencyReport;
  updated_metrics: {
    coverage: number;
    confidence: number;
    consensus: number;
  };
}

/**
 * Resume Session Result
 * 
 * Information for resuming an interrupted session.
 */
export interface ResumeSessionResult {
  session_id: string;
  phase: string;
  checkpoint_id: string;
  timestamp: number;
  next_steps: string[];
  context_summary: string;
  plans_summary: {
    plan_id: string;
    description: string;
    steps_completed: number;
    steps_total: number;
  }[];
}

