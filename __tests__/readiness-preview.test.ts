/**
 * Test suite for Readiness Preview feature
 * 
 * Verifies that:
 * 1. Readiness Preview appears after all plans are submitted
 * 2. Correct calculations for total declared steps
 * 3. Warning appears for long capability chains
 * 4. Guidance is clear and actionable
 */

import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import { handleSubmitReasoningPlan } from '../src/workers/parallel-reasoning-tools-v5.js';

describe('Readiness Preview Feature', () => {
  let manager: ParallelReasoningSessionManager;

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
  });

  test('should show Readiness Preview after all plans submitted', async () => {
    // Initialize session
    manager.initSession({
      session_id: 'test_preview_001',
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });

    // Submit 3 plans with optimal length (3-5 steps)
    await handleSubmitReasoningPlan({
      session_id: 'test_preview_001',
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources: primary', 'analytical_models: quantitative'],
        capability_chain: ['step1', 'step2', 'step3', 'step4'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: 'test_preview_001',
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources: secondary', 'analytical_models: qualitative'],
        capability_chain: ['step1', 'step2', 'step3', 'step4', 'step5'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    // Third plan should trigger Readiness Preview
    const result = await handleSubmitReasoningPlan({
      session_id: 'test_preview_001',
      plan: {
        plan_id: 'plan_C',
        description: 'Plan C',
        diversity_axes: ['data_sources: expert', 'analytical_models: mixed'],
        capability_chain: ['step1', 'step2', 'step3'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const response = result.content[0].text;

    // Verify Readiness Preview is present
    expect(response).toContain('🎯 Readiness Preview');
    expect(response).toContain('What You Need to Finalize');

    // Verify correct total steps calculation (4 + 5 + 3 = 12)
    expect(response).toContain('Total declared steps**: 12');

    // Verify coverage calculation (95% of 12 = 11.4, rounded up to 12)
    expect(response).toContain('Steps needed**: Execute at least 12 steps');

    // Verify confidence guidance
    expect(response).toContain('Evidence needed**: At least 4 unique evidence IDs');

    // Verify consensus guidance
    expect(response).toContain('Peer critiques**: Submit 3-5 peer critiques');

    // Verify recommended execution strategy
    expect(response).toContain('📋 Recommended Execution Strategy');
    expect(response).toContain('Execute core steps first');
    expect(response).toContain('Check readiness');
  });

  test('should NOT show Readiness Preview before all plans submitted', async () => {
    // Initialize session
    manager.initSession({
      session_id: 'test_preview_002',
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });

    // Submit only 1 plan
    const result = await handleSubmitReasoningPlan({
      session_id: 'test_preview_002',
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources: primary', 'analytical_models: quantitative'],
        capability_chain: ['step1', 'step2', 'step3'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const response = result.content[0].text;

    // Verify Readiness Preview is NOT present
    expect(response).not.toContain('🎯 Readiness Preview');
    expect(response).toContain('Submit 2 more plan(s)');
  });

  test('should show warning for long capability chains', async () => {
    // Initialize session
    manager.initSession({
      session_id: 'test_preview_003',
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });

    // Submit plan with 8 steps (triggers warning)
    const result = await handleSubmitReasoningPlan({
      session_id: 'test_preview_003',
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources: primary', 'analytical_models: quantitative'],
        capability_chain: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const response = result.content[0].text;

    // Verify warning is present
    expect(response).toContain('⚠️');
    expect(response).toContain('Capability Chain Length Notice');
    expect(response).toContain('8 capability steps');
    expect(response).toContain('Recommendation');
    expect(response).toContain('3-5 steps per plan');
  });

  test('should NOT show warning for optimal capability chains', async () => {
    // Initialize session
    manager.initSession({
      session_id: 'test_preview_004',
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });

    // Submit plan with 5 steps (optimal, no warning)
    const result = await handleSubmitReasoningPlan({
      session_id: 'test_preview_004',
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources: primary', 'analytical_models: quantitative'],
        capability_chain: ['step1', 'step2', 'step3', 'step4', 'step5'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const response = result.content[0].text;

    // Verify warning is NOT present
    expect(response).not.toContain('Capability Chain Length Notice');
  });

  test('should calculate correct coverage requirements for different plan sizes', async () => {
    // Initialize session
    manager.initSession({
      session_id: 'test_preview_005',
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });

    // Submit 2 plans: 3 steps + 7 steps = 10 total
    await handleSubmitReasoningPlan({
      session_id: 'test_preview_005',
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources: primary', 'analytical_models: quantitative'],
        capability_chain: ['s1', 's2', 's3'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const result = await handleSubmitReasoningPlan({
      session_id: 'test_preview_005',
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources: secondary', 'analytical_models: qualitative'],
        capability_chain: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const response = result.content[0].text;

    // Verify correct total (3 + 7 = 10)
    expect(response).toContain('Total declared steps**: 10');

    // Verify correct coverage requirement (95% of 10 = 9.5, rounded up to 10)
    expect(response).toContain('Steps needed**: Execute at least 10 steps');
  });

  test('should include all three quality metrics in preview', async () => {
    // Initialize session
    manager.initSession({
      session_id: 'test_preview_006',
      task_description: 'Test task',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });

    await handleSubmitReasoningPlan({
      session_id: 'test_preview_006',
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources: primary', 'analytical_models: quantitative'],
        capability_chain: ['step1', 'step2', 'step3'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const result = await handleSubmitReasoningPlan({
      session_id: 'test_preview_006',
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources: secondary', 'analytical_models: qualitative'],
        capability_chain: ['step1', 'step2', 'step3'],
        rationale: 'Test',
        expected_outputs: ['output']
      }
    }, manager);

    const response = result.content[0].text;

    // Verify all three metrics are present
    expect(response).toContain('1. Coverage ≥ 95%');
    expect(response).toContain('2. Confidence ≥ 85%');
    expect(response).toContain('3. Consensus ≥ 80%');

    // Verify formulas are explained
    expect(response).toContain('Coverage = executed_steps / total_declared_steps');
    expect(response).toContain('Base 50% + 10% per evidence ID');
    expect(response).toContain('(agreements - conflicts) / total_interactions');
  });
});

