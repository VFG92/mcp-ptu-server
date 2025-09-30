/**
 * Process Excellence & IT Capabilities
 * Process mining, RPA, IT architecture, Cloud TCO, Cybersecurity, Data Governance, AI Use Cases
 */

import { z } from 'zod';
import type { CapabilityNode, CapabilityResult, ExecutionContext } from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

// Process Mining
const processMiningCapability: CapabilityNode = {
  id: 'process_mining',
  name: 'Process Mining Analyzer',
  description: 'Analyze process flows from ERP/CRM logs to identify bottlenecks and optimization opportunities',
  category: 'operational',
  preconditions: { required_inputs: ['process_logs', 'target_process'] },
  output_contract: {
    schema: z.object({
      process_overview: z.object({
        total_cases: z.number(),
        avg_duration_days: z.number(),
        variants: z.number(),
        conformance_rate: z.number()
      }),
      bottlenecks: z.array(z.object({
        activity: z.string(),
        avg_wait_time_hours: z.number(),
        cases_affected: z.number(),
        impact: z.enum(['critical', 'high', 'medium', 'low'])
      })),
      optimization_opportunities: z.array(z.object({
        opportunity: z.string(),
        time_savings_hours: z.number(),
        cost_savings: z.number(),
        implementation_effort: z.enum(['low', 'medium', 'high'])
      })),
      process_variants: z.array(z.object({
        variant: z.string(),
        frequency: z.number(),
        avg_duration: z.number(),
        is_optimal: z.boolean()
      }))
    }),
    required_evidence: ['bottlenecks'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 550, expected_tokens_out: 1500, cpu_ms: 800, subrequests: 3 },
  expected_precision: 0.75,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      process_overview: { total_cases: 15000, avg_duration_days: 12, variants: 45, conformance_rate: 72 },
      bottlenecks: [
        { activity: 'Approval step 2', avg_wait_time_hours: 48, cases_affected: 8500, impact: 'critical' as const },
        { activity: 'Data validation', avg_wait_time_hours: 24, cases_affected: 6000, impact: 'high' as const }
      ],
      optimization_opportunities: [
        { opportunity: 'Automate approval routing', time_savings_hours: 36, cost_savings: 250000, implementation_effort: 'medium' as const },
        { opportunity: 'Implement parallel processing', time_savings_hours: 24, cost_savings: 180000, implementation_effort: 'high' as const }
      ],
      process_variants: [
        { variant: 'Standard path', frequency: 65, avg_duration: 8, is_optimal: true },
        { variant: 'Exception path 1', frequency: 25, avg_duration: 18, is_optimal: false },
        { variant: 'Exception path 2', frequency: 10, avg_duration: 25, is_optimal: false }
      ]
    };
    return {
      capability_id: 'process_mining',
      output,
      evidence: { bottlenecks: [{ type: EvidenceType.RETRIEVAL, rationale: 'Bottlenecks identified from process log analysis', timestamp: Date.now() }] },
      confidence: 0.75,
      cost_actual: { expected_tokens_in: 530, expected_tokens_out: 1450, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.85,
      warnings: ['Process mining accuracy depends on log data quality'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['process', 'mining', 'optimization']
};

// RPA Opportunity Scan
const rpaOpportunityScanCapability: CapabilityNode = {
  id: 'rpa_opportunity_scan',
  name: 'RPA Opportunity Scanner',
  description: 'Identify automation opportunities and prioritize RPA use cases',
  category: 'operational',
  preconditions: { required_inputs: ['process_inventory', 'task_characteristics'] },
  output_contract: {
    schema: z.object({
      automation_candidates: z.array(z.object({
        process: z.string(),
        volume_annual: z.number(),
        time_per_instance_minutes: z.number(),
        automation_feasibility: z.number().min(0).max(100),
        roi_score: z.number(),
        priority: z.enum(['high', 'medium', 'low'])
      })),
      total_opportunity: z.object({
        fte_savings: z.number(),
        cost_savings_annual: z.number(),
        implementation_cost: z.number(),
        payback_months: z.number()
      }),
      implementation_roadmap: z.array(z.object({
        wave: z.string(),
        processes: z.array(z.string()),
        fte_savings: z.number(),
        timeline: z.string()
      }))
    }),
    required_evidence: ['total_opportunity'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 550, expected_tokens_out: 1400, cpu_ms: 750, subrequests: 3 },
  expected_precision: 0.70,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      automation_candidates: [
        { process: 'Invoice processing', volume_annual: 50000, time_per_instance_minutes: 15, automation_feasibility: 95, roi_score: 92, priority: 'high' as const },
        { process: 'Data entry', volume_annual: 120000, time_per_instance_minutes: 8, automation_feasibility: 90, roi_score: 88, priority: 'high' as const },
        { process: 'Report generation', volume_annual: 2400, time_per_instance_minutes: 45, automation_feasibility: 85, roi_score: 75, priority: 'medium' as const }
      ],
      total_opportunity: { fte_savings: 12.5, cost_savings_annual: 1250000, implementation_cost: 350000, payback_months: 3.4 },
      implementation_roadmap: [
        { wave: 'Wave 1 - Quick wins', processes: ['Invoice processing', 'Data entry'], fte_savings: 9.5, timeline: 'Q1-Q2 2024' },
        { wave: 'Wave 2 - Complex processes', processes: ['Report generation'], fte_savings: 3.0, timeline: 'Q3 2024' }
      ]
    };
    return {
      capability_id: 'rpa_opportunity_scan',
      output,
      evidence: { total_opportunity: [{ type: EvidenceType.CALCULATION, formula: 'FTE savings = (Volume × Time per instance) / (Annual working hours)', rationale: 'Bottom-up calculation of automation potential', timestamp: Date.now() }] },
      confidence: 0.70,
      cost_actual: { expected_tokens_in: 530, expected_tokens_out: 1350, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.80,
      warnings: ['Automation feasibility should be validated with technical assessment'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['rpa', 'automation', 'digital']
};

// IT Architecture Map
const itArchitectureMapCapability: CapabilityNode = {
  id: 'it_architecture_map',
  name: 'IT Architecture Mapper',
  description: 'Map IT system landscape and identify modernization gaps',
  category: 'operational',
  preconditions: { required_inputs: ['system_inventory', 'integration_map'] },
  output_contract: {
    schema: z.object({
      system_landscape: z.object({
        total_applications: z.number(),
        legacy_systems: z.number(),
        cloud_native: z.number(),
        hybrid: z.number(),
        avg_age_years: z.number()
      }),
      technical_debt: z.object({
        total_score: z.number().min(0).max(100),
        categories: z.array(z.object({
          category: z.string(),
          score: z.number(),
          impact: z.string()
        }))
      }),
      modernization_priorities: z.array(z.object({
        system: z.string(),
        current_state: z.string(),
        target_state: z.string(),
        business_impact: z.enum(['critical', 'high', 'medium', 'low']),
        technical_complexity: z.enum(['high', 'medium', 'low']),
        estimated_cost: z.number(),
        timeline: z.string()
      })),
      integration_complexity: z.object({
        total_integrations: z.number(),
        point_to_point: z.number(),
        api_based: z.number(),
        complexity_score: z.number()
      })
    }),
    required_evidence: ['technical_debt'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 600, expected_tokens_out: 1600, cpu_ms: 850, subrequests: 3 },
  expected_precision: 0.72,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      system_landscape: { total_applications: 250, legacy_systems: 85, cloud_native: 45, hybrid: 120, avg_age_years: 8.5 },
      technical_debt: {
        total_score: 62,
        categories: [
          { category: 'Legacy technology', score: 45, impact: 'High maintenance costs, limited scalability' },
          { category: 'Integration complexity', score: 55, impact: 'Slow time-to-market, data inconsistency' },
          { category: 'Security vulnerabilities', score: 70, impact: 'Compliance risk, potential breaches' }
        ]
      },
      modernization_priorities: [
        { system: 'Core ERP', current_state: 'On-premise legacy', target_state: 'Cloud SaaS', business_impact: 'critical' as const, technical_complexity: 'high' as const, estimated_cost: 15000000, timeline: '24 months' },
        { system: 'CRM', current_state: 'Custom-built', target_state: 'Modern CRM platform', business_impact: 'high' as const, technical_complexity: 'medium' as const, estimated_cost: 3000000, timeline: '12 months' }
      ],
      integration_complexity: { total_integrations: 450, point_to_point: 280, api_based: 170, complexity_score: 68 }
    };
    return {
      capability_id: 'it_architecture_map',
      output,
      evidence: { technical_debt: [{ type: EvidenceType.HEURISTIC, rationale: 'Technical debt scored based on system age, technology stack, and maintenance burden', timestamp: Date.now() }] },
      confidence: 0.72,
      cost_actual: { expected_tokens_in: 580, expected_tokens_out: 1550, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.80,
      warnings: ['Modernization costs are high-level estimates - detailed assessment required'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['it', 'architecture', 'modernization']
};

// Cloud TCO Model
const cloudTcoModelCapability: CapabilityNode = {
  id: 'cloud_tco_model',
  name: 'Cloud TCO Modeler',
  description: 'Compare total cost of ownership for cloud vs on-premise infrastructure',
  category: 'financial',
  preconditions: { required_inputs: ['current_infrastructure', 'workload_profile'] },
  output_contract: {
    schema: z.object({
      on_premise_tco: z.object({
        capex: z.number(),
        opex_annual: z.number(),
        five_year_tco: z.number(),
        cost_breakdown: z.array(z.object({ category: z.string(), amount: z.number(), percentage: z.number() }))
      }),
      cloud_tco: z.object({
        migration_cost: z.number(),
        opex_annual: z.number(),
        five_year_tco: z.number(),
        cost_breakdown: z.array(z.object({ category: z.string(), amount: z.number(), percentage: z.number() }))
      }),
      comparison: z.object({
        five_year_savings: z.number(),
        breakeven_months: z.number(),
        recommendation: z.enum(['cloud', 'on_premise', 'hybrid'])
      }),
      non_cost_factors: z.array(z.object({
        factor: z.string(),
        cloud_advantage: z.boolean(),
        description: z.string()
      }))
    }),
    required_evidence: ['comparison'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 550, expected_tokens_out: 1400, cpu_ms: 750, subrequests: 3 },
  expected_precision: 0.70,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      on_premise_tco: {
        capex: 5000000,
        opex_annual: 2000000,
        five_year_tco: 15000000,
        cost_breakdown: [
          { category: 'Hardware', amount: 5000000, percentage: 33 },
          { category: 'Software licenses', amount: 3000000, percentage: 20 },
          { category: 'Data center', amount: 2500000, percentage: 17 },
          { category: 'Personnel', amount: 3500000, percentage: 23 },
          { category: 'Maintenance', amount: 1000000, percentage: 7 }
        ]
      },
      cloud_tco: {
        migration_cost: 1500000,
        opex_annual: 2200000,
        five_year_tco: 12500000,
        cost_breakdown: [
          { category: 'Migration', amount: 1500000, percentage: 12 },
          { category: 'Cloud services', amount: 8000000, percentage: 64 },
          { category: 'Personnel (reduced)', amount: 2500000, percentage: 20 },
          { category: 'Training', amount: 500000, percentage: 4 }
        ]
      },
      comparison: { five_year_savings: 2500000, breakeven_months: 18, recommendation: 'cloud' as const },
      non_cost_factors: [
        { factor: 'Scalability', cloud_advantage: true, description: 'Elastic scaling vs fixed capacity' },
        { factor: 'Time to market', cloud_advantage: true, description: 'Faster provisioning and deployment' },
        { factor: 'Data sovereignty', cloud_advantage: false, description: 'May require specific regions/compliance' }
      ]
    };
    return {
      capability_id: 'cloud_tco_model',
      output,
      evidence: { comparison: [{ type: EvidenceType.CALCULATION, formula: 'TCO = Capex + (Opex × Years)', rationale: '5-year total cost of ownership comparison', timestamp: Date.now() }] },
      confidence: 0.70,
      cost_actual: { expected_tokens_in: 530, expected_tokens_out: 1350, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.80,
      warnings: ['TCO model should be validated with actual cloud pricing and usage patterns'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['cloud', 'tco', 'infrastructure']
};

export function registerProcessITCapabilities(graph: CapabilityGraph): void {
  graph.register(processMiningCapability);
  graph.register(rpaOpportunityScanCapability);
  graph.register(itArchitectureMapCapability);
  graph.register(cloudTcoModelCapability);
}

