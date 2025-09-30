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

import { CapabilityGraph, type ExecutionContext, type PolicyConfig, type CostEstimate, type CapabilityNode, type CapabilityResult } from './capability-graph.js';
import { CapabilityPlanner, type PlanningRequest } from './capability-planner.js';
import { BudgetScheduler, type BudgetConstraints } from './budget-scheduler.js';
import { EvidenceLedger } from './evidence-ledger.js';
import { ConfidenceCalculus } from './confidence-calculus.js';
import { TournamentKernel, BudgetBandit } from './tournament-kernel.js';
import { Whiteboard, Scratchpad, ArtifactMerger } from './whiteboard-memory.js';
import { validateArtifact } from './output-schemas.js';
import { getAdapter } from './capability-adapters.js';
import { detectIndustry, getIndustryContext, type IndustryVertical, type GeographicRegion, type IndustryContext } from './industry-context.js';
import { attachNativeCapabilities, runNativeEnhancement, type NativeEnhancementOutcome } from './llm-native-capabilities.js';

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
  tournament_mode?: boolean;      // Run tournament for best results (DEFAULT: true, set to false to disable)
  industry_vertical?: IndustryVertical;  // Industry context (auto-detected if not provided)
  geographic_region?: GeographicRegion;  // Geographic region for regulatory context
  entity_names?: Record<string, string>; // Actual entity names to use (e.g., competitors, products)
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

  // Session tracking for monitoring and export
  private sessionCosts: Map<string, {
    tokens_in: number;
    tokens_out: number;
    cpu_ms: number;
    subrequests: number;
  }> = new Map();

  private sessionExecutions: Map<string, Array<{
    capability_id: string;
    timestamp: number;
    success: boolean;
    cost: any;
  }>> = new Map();

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
   * Track cost for a session
   */
  private trackSessionCost(sessionId: string, cost: {
    tokens_in?: number;
    tokens_out?: number;
    cpu_ms?: number;
    subrequests?: number;
  }): void {
    if (!this.sessionCosts.has(sessionId)) {
      this.sessionCosts.set(sessionId, {
        tokens_in: 0,
        tokens_out: 0,
        cpu_ms: 0,
        subrequests: 0
      });
    }

    const current = this.sessionCosts.get(sessionId)!;
    current.tokens_in += cost.tokens_in || 0;
    current.tokens_out += cost.tokens_out || 0;
    current.cpu_ms += cost.cpu_ms || 0;
    current.subrequests += cost.subrequests || 0;
  }

  /**
   * Track capability execution for a session
   */
  private trackCapabilityExecution(sessionId: string, execution: {
    capability_id: string;
    timestamp: number;
    success: boolean;
    cost: any;
  }): void {
    if (!this.sessionExecutions.has(sessionId)) {
      this.sessionExecutions.set(sessionId, []);
    }

    this.sessionExecutions.get(sessionId)!.push(execution);
  }

  /**
   * Execute orchestrated capability analysis
   */
  async execute(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();

    // Detect or use provided industry context
    const industryVertical = request.industry_vertical || detectIndustry(request.task);
    const industryContext = getIndustryContext(industryVertical, request.geographic_region);

    console.log(`[Orchestrator] Detected industry: ${industryVertical}, region: ${industryContext.region}`);

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

    // Attach LLM native capability manager so every capability can invoke native tools
    attachNativeCapabilities(context);

    // Store industry context in whiteboard for capabilities to access
    context.whiteboard.set('__industry_context__', industryContext);
    context.whiteboard.set('__entity_names__', request.entity_names || {});

    // Get adapter preferences if specified
    let preferredCategories: string[] | undefined;
    if (request.adapter_id) {
      const adapter = getAdapter(request.adapter_id);
      if (adapter) {
        preferredCategories = adapter.preferred_categories;
      }
    }

    // Step 1: Plan capability chain
    const planningRequest: PlanningRequest = {
      task_description: request.task,
      required_outputs: request.required_artifacts,
      preferred_categories: preferredCategories,
      budget: request.budget,
      context
    };

    const plan = await this.planner.plan(planningRequest);

    // Step 2: Create execution plan from capability chain
    const capabilityInputs = new Map<string, any>();
    // Add industry context to inputs
    capabilityInputs.set('industry_context', industryContext);
    capabilityInputs.set('entity_names', request.entity_names || {});
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
      const capability = this.graph.get(capId);

      if (capability) {
        const enhancement = await runNativeEnhancement(capability, result, context);
        if (enhancement) {
          this.integrateNativeEnhancement(
            capability,
            result,
            enhancement,
            executionResult.cost_actual,
            request.session_id,
            executionResult.warnings
          );
        }
      }

      // Track execution for session with final costs
      this.trackCapabilityExecution(request.session_id, {
        capability_id: capId,
        timestamp: Date.now(),
        success: true,
        cost: result.cost_actual
      });

      this.trackSessionCost(request.session_id, {
        tokens_in: result.cost_actual.expected_tokens_in,
        tokens_out: result.cost_actual.expected_tokens_out,
        cpu_ms: result.cost_actual.cpu_ms,
        subrequests: result.cost_actual.subrequests
      });

      // Add evidence to ledger (includes native enhancement evidence)
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

    // Step 4: Tournament mode (enabled by default for multi-agent quality, can be disabled)
    const enableTournament = request.tournament_mode !== false; // Default to true unless explicitly disabled
    if (enableTournament && executionResult.results.size > 1) {
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

    if (plan.recommended_chain.coverage_score < 1) {
      result.partial = true;
      result.coverage = Math.min(result.coverage, plan.recommended_chain.coverage_score);

      const missingAspects = plan.coverage_analysis.missing_aspects;
      if (missingAspects.length > 0) {
        const coverageGaps = missingAspects.map(aspect => `coverage_gap:${aspect}`);
        const existing = new Set(result.missing_capabilities);
        for (const gap of coverageGaps) {
          if (!existing.has(gap)) {
            result.missing_capabilities.push(gap);
            existing.add(gap);
          }
        }
      }

      const coverageWarning = 'Capability coverage limited by budget/plan constraints; some requested aspects remain unresolved.';
      if (!result.warnings.includes(coverageWarning)) {
        result.warnings.push(coverageWarning);
      }
    }

    return result;
  }

  private integrateNativeEnhancement(
    capability: CapabilityNode,
    result: CapabilityResult,
    enhancement: NativeEnhancementOutcome,
    executionCost: CostEstimate,
    sessionId: string,
    schedulerWarnings: string[]
  ): void {
    const tokensUsed = enhancement.tokens_used ?? 0;
    const tokensInDelta = Math.ceil(tokensUsed / 2);
    const tokensOutDelta = Math.max(0, tokensUsed - tokensInDelta);
    const cpuDelta = 50;

    result.cost_actual.expected_tokens_in += tokensInDelta;
    result.cost_actual.expected_tokens_out += tokensOutDelta;
    result.cost_actual.cpu_ms += cpuDelta;
    result.cost_actual.subrequests += 1;

    executionCost.expected_tokens_in += tokensInDelta;
    executionCost.expected_tokens_out += tokensOutDelta;
    executionCost.cpu_ms += cpuDelta;
    executionCost.subrequests += 1;

    if (!result.evidence.native_enhancement) {
      result.evidence.native_enhancement = [];
    }

    result.evidence.native_enhancement.push({
      type: enhancement.evidenceType,
      rationale: enhancement.message,
      source: enhancement.capabilityType,
      timestamp: Date.now()
    });

    (result.metadata as Record<string, any>).native_enhancement = {
      type: enhancement.capabilityType,
      message: enhancement.message,
      data: enhancement.result
    };

    const enhancementWarning = `LLM native ${enhancement.capabilityType.replace(/_/g, ' ')} enhancement applied for ${capability.name}`;

    if (!result.warnings.includes(enhancementWarning)) {
      result.warnings.push(enhancementWarning);
    }
    if (!schedulerWarnings.includes(enhancementWarning)) {
      schedulerWarnings.push(enhancementWarning);
    }

    result.confidence = Math.min(0.99, result.confidence + 0.08);
    result.quality_score = Math.min(0.99, result.quality_score + 0.05);
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
   * Returns complete session data including full artifacts, evidence, and execution history
   */
  exportSession(sessionId: string): {
    session_id: string;
    artifacts: Array<{
      id: string;
      type: string;
      status: string;
      version: number;
      created_by: string;
      created_at: number;
      updated_at: number;
      data: any;
      review_notes?: string;
    }>;
    evidence: any[];
    execution_summary: {
      total_capabilities_executed: number;
      total_cost: {
        tokens_in: number;
        tokens_out: number;
        cpu_ms: number;
        subrequests: number;
      };
      avg_confidence: number;
      avg_evidence_quality: number;
    };
    exported_at: number;
  } {
    const artifactIds = this.whiteboard.getAllIds();

    // Get full artifacts with metadata
    const artifacts = artifactIds.map(id => {
      const artifact = this.whiteboard.get(id);
      if (!artifact) return null;

      return {
        id: artifact.metadata.id,
        type: artifact.metadata.type,
        status: artifact.metadata.status,
        version: artifact.metadata.version,
        created_by: artifact.metadata.created_by,
        created_at: artifact.metadata.created_at,
        updated_at: artifact.metadata.updated_at,
        data: artifact.data,
        review_notes: artifact.metadata.review_notes
      };
    }).filter(a => a !== null);

    // Get evidence for all artifacts
    const evidence = artifactIds.map(id => this.ledger.exportEvidence(id));

    // Calculate execution summary
    const totalConfidence = evidence.reduce((sum, e) => sum + (e.quality_score || 0), 0);
    const avgConfidence = evidence.length > 0 ? totalConfidence / evidence.length : 0;

    const totalEvidenceQuality = evidence.reduce((sum, e) => {
      const verified = e.summary?.verified || 0;
      const total = e.summary?.total_claims || 1;
      return sum + (verified / total);
    }, 0);
    const avgEvidenceQuality = evidence.length > 0 ? totalEvidenceQuality / evidence.length : 0;

    // Get tracked costs for this session
    const sessionCost = this.sessionCosts.get(sessionId) || {
      tokens_in: 0,
      tokens_out: 0,
      cpu_ms: 0,
      subrequests: 0
    };

    // Get execution history for this session
    const executions = this.sessionExecutions.get(sessionId) || [];

    return {
      session_id: sessionId,
      artifacts,
      evidence,
      execution_summary: {
        total_capabilities_executed: executions.length,
        total_cost: sessionCost,
        avg_confidence: avgConfidence,
        avg_evidence_quality: avgEvidenceQuality
      },
      exported_at: Date.now()
    };
  }

  /**
   * Get session status for monitoring
   */
  getSessionStatus(sessionId: string): {
    session_id: string;
    artifacts_count: number;
    capabilities_executed: number;
    total_cost: {
      tokens_in: number;
      tokens_out: number;
      cpu_ms: number;
      subrequests: number;
    };
    recent_executions: Array<{
      capability_id: string;
      timestamp: number;
      success: boolean;
    }>;
  } {
    const artifactIds = this.whiteboard.getAllIds();
    const executions = this.sessionExecutions.get(sessionId) || [];
    const sessionCost = this.sessionCosts.get(sessionId) || {
      tokens_in: 0,
      tokens_out: 0,
      cpu_ms: 0,
      subrequests: 0
    };

    // Get last 10 executions
    const recentExecutions = executions
      .slice(-10)
      .map(e => ({
        capability_id: e.capability_id,
        timestamp: e.timestamp,
        success: e.success
      }));

    return {
      session_id: sessionId,
      artifacts_count: artifactIds.length,
      capabilities_executed: executions.length,
      total_cost: sessionCost,
      recent_executions: recentExecutions
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
