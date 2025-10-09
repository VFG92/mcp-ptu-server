/**
 * Test suite for Readiness Preview feature
 *
 * Verifies that:
 * 1. Readiness Preview appears in list_plan_status (not in submit_reasoning_plan)
 * 2. Correct calculations for total declared steps
 * 3. Warning appears for long capability chains
 * 4. Guidance is clear and actionable
 */

import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import { handleSubmitReasoningPlan, handleListPlanStatus } from '../src/workers/parallel-reasoning-tools-v5.js';

describe('Readiness Preview Feature', () => {
  let manager: ParallelReasoningSessionManager;

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
  });

  test('should show Readiness Preview in list_plan_status after all plans submitted', async () => {
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

    await handleSubmitReasoningPlan({
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

    // Now call list_plan_status to get Readiness Preview
    const result = await handleListPlanStatus({
      session_id: 'test_preview_001'
    }, manager);

    const response = result.content[0].text;

    // Verify Readiness Preview is present
    expect(response).toContain('🎯 Readiness Preview');
    expect(response).toContain('Finalization Readiness');

    // Verify correct total steps calculation (4 + 5 + 3 = 12)
    expect(response).toContain('0/12 steps');

    // Verify coverage gap is shown (0/12 executed)
    expect(response).toContain('Coverage Gap');
    expect(response).toContain('0.0%');

    // Verify confidence gap is shown
    expect(response).toContain('Confidence Gap');

    // Verify consensus gap is shown
    expect(response).toContain('Consensus Gap');
  });

  test('should prompt to call list_plan_status after submitting plans', async () => {
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

    // Verify it shows how many more plans are needed
    expect(response).toContain('Submit 2 more plan(s)');

    // Verify it doesn't contain the old readiness preview format
    expect(response).not.toContain('🎯 Readiness Preview');
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

    await handleSubmitReasoningPlan({
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

    // Call list_plan_status to get readiness info
    const result = await handleListPlanStatus({
      session_id: 'test_preview_005'
    }, manager);

    const response = result.content[0].text;

    // Verify correct total (3 + 7 = 10)
    expect(response).toContain('0/10 steps');

    // Verify coverage gap is shown
    expect(response).toContain('Coverage Gap');
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

    await handleSubmitReasoningPlan({
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

    // Call list_plan_status to get readiness info
    const result = await handleListPlanStatus({
      session_id: 'test_preview_006'
    }, manager);

    const response = result.content[0].text;

    // Verify all three metrics are present
    expect(response).toContain('Coverage');
    expect(response).toContain('Confidence');
    expect(response).toContain('Consensus');

    // Verify gaps are shown
    expect(response).toContain('Coverage Gap');
    expect(response).toContain('Confidence Gap');
    expect(response).toContain('Consensus Gap');
  });
});

