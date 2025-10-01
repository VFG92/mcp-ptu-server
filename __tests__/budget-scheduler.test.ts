import { describe, it, expect } from '@jest/globals';
import { BudgetScheduler, type BudgetConstraints } from '../src/workers/budget-scheduler.js';
import { CapabilityGraph, type ExecutionContext, type CostEstimate } from '../src/workers/capability-graph.js';
import { createDefaultBudget, createDefaultPolicy } from '../src/workers/capability-orchestrator.js';

function toCostEstimate(budget: BudgetConstraints): CostEstimate {
  return {
    expected_tokens_in: budget.max_tokens_in,
    expected_tokens_out: budget.max_tokens_out,
    cpu_ms: budget.max_cpu_ms,
    subrequests: budget.max_subrequests,
    memory_kb: budget.max_memory_kb ?? 0
  };
}

describe('BudgetScheduler coverage calculations', () => {
  it('returns zero coverage for empty capability plans', async () => {
    const graph = new CapabilityGraph();
    const scheduler = new BudgetScheduler(graph);
    const budget = createDefaultBudget();
    const context: ExecutionContext = {
      session_id: 'empty-plan-session',
      budget_remaining: toCostEstimate(budget),
      whiteboard: new Map(),
      scratchpad: new Map(),
      policy: createDefaultPolicy(),
      trace: []
    };

    const plan = await scheduler.plan([], new Map(), budget, context);

    expect(plan.waves).toHaveLength(0);
    expect(plan.coverage_score).toBe(0);

    const result = await scheduler.execute(plan, context);

    expect(result.coverage).toBe(0);
    expect(Number.isNaN(result.coverage)).toBe(false);
    expect(result.success).toBe(true);
    expect(result.partial).toBe(false);
  });
});
