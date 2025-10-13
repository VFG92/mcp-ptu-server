import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ParallelReasoningSessionManager
} from '../src/workers/parallel-reasoning-mcp.js';
import type {
  ReasoningPlan,
  DiversityAxis
} from '../src/workers/parallel-reasoning-mcp.js';

const sessionId = 'manager_validation_session';

function createPlan(plan_id: string, diversity_axes: DiversityAxis[]): ReasoningPlan {
  return {
    plan_id,
    description: `Plan ${plan_id}`,
    diversity_axes,
    capability_chain: ['market_scan'],
    rationale: 'Test rationale',
    expected_outputs: ['artifact']
  };
}

describe('ParallelReasoningSessionManager structural validation', () => {
  let manager: ParallelReasoningSessionManager;

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
    manager.initSession({
      session_id: sessionId,
      task_description: 'Validate session manager guardrails',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });
  });

  it('rejects duplicate plan IDs and preserves existing plan results', () => {
    const planA = createPlan('plan_A', ['data_sources', 'analytical_models', 'time_horizons']);
    const planB = createPlan('plan_A', ['data_sources', 'analytical_models', 'risk_perspectives']);

    const first = manager.submitPlan(sessionId, planA);
    expect(first.accepted).toBe(true);

    manager.recordPlanResult(sessionId, 'plan_A', {
      content: [{ type: 'text', text: 'Result snapshot' }]
    });

    const second = manager.submitPlan(sessionId, planB);
    expect(second.accepted).toBe(false);
    expect(second.reason).toContain('Plan ID `plan_A` already exists');

    const session = manager.getSession(sessionId);
    expect(session?.plans.size).toBe(1);
    expect(session?.plan_results.get('plan_A')?.length).toBe(1);
  });

  it('validates plan IDs when storing cross-plan notes', () => {
    const planA = createPlan('plan_A', ['data_sources', 'analytical_models', 'time_horizons']);
    const planB = createPlan('plan_B', ['data_sources', 'analytical_models', 'risk_perspectives']);
    expect(manager.submitPlan(sessionId, planA).accepted).toBe(true);
    expect(manager.submitPlan(sessionId, planB).accepted).toBe(true);

    expect(() =>
      manager.submitCrossPlanNote(sessionId, {
        from_plan_id: 'nonexistent',
        to_plan_id: 'plan_B',
        note: 'Invalid note',
        references: [],
        timestamp: Date.now()
      })
    ).toThrow(/Plan ID `nonexistent` not found/);

    expect(() =>
      manager.submitCrossPlanNote(sessionId, {
        from_plan_id: 'plan_A',
        to_plan_id: 'missing',
        note: 'Invalid note',
        references: [],
        timestamp: Date.now()
      })
    ).toThrow(/Plan ID `missing` not found/);

    manager.submitCrossPlanNote(sessionId, {
      from_plan_id: 'plan_A',
      to_plan_id: 'plan_B',
      note: 'Valid cross contamination',
      references: ['evidence_001'],
      timestamp: Date.now()
    });

    const session = manager.getSession(sessionId);
    expect(session?.cross_plan_notes.length).toBe(1);
  });

  it('validates plan IDs for peer critiques', () => {
    const planA = createPlan('plan_A', ['data_sources', 'analytical_models', 'time_horizons']);
    const planB = createPlan('plan_B', ['data_sources', 'analytical_models', 'risk_perspectives']);
    manager.submitPlan(sessionId, planA);
    manager.submitPlan(sessionId, planB);

    // UPDATED (v5.10.0): Minimum 3 claims with falsification tests AND counterfactual scenarios required
    expect(() =>
      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'ghost',
        reviewed_plan_id: 'plan_B',
        claims_challenged: [
          { claim: 'Test claim 1', evidence_ids: ['ev1'], challenge: 'Test', falsification_test: 'If X, falsified', counterfactual_scenario: 'If X fails, pivot to Y' },
          { claim: 'Test claim 2', evidence_ids: ['ev2'], challenge: 'Test', falsification_test: 'If Y, falsified', counterfactual_scenario: 'If Y fails, pivot to Z' },
          { claim: 'Test claim 3', evidence_ids: ['ev3'], challenge: 'Test', falsification_test: 'If Z, falsified', counterfactual_scenario: 'If Z fails, pivot to W' }
        ],
        residual_risks: [],
        agreement_score: 0.5,
        timestamp: Date.now()
      })
    ).toThrow(/Reviewer plan ID `ghost` not found/);

    expect(() =>
      manager.submitPeerCritique(sessionId, {
        reviewer_plan_id: 'plan_A',
        reviewed_plan_id: 'phantom',
        claims_challenged: [
          { claim: 'Test claim 1', evidence_ids: ['ev1'], challenge: 'Test', falsification_test: 'If X, falsified', counterfactual_scenario: 'If X fails, pivot to Y' },
          { claim: 'Test claim 2', evidence_ids: ['ev2'], challenge: 'Test', falsification_test: 'If Y, falsified', counterfactual_scenario: 'If Y fails, pivot to Z' },
          { claim: 'Test claim 3', evidence_ids: ['ev3'], challenge: 'Test', falsification_test: 'If Z, falsified', counterfactual_scenario: 'If Z fails, pivot to W' }
        ],
        residual_risks: [],
        agreement_score: 0.5,
        timestamp: Date.now()
      })
    ).toThrow(/Reviewed plan ID `phantom` not found/);

    manager.submitPeerCritique(sessionId, {
      reviewer_plan_id: 'plan_A',
      reviewed_plan_id: 'plan_B',
      claims_challenged: [
        { claim: 'Market size 50B', evidence_ids: ['evidence_001'], challenge: 'Requires sensitivity check', falsification_test: 'If market <$40B in 2025, claim falsified', counterfactual_scenario: 'If market is $30B, reduce headcount 40%' },
        { claim: 'Growth rate 20%', evidence_ids: ['evidence_002'], challenge: 'Historical avg is 12%', falsification_test: 'If Q1 growth <10%, claim falsified', counterfactual_scenario: 'If growth is 10%, pivot to profitability' },
        { claim: 'Market share 15%', evidence_ids: ['evidence_003'], challenge: 'Assumes no new entrants', falsification_test: 'If competitors >10, claim falsified', counterfactual_scenario: 'If 15 competitors, differentiate on service' }
      ],
      residual_risks: ['Regulatory shock'],
      agreement_score: 0.75,
      timestamp: Date.now()
    });

    const session = manager.getSession(sessionId);
    expect(session?.peer_critiques.length).toBe(1);
    expect(session?.status).toBe('peer_review');
  });

  it('rejects plans missing required diversity axes', () => {
    const plan = createPlan('plan_missing_axes', ['risk_perspectives', 'time_horizons']);
    const result = manager.submitPlan(sessionId, plan);

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('include required diversity axes');
    expect(result.diversity_validation.required_axes_satisfied).toBe(false);
    expect(result.diversity_validation.required_axes).toEqual(['data_sources', 'analytical_models']);
  });

  it('validates plan IDs for mediation decisions', () => {
    const planA = createPlan('plan_A', ['data_sources', 'analytical_models', 'time_horizons']);
    manager.submitPlan(sessionId, planA);

    expect(() =>
      manager.submitMediationDecision(sessionId, {
        decision_point: 'Market entry strategy',
        chosen_from_plan: 'unknown_plan',
        rationale: 'Invalid rationale',
        evidence_ids: ['evidence'],
        confidence: 0.6
      })
    ).toThrow(/Plan ID `unknown_plan` not found/);

    manager.submitMediationDecision(sessionId, {
      decision_point: 'Market entry strategy',
      chosen_from_plan: 'plan_A',
      rationale: 'Use baseline plan due to validated evidence',
      evidence_ids: ['evidence_001'],
      confidence: 0.9
    });

    const session = manager.getSession(sessionId);
    expect(session?.mediation_decisions.length).toBe(1);
  });
});
