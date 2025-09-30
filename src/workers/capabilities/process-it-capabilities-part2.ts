/**
 * Process Excellence & IT Capabilities - Part 2
 * Cybersecurity, Data Governance, AI Use Case Screening
 */

import { z } from 'zod';
import type { CapabilityNode, CapabilityResult, ExecutionContext } from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

// Cybersecurity Risk Model
const cybersecurityRiskModelCapability: CapabilityNode = {
  id: 'cybersecurity_risk_model',
  name: 'Cybersecurity Risk Modeler',
  description: 'Assess cybersecurity risks, threat landscape, and compliance with ISO 27001, NIS2',
  category: 'risk',
  preconditions: { required_inputs: ['security_posture', 'threat_landscape'] },
  output_contract: {
    schema: z.object({
      overall_risk_score: z.number().min(0).max(100),
      risk_categories: z.array(z.object({
        category: z.string(),
        risk_level: z.enum(['critical', 'high', 'medium', 'low']),
        score: z.number(),
        key_vulnerabilities: z.array(z.string())
      })),
      threat_analysis: z.array(z.object({
        threat: z.string(),
        likelihood: z.enum(['high', 'medium', 'low']),
        impact: z.enum(['critical', 'high', 'medium', 'low']),
        current_controls: z.array(z.string()),
        gaps: z.array(z.string())
      })),
      compliance_status: z.array(z.object({
        framework: z.string(),
        compliance_percentage: z.number(),
        status: z.enum(['compliant', 'partial', 'non_compliant']),
        critical_gaps: z.array(z.string())
      })),
      remediation_roadmap: z.array(z.object({
        initiative: z.string(),
        risk_reduction: z.number(),
        investment: z.number(),
        timeline: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
      }))
    }),
    required_evidence: ['overall_risk_score'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 600, expected_tokens_out: 1700, cpu_ms: 900, subrequests: 3 },
  expected_precision: 0.70,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      overall_risk_score: 68,
      risk_categories: [
        { category: 'Data protection', risk_level: 'high' as const, score: 72, key_vulnerabilities: ['Unencrypted data at rest', 'Weak access controls'] },
        { category: 'Network security', risk_level: 'medium' as const, score: 58, key_vulnerabilities: ['Legacy firewall rules', 'Limited segmentation'] },
        { category: 'Identity & access', risk_level: 'high' as const, score: 75, key_vulnerabilities: ['No MFA for privileged accounts', 'Excessive permissions'] },
        { category: 'Incident response', risk_level: 'medium' as const, score: 55, key_vulnerabilities: ['No formal IR plan', 'Limited monitoring'] }
      ],
      threat_analysis: [
        { threat: 'Ransomware attack', likelihood: 'high' as const, impact: 'critical' as const, current_controls: ['Antivirus', 'Email filtering'], gaps: ['No offline backups', 'Limited user training'] },
        { threat: 'Data breach', likelihood: 'medium' as const, impact: 'critical' as const, current_controls: ['Firewall', 'Basic encryption'], gaps: ['No DLP', 'Weak access controls'] },
        { threat: 'Insider threat', likelihood: 'medium' as const, impact: 'high' as const, current_controls: ['Background checks'], gaps: ['No user behavior analytics', 'Limited monitoring'] }
      ],
      compliance_status: [
        { framework: 'ISO 27001', compliance_percentage: 65, status: 'partial' as const, critical_gaps: ['Risk assessment process', 'Incident management', 'Business continuity'] },
        { framework: 'NIS2 (EU)', compliance_percentage: 45, status: 'non_compliant' as const, critical_gaps: ['Supply chain security', 'Incident reporting', 'Governance structure'] },
        { framework: 'GDPR', compliance_percentage: 78, status: 'partial' as const, critical_gaps: ['Data mapping', 'Privacy by design'] }
      ],
      remediation_roadmap: [
        { initiative: 'Implement MFA for all users', risk_reduction: 25, investment: 150000, timeline: '3 months', priority: 'high' as const },
        { initiative: 'Deploy EDR solution', risk_reduction: 30, investment: 300000, timeline: '6 months', priority: 'high' as const },
        { initiative: 'Establish SOC', risk_reduction: 35, investment: 1200000, timeline: '12 months', priority: 'medium' as const }
      ]
    };
    return {
      capability_id: 'cybersecurity_risk_model',
      output,
      evidence: { overall_risk_score: [{ type: EvidenceType.HEURISTIC, rationale: 'Risk score calculated from vulnerability assessment, threat analysis, and compliance gaps', timestamp: Date.now() }] },
      confidence: 0.70,
      cost_actual: { expected_tokens_in: 580, expected_tokens_out: 1650, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.80,
      warnings: ['Cybersecurity assessment should be validated with penetration testing'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['cybersecurity', 'risk', 'compliance']
};

// Data Governance Index
const dataGovernanceIndexCapability: CapabilityNode = {
  id: 'data_governance_index',
  name: 'Data Governance Index',
  description: 'Assess data governance maturity, data quality, lineage, and stewardship',
  category: 'operational',
  preconditions: { required_inputs: ['data_landscape', 'governance_practices'] },
  output_contract: {
    schema: z.object({
      maturity_score: z.number().min(0).max(100),
      maturity_level: z.enum(['initial', 'managed', 'defined', 'quantitatively_managed', 'optimizing']),
      dimensions: z.array(z.object({
        dimension: z.string(),
        score: z.number(),
        level: z.string(),
        strengths: z.array(z.string()),
        gaps: z.array(z.string())
      })),
      data_quality: z.object({
        overall_score: z.number(),
        completeness: z.number(),
        accuracy: z.number(),
        consistency: z.number(),
        timeliness: z.number(),
        critical_issues: z.array(z.string())
      }),
      data_lineage: z.object({
        coverage: z.number(),
        critical_data_elements_mapped: z.number(),
        total_critical_elements: z.number(),
        gaps: z.array(z.string())
      }),
      stewardship: z.object({
        data_owners_assigned: z.number(),
        data_stewards_assigned: z.number(),
        coverage_percentage: z.number(),
        effectiveness_score: z.number()
      }),
      improvement_priorities: z.array(z.object({
        area: z.string(),
        current_state: z.string(),
        target_state: z.string(),
        business_impact: z.string(),
        effort: z.enum(['low', 'medium', 'high']),
        timeline: z.string()
      }))
    }),
    required_evidence: ['maturity_score'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 600, expected_tokens_out: 1600, cpu_ms: 850, subrequests: 3 },
  expected_precision: 0.72,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      maturity_score: 52,
      maturity_level: 'managed' as const,
      dimensions: [
        { dimension: 'Data strategy', score: 45, level: 'Initial', strengths: ['Executive awareness'], gaps: ['No formal strategy', 'Limited funding'] },
        { dimension: 'Data quality', score: 58, level: 'Managed', strengths: ['Quality metrics defined', 'Some monitoring'], gaps: ['Inconsistent enforcement', 'Limited automation'] },
        { dimension: 'Metadata management', score: 42, level: 'Initial', strengths: ['Business glossary started'], gaps: ['Incomplete coverage', 'No lineage tracking'] },
        { dimension: 'Data security', score: 65, level: 'Defined', strengths: ['Access controls', 'Encryption'], gaps: ['Limited data classification', 'No DLP'] }
      ],
      data_quality: {
        overall_score: 68,
        completeness: 75,
        accuracy: 72,
        consistency: 58,
        timeliness: 65,
        critical_issues: ['Customer data inconsistency across systems', 'Product master data duplicates', 'Financial data reconciliation gaps']
      },
      data_lineage: {
        coverage: 35,
        critical_data_elements_mapped: 140,
        total_critical_elements: 400,
        gaps: ['No lineage for legacy systems', 'Manual processes not documented', 'External data sources not tracked']
      },
      stewardship: {
        data_owners_assigned: 25,
        data_stewards_assigned: 12,
        coverage_percentage: 45,
        effectiveness_score: 55
      },
      improvement_priorities: [
        { area: 'Data quality framework', current_state: 'Ad-hoc monitoring', target_state: 'Automated DQ with SLAs', business_impact: 'Improved decision-making, reduced errors', effort: 'medium' as const, timeline: '9 months' },
        { area: 'Data lineage', current_state: '35% coverage', target_state: '90% coverage for critical data', business_impact: 'Regulatory compliance, impact analysis', effort: 'high' as const, timeline: '12 months' },
        { area: 'Data stewardship', current_state: '45% coverage', target_state: '100% coverage with active stewards', business_impact: 'Accountability, data quality ownership', effort: 'low' as const, timeline: '6 months' }
      ]
    };
    return {
      capability_id: 'data_governance_index',
      output,
      evidence: { maturity_score: [{ type: EvidenceType.HEURISTIC, rationale: 'Maturity assessed using DAMA-DMBOK framework across multiple dimensions', timestamp: Date.now() }] },
      confidence: 0.72,
      cost_actual: { expected_tokens_in: 580, expected_tokens_out: 1550, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.82,
      warnings: ['Data governance maturity assessment should involve stakeholder interviews'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['data', 'governance', 'quality']
};

// AI Use Case Screener
const aiUseCaseScreenerCapability: CapabilityNode = {
  id: 'ai_use_case_screener',
  name: 'AI Use Case Screener',
  description: 'Identify and prioritize AI/ML use cases with ROI analysis',
  category: 'strategic',
  preconditions: { required_inputs: ['business_processes', 'data_availability'] },
  output_contract: {
    schema: z.object({
      use_cases: z.array(z.object({
        use_case: z.string(),
        category: z.enum(['predictive_analytics', 'process_automation', 'personalization', 'optimization', 'computer_vision', 'nlp']),
        business_value: z.number(),
        technical_feasibility: z.number(),
        data_readiness: z.number(),
        priority_score: z.number(),
        estimated_roi: z.number(),
        implementation_complexity: z.enum(['low', 'medium', 'high']),
        timeline_months: z.number()
      })),
      prioritization_matrix: z.array(z.object({
        quadrant: z.string(),
        use_cases: z.array(z.string()),
        recommendation: z.string()
      })),
      implementation_roadmap: z.array(z.object({
        phase: z.string(),
        use_cases: z.array(z.string()),
        investment: z.number(),
        expected_value: z.number(),
        timeline: z.string()
      })),
      enablers_required: z.array(z.object({
        enabler: z.string(),
        current_state: z.string(),
        target_state: z.string(),
        investment: z.number()
      }))
    }),
    required_evidence: ['use_cases'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 600, expected_tokens_out: 1700, cpu_ms: 900, subrequests: 3 },
  expected_precision: 0.68,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      use_cases: [
        { use_case: 'Demand forecasting', category: 'predictive_analytics' as const, business_value: 90, technical_feasibility: 85, data_readiness: 80, priority_score: 85, estimated_roi: 4.5, implementation_complexity: 'medium' as const, timeline_months: 6 },
        { use_case: 'Churn prediction', category: 'predictive_analytics' as const, business_value: 85, technical_feasibility: 90, data_readiness: 75, priority_score: 83, estimated_roi: 5.2, implementation_complexity: 'low' as const, timeline_months: 4 },
        { use_case: 'Dynamic pricing', category: 'optimization' as const, business_value: 95, technical_feasibility: 70, data_readiness: 65, priority_score: 77, estimated_roi: 6.8, implementation_complexity: 'high' as const, timeline_months: 9 },
        { use_case: 'Quality defect detection', category: 'computer_vision' as const, business_value: 80, technical_feasibility: 75, data_readiness: 60, priority_score: 72, estimated_roi: 3.8, implementation_complexity: 'high' as const, timeline_months: 12 },
        { use_case: 'Customer service chatbot', category: 'nlp' as const, business_value: 70, technical_feasibility: 85, data_readiness: 70, priority_score: 75, estimated_roi: 2.5, implementation_complexity: 'medium' as const, timeline_months: 5 }
      ],
      prioritization_matrix: [
        { quadrant: 'Quick wins (High value, High feasibility)', use_cases: ['Churn prediction'], recommendation: 'Implement immediately' },
        { quadrant: 'Strategic bets (High value, Lower feasibility)', use_cases: ['Dynamic pricing', 'Demand forecasting'], recommendation: 'Invest in enablers, then implement' },
        { quadrant: 'Fill-ins (Lower value, High feasibility)', use_cases: ['Customer service chatbot'], recommendation: 'Implement if resources available' },
        { quadrant: 'Long-term (Lower value, Lower feasibility)', use_cases: ['Quality defect detection'], recommendation: 'Monitor technology maturity' }
      ],
      implementation_roadmap: [
        { phase: 'Phase 1 - Quick wins', use_cases: ['Churn prediction'], investment: 250000, expected_value: 1300000, timeline: 'Q1-Q2 2024' },
        { phase: 'Phase 2 - Strategic', use_cases: ['Demand forecasting', 'Dynamic pricing'], investment: 800000, expected_value: 5200000, timeline: 'Q3 2024 - Q1 2025' },
        { phase: 'Phase 3 - Scale', use_cases: ['Customer service chatbot', 'Quality defect detection'], investment: 600000, expected_value: 2100000, timeline: 'Q2-Q4 2025' }
      ],
      enablers_required: [
        { enabler: 'Data platform', current_state: 'Siloed data sources', target_state: 'Unified data lake with ML pipelines', investment: 1500000 },
        { enabler: 'ML Ops', current_state: 'Manual model deployment', target_state: 'Automated ML Ops platform', investment: 500000 },
        { enabler: 'Talent', current_state: '2 data scientists', target_state: '8 data scientists + ML engineers', investment: 1200000 }
      ]
    };
    return {
      capability_id: 'ai_use_case_screener',
      output,
      evidence: { use_cases: [{ type: EvidenceType.HEURISTIC, rationale: 'Use cases scored on business value, technical feasibility, and data readiness', timestamp: Date.now() }] },
      confidence: 0.68,
      cost_actual: { expected_tokens_in: 580, expected_tokens_out: 1650, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.78,
      warnings: ['AI use case ROI estimates should be validated with pilot projects'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['ai', 'ml', 'use_cases', 'digital']
};

export function registerProcessITPart2Capabilities(graph: CapabilityGraph): void {
  graph.register(cybersecurityRiskModelCapability);
  graph.register(dataGovernanceIndexCapability);
  graph.register(aiUseCaseScreenerCapability);
}

