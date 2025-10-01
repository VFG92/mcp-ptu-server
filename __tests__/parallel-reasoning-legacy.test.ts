import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  handleInitParallelReasoning,
  handleSubmitReasoningPlan,
  handleSubmitCrossPlanNote,
  handleSubmitPeerCritique,
  handleSubmitMediationDecision
} from '../src/workers/parallel-reasoning-tools-v5.js';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';

const sessionId = 'tool_handler_validation_session';

describe('parallel reasoning v5 tool handler validation', () => {
  let manager: ParallelReasoningSessionManager;

  beforeEach(async () => {
    manager = new ParallelReasoningSessionManager();

    await handleInitParallelReasoning({
      session_id: sessionId,
      task_description: 'Validate tool-level error handling',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_A',
        description: 'Baseline plan',
        diversity_axes: ['data_sources', 'analytical_models'],
        capability_chain: ['market_scan'],
        rationale: 'Baseline analysis',
        expected_outputs: ['market_map']
      }
    }, manager);

    await handleSubmitReasoningPlan({
      session_id: sessionId,
      plan: {
        plan_id: 'plan_B',
        description: 'Risk-focused plan',
        diversity_axes: ['risk_perspectives', 'time_horizons'],
        capability_chain: ['market_scan'],
        rationale: 'Risk lens',
        expected_outputs: ['risk_map']
      }
    }, manager);
  });

  it('surfaces validation errors for cross-plan notes referencing missing plans', async () => {
    const invalid = await handleSubmitCrossPlanNote({
      session_id: sessionId,
      note: {
        from_plan_id: 'missing_plan',
        to_plan_id: 'plan_B',
        note: 'Should fail',
        references: [],
        timestamp: Date.now()
      }
    }, manager);

    expect(invalid.content[0].text).toContain('❌ Validation Error');
    expect(invalid.content[0].text).toContain('missing_plan');

    const valid = await handleSubmitCrossPlanNote({
      session_id: sessionId,
      note: {
        from_plan_id: 'plan_A',
        to_plan_id: 'plan_B',
        note: 'Regulatory update shared',
        references: ['evidence_001'],
        timestamp: Date.now()
      }
    }, manager);

    expect(valid.content[0].text).toContain('Cross-Plan Note Recorded');
  });

  it('surfaces validation errors for peer critiques referencing missing plans', async () => {
    const invalid = await handleSubmitPeerCritique({
      session_id: sessionId,
      critique: {
        reviewer_plan_id: 'ghost_plan',
        reviewed_plan_id: 'plan_A',
        claims_challenged: [],
        residual_risks: [],
        agreement_score: 0.5,
        timestamp: Date.now()
      }
    }, manager);

    expect(invalid.content[0].text).toContain('❌ Validation Error');
    expect(invalid.content[0].text).toContain('ghost_plan');

    const valid = await handleSubmitPeerCritique({
      session_id: sessionId,
      critique: {
        reviewer_plan_id: 'plan_A',
        reviewed_plan_id: 'plan_B',
        claims_challenged: [{
          claim: 'Risk probability 5%',
          evidence_ids: ['evidence_002'],
          challenge: 'Consider worst-case 10%'
        }],
        residual_risks: ['Supply chain disruption'],
        agreement_score: 0.7,
        timestamp: Date.now()
      }
    }, manager);

    expect(valid.content[0].text).toContain('Peer Critique Recorded');
  });

  it('surfaces validation errors for mediation decisions referencing missing plans', async () => {
    const invalid = await handleSubmitMediationDecision({
      session_id: sessionId,
      decision: {
        decision_point: 'Final recommendation',
        chosen_from_plan: 'unknown_plan',
        rationale: 'Should fail due to missing plan',
        evidence_ids: ['evidence_003'],
        confidence: 0.6
      }
    }, manager);

    expect(invalid.content[0].text).toContain('❌ Validation Error');
    expect(invalid.content[0].text).toContain('unknown_plan');

    const valid = await handleSubmitMediationDecision({
      session_id: sessionId,
      decision: {
        decision_point: 'Final recommendation',
        chosen_from_plan: 'plan_A',
        rationale: 'Baseline plan supported by evidence',
        evidence_ids: ['evidence_004'],
        confidence: 0.85
      }
    }, manager);

    expect(valid.content[0].text).toContain('Mediation Decision Recorded');
  });

  it('accepts plans that differ by two unique axes overall even when sharing core axes', () => {
    const diversitySession = 'diversity_axes_symdiff';

    manager.initSession({
      session_id: diversitySession,
      task_description: 'Validate symmetric difference diversity checks',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 2
    });

    const first = manager.submitPlan(diversitySession, {
      plan_id: 'plan_core',
      description: 'Data and model baseline with horizon extension',
      diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
      capability_chain: ['market_scan'],
      rationale: 'Extend baseline with forward-looking horizon',
      expected_outputs: ['forecast_summary']
    });
    expect(first.accepted).toBe(true);
    expect(first.diversity_validation.axes_unique_to_existing).toBe(true);

    const second = manager.submitPlan(diversitySession, {
      plan_id: 'plan_risk',
      description: 'Data and model baseline with risk perspective',
      diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'],
      capability_chain: ['market_scan'],
      rationale: 'Introduce risk lens while keeping shared foundations',
      expected_outputs: ['risk_summary']
    });
    expect(second.accepted).toBe(true);
    expect(second.diversity_validation.axes_unique_to_existing).toBe(true);
  });
});
