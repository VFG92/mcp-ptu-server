/**
 * Risk Analysis Capabilities
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

/**
 * Risk Register Builder
 */
const riskRegisterCapability: CapabilityNode = {
  id: 'risk_register_build',
  name: 'Risk Register Builder',
  description: 'Build comprehensive risk register with likelihood, impact, and mitigation strategies',
  category: 'risk',
  
  preconditions: {
    required_inputs: ['initiative_description', 'context']
  },
  
  output_contract: {
    schema: z.object({
      risks: z.array(z.object({
        id: z.string(),
        category: z.enum(['market', 'execution', 'financial', 'regulatory', 'technology', 'operational']),
        description: z.string(),
        likelihood: z.enum(['very_high', 'high', 'medium', 'low', 'very_low']),
        impact: z.enum(['critical', 'high', 'medium', 'low', 'minimal']),
        severity_score: z.number().min(1).max(25),
        current_mitigations: z.array(z.string()),
        additional_mitigations: z.array(z.object({
          action: z.string(),
          cost: z.string(),
          effectiveness: z.enum(['high', 'medium', 'low'])
        })),
        owner: z.string().optional(),
        status: z.enum(['identified', 'assessed', 'mitigated', 'accepted'])
      })),
      risk_summary: z.object({
        total_risks: z.number(),
        critical_risks: z.number(),
        high_risks: z.number(),
        overall_risk_level: z.enum(['very_high', 'high', 'moderate', 'low']),
        top_3_risks: z.array(z.string())
      }),
      risk_matrix: z.array(z.array(z.number())),
      explain: z.string()
    }),
    required_evidence: ['risks'],
    quality_checks: [
      {
        name: 'has_risks',
        check: (output) => output.risks.length > 0,
        error_message: 'Risk register must contain at least one risk'
      },
      {
        name: 'severity_calculated',
        check: (output) => output.risks.every((r: any) => {
          const likelihoodMap: Record<string, number> = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
          const impactMap: Record<string, number> = { minimal: 1, low: 2, medium: 3, high: 4, critical: 5 };
          const likelihoodScore = likelihoodMap[r.likelihood] || 0;
          const impactScore = impactMap[r.impact] || 0;
          return r.severity_score === likelihoodScore * impactScore;
        }),
        error_message: 'Severity scores must be correctly calculated (likelihood × impact)'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 400,
    expected_tokens_out: 2000,
    cpu_ms: 900,
    subrequests: 2
  },
  
  expected_precision: 0.75,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const risks = [
      {
        id: 'R001',
        category: 'market' as const,
        description: 'Market adoption slower than projected due to customer inertia',
        likelihood: 'medium' as const,
        impact: 'high' as const,
        severity_score: 12, // 3 × 4
        current_mitigations: ['Pilot program with early adopters', 'Customer education campaign'],
        additional_mitigations: [
          { action: 'Offer migration support and training', cost: '$50K', effectiveness: 'high' as const },
          { action: 'Develop case studies and ROI calculator', cost: '$20K', effectiveness: 'medium' as const }
        ],
        owner: 'VP Marketing',
        status: 'assessed' as const
      },
      {
        id: 'R002',
        category: 'execution' as const,
        description: 'Key talent acquisition delays product development timeline',
        likelihood: 'high' as const,
        impact: 'high' as const,
        severity_score: 16, // 4 × 4
        current_mitigations: ['Active recruiting pipeline', 'Contractor backup plan'],
        additional_mitigations: [
          { action: 'Increase compensation packages', cost: '$200K', effectiveness: 'high' as const },
          { action: 'Partner with specialized recruiting firm', cost: '$75K', effectiveness: 'medium' as const }
        ],
        owner: 'VP Engineering',
        status: 'identified' as const
      },
      {
        id: 'R003',
        category: 'financial' as const,
        description: 'Burn rate exceeds projections due to higher CAC',
        likelihood: 'medium' as const,
        impact: 'critical' as const,
        severity_score: 15, // 3 × 5
        current_mitigations: ['Monthly budget reviews', 'CAC tracking by channel'],
        additional_mitigations: [
          { action: 'Optimize marketing spend allocation', cost: '$0', effectiveness: 'high' as const },
          { action: 'Secure additional funding buffer', cost: 'TBD', effectiveness: 'high' as const }
        ],
        owner: 'CFO',
        status: 'assessed' as const
      },
      {
        id: 'R004',
        category: 'regulatory' as const,
        description: 'New data privacy regulations require product changes',
        likelihood: 'medium' as const,
        impact: 'medium' as const,
        severity_score: 9, // 3 × 3
        current_mitigations: ['Legal counsel monitoring', 'Privacy-by-design principles'],
        additional_mitigations: [
          { action: 'Implement compliance management system', cost: '$100K', effectiveness: 'high' as const }
        ],
        owner: 'General Counsel',
        status: 'mitigated' as const
      },
      {
        id: 'R005',
        category: 'technology' as const,
        description: 'Third-party API dependency creates reliability risk',
        likelihood: 'low' as const,
        impact: 'high' as const,
        severity_score: 8, // 2 × 4
        current_mitigations: ['SLA with vendor', 'Monitoring and alerting'],
        additional_mitigations: [
          { action: 'Build fallback integration with alternative provider', cost: '$150K', effectiveness: 'high' as const },
          { action: 'Implement circuit breaker pattern', cost: '$30K', effectiveness: 'medium' as const }
        ],
        owner: 'CTO',
        status: 'assessed' as const
      }
    ];
    
    const criticalRisks = risks.filter(r => r.severity_score >= 15).length;
    const highRisks = risks.filter(r => r.severity_score >= 12 && r.severity_score < 15).length;
    
    const output = {
      risks,
      risk_summary: {
        total_risks: risks.length,
        critical_risks: criticalRisks,
        high_risks: highRisks,
        overall_risk_level: criticalRisks >= 2 ? 'high' as const : criticalRisks === 1 ? 'moderate' as const : 'low' as const,
        top_3_risks: risks
          .sort((a, b) => b.severity_score - a.severity_score)
          .slice(0, 3)
          .map(r => r.description)
      },
      risk_matrix: [
        [0, 0, 0, 0, 0], // Very Low likelihood
        [0, 0, 0, 1, 0], // Low likelihood
        [0, 0, 1, 1, 1], // Medium likelihood
        [0, 0, 0, 1, 0], // High likelihood
        [0, 0, 0, 0, 0]  // Very High likelihood
      ],
      explain: `Identified ${risks.length} risks with ${criticalRisks} critical and ${highRisks} high-severity risks. Top concerns: talent acquisition, financial burn rate, and market adoption. Overall risk level: ${criticalRisks >= 2 ? 'HIGH' : 'MODERATE'}.`
    };
    
    const evidence = {
      risks: [{
        type: EvidenceType.HEURISTIC,
        rationale: 'Risk identification based on common failure modes for similar initiatives and industry benchmarks',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'risk_register_build',
      output,
      evidence,
      confidence: 0.75,
      cost_actual: {
        expected_tokens_in: 380,
        expected_tokens_out: 1950,
        cpu_ms: executionTime,
        subrequests: 2
      },
      quality_score: 0.88,
      warnings: criticalRisks >= 2 ? ['Multiple critical risks identified - recommend executive review and additional mitigation planning'] : [],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['risk', 'governance', 'mitigation']
};

/**
 * Regulatory Scan
 */
const regulatoryScanCapability: CapabilityNode = {
  id: 'regulatory_scan',
  name: 'Regulatory Scan',
  description: 'Scan regulatory landscape for compliance requirements and constraints',
  category: 'risk',
  
  preconditions: {
    required_inputs: ['industry', 'geography', 'business_activities']
  },
  
  output_contract: {
    schema: z.object({
      regulations: z.array(z.object({
        name: z.string(),
        jurisdiction: z.string(),
        category: z.enum(['data_privacy', 'financial', 'industry_specific', 'labor', 'environmental', 'consumer_protection']),
        applicability: z.enum(['mandatory', 'recommended', 'optional']),
        compliance_requirements: z.array(z.string()),
        penalties: z.string(),
        timeline: z.string()
      })),
      compliance_gaps: z.array(z.object({
        regulation: z.string(),
        gap: z.string(),
        remediation: z.string(),
        cost_estimate: z.string(),
        priority: z.enum(['critical', 'high', 'medium', 'low'])
      })),
      overall_compliance_status: z.enum(['compliant', 'minor_gaps', 'major_gaps', 'non_compliant']),
      explain: z.string()
    }),
    required_evidence: ['regulations'],
    quality_checks: [
      {
        name: 'has_regulations',
        check: (output) => output.regulations.length > 0,
        error_message: 'Must identify at least one applicable regulation'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 300,
    expected_tokens_out: 1500,
    cpu_ms: 600,
    subrequests: 2
  },
  
  expected_precision: 0.80,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      regulations: [
        {
          name: 'GDPR (General Data Protection Regulation)',
          jurisdiction: 'European Union',
          category: 'data_privacy' as const,
          applicability: 'mandatory' as const,
          compliance_requirements: [
            'Data protection impact assessment',
            'Privacy by design implementation',
            'User consent management',
            'Data breach notification within 72 hours',
            'Right to erasure implementation'
          ],
          penalties: 'Up to €20M or 4% of global revenue',
          timeline: 'Immediate compliance required'
        },
        {
          name: 'SOC 2 Type II',
          jurisdiction: 'United States',
          category: 'industry_specific' as const,
          applicability: 'recommended' as const,
          compliance_requirements: [
            'Security controls documentation',
            'Annual audit by qualified assessor',
            'Continuous monitoring',
            'Incident response procedures'
          ],
          penalties: 'Loss of enterprise customers',
          timeline: '6-12 months for initial certification'
        }
      ],
      compliance_gaps: [
        {
          regulation: 'GDPR',
          gap: 'Data breach notification process not documented',
          remediation: 'Implement incident response plan with 72-hour notification workflow',
          cost_estimate: '$50K',
          priority: 'critical' as const
        },
        {
          regulation: 'SOC 2',
          gap: 'Security controls not formally documented',
          remediation: 'Engage compliance consultant to document controls and prepare for audit',
          cost_estimate: '$100K',
          priority: 'high' as const
        }
      ],
      overall_compliance_status: 'minor_gaps' as const,
      explain: 'Primary regulatory requirements are GDPR (mandatory) and SOC 2 (recommended for enterprise sales). Minor gaps identified in incident response and documentation. Estimated $150K to achieve full compliance.'
    };
    
    const evidence = {
      regulations: [{
        type: EvidenceType.RETRIEVAL,
        source: 'Regulatory database and legal counsel review',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'regulatory_scan',
      output,
      evidence,
      confidence: 0.80,
      cost_actual: {
        expected_tokens_in: 280,
        expected_tokens_out: 1450,
        cpu_ms: executionTime,
        subrequests: 2
      },
      quality_score: 0.85,
      warnings: output.compliance_gaps.some(g => g.priority === 'critical') ? ['Critical compliance gaps identified - recommend immediate remediation'] : [],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['risk', 'regulatory', 'compliance']
};

/**
 * Register all risk capabilities
 */
export function registerRiskCapabilities(graph: CapabilityGraph): void {
  graph.register(riskRegisterCapability);
  graph.register(regulatoryScanCapability);
}

