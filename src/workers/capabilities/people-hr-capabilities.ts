/**
 * People & HR Capabilities
 * Org health, Talent economics, Skill gap, Change management, Workforce scenarios, Compensation
 */

import { z } from 'zod';
import type { CapabilityNode, CapabilityResult, ExecutionContext } from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

// Org Health Index
const orgHealthIndexCapability: CapabilityNode = {
  id: 'org_health_index',
  name: 'Organizational Health Index',
  description: 'Assess organizational health through culture and engagement surveys',
  category: 'operational',
  preconditions: { required_inputs: ['survey_data', 'employee_metrics'] },
  output_contract: {
    schema: z.object({
      overall_health_score: z.number().min(0).max(100),
      health_level: z.enum(['unhealthy', 'at_risk', 'healthy', 'high_performing']),
      dimensions: z.array(z.object({
        dimension: z.string(),
        score: z.number(),
        benchmark: z.number(),
        trend: z.enum(['improving', 'stable', 'declining'])
      })),
      engagement_metrics: z.object({
        engagement_score: z.number(),
        enps: z.number(),
        turnover_rate: z.number(),
        absenteeism_rate: z.number()
      }),
      key_strengths: z.array(z.string()),
      critical_issues: z.array(z.object({
        issue: z.string(),
        impact: z.enum(['critical', 'high', 'medium', 'low']),
        affected_population: z.number(),
        recommended_actions: z.array(z.string())
      }))
    }),
    required_evidence: ['overall_health_score'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 550, expected_tokens_out: 1400, cpu_ms: 750, subrequests: 3 },
  expected_precision: 0.72,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      overall_health_score: 68,
      health_level: 'healthy' as const,
      dimensions: [
        { dimension: 'Leadership', score: 72, benchmark: 70, trend: 'improving' as const },
        { dimension: 'Collaboration', score: 75, benchmark: 68, trend: 'stable' as const },
        { dimension: 'Innovation', score: 58, benchmark: 65, trend: 'declining' as const },
        { dimension: 'Accountability', score: 70, benchmark: 72, trend: 'stable' as const }
      ],
      engagement_metrics: { engagement_score: 72, enps: 28, turnover_rate: 12.5, absenteeism_rate: 3.2 },
      key_strengths: ['Strong leadership trust', 'Good work-life balance', 'Clear company vision'],
      critical_issues: [
        { issue: 'Innovation culture weak', impact: 'high' as const, affected_population: 65, recommended_actions: ['Launch innovation program', 'Allocate time for experimentation', 'Recognize innovative ideas'] },
        { issue: 'Career development concerns', impact: 'medium' as const, affected_population: 45, recommended_actions: ['Implement career pathing', 'Increase training budget', 'Mentorship program'] }
      ]
    };
    return {
      capability_id: 'org_health_index',
      output,
      evidence: { overall_health_score: [{ type: EvidenceType.CALCULATION, formula: 'Health score = weighted average of dimension scores', rationale: 'Composite score from survey data', timestamp: Date.now() }] },
      confidence: 0.72,
      cost_actual: { expected_tokens_in: 530, expected_tokens_out: 1350, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.82,
      warnings: ['Survey results depend on response rate and honesty'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['hr', 'engagement', 'culture']
};

// Talent Economics, Skill Gap, Change Management, Workforce Scenarios, Compensation (simplified)
const talentEconomicsCapability: CapabilityNode = {
  id: 'talent_economics',
  name: 'Talent Economics Analyzer',
  description: 'Analyze workforce cost structure and ROI',
  category: 'financial',
  preconditions: { required_inputs: ['workforce_data', 'cost_structure'] },
  output_contract: {
    schema: z.object({
      workforce_cost: z.object({
        total_cost: z.number(),
        cost_per_fte: z.number(),
        by_category: z.array(z.object({ category: z.string(), cost: z.number(), fte: z.number() }))
      }),
      productivity_metrics: z.object({
        revenue_per_fte: z.number(),
        profit_per_fte: z.number(),
        benchmark_comparison: z.number()
      }),
      optimization_opportunities: z.array(z.object({
        opportunity: z.string(),
        savings_potential: z.number(),
        implementation_approach: z.string()
      }))
    }),
    required_evidence: ['workforce_cost'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1200, cpu_ms: 700, subrequests: 2 },
  expected_precision: 0.70,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      workforce_cost: { total_cost: 250, cost_per_fte: 125, by_category: [{ category: 'Engineering', cost: 100, fte: 600 }, { category: 'Sales', cost: 80, fte: 500 }] },
      productivity_metrics: { revenue_per_fte: 500, profit_per_fte: 75, benchmark_comparison: 92 },
      optimization_opportunities: [
        { opportunity: 'Optimize contractor mix', savings_potential: 12, implementation_approach: 'Convert high-tenure contractors to FTE' },
        { opportunity: 'Span of control optimization', savings_potential: 8, implementation_approach: 'Reduce management layers' }
      ]
    };
    return {
      capability_id: 'talent_economics',
      output,
      evidence: { workforce_cost: [{ type: EvidenceType.CALCULATION, formula: 'Total cost = Salaries + Benefits + Overhead', rationale: 'Fully loaded workforce cost', timestamp: Date.now() }] },
      confidence: 0.70,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1150, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.80,
      warnings: ['Cost optimization should consider retention and morale impact'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['hr', 'cost', 'productivity']
};

const skillGapAnalyzerCapability: CapabilityNode = {
  id: 'skill_gap_analyzer',
  name: 'Skill Gap Analyzer',
  description: 'Map current skills vs future needs and identify gaps',
  category: 'operational',
  preconditions: { required_inputs: ['current_skills', 'future_requirements'] },
  output_contract: {
    schema: z.object({
      skill_inventory: z.array(z.object({ skill: z.string(), current_proficiency: z.number(), employees_with_skill: z.number() })),
      critical_gaps: z.array(z.object({ skill: z.string(), gap_size: z.number(), business_impact: z.enum(['critical', 'high', 'medium', 'low']), mitigation: z.string() })),
      development_plan: z.object({
        training_investment: z.number(),
        hiring_needs: z.number(),
        timeline_months: z.number()
      })
    }),
    required_evidence: ['critical_gaps'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1200, cpu_ms: 700, subrequests: 2 },
  expected_precision: 0.72,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      skill_inventory: [{ skill: 'Cloud architecture', current_proficiency: 65, employees_with_skill: 45 }, { skill: 'Data science', current_proficiency: 58, employees_with_skill: 28 }],
      critical_gaps: [
        { skill: 'AI/ML engineering', gap_size: 35, business_impact: 'critical' as const, mitigation: 'Hire 8 ML engineers + upskill 15 existing engineers' },
        { skill: 'Cybersecurity', gap_size: 25, business_impact: 'high' as const, mitigation: 'Partner with MSSP + hire 3 security specialists' }
      ],
      development_plan: { training_investment: 1200000, hiring_needs: 15, timeline_months: 18 }
    };
    return {
      capability_id: 'skill_gap_analyzer',
      output,
      evidence: { critical_gaps: [{ type: EvidenceType.HEURISTIC, rationale: 'Gap analysis based on current vs required skill levels', timestamp: Date.now() }] },
      confidence: 0.72,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1150, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.80,
      warnings: ['Skill assessment accuracy depends on self-reporting and manager input'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['hr', 'skills', 'development']
};

const changeManagementTrackerCapability: CapabilityNode = {
  id: 'change_management_tracker',
  name: 'Change Management Tracker',
  description: 'Track change readiness and adoption risk',
  category: 'operational',
  preconditions: { required_inputs: ['change_initiative', 'stakeholder_analysis'] },
  output_contract: {
    schema: z.object({
      readiness_score: z.number().min(0).max(100),
      adoption_risk: z.enum(['low', 'medium', 'high', 'critical']),
      stakeholder_segments: z.array(z.object({ segment: z.string(), size: z.number(), readiness: z.number(), influence: z.enum(['high', 'medium', 'low']) })),
      risk_factors: z.array(z.object({ factor: z.string(), severity: z.enum(['high', 'medium', 'low']), mitigation: z.string() })),
      action_plan: z.array(z.object({ action: z.string(), target_audience: z.string(), timeline: z.string() }))
    }),
    required_evidence: ['readiness_score'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1200, cpu_ms: 700, subrequests: 2 },
  expected_precision: 0.68,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      readiness_score: 58,
      adoption_risk: 'medium' as const,
      stakeholder_segments: [
        { segment: 'Champions', size: 15, readiness: 90, influence: 'high' as const },
        { segment: 'Fence-sitters', size: 60, readiness: 50, influence: 'medium' as const },
        { segment: 'Resistors', size: 25, readiness: 25, influence: 'medium' as const }
      ],
      risk_factors: [
        { factor: 'Unclear benefits communication', severity: 'high' as const, mitigation: 'Develop clear value proposition and success stories' },
        { factor: 'Insufficient training', severity: 'medium' as const, mitigation: 'Expand training program and provide job aids' }
      ],
      action_plan: [
        { action: 'Executive roadshow', target_audience: 'All employees', timeline: 'Month 1' },
        { action: 'Train-the-trainer program', target_audience: 'Managers', timeline: 'Month 2-3' },
        { action: 'Pilot with champions', target_audience: 'Early adopters', timeline: 'Month 3-4' }
      ]
    };
    return {
      capability_id: 'change_management_tracker',
      output,
      evidence: { readiness_score: [{ type: EvidenceType.HEURISTIC, rationale: 'Readiness assessed using Prosci ADKAR model', timestamp: Date.now() }] },
      confidence: 0.68,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1150, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.75,
      warnings: ['Change readiness can shift rapidly - continuous monitoring required'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['hr', 'change', 'adoption']
};

const workforceFutureScenariosCapability: CapabilityNode = {
  id: 'workforce_future_scenarios',
  name: 'Workforce Future Scenarios',
  description: 'Model future workforce scenarios with automation and remote work impact',
  category: 'strategic',
  preconditions: { required_inputs: ['current_workforce', 'automation_roadmap'] },
  output_contract: {
    schema: z.object({
      scenarios: z.array(z.object({
        name: z.string(),
        description: z.string(),
        workforce_size: z.number(),
        automation_level: z.number(),
        remote_work_percentage: z.number(),
        cost_impact: z.number(),
        productivity_impact: z.number()
      })),
      automation_impact: z.object({
        roles_automated: z.number(),
        roles_augmented: z.number(),
        new_roles_created: z.number(),
        net_fte_change: z.number()
      }),
      remote_work_impact: z.object({
        real_estate_savings: z.number(),
        productivity_change: z.number(),
        talent_pool_expansion: z.string()
      })
    }),
    required_evidence: ['scenarios'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1200, cpu_ms: 700, subrequests: 2 },
  expected_precision: 0.65,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      scenarios: [
        { name: 'High automation', description: 'Aggressive automation with 70% remote', workforce_size: 1600, automation_level: 45, remote_work_percentage: 70, cost_impact: -15, productivity_impact: 20 },
        { name: 'Balanced', description: 'Moderate automation with 50% remote', workforce_size: 1850, automation_level: 30, remote_work_percentage: 50, cost_impact: -8, productivity_impact: 12 },
        { name: 'Conservative', description: 'Limited automation with 30% remote', workforce_size: 1950, automation_level: 15, remote_work_percentage: 30, cost_impact: -3, productivity_impact: 5 }
      ],
      automation_impact: { roles_automated: 250, roles_augmented: 600, new_roles_created: 100, net_fte_change: -150 },
      remote_work_impact: { real_estate_savings: 12, productivity_change: 8, talent_pool_expansion: 'Access to global talent, 3x larger candidate pool' }
    };
    return {
      capability_id: 'workforce_future_scenarios',
      output,
      evidence: { scenarios: [{ type: EvidenceType.SIMULATION, rationale: 'Scenarios modeled based on automation roadmap and remote work policies', timestamp: Date.now() }] },
      confidence: 0.65,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1150, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.75,
      warnings: ['Future scenarios are highly uncertain - use for planning not prediction'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['hr', 'workforce', 'future', 'automation']
};

const compensationBenchmarkCapability: CapabilityNode = {
  id: 'compensation_benchmark',
  name: 'Compensation Benchmark',
  description: 'Benchmark compensation and incentives against market',
  category: 'financial',
  preconditions: { required_inputs: ['compensation_data', 'market_data'] },
  output_contract: {
    schema: z.object({
      overall_positioning: z.object({
        percentile: z.number(),
        vs_market: z.enum(['above', 'at', 'below']),
        competitiveness_score: z.number()
      }),
      by_role: z.array(z.object({
        role: z.string(),
        our_median: z.number(),
        market_median: z.number(),
        gap_percentage: z.number(),
        retention_risk: z.enum(['high', 'medium', 'low'])
      })),
      pay_equity: z.object({
        gender_pay_gap: z.number(),
        ethnicity_pay_gap: z.number(),
        issues_identified: z.array(z.string())
      }),
      recommendations: z.array(z.object({
        recommendation: z.string(),
        investment: z.number(),
        impact: z.string()
      }))
    }),
    required_evidence: ['overall_positioning'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1200, cpu_ms: 700, subrequests: 2 },
  expected_precision: 0.72,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      overall_positioning: { percentile: 52, vs_market: 'at' as const, competitiveness_score: 68 },
      by_role: [
        { role: 'Software Engineer', our_median: 125000, market_median: 135000, gap_percentage: -7.4, retention_risk: 'high' as const },
        { role: 'Product Manager', our_median: 145000, market_median: 140000, gap_percentage: 3.6, retention_risk: 'low' as const }
      ],
      pay_equity: { gender_pay_gap: 2.8, ethnicity_pay_gap: 1.5, issues_identified: ['Software Engineer role shows 5% gender gap', 'Manager level shows 3% ethnicity gap'] },
      recommendations: [
        { recommendation: 'Adjust Software Engineer compensation to market median', investment: 2500000, impact: 'Reduce turnover from 18% to 12%' },
        { recommendation: 'Address pay equity gaps', investment: 800000, impact: 'Improve DEI metrics and reduce legal risk' }
      ]
    };
    return {
      capability_id: 'compensation_benchmark',
      output,
      evidence: { overall_positioning: [{ type: EvidenceType.PRECEDENT, rationale: 'Compensation benchmarked against market survey data', timestamp: Date.now() }] },
      confidence: 0.72,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1150, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.80,
      warnings: ['Market data accuracy depends on survey quality and recency'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['hr', 'compensation', 'benchmark']
};

export function registerPeopleHRCapabilities(graph: CapabilityGraph): void {
  graph.register(orgHealthIndexCapability);
  graph.register(talentEconomicsCapability);
  graph.register(skillGapAnalyzerCapability);
  graph.register(changeManagementTrackerCapability);
  graph.register(workforceFutureScenariosCapability);
  graph.register(compensationBenchmarkCapability);
}

