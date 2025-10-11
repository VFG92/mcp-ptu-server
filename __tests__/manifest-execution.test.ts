import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import {
  generateExecutionManifest,
  handleRegisterExecutionResults
} from '../src/workers/manifest-execution.ts';

describe('manifest execution registration', () => {
  let manager: ParallelReasoningSessionManager;
  const sessionId = 'test-manifest-execution';

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();

    manager.initSession({
      session_id: sessionId,
      task_description: 'Test manifest execution',
      required_diversity_axes: ['data_sources', 'analytical_models'],
      min_plans: 1
    });

    manager.submitPlan(sessionId, {
      plan_id: 'plan-alpha',
      description: 'Plan Alpha',
      diversity_axes: ['data_sources', 'analytical_models', 'stakeholder_views'],
      capability_chain: ['cap1', 'cap2', 'cap3'],
      rationale: 'Test plan',
      expected_outputs: ['Output']
    });
  });

  function baseSelfAssessment() {
    return {
      total_evidence_items: 3,
      external_sources: 1,
      quantitative_datapoints: 2,
      workpapers_created: 1,
      estimated_confidence: 0.6,
      estimated_coverage: 0.5,
      meets_confidence_threshold: false,
      meets_coverage_threshold: false,
      gaps_identified: ['Need more external validation']
    };
  }

  it('accepts ultra-concise summaries up to 300 characters', async () => {
    const manifest = generateExecutionManifest(sessionId, manager);
    const summary = 'A'.repeat(300);

    const response = await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      self_assessment: baseSelfAssessment(),
      results: [{
        plan_id: 'plan-alpha',
        step_id: 'plan-alpha_step_1',
        evidence_count: 1,
        source_count: 1,
        data_point_count: 1,
        summary
      }]
    }, manager);

    expect(response.content[0].text).toContain('Results Registered');

    const session = manager.getSession(sessionId);
    expect(session).toBeDefined();
    const planResults = session?.plan_results.get('plan-alpha');
    expect(planResults).toBeDefined();
    expect(planResults?.length).toBe(1);
    expect(planResults?.[0].findings.length).toBe(300);

    const token = session?.execution_tokens?.find(t => t.token === manifest.execution_token);
    expect(token?.used).toBe(true);
  });

  it('keeps token active when some results fail and allows retry', async () => {
    const manifest = generateExecutionManifest(sessionId, manager);

    const firstResponse = await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      self_assessment: baseSelfAssessment(),
      results: [
        {
          plan_id: 'plan-alpha',
          step_id: 'plan-alpha_step_1',
          evidence_count: 2,
          source_count: 1,
          data_point_count: 1,
          summary: 'Registered successfully'
        },
        {
          plan_id: 'unknown-plan',
          step_id: 'unknown-plan_step_1',
          evidence_count: 1,
          source_count: 0,
          data_point_count: 0,
          summary: 'This should fail'
        }
      ]
    }, manager);

    expect(firstResponse.content[0].text).toContain('Registration Issues');
    expect(firstResponse.content[0].text).toContain('plan not found in session');

    const session = manager.getSession(sessionId);
    expect(session).toBeDefined();
    const planResults = session?.plan_results.get('plan-alpha');
    expect(planResults?.length).toBe(1);

    let token = session?.execution_tokens?.find(t => t.token === manifest.execution_token);
    expect(token?.used).toBe(false);

    const retryResponse = await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      self_assessment: baseSelfAssessment(),
      results: [{
        plan_id: 'plan-alpha',
        step_id: 'plan-alpha_step_2',
        evidence_count: 1,
        source_count: 1,
        data_point_count: 1,
        summary: 'Recovered missing step'
      }]
    }, manager);

    expect(retryResponse.content[0].text).toContain('Results Registered');
    expect(retryResponse.content[0].text).not.toContain('Registration Issues');

    const updatedSession = manager.getSession(sessionId);
    expect(updatedSession?.plan_results.get('plan-alpha')?.length).toBe(2);

    token = updatedSession?.execution_tokens?.find(t => t.token === manifest.execution_token);
    expect(token?.used).toBe(true);
  });
});
