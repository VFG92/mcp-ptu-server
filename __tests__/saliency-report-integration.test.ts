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

    // Register execution results with low-quality evidence (NEW format)
    const result = await handleRegisterExecutionResults({
      execution_token,
      self_assessment: {
        total_evidence_items: 0,
        external_sources: 0,
        quantitative_datapoints: 0,
        workpapers_created: 0,
        estimated_confidence: 0.2,
        estimated_coverage: 1.0,
        meets_confidence_threshold: false,
        meets_coverage_threshold: true
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 0,
          source_count: 0,
          data_point_count: 0,
          evidence_refs: [],
          summary: 'Basic market research output'
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
      self_assessment: {
        total_evidence_items: 0,
        external_sources: 0,
        quantitative_datapoints: 0,
        workpapers_created: 0,
        estimated_confidence: 0.2,
        estimated_coverage: 1.0,
        meets_confidence_threshold: false,
        meets_coverage_threshold: true
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 0,
          source_count: 0,
          data_point_count: 0,
          evidence_refs: [],
          summary: 'Basic output without external sources'
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
      self_assessment: {
        total_evidence_items: 0,
        external_sources: 0,
        quantitative_datapoints: 0,
        workpapers_created: 0,
        estimated_confidence: 0.2,
        estimated_coverage: 1.0,
        meets_confidence_threshold: false,
        meets_coverage_threshold: true
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 0,
          source_count: 0,
          data_point_count: 0,
          evidence_refs: [],
          summary: 'Output without citations'
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
      self_assessment: {
        total_evidence_items: 0,
        external_sources: 0,
        quantitative_datapoints: 0,
        workpapers_created: 0,
        estimated_confidence: 0.2,
        estimated_coverage: 1.0,
        meets_confidence_threshold: false,
        meets_coverage_threshold: true
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 0,
          source_count: 0,
          data_point_count: 0,
          evidence_refs: [],
          summary: 'Basic output'
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
      self_assessment: {
        total_evidence_items: 8,
        external_sources: 3,
        quantitative_datapoints: 3,
        workpapers_created: 2,
        estimated_confidence: 0.9,
        estimated_coverage: 1.0,
        meets_confidence_threshold: true,
        meets_coverage_threshold: true
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 8,
          source_count: 3,
          data_point_count: 3,
          evidence_refs: [
            { ref_id: 'Report1', type: 'source', reliability: 0.9 },
            { ref_id: 'Report2', type: 'source', reliability: 0.9 },
            { ref_id: 'Report3', type: 'source', reliability: 0.9 },
            { ref_id: 'Calc1', type: 'calculation', reliability: 0.95 }
          ],
          summary: 'Comprehensive analysis. 3 sources, 3 datapoints, 2 workpapers. Market: $5B, Growth: 15%, ROI: 150%.'
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
      self_assessment: {
        total_evidence_items: 2,
        external_sources: 2,
        quantitative_datapoints: 0,
        workpapers_created: 0,
        estimated_confidence: 0.4,
        estimated_coverage: 1.0,
        meets_confidence_threshold: false,
        meets_coverage_threshold: true,
        gaps_identified: ['No quantitative data', 'No workpapers']
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 2,
          source_count: 2,
          data_point_count: 0,
          evidence_refs: [
            { ref_id: 'Source1', type: 'source', reliability: 0.7 },
            { ref_id: 'Source2', type: 'source', reliability: 0.7 }
          ],
          summary: 'Analysis with 2 external sources but no quantitative data.'
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
      self_assessment: {
        total_evidence_items: 0,
        external_sources: 0,
        quantitative_datapoints: 0,
        workpapers_created: 0,
        estimated_confidence: 0.2,
        estimated_coverage: 1.0,
        meets_confidence_threshold: false,
        meets_coverage_threshold: true,
        gaps_identified: ['No evidence collected']
      },
      results: [
        {
          plan_id: 'plan_A',
          step_id: 'market_research',
          evidence_count: 0,
          source_count: 0,
          data_point_count: 0,
          evidence_refs: [],
          summary: 'Basic output with no evidence.'
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

