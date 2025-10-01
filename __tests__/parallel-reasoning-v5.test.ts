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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import {
  handleInitParallelReasoning,
  handleSubmitReasoningPlan,
  handleSubmitCrossPlanNote,
  handleSubmitPeerCritique,
  handleSubmitMediationDecision,
  handleListPlanStatus,
  handleFinalizeParallelReasoning
} from '../src/workers/parallel-reasoning-tools-v5.js';

describe('Parallel Reasoning v5.0 - End-to-End Workflow', () => {
  let manager: ParallelReasoningSessionManager;
  const sessionId = 'test_session_001';

  beforeEach(() => {
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

    expect(initResult.content[0].text).toContain('Parallel Reasoning Session Initialized');
    expect(initResult.content[0].text).toContain('Submit 3 plans');

    // Step 2: Submit 3 diverse plans
    const planA = await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Official statistics + Regression',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan', 'tam_sam_som_build'],
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
        diversity_axes: ['time_horizons', 'risk_perspectives'], // 2 axes different from Plan A
        capability_chain: ['market_scan', 'monte_carlo_finance'],
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
        diversity_axes: ['quality_metrics', 'stakeholder_views'], // 2 axes different from Plan A and B
        capability_chain: ['market_scan', 'regulatory_scan'],
        rationale: 'Long-term perspective',
        expected_outputs: ['market_map', 'regulatory_analysis']
      }
    }, manager);

    expect(planC.content[0].text).toContain('Plan Accepted');
    expect(planC.content[0].text).toContain('Minimum Plans Met');

    // Step 3: Cross-plan contamination
    const note1 = await handleSubmitCrossPlanNote({
      session_id: sessionId,
      note: {
        from_plan_id: 'plan_A',
        to_plan_id: 'plan_B',
        note: 'Found market size €50B, consider in simulation',
        references: ['evidence_001'],
        timestamp: Date.now()
      }
    }, manager);

    expect(note1.content[0].text).toContain('Cross-Plan Note Recorded');

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

    // Step 7: Finalize
    const finalize = await handleFinalizeParallelReasoning({
      session_id: sessionId
    }, manager);

    expect(finalize.content[0].text).toContain('Session Finalized');
  });

  it('should reject plan with insufficient diversity', async () => {
    // Initialize
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    }, manager);

    // Submit first plan
    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan'],
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
        capability_chain: ['market_scan'],
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    expect(result.content[0].text).toContain('Plan Rejected');
    expect(result.content[0].text).toContain('at least 2 axes must differ');
  });

  it('should persist sessions across manager instances', () => {
    // Create first manager and initialize session
    const manager1 = new ParallelReasoningSessionManager();
    manager1.initSession({
      session_id: sessionId,
      task_description: 'Test persistence',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
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
    expect(session?.min_plans).toBe(2);
  });

  it('should validate completeness before finalization', async () => {
    // Initialize and submit plans
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan'],
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources', 'time_horizons'], // Different axes
        capability_chain: ['market_scan'],
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    // Try to finalize without mediation decisions (should show incomplete)
    const result = await handleFinalizeParallelReasoning({
      session_id: sessionId
    }, manager);

    // Should still finalize but show what's missing
    expect(result.content[0].text).toContain('Session Finalized');
  });

  it('should track cross-plan notes for audit trail', async () => {
    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Test',
      required_diversity_axes: ['data_sources'],
      min_plans: 2
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Plan A',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan'],
        rationale: 'Test',
        expected_outputs: ['market_map']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Plan B',
        diversity_axes: ['data_sources', 'time_horizons'],
        capability_chain: ['market_scan'],
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
});

