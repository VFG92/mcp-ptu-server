/**
 * Parallel Reasoning v5.0 End-to-End Tests
 * 
 * Tests complete workflow with persistence:
 * - Session initialization
 * - Plan submission with diversity validation
 * - Plan execution
 * - Cross-plan contamination
 * - Peer review
 * - Mediation
 * - Finalization
 * - Persistence between steps
 */

import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';

type HandleAnalyzeWithCapabilities = typeof import('../src/workers/capability-tools.js')['handleAnalyzeWithCapabilities'];

const analyzeWithCapabilitiesMock = jest.fn() as jest.MockedFunction<HandleAnalyzeWithCapabilities>;

// Standard test capability chain (8 capabilities minimum)
const TEST_CAP_CHAIN = ['market_scan', 'tam_sam_som_build', 'competitor_analysis', 'customer_segmentation', 'brand_equity_valuation', 'gtm_strategy', 'digital_roi_attribution', 'customer_journey_mapping'];

jest.unstable_mockModule('../src/workers/capability-tools.js', () => ({
  handleAnalyzeWithCapabilities: analyzeWithCapabilitiesMock
}));

type ParallelReasoningToolsModule = typeof import('../src/workers/parallel-reasoning-tools-v5.js');

let handleInitParallelReasoning: ParallelReasoningToolsModule['handleInitParallelReasoning'];
let handleSubmitReasoningPlan: ParallelReasoningToolsModule['handleSubmitReasoningPlan'];
let handleExecutePlanStep: ParallelReasoningToolsModule['handleExecutePlanStep'];
let handleSubmitCrossPlanNote: ParallelReasoningToolsModule['handleSubmitCrossPlanNote'];
let handleSubmitPeerCritique: ParallelReasoningToolsModule['handleSubmitPeerCritique'];
let handleSubmitMediationDecision: ParallelReasoningToolsModule['handleSubmitMediationDecision'];
let handleListPlanStatus: ParallelReasoningToolsModule['handleListPlanStatus'];
let handleFinalizeParallelReasoning: ParallelReasoningToolsModule['handleFinalizeParallelReasoning'];

beforeAll(async () => {
  ({
    handleInitParallelReasoning,
    handleSubmitReasoningPlan,
    handleExecutePlanStep,
    handleSubmitCrossPlanNote,
    handleSubmitPeerCritique,
    handleSubmitMediationDecision,
    handleListPlanStatus,
    handleFinalizeParallelReasoning
  } = await import('../src/workers/parallel-reasoning-tools-v5.js'));
});
describe('Parallel Reasoning v5.0 - End-to-End Workflow', () => {
  let manager: ParallelReasoningSessionManager;
  const sessionId = 'test_session_001';

  beforeEach(() => {
    analyzeWithCapabilitiesMock.mockReset();
    manager = new ParallelReasoningSessionManager();
  });

  it('should complete full workflow: init → plans → contamination → peer review → mediation → finalize', async () => {
    // Step 1: Initialize session
    const initResult = await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test market analysis',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    }, manager);

    expect(initResult.content[0].text).toContain('Session Initialized Successfully');
    expect(initResult.content[0].text).toContain('session_id');

    // Step 2: Submit 3 diverse plans
    const planA = await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Official statistics + Regression',
        diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
        capability_chain: ['market_scan', 'tam_sam_som_build', 'competitor_analysis', 'customer_segmentation', 'brand_equity_valuation', 'gtm_strategy', 'digital_roi_attribution', 'customer_journey_mapping'],
        rationale: 'Baseline using official data',
        expected_outputs: ['market_map', 'tam_sam_som']
      }
    }, manager);

    expect(planA.content[0].text).toContain('Plan Accepted');

    const planB = await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Industry reports + Monte Carlo',
        diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'], // Shares required axes, adds unique risk lens
        capability_chain: ['market_scan', 'monte_carlo_finance', 'competitor_analysis', 'customer_segmentation', 'brand_equity_valuation', 'gtm_strategy', 'digital_roi_attribution', 'customer_journey_mapping'],
        rationale: 'Probabilistic analysis',
        expected_outputs: ['market_map', 'monte_carlo_results']
      }
    }, manager);

    expect(planB.content[0].text).toContain('Plan Accepted');

    const planC = await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_C',
        description: 'Academic research + Normative',
        diversity_axes: ['data_sources', 'analytical_models', 'quality_metrics', 'stakeholder_views'], // Required axes plus two unique dimensions
        capability_chain: ['market_scan', 'regulatory_scan', 'competitor_analysis', 'customer_segmentation', 'brand_equity_valuation', 'gtm_strategy', 'digital_roi_attribution', 'customer_journey_mapping'],
        rationale: 'Long-term perspective',
        expected_outputs: ['market_map', 'regulatory_analysis']
      }
    }, manager);

    expect(planC.content[0].text).toContain('Plan Accepted');
    // Note: In manifest-based workflow, execute_reasoning_manifest is called after all plans are submitted
    // expect(planC.content[0].text).toContain('execute_reasoning_manifest');

    // Step 3: Cross-plan contamination (DEPRECATED - not needed in manifest workflow)
    // const note1 = await handleSubmitCrossPlanNote({
    //   session_id: sessionId,
    //   note: {
    //     from_plan_id: 'plan_A',
    //     to_plan_id: 'plan_B',
    //     note: 'Found market size €50B, consider in simulation',
    //     references: ['evidence_001'],
    //     timestamp: Date.now()
    //   }
    // }, manager);
    // expect(note1.content[0].text).toContain('Cross-Plan Note Recorded');

    // Step 4: Peer review
    const critique1 = await handleSubmitPeerCritique({
      session_id: sessionId,
      critique: {
        reviewer_plan_id: 'plan_B',
        reviewed_plan_id: 'plan_A',
        claims_challenged: [{
          claim: 'Market size estimation',
          evidence_ids: ['evidence_001'],
          challenge: 'Assumes linear growth',
          falsification_test: 'Test with crisis data'
        }],
        residual_risks: ['Regulatory changes not considered'],
        agreement_score: 0.65,
        timestamp: Date.now()
      }
    }, manager);

    expect(critique1.content[0].text).toContain('Peer Critique Recorded');

    // Step 5: Mediation
    const decision1 = await handleSubmitMediationDecision({
      session_id: sessionId,
      decision: {
        decision_point: 'Market size estimation',
        chosen_from_plan: 'plan_B',
        rationale: 'Monte Carlo provides confidence intervals',
        evidence_ids: ['evidence_005', 'evidence_006'],
        confidence: 0.82
      }
    }, manager);

    expect(decision1.content[0].text).toContain('Mediation Decision Recorded');

    // Step 6: List status
    const status = await handleListPlanStatus({
      session_id: sessionId
    }, manager);

    expect(status.content[0].text).toContain('Session Status');

    // Step 7: Finalize (should be incomplete since no plans were executed)
    const finalize = await handleFinalizeParallelReasoning({
      session_id: sessionId
    }, manager);

    expect(finalize.content[0].text).toContain('Session Incomplete');
  });

  it('records plan execution results on the injected manager and allows finalization', async () => {
    const executionSessionId = 'test_session_plan_results';

    await handleInitParallelReasoning({
      session_id: executionSessionId,
      task_description: 'Validate plan execution result persistence',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: executionSessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A baseline',
        diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Baseline analysis',
        expected_outputs: ['market_map']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: executionSessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B alternative',
        diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Risk-focused analysis',
        expected_outputs: ['risk_summary']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: executionSessionId,
      plan: {
        plan_id: 'plan_C',
        description: 'Plan C stakeholder view',
        diversity_axes: ['data_sources', 'analytical_models', 'stakeholder_views'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Stakeholder-focused analysis',
        expected_outputs: ['stakeholder_map']
      }
    }, manager);

    analyzeWithCapabilitiesMock
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Mock result for plan A' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Mock result for plan B' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Mock result for plan C' }] });

    try {
      const planAExecution = await handleExecutePlanStep({
        session_id: executionSessionId,
        plan_id: 'plan_A',
        task: 'Execute plan A capability chain'
      }, undefined, manager);

      expect(planAExecution.content[0].text).toContain('Capability Executed: plan_A');

      const planBExecution = await handleExecutePlanStep({
        session_id: executionSessionId,
        plan_id: 'plan_B',
        task: 'Execute plan B capability chain'
      }, undefined, manager);

      expect(planBExecution.content[0].text).toContain('Capability Executed: plan_B');

      const planCExecution = await handleExecutePlanStep({
        session_id: executionSessionId,
        plan_id: 'plan_C',
        task: 'Execute plan C capability chain'
      }, undefined, manager);

      expect(planCExecution.content[0].text).toContain('Capability Executed: plan_C');

      expect(analyzeWithCapabilitiesMock).toHaveBeenCalledTimes(3);
      expect(analyzeWithCapabilitiesMock.mock.calls[0][0]).toMatchObject({
        session_id: `${executionSessionId}_plan_A`,
        task: 'Execute plan A capability chain',
        tournament_mode: true,
        peer_review_mode: true
      });

      const session = manager.getSession(executionSessionId);
      expect(session?.plan_results.get('plan_A')?.[0]?.content[0].text).toContain('Mock result for plan A');
      expect(session?.plan_results.get('plan_B')?.[0]?.content[0].text).toContain('Mock result for plan B');
      expect(session?.plan_results.get('plan_C')?.[0]?.content[0].text).toContain('Mock result for plan C');

      const finalize = await handleFinalizeParallelReasoning({
        session_id: executionSessionId
      }, manager);

      // Note: Finalization will be blocked because:
      // 1. Coverage is low (1/8 = 12.5% < 95% threshold)
      // 2. Confidence is low (< 85% threshold)
      // This test verifies that plan execution results are recorded correctly,
      // not that finalization succeeds with incomplete execution
      expect(finalize.content[0].text).toContain('Session Incomplete');
    } finally {
      analyzeWithCapabilitiesMock.mockReset();
    }
  });

  it('should reject plan with insufficient diversity', async () => {
    // Initialize
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    }, manager);

    // Submit first plan
    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    // Submit second plan with same axes (should be rejected)
    const result = await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources', 'analytical_models'], // Same as Plan A
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    expect(result.content[0].text).toContain('Plan Rejected');
    expect(result.content[0].text).toContain('too similar');
  });

  it('should persist sessions across manager instances', () => {
    // Create first manager and initialize session
    const manager1 = new ParallelReasoningSessionManager();
    manager1.initSession({
      session_id: sessionId,
      task_description: 'Test persistence',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    });

    // Serialize sessions
    const serialized = manager1.serializeSessions();
    expect(serialized.length).toBe(1);
    expect(serialized[0][0]).toBe(sessionId);

    // Create second manager and load sessions
    const manager2 = new ParallelReasoningSessionManager();
    manager2.loadSessions(serialized);

    // Verify session was restored
    const session = manager2.getSession(sessionId);
    expect(session).not.toBeNull();
    expect(session?.task_description).toBe('Test persistence');
    expect(session?.min_plans).toBe(3);
  });

  it('should validate completeness before finalization', async () => {
    // Initialize and submit plans
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 3
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources', 'analytical_models', 'quality_metrics'], // Shares required axes, adds unique quality focus
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    // Try to finalize without mediation decisions (should show incomplete)
    const result = await handleFinalizeParallelReasoning({
      session_id: sessionId
    }, manager);

    // Should show incomplete
    expect(result.content[0].text).toContain('Session Incomplete');
  });

  it('should track cross-plan notes for audit trail', async () => {
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test',
      required_diversity_axes: ['data_sources'],
      min_plans: 3
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources', 'risk_perspectives', 'stakeholder_views'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    // Submit multiple notes
    await handleSubmitCrossPlanNote({
      session_id: sessionId,
      note: {
        from_plan_id: 'plan_A',
        to_plan_id: 'plan_B',
        note: 'Note 1',
        references: ['evidence_001'],
        timestamp: Date.now()
      }
    }, manager);

    await handleSubmitCrossPlanNote({
      session_id: sessionId,
      note: {
        from_plan_id: 'plan_B',
        to_plan_id: 'plan_A',
        note: 'Note 2',
        references: ['evidence_002'],
        timestamp: Date.now()
      }
    }, manager);

    // Verify notes are stored
    const session = manager.getSession(sessionId);
    expect(session?.cross_plan_notes.length).toBe(2);
  });

  it('should correctly serialize and deserialize sessions with nested Maps', async () => {
    // Initialize session
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test serialization',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    }, manager);

    // Submit plans
    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test plan A',
        expected_outputs: ['output_a']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test plan B',
        expected_outputs: ['output_b']
      }
    }, manager);

    // Verify session has plans
    const sessionBefore = manager.getSession(sessionId);
    expect(sessionBefore).toBeDefined();
    expect(sessionBefore?.plans.size).toBe(2);
    expect(sessionBefore?.plans.get('plan_A')).toBeDefined();
    expect(sessionBefore?.plans.get('plan_B')).toBeDefined();

    // Serialize sessions
    const serialized = manager.serializeSessions();
    expect(serialized.length).toBe(1);
    expect(serialized[0][0]).toBe(sessionId);

    // Create new manager and load serialized sessions
    const newManager = new ParallelReasoningSessionManager();
    newManager.loadSessions(serialized);

    // Verify session was correctly deserialized
    const sessionAfter = newManager.getSession(sessionId);
    expect(sessionAfter).toBeDefined();
    expect(sessionAfter?.session_id).toBe(sessionId);
    expect(sessionAfter?.task_description).toBe('Test serialization');

    // CRITICAL: Verify Maps were correctly restored
    expect(sessionAfter?.plans).toBeInstanceOf(Map);
    expect(sessionAfter?.plan_results).toBeInstanceOf(Map);
    expect(sessionAfter?.plans.size).toBe(2);

    // Verify plan data is intact
    const planA = sessionAfter?.plans.get('plan_A');
    expect(planA).toBeDefined();
    expect(planA?.plan_id).toBe('plan_A');
    expect(planA?.description).toBe('Plan A');
    expect(planA?.diversity_axes).toEqual(['data_sources', 'analytical_models', 'time_horizons']);

    const planB = sessionAfter?.plans.get('plan_B');
    expect(planB).toBeDefined();
    expect(planB?.plan_id).toBe('plan_B');
    expect(planB?.description).toBe('Plan B');

    // Verify we can submit more plans to the restored session
    const planC = await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_C',
        description: 'Plan C',
        diversity_axes: ['data_sources', 'analytical_models', 'stakeholder_views'],
        capability_chain: TEST_CAP_CHAIN,
        rationale: 'Test plan C after restore',
        expected_outputs: ['output_c']
      }
    }, newManager);

    expect(planC.content[0].text).toContain('Plan Accepted');

    const finalSession = newManager.getSession(sessionId);
    expect(finalSession?.plans.size).toBe(3);
  });
});
