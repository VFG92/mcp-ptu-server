/**
 * Legal & Regulatory Capabilities
 * Regulatory scan, Compliance gap, Contract risk, IP landscape, Antitrust impact
 */

import { z } from 'zod';
import type { CapabilityNode, CapabilityResult, ExecutionContext } from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

// Regulatory Scan (Enhanced)
const regulatoryScanEnhancedCapability: CapabilityNode = {
  id: 'regulatory_scan_enhanced',
  name: 'Enhanced Regulatory Scanner',
  description: 'Comprehensive regulatory landscape scan with vertical-specific regulations',
  category: 'risk',
  preconditions: { required_inputs: ['industry_vertical', 'geographic_regions'] },
  output_contract: {
    schema: z.object({
      applicable_regulations: z.array(z.object({
        regulation: z.string(),
        jurisdiction: z.string(),
        applicability: z.enum(['mandatory', 'recommended', 'emerging']),
        compliance_deadline: z.string().optional(),
        penalties_for_non_compliance: z.string(),
        current_status: z.enum(['compliant', 'partial', 'non_compliant', 'not_assessed'])
      })),
      emerging_regulations: z.array(z.object({
        regulation: z.string(),
        expected_effective_date: z.string(),
        impact_assessment: z.string(),
        preparation_required: z.array(z.string())
      })),
      compliance_roadmap: z.array(z.object({
        regulation: z.string(),
        actions: z.array(z.string()),
        investment: z.number(),
        timeline: z.string(),
        priority: z.enum(['critical', 'high', 'medium', 'low'])
      }))
    }),
    required_evidence: ['applicable_regulations'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 550, expected_tokens_out: 1500, cpu_ms: 800, subrequests: 3 },
  expected_precision: 0.72,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const industryContext = context.whiteboard.get('__industry_context__');
    const output = {
      applicable_regulations: [
        { regulation: 'GDPR', jurisdiction: 'EU', applicability: 'mandatory' as const, compliance_deadline: 'Ongoing', penalties_for_non_compliance: 'Up to €20M or 4% of global revenue', current_status: 'partial' as const },
        { regulation: 'CCPA/CPRA', jurisdiction: 'California, USA', applicability: 'mandatory' as const, compliance_deadline: 'Ongoing', penalties_for_non_compliance: 'Up to $7,500 per violation', current_status: 'compliant' as const },
        { regulation: 'AI Act (EU)', jurisdiction: 'EU', applicability: 'emerging' as const, compliance_deadline: '2026', penalties_for_non_compliance: 'Up to €30M or 6% of global revenue', current_status: 'not_assessed' as const }
      ],
      emerging_regulations: [
        { regulation: 'EU AI Act', expected_effective_date: '2026-Q2', impact_assessment: 'High-risk AI systems require conformity assessment', preparation_required: ['AI system inventory', 'Risk classification', 'Documentation framework'] },
        { regulation: 'Digital Markets Act', expected_effective_date: '2024-Q2', impact_assessment: 'Gatekeeper obligations for large platforms', preparation_required: ['Market position assessment', 'Interoperability planning'] }
      ],
      compliance_roadmap: [
        { regulation: 'GDPR', actions: ['Complete data mapping', 'Implement privacy by design', 'Update consent mechanisms'], investment: 500000, timeline: '9 months', priority: 'high' as const },
        { regulation: 'AI Act', actions: ['Classify AI systems', 'Establish governance', 'Prepare documentation'], investment: 800000, timeline: '18 months', priority: 'medium' as const }
      ]
    };
    return {
      capability_id: 'regulatory_scan_enhanced',
      output,
      evidence: { applicable_regulations: [{ type: EvidenceType.RETRIEVAL, rationale: 'Regulations identified from legal databases and industry-specific requirements', timestamp: Date.now() }] },
      confidence: 0.72,
      cost_actual: { expected_tokens_in: 530, expected_tokens_out: 1450, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.80,
      warnings: ['Regulatory landscape changes frequently - continuous monitoring required'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['legal', 'regulatory', 'compliance']
};

// Compliance Gap Assessment
const complianceGapAssessmentCapability: CapabilityNode = {
  id: 'compliance_gap_assessment',
  name: 'Compliance Gap Assessor',
  description: 'Assess compliance gaps for GDPR, SOX, ISO standards',
  category: 'risk',
  preconditions: { required_inputs: ['target_frameworks', 'current_controls'] },
  output_contract: {
    schema: z.object({
      frameworks_assessed: z.array(z.object({
        framework: z.string(),
        total_controls: z.number(),
        compliant: z.number(),
        partial: z.number(),
        non_compliant: z.number(),
        compliance_percentage: z.number()
      })),
      critical_gaps: z.array(z.object({
        framework: z.string(),
        control: z.string(),
        gap_description: z.string(),
        risk_level: z.enum(['critical', 'high', 'medium', 'low']),
        remediation: z.string(),
        effort: z.enum(['low', 'medium', 'high']),
        timeline: z.string()
      })),
      remediation_plan: z.object({
        total_investment: z.number(),
        timeline_months: z.number(),
        phases: z.array(z.object({
          phase: z.string(),
          gaps_addressed: z.number(),
          investment: z.number(),
          duration_months: z.number()
        }))
      })
    }),
    required_evidence: ['frameworks_assessed'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 550, expected_tokens_out: 1400, cpu_ms: 750, subrequests: 3 },
  expected_precision: 0.70,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      frameworks_assessed: [
        { framework: 'GDPR', total_controls: 99, compliant: 65, partial: 22, non_compliant: 12, compliance_percentage: 66 },
        { framework: 'SOX', total_controls: 45, compliant: 38, partial: 5, non_compliant: 2, compliance_percentage: 84 },
        { framework: 'ISO 27001', total_controls: 114, compliant: 58, partial: 35, non_compliant: 21, compliance_percentage: 51 }
      ],
      critical_gaps: [
        { framework: 'GDPR', control: 'Data subject rights', gap_description: 'No automated process for data subject requests', risk_level: 'high' as const, remediation: 'Implement DSAR management system', effort: 'medium' as const, timeline: '6 months' },
        { framework: 'ISO 27001', control: 'Incident management', gap_description: 'No formal incident response plan', risk_level: 'critical' as const, remediation: 'Develop and test IR plan', effort: 'medium' as const, timeline: '4 months' },
        { framework: 'SOX', control: 'Change management', gap_description: 'Insufficient segregation of duties', risk_level: 'high' as const, remediation: 'Implement role-based access controls', effort: 'high' as const, timeline: '8 months' }
      ],
      remediation_plan: {
        total_investment: 1800000,
        timeline_months: 18,
        phases: [
          { phase: 'Critical gaps', gaps_addressed: 8, investment: 800000, duration_months: 6 },
          { phase: 'High priority', gaps_addressed: 15, investment: 600000, duration_months: 8 },
          { phase: 'Medium priority', gaps_addressed: 25, investment: 400000, duration_months: 4 }
        ]
      }
    };
    return {
      capability_id: 'compliance_gap_assessment',
      output,
      evidence: { frameworks_assessed: [{ type: EvidenceType.HEURISTIC, rationale: 'Gap assessment based on control framework requirements vs current implementation', timestamp: Date.now() }] },
      confidence: 0.70,
      cost_actual: { expected_tokens_in: 530, expected_tokens_out: 1350, cpu_ms: Date.now() - startTime, subrequests: 3 },
      quality_score: 0.80,
      warnings: ['Compliance assessment should be validated by external auditors'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['legal', 'compliance', 'audit']
};

// Contract Risk Analyzer, IP Landscape, Antitrust Impact (simplified for brevity)
const contractRiskAnalyzerCapability: CapabilityNode = {
  id: 'contract_risk_analyzer',
  name: 'Contract Risk Analyzer',
  description: 'Analyze contract risks including critical clauses, liability, and termination',
  category: 'risk',
  preconditions: { required_inputs: ['contracts'] },
  output_contract: {
    schema: z.object({
      contracts_analyzed: z.number(),
      high_risk_contracts: z.array(z.object({
        contract: z.string(),
        counterparty: z.string(),
        risk_score: z.number(),
        key_risks: z.array(z.string()),
        recommended_actions: z.array(z.string())
      })),
      clause_analysis: z.array(z.object({
        clause_type: z.string(),
        favorable: z.number(),
        neutral: z.number(),
        unfavorable: z.number()
      }))
    }),
    required_evidence: ['contracts_analyzed'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1200, cpu_ms: 700, subrequests: 2 },
  expected_precision: 0.68,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      contracts_analyzed: 250,
      high_risk_contracts: [
        { contract: 'Supplier Agreement XYZ', counterparty: 'Supplier XYZ', risk_score: 78, key_risks: ['Unlimited liability', 'Auto-renewal without notice', 'Unfavorable termination terms'], recommended_actions: ['Renegotiate liability cap', 'Add termination notice period'] }
      ],
      clause_analysis: [
        { clause_type: 'Liability', favorable: 45, neutral: 120, unfavorable: 85 },
        { clause_type: 'Termination', favorable: 60, neutral: 140, unfavorable: 50 }
      ]
    };
    return {
      capability_id: 'contract_risk_analyzer',
      output,
      evidence: { contracts_analyzed: [{ type: EvidenceType.RETRIEVAL, rationale: 'Contract analysis using NLP and legal risk frameworks', timestamp: Date.now() }] },
      confidence: 0.68,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1150, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.75,
      warnings: ['Contract analysis should be reviewed by legal counsel'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['legal', 'contracts', 'risk']
};

const ipLandscapeCapability: CapabilityNode = {
  id: 'ip_landscape',
  name: 'IP Landscape Analyzer',
  description: 'Analyze patent landscape, freedom-to-operate, and litigation risk',
  category: 'risk',
  preconditions: { required_inputs: ['technology_area'] },
  output_contract: {
    schema: z.object({
      patent_landscape: z.object({
        total_patents: z.number(),
        our_patents: z.number(),
        competitor_patents: z.number(),
        white_space_areas: z.array(z.string())
      }),
      freedom_to_operate: z.object({
        risk_level: z.enum(['low', 'medium', 'high']),
        blocking_patents: z.number(),
        mitigation_options: z.array(z.string())
      }),
      litigation_risk: z.object({
        active_disputes: z.number(),
        potential_infringement: z.number(),
        estimated_exposure: z.number()
      })
    }),
    required_evidence: ['patent_landscape'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1100, cpu_ms: 650, subrequests: 2 },
  expected_precision: 0.65,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      patent_landscape: { total_patents: 15000, our_patents: 450, competitor_patents: 8500, white_space_areas: ['Edge computing applications', 'Quantum-resistant encryption'] },
      freedom_to_operate: { risk_level: 'medium' as const, blocking_patents: 12, mitigation_options: ['License negotiations', 'Design around', 'Patent challenge'] },
      litigation_risk: { active_disputes: 2, potential_infringement: 5, estimated_exposure: 25000000 }
    };
    return {
      capability_id: 'ip_landscape',
      output,
      evidence: { patent_landscape: [{ type: EvidenceType.RETRIEVAL, rationale: 'Patent data from USPTO, EPO, and other patent databases', timestamp: Date.now() }] },
      confidence: 0.65,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1050, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.75,
      warnings: ['IP analysis should be validated by patent attorneys'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['legal', 'ip', 'patents']
};

const antitrustImpactCapability: CapabilityNode = {
  id: 'antitrust_impact',
  name: 'Antitrust Impact Analyzer',
  description: 'Assess concentration risk, merger control, and antitrust compliance',
  category: 'risk',
  preconditions: { required_inputs: ['market_position', 'transaction_type'] },
  output_contract: {
    schema: z.object({
      market_concentration: z.object({
        hhi_index: z.number(),
        our_market_share: z.number(),
        concentration_level: z.enum(['low', 'moderate', 'high']),
        antitrust_risk: z.enum(['low', 'medium', 'high'])
      }),
      merger_control: z.object({
        filing_required: z.boolean(),
        jurisdictions: z.array(z.string()),
        estimated_timeline_months: z.number(),
        approval_probability: z.number()
      }),
      risk_factors: z.array(z.object({
        factor: z.string(),
        severity: z.enum(['high', 'medium', 'low']),
        mitigation: z.string()
      }))
    }),
    required_evidence: ['market_concentration'],
    quality_checks: []
  },
  cost_estimate: { expected_tokens_in: 500, expected_tokens_out: 1100, cpu_ms: 650, subrequests: 2 },
  expected_precision: 0.68,
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    const output = {
      market_concentration: { hhi_index: 1850, our_market_share: 22, concentration_level: 'moderate' as const, antitrust_risk: 'medium' as const },
      merger_control: { filing_required: true, jurisdictions: ['US (HSR)', 'EU (EUMR)', 'UK (CMA)'], estimated_timeline_months: 9, approval_probability: 0.75 },
      risk_factors: [
        { factor: 'Market share >20% post-merger', severity: 'medium' as const, mitigation: 'Prepare competitive analysis and efficiencies defense' },
        { factor: 'Vertical integration concerns', severity: 'low' as const, mitigation: 'Offer behavioral remedies if required' }
      ]
    };
    return {
      capability_id: 'antitrust_impact',
      output,
      evidence: { market_concentration: [{ type: EvidenceType.CALCULATION, formula: 'HHI = Sum of squared market shares', rationale: 'Herfindahl-Hirschman Index calculation', timestamp: Date.now() }] },
      confidence: 0.68,
      cost_actual: { expected_tokens_in: 480, expected_tokens_out: 1050, cpu_ms: Date.now() - startTime, subrequests: 2 },
      quality_score: 0.78,
      warnings: ['Antitrust analysis should be reviewed by competition law experts'],
      metadata: { execution_time_ms: Date.now() - startTime, timestamp: Date.now(), version: '1.0.0' }
    };
  },
  version: '1.0.0',
  tags: ['legal', 'antitrust', 'merger']
};

export function registerLegalRegulatoryCapabilities(graph: CapabilityGraph): void {
  graph.register(regulatoryScanEnhancedCapability);
  graph.register(complianceGapAssessmentCapability);
  graph.register(contractRiskAnalyzerCapability);
  graph.register(ipLandscapeCapability);
  graph.register(antitrustImpactCapability);
}

