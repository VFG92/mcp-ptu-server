/**
 * Saliency Report Integration Tests
 * 
 * Tests that saliency report is properly integrated into list_plan_status
 * to guide ChatGPT on what evidence is missing.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParallelReasoningSessionManager } from '../src/workers/parallel-reasoning-mcp.js';
import { handleRegisterExecutionResults, generateExecutionManifest } from '../src/workers/manifest-execution.js';
import { handleListPlanStatus } from '../src/workers/parallel-reasoning-tools-v5.js';

describe('Saliency Report Integration', () => {
  let manager: ParallelReasoningSessionManager;
  let sessionId: string;

  beforeEach(() => {
    manager = new ParallelReasoningSessionManager();
    sessionId = `test_saliency_${Date.now()}`;

    // Initialize session
    manager.initSession({
      session_id: sessionId,
      task_description: 'Test task for saliency report',
      required_diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
      min_plans: 3
    });

    // Submit plans
    manager.submitPlan(sessionId, {
      plan_id: 'plan_A',
      description: 'Plan A',
      diversity_axes: ['data_sources', 'analytical_models', 'time_horizons'],
      capability_chain: ['market_research', 'competitor_analysis', 'financial_modeling'],
      rationale: 'Test plan A',
      expected_outputs: ['output1', 'output2']
    });

    manager.submitPlan(sessionId, {
      plan_id: 'plan_B',
      description: 'Plan B',
      diversity_axes: ['data_sources', 'analytical_models', 'risk_perspectives'],
      capability_chain: ['market_research', 'risk_assessment', 'scenario_planning'],
      rationale: 'Test plan B',
      expected_outputs: ['output3', 'output4']
    });

    manager.submitPlan(sessionId, {
      plan_id: 'plan_C',
      description: 'Plan C',
      diversity_axes: ['data_sources', 'stakeholder_views', 'quality_metrics'],
      capability_chain: ['stakeholder_mapping', 'swot_analysis', 'kpi_definition'],
      rationale: 'Test plan C',
      expected_outputs: ['output5', 'output6']
    });
  });

  it('should save saliency report to session after batch registration', async () => {
    // Generate execution manifest first
    const manifest = generateExecutionManifest(sessionId, manager);
    const execution_token = manifest.execution_token;

    // Register execution results with low-quality evidence
    const result = await handleRegisterExecutionResults({
      execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Basic market research output',
          evidence_refs: [],
          workpapers: []
        }
      ]
    }, manager);

    // Check that saliency report was saved to session
    const updatedSession = manager.getSession(sessionId);
    expect(updatedSession?.saliency_report).toBeDefined();
    expect(updatedSession?.saliency_report.session_id).toBe(sessionId);
    expect(updatedSession?.saliency_report.overall_quality_score).toBeDefined();
  });

  it('should include saliency report in list_plan_status output', async () => {
    // Generate execution manifest and register low-quality results
    const manifest = generateExecutionManifest(sessionId, manager);

    await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Basic output without external sources',
          evidence_refs: [],
          workpapers: []
        }
      ]
    }, manager);

    // Get status
    const status = await handleListPlanStatus({ session_id: sessionId }, manager);
    const statusText = status.content[0].text;

    // Check that saliency report section is present
    expect(statusText).toContain('Evidence Quality Report');
    expect(statusText).toContain('Overall Quality Score');
  });

  it('should show missing evidence types in status', async () => {
    // Generate manifest and register results without external sources
    const manifest = generateExecutionManifest(sessionId, manager);

    await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Output without citations',
          evidence_refs: [],
          workpapers: []
        }
      ]
    }, manager);

    // Get status
    const status = await handleListPlanStatus({ session_id: sessionId }, manager);
    const statusText = status.content[0].text;

    // Check for missing evidence types
    expect(statusText).toContain('Missing Evidence Types');
    expect(statusText.includes('EXTERNAL_SOURCES') || statusText.includes('external sources')).toBe(true);
  });

  it('should show recommendations in status', async () => {
    // Generate manifest and register low-quality results
    const manifest = generateExecutionManifest(sessionId, manager);

    await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Basic output',
          evidence_refs: [],
          workpapers: []
        }
      ]
    }, manager);

    // Get status
    const status = await handleListPlanStatus({ session_id: sessionId }, manager);
    const statusText = status.content[0].text;

    // Check for recommendations
    expect(statusText).toContain('Recommendations');
  });

  it('should not show saliency report if not yet generated', async () => {
    // Get status before any execution
    const status = await handleListPlanStatus({ session_id: sessionId }, manager);
    const statusText = status.content[0].text;

    // Saliency report section should not be present
    expect(statusText).not.toContain('Evidence Quality Report');
  });

  it('should show high quality score when evidence is good', async () => {
    // Generate manifest and register high-quality results with external sources and workpapers
    const manifest = generateExecutionManifest(sessionId, manager);

    await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Comprehensive analysis with citations:\n- Source 1: https://example.com/report1\n- Source 2: https://example.com/report2\n- Source 3: https://example.com/report3\n\nQuantitative data:\n- Market size: $5B (source: Gartner)\n- Growth rate: 15% CAGR\n- Market share: 25%\n\nWorkpaper: [dataset.csv]\nCalculations: ROI = (Revenue - Cost) / Cost = 150%',
          evidence_refs: [
            { description: 'Report 1', type: 'url', source: 'https://example.com/report1', reliability_score: 0.9 },
            { description: 'Report 2', type: 'url', source: 'https://example.com/report2', reliability_score: 0.9 },
            { description: 'Report 3', type: 'url', source: 'https://example.com/report3', reliability_score: 0.9 }
          ],
          workpapers: [
            { title: 'Market Data', type: 'dataset', content: 'Market size: $5B, Growth: 15%', format: 'markdown' },
            { title: 'ROI Calculation', type: 'calculation', content: 'ROI = 150%', format: 'markdown' }
          ]
        }
      ]
    }, manager);

    // Get status
    const status = await handleListPlanStatus({ session_id: sessionId }, manager);
    const statusText = status.content[0].text;

    // Check for high quality score
    expect(statusText).toContain('Evidence Quality Report');
    const updatedSession = manager.getSession(sessionId);
    expect(updatedSession?.saliency_report.overall_quality_score).toBeGreaterThan(0.5);
  });

  it('should identify specific missing evidence types', async () => {
    // Generate manifest and register results missing specific types
    const manifest = generateExecutionManifest(sessionId, manager);

    await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Analysis with some external sources:\n- https://example.com/source1\n- https://example.com/source2\n\nBut no quantitative data or workpapers.',
          evidence_refs: [
            { description: 'Source 1', type: 'url', source: 'https://example.com/source1' },
            { description: 'Source 2', type: 'url', source: 'https://example.com/source2' }
          ],
          workpapers: []
        }
      ]
    }, manager);

    const updatedSession = manager.getSession(sessionId);
    const report = updatedSession?.saliency_report;

    expect(report).toBeDefined();
    expect(report.missing_evidence_types).toBeDefined();
    
    // Should be missing quantitative data and workpapers
    const missingTypes = report.missing_evidence_types.map((m: any) => m.type);
    expect(missingTypes).toContain('quantitative_data');
    expect(missingTypes).toContain('workpapers');
  });

  it('should provide actionable examples for missing evidence', async () => {
    // Generate manifest and register low-quality results
    const manifest = generateExecutionManifest(sessionId, manager);

    await handleRegisterExecutionResults({
      execution_token: manifest.execution_token,
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          findings: 'Basic output',
          evidence_refs: [],
          workpapers: []
        }
      ]
    }, manager);

    const updatedSession = manager.getSession(sessionId);
    const report = updatedSession?.saliency_report;

    expect(report).toBeDefined();
    expect(report.missing_evidence_types.length).toBeGreaterThan(0);

    // Each missing type should have examples
    for (const missing of report.missing_evidence_types) {
      expect(missing.examples).toBeDefined();
      expect(missing.examples.length).toBeGreaterThan(0);
      expect(missing.description).toBeDefined();
      expect(missing.priority).toBeDefined();
    }
  });
});

