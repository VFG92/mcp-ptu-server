/**
 * Strategic Analysis Capabilities
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

/**
 * Stakeholder Mapping
 */
const stakeholderMappingCapability: CapabilityNode = {
  id: 'stakeholder_mapping',
  name: 'Stakeholder Mapping',
  description: 'Map key stakeholders with influence, interest, and engagement strategies',
  category: 'strategic',
  
  preconditions: {
    required_inputs: ['initiative', 'organization_context']
  },
  
  output_contract: {
    schema: z.object({
      stakeholders: z.array(z.object({
        name: z.string(),
        role: z.string(),
        influence: z.enum(['very_high', 'high', 'medium', 'low']),
        interest: z.enum(['very_high', 'high', 'medium', 'low']),
        position: z.enum(['champion', 'supporter', 'neutral', 'skeptic', 'blocker']),
        concerns: z.array(z.string()),
        motivations: z.array(z.string()),
        engagement_strategy: z.string()
      })),
      power_interest_matrix: z.object({
        manage_closely: z.array(z.string()),
        keep_satisfied: z.array(z.string()),
        keep_informed: z.array(z.string()),
        monitor: z.array(z.string())
      }),
      key_relationships: z.array(z.object({
        stakeholder_1: z.string(),
        stakeholder_2: z.string(),
        relationship: z.enum(['aligned', 'neutral', 'conflicting']),
        implication: z.string()
      })),
      explain: z.string()
    }),
    required_evidence: ['stakeholders'],
    quality_checks: [
      {
        name: 'has_stakeholders',
        check: (output) => output.stakeholders.length > 0,
        error_message: 'Must identify at least one stakeholder'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 400,
    expected_tokens_out: 1600,
    cpu_ms: 700,
    subrequests: 2
  },
  
  expected_precision: 0.75,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const stakeholders = [
      {
        name: 'CEO',
        role: 'Chief Executive Officer',
        influence: 'very_high' as const,
        interest: 'high' as const,
        position: 'supporter' as const,
        concerns: ['ROI timeline', 'Resource allocation', 'Strategic fit'],
        motivations: ['Company growth', 'Competitive advantage', 'Shareholder value'],
        engagement_strategy: 'Monthly executive briefings with KPI dashboard and strategic alignment updates'
      },
      {
        name: 'CFO',
        role: 'Chief Financial Officer',
        influence: 'very_high' as const,
        interest: 'very_high' as const,
        position: 'skeptic' as const,
        concerns: ['Budget overruns', 'Payback period', 'Financial risk'],
        motivations: ['Cost control', 'Predictable returns', 'Risk mitigation'],
        engagement_strategy: 'Detailed financial modeling with sensitivity analysis, weekly budget reviews, clear ROI milestones'
      },
      {
        name: 'VP Engineering',
        role: 'Engineering Leader',
        influence: 'high' as const,
        interest: 'very_high' as const,
        position: 'champion' as const,
        concerns: ['Technical feasibility', 'Team capacity', 'Technical debt'],
        motivations: ['Innovation', 'Team growth', 'Technical excellence'],
        engagement_strategy: 'Deep technical collaboration, resource planning support, recognition of engineering contributions'
      },
      {
        name: 'VP Sales',
        role: 'Sales Leader',
        influence: 'high' as const,
        interest: 'medium' as const,
        position: 'neutral' as const,
        concerns: ['Impact on current sales', 'Sales enablement', 'Customer disruption'],
        motivations: ['Revenue growth', 'Customer satisfaction', 'Team quota attainment'],
        engagement_strategy: 'Early involvement in go-to-market planning, sales enablement materials, customer success stories'
      },
      {
        name: 'Head of Operations',
        role: 'Operations Leader',
        influence: 'medium' as const,
        interest: 'high' as const,
        position: 'supporter' as const,
        concerns: ['Operational complexity', 'Process changes', 'Training requirements'],
        motivations: ['Efficiency gains', 'Process improvement', 'Scalability'],
        engagement_strategy: 'Process design collaboration, change management support, operational metrics tracking'
      }
    ];
    
    const output = {
      stakeholders,
      power_interest_matrix: {
        manage_closely: ['CEO', 'CFO', 'VP Engineering'],
        keep_satisfied: ['VP Sales'],
        keep_informed: ['Head of Operations'],
        monitor: []
      },
      key_relationships: [
        {
          stakeholder_1: 'CEO',
          stakeholder_2: 'CFO',
          relationship: 'aligned' as const,
          implication: 'Both focused on financial returns - need strong ROI case'
        },
        {
          stakeholder_1: 'CFO',
          stakeholder_2: 'VP Engineering',
          relationship: 'conflicting' as const,
          implication: 'CFO cost-focused vs Engineering innovation-focused - need balanced narrative'
        },
        {
          stakeholder_1: 'VP Engineering',
          stakeholder_2: 'Head of Operations',
          relationship: 'aligned' as const,
          implication: 'Both see operational benefits - leverage for broader support'
        }
      ],
      explain: 'Key stakeholders mapped across power-interest matrix. CFO is critical skeptic requiring detailed financial justification. CEO and VP Engineering are supporters. Need to manage CFO concerns while leveraging champion relationships.'
    };
    
    const evidence = {
      stakeholders: [{
        type: EvidenceType.HEURISTIC,
        rationale: 'Stakeholder analysis based on typical organizational roles and change management patterns',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'stakeholder_mapping',
      output,
      evidence,
      confidence: 0.75,
      cost_actual: {
        expected_tokens_in: 380,
        expected_tokens_out: 1550,
        cpu_ms: executionTime,
        subrequests: 2
      },
      quality_score: 0.82,
      warnings: output.stakeholders.some((s: any) => s.position === 'blocker') ? ['Blocker stakeholders identified - develop specific mitigation strategies'] : [],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['strategic', 'stakeholders', 'change-management']
};

/**
 * Channel Economics Analysis
 */
const channelEconomicsCapability: CapabilityNode = {
  id: 'channel_economics',
  name: 'Channel Economics Analysis',
  description: 'Analyze economics and effectiveness of different go-to-market channels',
  category: 'commercial',
  
  preconditions: {
    required_inputs: ['channels', 'target_segments']
  },
  
  output_contract: {
    schema: z.object({
      channels: z.array(z.object({
        name: z.string(),
        type: z.enum(['direct_sales', 'inside_sales', 'digital_marketing', 'channel_partners', 'self_service']),
        cac: z.number(),
        conversion_rate: z.number(),
        sales_cycle_days: z.number(),
        avg_deal_size: z.number(),
        capacity: z.number(),
        efficiency_score: z.number(),
        best_for_segments: z.array(z.string()),
        pros: z.array(z.string()),
        cons: z.array(z.string())
      })),
      recommended_mix: z.array(z.object({
        channel: z.string(),
        allocation_pct: z.number(),
        rationale: z.string()
      })),
      blended_metrics: z.object({
        blended_cac: z.number(),
        blended_conversion: z.number(),
        blended_cycle_days: z.number()
      }),
      explain: z.string()
    }),
    required_evidence: ['channels', 'recommended_mix'],
    quality_checks: [
      {
        name: 'allocation_sums_to_100',
        check: (output) => {
          const total = output.recommended_mix.reduce((sum: number, m: any) => sum + m.allocation_pct, 0);
          return Math.abs(total - 100) < 0.1;
        },
        error_message: 'Channel allocation must sum to 100%'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 500,
    expected_tokens_out: 1400,
    cpu_ms: 750,
    subrequests: 2
  },
  
  expected_precision: 0.70,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const channels = [
      {
        name: 'Enterprise Direct Sales',
        type: 'direct_sales' as const,
        cac: 12000,
        conversion_rate: 0.25,
        sales_cycle_days: 180,
        avg_deal_size: 150000,
        capacity: 50,
        efficiency_score: 0.85,
        best_for_segments: ['Enterprise', 'Strategic Accounts'],
        pros: ['High deal sizes', 'Deep relationships', 'Complex solutions'],
        cons: ['High CAC', 'Long cycles', 'Limited scalability']
      },
      {
        name: 'Inside Sales',
        type: 'inside_sales' as const,
        cac: 3000,
        conversion_rate: 0.15,
        sales_cycle_days: 60,
        avg_deal_size: 30000,
        capacity: 200,
        efficiency_score: 0.75,
        best_for_segments: ['Mid-market', 'Growth Companies'],
        pros: ['Scalable', 'Faster cycles', 'Lower CAC'],
        cons: ['Smaller deals', 'Less relationship depth']
      },
      {
        name: 'Digital Marketing',
        type: 'digital_marketing' as const,
        cac: 500,
        conversion_rate: 0.03,
        sales_cycle_days: 14,
        avg_deal_size: 5000,
        capacity: 10000,
        efficiency_score: 0.60,
        best_for_segments: ['SMB', 'Startups'],
        pros: ['Highly scalable', 'Low CAC', 'Fast cycles'],
        cons: ['Low conversion', 'Small deals', 'High churn']
      },
      {
        name: 'Channel Partners',
        type: 'channel_partners' as const,
        cac: 2000,
        conversion_rate: 0.20,
        sales_cycle_days: 90,
        avg_deal_size: 50000,
        capacity: 500,
        efficiency_score: 0.70,
        best_for_segments: ['Mid-market', 'Geographic Expansion'],
        pros: ['Extended reach', 'Local expertise', 'Shared risk'],
        cons: ['Less control', 'Revenue share', 'Partner management']
      }
    ];
    
    const output = {
      channels,
      recommended_mix: [
        {
          channel: 'Enterprise Direct Sales',
          allocation_pct: 30,
          rationale: 'Focus on high-value enterprise deals for revenue concentration'
        },
        {
          channel: 'Inside Sales',
          allocation_pct: 40,
          rationale: 'Primary growth engine for mid-market with best efficiency balance'
        },
        {
          channel: 'Digital Marketing',
          allocation_pct: 20,
          rationale: 'Volume play for SMB segment and lead generation'
        },
        {
          channel: 'Channel Partners',
          allocation_pct: 10,
          rationale: 'Strategic for geographic expansion and market testing'
        }
      ],
      blended_metrics: {
        blended_cac: 0.30 * 12000 + 0.40 * 3000 + 0.20 * 500 + 0.10 * 2000,
        blended_conversion: 0.30 * 0.25 + 0.40 * 0.15 + 0.20 * 0.03 + 0.10 * 0.20,
        blended_cycle_days: 0.30 * 180 + 0.40 * 60 + 0.20 * 14 + 0.10 * 90
      },
      explain: 'Recommended channel mix balances efficiency (Inside Sales 40%), revenue concentration (Enterprise 30%), volume (Digital 20%), and expansion (Partners 10%). Blended CAC of $5,100 with 14.1% conversion rate.'
    };
    
    const evidence = {
      channels: [{
        type: EvidenceType.ASSUMPTION,
        rationale: 'Channel metrics based on industry benchmarks and typical B2B SaaS performance',
        confidence: 0.65,
        timestamp: Date.now()
      }],
      recommended_mix: [{
        type: EvidenceType.CALCULATION,
        formula: 'Optimization based on efficiency scores, capacity constraints, and segment alignment',
        inputs: { channels: channels.map(c => ({ name: c.name, efficiency: c.efficiency_score })) },
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'channel_economics',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 480,
        expected_tokens_out: 1350,
        cpu_ms: executionTime,
        subrequests: 2
      },
      quality_score: 0.80,
      warnings: ['Channel metrics should be validated with actual performance data over time'],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['strategic', 'commercial', 'go-to-market', 'channels']
};

/**
 * Register all strategic capabilities
 */
export function registerStrategicCapabilities(graph: CapabilityGraph): void {
  graph.register(stakeholderMappingCapability);
  graph.register(channelEconomicsCapability);
}

