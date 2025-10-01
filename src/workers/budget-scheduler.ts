/**
 * Budget-Aware Scheduler
 * 
 * Optimizes capability execution under token/CPU/connection constraints.
 * Implements progressive disclosure, partial correctness, and retry logic.
 */

import type {
  CapabilityNode,
  CapabilityResult,
  CostEstimate,
  ExecutionContext,
  ExecutionTrace
} from './capability-graph.js';
import { CapabilityGraph } from './capability-graph.js';

/**
 * Budget constraints
 */
export interface BudgetConstraints {
  max_tokens_in: number;
  max_tokens_out: number;
  max_cpu_ms: number;
  max_subrequests: number;
  max_memory_kb?: number;
}

/**
 * Execution wave - batch of capabilities to run together
 */
export interface ExecutionWave {
  wave_number: number;
  capabilities: Array<{
    capability_id: string;
    inputs: any;
    priority: number;          // Higher = more important
  }>;
  estimated_cost: CostEstimate;
  strategy: 'parallel' | 'sequential';
}

/**
 * Execution plan
 */
export interface ExecutionPlan {
  waves: ExecutionWave[];
  total_estimated_cost: CostEstimate;
  coverage_score: number;       // 0-1, how much of the request is covered
  degraded_capabilities: string[]; // Capabilities using surrogates
}

/**
 * Execution result with partial success handling
 */
export interface ScheduledExecutionResult {
  success: boolean;
  partial: boolean;             // True if some capabilities failed
  results: Map<string, CapabilityResult>;
  failed: Map<string, string>;  // capability_id -> error message
  coverage: number;             // 0-1, actual coverage achieved
  cost_actual: CostEstimate;
  warnings: string[];
  missing_capabilities: string[];
  blocking_artifacts: string[]; // Artifacts that couldn't be produced
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  max_retries: number;
  initial_backoff_ms: number;
  max_backoff_ms: number;
  retryable_errors: string[];   // Error types that can be retried
}

/**
 * Budget Scheduler
 */
export class BudgetScheduler {
  private graph: CapabilityGraph;
  private retryConfig: RetryConfig;
  private idempotencyKeys: Map<string, CapabilityResult> = new Map();

  constructor(
    graph: CapabilityGraph,
    retryConfig: RetryConfig = {
      max_retries: 3,
      initial_backoff_ms: 100,
      max_backoff_ms: 5000,
      retryable_errors: ['rate_limit', 'timeout', 'network_error']
    }
  ) {
    this.graph = graph;
    this.retryConfig = retryConfig;
  }

  /**
   * Create execution plan optimizing for coverage under budget
   */
  async plan(
    capabilityIds: string[],
    inputs: Map<string, any>,
    budget: BudgetConstraints,
    context: ExecutionContext
  ): Promise<ExecutionPlan> {
    // Solve knapsack: maximize coverage-weighted utility <= budget
    const plan: ExecutionPlan = {
      waves: [],
      total_estimated_cost: this.initCost(),
      coverage_score: 0,
      degraded_capabilities: []
    };

    if (capabilityIds.length === 0) {
      return plan;
    }

    // Categorize capabilities by cost (cheap vs expensive)
    const capabilities = capabilityIds
      .map(id => this.graph.get(id))
      .filter((cap): cap is CapabilityNode => cap !== undefined);

    const cheap: CapabilityNode[] = [];
    const expensive: CapabilityNode[] = [];

    for (const cap of capabilities) {
      const totalTokens = cap.cost_estimate.expected_tokens_in + cap.cost_estimate.expected_tokens_out;
      if (totalTokens < 1000 && cap.cost_estimate.cpu_ms < 500) {
        cheap.push(cap);
      } else {
        expensive.push(cap);
      }
    }

    // Wave 1: Cheap, broad capabilities (scan, quick analysis)
    if (cheap.length > 0) {
      const wave1 = this.createWave(1, cheap, inputs, budget, context, 'parallel');
      if (this.fitsInBudget(wave1.estimated_cost, budget, plan.total_estimated_cost)) {
        plan.waves.push(wave1);
        this.addCost(plan.total_estimated_cost, wave1.estimated_cost);
      }
    }

    // Wave 2: Expensive, deep capabilities (models, simulations)
    if (expensive.length > 0) {
      const remainingBudget = this.subtractCost(budget, plan.total_estimated_cost);
      const wave2 = this.createWave(2, expensive, inputs, remainingBudget, context, 'sequential');
      
      // May need to degrade some capabilities
      const { wave, degraded } = this.applyDegradation(wave2, remainingBudget);
      plan.waves.push(wave);
      plan.degraded_capabilities.push(...degraded);
      this.addCost(plan.total_estimated_cost, wave.estimated_cost);
    }

    // Calculate coverage
    const totalRequested = capabilityIds.length;
    const totalPlanned = plan.waves.reduce((sum, w) => sum + w.capabilities.length, 0);
    plan.coverage_score = totalRequested === 0 ? 0 : totalPlanned / totalRequested;

    return plan;
  }

  /**
   * Execute a plan with progressive disclosure
   */
  async execute(
    plan: ExecutionPlan,
    context: ExecutionContext
  ): Promise<ScheduledExecutionResult> {
    const result: ScheduledExecutionResult = {
      success: true,
      partial: false,
      results: new Map(),
      failed: new Map(),
      coverage: 0,
      cost_actual: this.initCost(),
      warnings: [],
      missing_capabilities: [],
      blocking_artifacts: []
    };

    // Execute waves sequentially
    for (const wave of plan.waves) {
      const waveResult = await this.executeWave(wave, context);
      
      // Merge results
      waveResult.results.forEach((res, id) => result.results.set(id, res));
      waveResult.failed.forEach((err, id) => result.failed.set(id, err));
      
      this.addCost(result.cost_actual, waveResult.cost);
      result.warnings.push(...waveResult.warnings);

      // Check if we should continue
      if (waveResult.blocking_failures.length > 0) {
        result.blocking_artifacts.push(...waveResult.blocking_failures);
        result.partial = true;
        break; // Stop if blocking artifacts can't be produced
      }

      // Update context with new artifacts
      waveResult.results.forEach((res, id) => {
        context.whiteboard.set(id, res.output);
      });
    }

    // Calculate final coverage
    const totalCapabilities = plan.waves.reduce((sum, w) => sum + w.capabilities.length, 0);
    result.coverage = totalCapabilities === 0 ? 0 : result.results.size / totalCapabilities;
    result.success = result.failed.size === 0;
    result.partial = result.failed.size > 0 && result.results.size > 0;

    return result;
  }

  /**
   * Execute a single wave
   */
  private async executeWave(
    wave: ExecutionWave,
    context: ExecutionContext
  ): Promise<{
    results: Map<string, CapabilityResult>;
    failed: Map<string, string>;
    cost: CostEstimate;
    warnings: string[];
    blocking_failures: string[];
  }> {
    const results = new Map<string, CapabilityResult>();
    const failed = new Map<string, string>();
    const warnings: string[] = [];
    const blocking_failures: string[] = [];
    const cost = this.initCost();

    if (wave.strategy === 'parallel') {
      // Execute all in parallel
      const promises = wave.capabilities.map(async ({ capability_id, inputs }) => {
        const cap = this.graph.get(capability_id);
        if (!cap) {
          failed.set(capability_id, 'Capability not found');
          return;
        }

        try {
          const result = await this.executeWithRetry(cap, inputs, context);
          results.set(capability_id, result);
          this.addCost(cost, result.cost_actual);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          failed.set(capability_id, errorMsg);
          
          // Check if blocking
          if (cap.output_contract.required_evidence.length > 0) {
            blocking_failures.push(capability_id);
          }
        }
      });

      await Promise.all(promises);
    } else {
      // Execute sequentially
      for (const { capability_id, inputs } of wave.capabilities) {
        const cap = this.graph.get(capability_id);
        if (!cap) {
          failed.set(capability_id, 'Capability not found');
          continue;
        }

        try {
          const result = await this.executeWithRetry(cap, inputs, context);
          results.set(capability_id, result);
          this.addCost(cost, result.cost_actual);
          
          // Update context for next capability
          context.whiteboard.set(capability_id, result.output);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          failed.set(capability_id, errorMsg);
          
          if (cap.output_contract.required_evidence.length > 0) {
            blocking_failures.push(capability_id);
          }
        }
      }
    }

    return { results, failed, cost, warnings, blocking_failures };
  }

  /**
   * Execute capability with retry logic and idempotency
   */
  private async executeWithRetry(
    capability: CapabilityNode,
    inputs: any,
    context: ExecutionContext
  ): Promise<CapabilityResult> {
    // Check idempotency key
    const idempotencyKey = this.generateIdempotencyKey(capability.id, inputs, context.session_id);
    const cached = this.idempotencyKeys.get(idempotencyKey);
    if (cached) {
      return cached;
    }

    let lastError: Error | null = null;
    let backoff = this.retryConfig.initial_backoff_ms;

    for (let attempt = 0; attempt <= this.retryConfig.max_retries; attempt++) {
      try {
        const result = await capability.execute(inputs, context);
        
        // Cache result
        this.idempotencyKeys.set(idempotencyKey, result);
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if retryable
        const isRetryable = this.retryConfig.retryable_errors.some(
          errType => lastError!.message.includes(errType)
        );

        if (!isRetryable || attempt === this.retryConfig.max_retries) {
          throw lastError;
        }

        // Exponential backoff
        await this.sleep(backoff);
        backoff = Math.min(backoff * 2, this.retryConfig.max_backoff_ms);
      }
    }

    throw lastError || new Error('Unknown error');
  }

  // Helper methods
  private createWave(
    waveNumber: number,
    capabilities: CapabilityNode[],
    inputs: Map<string, any>,
    budget: BudgetConstraints | CostEstimate,
    context: ExecutionContext,
    strategy: 'parallel' | 'sequential'
  ): ExecutionWave {
    return {
      wave_number: waveNumber,
      capabilities: capabilities.map(cap => ({
        capability_id: cap.id,
        inputs: inputs.get(cap.id) || {},
        priority: cap.expected_precision
      })),
      estimated_cost: this.graph.estimateCost(capabilities.map(c => c.id)),
      strategy
    };
  }

  private fitsInBudget(cost: CostEstimate, budget: BudgetConstraints, used: CostEstimate): boolean {
    return (
      used.expected_tokens_in + cost.expected_tokens_in <= budget.max_tokens_in &&
      used.expected_tokens_out + cost.expected_tokens_out <= budget.max_tokens_out &&
      used.cpu_ms + cost.cpu_ms <= budget.max_cpu_ms &&
      used.subrequests + cost.subrequests <= budget.max_subrequests
    );
  }

  private subtractCost(budget: BudgetConstraints, used: CostEstimate): CostEstimate {
    return {
      expected_tokens_in: budget.max_tokens_in - used.expected_tokens_in,
      expected_tokens_out: budget.max_tokens_out - used.expected_tokens_out,
      cpu_ms: budget.max_cpu_ms - used.cpu_ms,
      subrequests: budget.max_subrequests - used.subrequests,
      memory_kb: (budget.max_memory_kb || 0) - (used.memory_kb || 0)
    };
  }

  private applyDegradation(
    wave: ExecutionWave,
    budget: CostEstimate
  ): { wave: ExecutionWave; degraded: string[] } {
    // For now, just return as-is
    // TODO: Implement surrogate operator selection
    return { wave, degraded: [] };
  }

  private initCost(): CostEstimate {
    return {
      expected_tokens_in: 0,
      expected_tokens_out: 0,
      cpu_ms: 0,
      subrequests: 0,
      memory_kb: 0
    };
  }

  private addCost(target: CostEstimate, add: CostEstimate): void {
    target.expected_tokens_in += add.expected_tokens_in;
    target.expected_tokens_out += add.expected_tokens_out;
    target.cpu_ms += add.cpu_ms;
    target.subrequests += add.subrequests;
    target.memory_kb = (target.memory_kb || 0) + (add.memory_kb || 0);
  }

  private generateIdempotencyKey(capabilityId: string, inputs: any, sessionId: string): string {
    return `${sessionId}:${capabilityId}:${JSON.stringify(inputs)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

