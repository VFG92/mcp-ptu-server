/**
 * Capability Orchestrator
 * 
 * Main orchestration layer that integrates:
 * - Capability planning
 * - Budget scheduling
 * - Evidence tracking
 * - Confidence calculation
 * - Tournament selection
 * - Policy enforcement
 */

import { CapabilityGraph, type ExecutionContext, type PolicyConfig } from './capability-graph.js';
import { CapabilityPlanner, type PlanningRequest } from './capability-planner.js';
import { BudgetScheduler, type BudgetConstraints } from './budget-scheduler.js';
import { EvidenceLedger } from './evidence-ledger.js';
import { ConfidenceCalculus } from './confidence-calculus.js';
import { TournamentKernel, BudgetBandit } from './tournament-kernel.js';
import { Whiteboard, Scratchpad, ArtifactMerger } from './whiteboard-memory.js';
import { validateArtifact } from './output-schemas.js';

/**
 * Orchestration request
 */
export interface OrchestrationRequest {
  session_id: string;
  task: string;
  budget: BudgetConstraints;
  policy: PolicyConfig;
  adapter_id?: string;            // Optional adapter (strategy, finance, etc.)
  required_artifacts?: string[];  // Required output types
  tournament_mode?: boolean;      // Run tournament for best results
}

/**
 * Orchestration result with partial success handling
 */
export interface OrchestrationResult {
  success: boolean;
  partial: boolean;               // True if some capabilities succeeded
  
  // Results
  artifacts: Array<{
    id: string;
    type: string;
    data: any;
    confidence: number;
    evidence_quality: number;
    validation_errors?: string[];
  }>;
  
  // Coverage
  coverage: number;               // 0-1
  missing_capabilities: string[];
  blocking_artifacts: string[];
  
  // Costs
  cost_actual: {
    tokens_in: number;
    tokens_out: number;
    cpu_ms: number;
    subrequests: number;
  };
  budget_remaining: BudgetConstraints;
  
  // Quality
  overall_confidence: number;
  quality_flags: string[];
  warnings: string[];
  
  // Metadata
  execution_time_ms: number;
  capabilities_executed: string[];
  capabilities_failed: string[];
}

/**
 * Capability Orchestrator
 */
export class CapabilityOrchestrator {
  private graph: CapabilityGraph;
  private planner: CapabilityPlanner;
  private scheduler: BudgetScheduler;
  private ledger: EvidenceLedger;
  private confidenceCalculus: ConfidenceCalculus;
  private tournament: TournamentKernel;
  private whiteboard: Whiteboard;
  private merger: ArtifactMerger;

  constructor(
    graph: CapabilityGraph,
    ledger: EvidenceLedger,
    whiteboard: Whiteboard
  ) {
    this.graph = graph;
    this.planner = new CapabilityPlanner(graph);
    this.scheduler = new BudgetScheduler(graph);
    this.ledger = ledger;
    this.confidenceCalculus = new ConfidenceCalculus();
    this.tournament = new TournamentKernel();
    this.whiteboard = whiteboard;
    this.merger = new ArtifactMerger();
  }

  /**
   * Execute orchestrated capability analysis
   */
  async execute(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();

    // Create execution context
    const context: ExecutionContext = {
      session_id: request.session_id,
      budget_remaining: {
        expected_tokens_in: request.budget.max_tokens_in,
        expected_tokens_out: request.budget.max_tokens_out,
        cpu_ms: request.budget.max_cpu_ms,
        subrequests: request.budget.max_subrequests,
        memory_kb: request.budget.max_memory_kb
      },
      whiteboard: new Map(),
      scratchpad: new Map(),
      policy: request.policy,
      trace: []
    };

    // Step 1: Plan capability chain
    const planningRequest: PlanningRequest = {
      task_description: request.task,
      required_outputs: request.required_artifacts,
      budget: request.budget,
      context
    };

    const plan = await this.planner.plan(planningRequest);

    // Step 2: Create execution plan from capability chain
    const capabilityInputs = new Map<string, any>();
    // TODO: Extract inputs from context or request
    const executionPlan = await this.scheduler.plan(
      plan.recommended_chain.capabilities,
      capabilityInputs,
      request.budget,
      context
    );

    // Step 3: Execute with budget scheduler
    const executionResult = await this.scheduler.execute(executionPlan, context);

    // Step 4: Process results with evidence and confidence
    const artifacts: OrchestrationResult['artifacts'] = [];
    const verifications = new Map();
    const evidenceQualities = new Map();

    for (const [capId, result] of executionResult.results) {
      // Add evidence to ledger
      for (const [field, evidenceArray] of Object.entries(result.evidence)) {
        this.ledger.addEvidence(
          capId,
          field,
          `Claim for ${field}`,
          evidenceArray
        );
      }

      // Verify evidence
      const verification = this.ledger.verifyArtifact(capId, result.output);
      verifications.set(capId, verification);

      // Calculate evidence quality
      const evidenceQuality = this.ledger.getEvidenceQualityScore(capId);
      evidenceQualities.set(capId, evidenceQuality);

      // Calculate confidence
      const confidenceResult = this.confidenceCalculus.calculateConfidence(
        result,
        verification,
        evidenceQuality
      );

      // Validate against schema
      const capability = this.graph.get(capId);
      let validationErrors: string[] | undefined;
      
      if (capability) {
        const validation = capability.output_contract.schema.safeParse(result.output);
        if (!validation.success) {
          validationErrors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        }
      }

      // Add to whiteboard
      this.whiteboard.add(
        capId,
        capability?.category || 'unknown',
        result.output,
        capId,
        'accepted'
      );

      artifacts.push({
        id: capId,
        type: capability?.category || 'unknown',
        data: result.output,
        confidence: confidenceResult.confidence,
        evidence_quality: evidenceQuality,
        validation_errors: validationErrors
      });
    }

    // Step 4: Tournament mode (if requested and multiple results)
    if (request.tournament_mode && executionResult.results.size > 1) {
      const tournamentResult = await this.tournament.runTournament(
        Array.from(executionResult.results.values()),
        verifications
      );

      // Use tournament winner as primary result
      // (Implementation would reorder artifacts based on tournament rankings)
    }

    // Step 5: Calculate overall confidence
    const overallConfidence = this.confidenceCalculus.calculateAggregateConfidence(
      Array.from(executionResult.results.values()),
      verifications,
      evidenceQualities,
      this.ledger
    );

    // Step 6: Build result
    const result: OrchestrationResult = {
      success: executionResult.success,
      partial: executionResult.partial,
      artifacts,
      coverage: executionResult.coverage,
      missing_capabilities: executionResult.missing_capabilities,
      blocking_artifacts: executionResult.blocking_artifacts,
      cost_actual: {
        tokens_in: executionResult.cost_actual.expected_tokens_in,
        tokens_out: executionResult.cost_actual.expected_tokens_out,
        cpu_ms: executionResult.cost_actual.cpu_ms,
        subrequests: executionResult.cost_actual.subrequests
      },
      budget_remaining: {
        max_tokens_in: request.budget.max_tokens_in - executionResult.cost_actual.expected_tokens_in,
        max_tokens_out: request.budget.max_tokens_out - executionResult.cost_actual.expected_tokens_out,
        max_cpu_ms: request.budget.max_cpu_ms - executionResult.cost_actual.cpu_ms,
        max_subrequests: request.budget.max_subrequests - executionResult.cost_actual.subrequests
      },
      overall_confidence: overallConfidence.confidence,
      quality_flags: overallConfidence.quality_flags,
      warnings: executionResult.warnings,
      execution_time_ms: Date.now() - startTime,
      capabilities_executed: Array.from(executionResult.results.keys()),
      capabilities_failed: Array.from(executionResult.failed.keys())
    };

    return result;
  }

  /**
   * Get status of an ongoing orchestration
   */
  getStatus(sessionId: string): {
    session_id: string;
    artifacts_count: number;
    artifacts: string[];
    evidence_summary: any;
  } {
    const artifactIds = this.whiteboard.getAllIds();
    
    return {
      session_id: sessionId,
      artifacts_count: artifactIds.length,
      artifacts: artifactIds,
      evidence_summary: artifactIds.map(id => this.ledger.getVerificationSummary(id))
    };
  }

  /**
   * Export session for audit trail
   */
  exportSession(sessionId: string): {
    session_id: string;
    artifacts: any[];
    evidence: any[];
    exported_at: number;
  } {
    const artifactIds = this.whiteboard.getAllIds();
    
    return {
      session_id: sessionId,
      artifacts: artifactIds.map(id => this.whiteboard.get(id)),
      evidence: artifactIds.map(id => this.ledger.exportEvidence(id)),
      exported_at: Date.now()
    };
  }
}

/**
 * Policy Enforcer
 */
export class PolicyEnforcer {
  /**
   * Check if operation is allowed under policy
   */
  checkPolicy(
    operation: string,
    context: ExecutionContext,
    params?: any
  ): { allowed: boolean; reason?: string } {
    const policy = context.policy;

    // Check PII filter
    if (policy.pii_filter_enabled && this.containsPII(params)) {
      return { allowed: false, reason: 'PII detected in request' };
    }

    // Check financial data filter
    if (policy.financial_data_filter_enabled && this.containsSensitiveFinancial(params)) {
      return { allowed: false, reason: 'Sensitive financial data detected' };
    }

    // Check token limits
    if (policy.max_tokens_per_capability) {
      const estimatedTokens = this.estimateTokens(params);
      if (estimatedTokens > policy.max_tokens_per_capability) {
        return { allowed: false, reason: 'Token limit exceeded' };
      }
    }

    // Check CPU limits
    if (policy.max_cpu_ms_per_capability) {
      // Would check estimated CPU time
    }

    return { allowed: true };
  }

  private containsPII(data: any): boolean {
    // Simple PII detection (would be more sophisticated in production)
    const str = JSON.stringify(data).toLowerCase();
    const piiPatterns = ['ssn', 'social security', 'credit card', 'passport'];
    return piiPatterns.some(pattern => str.includes(pattern));
  }

  private containsSensitiveFinancial(data: any): boolean {
    // Check for sensitive financial data
    return false; // Placeholder
  }

  private estimateTokens(data: any): number {
    // Rough estimate: 1 token ≈ 4 characters
    return JSON.stringify(data).length / 4;
  }
}

/**
 * Create default policy
 */
export function createDefaultPolicy(): PolicyConfig {
  return {
    pii_filter_enabled: true,
    financial_data_filter_enabled: true,
    max_tokens_per_capability: 5000,
    max_cpu_ms_per_capability: 10000,
    require_evidence_for: ['financial', 'risk']
  };
}

/**
 * Create default budget
 */
export function createDefaultBudget(): BudgetConstraints {
  return {
    max_tokens_in: 10000,
    max_tokens_out: 20000,
    max_cpu_ms: 30000,
    max_subrequests: 20
  };
}

