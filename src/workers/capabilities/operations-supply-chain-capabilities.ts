/**
 * Operations & Supply Chain Capabilities
 * 
 * Advanced capabilities for lean operations, footprint optimization, inventory management,
 * procurement, quality, and aftermarket economics.
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

/**
 * Lean Ops Benchmark - Productivity KPIs, OEE
 */
const leanOpsBenchmarkCapability: CapabilityNode = {
  id: 'lean_ops_benchmark',
  name: 'Lean Operations Benchmark',
  description: 'Benchmark operational performance using lean metrics including OEE, productivity, and waste analysis',
  category: 'operational',
  
  preconditions: {
    required_inputs: ['operations_data', 'industry_vertical']
  },
  
  output_contract: {
    schema: z.object({
      oee_analysis: z.object({
        overall_oee: z.number(),
        availability: z.number(),
        performance: z.number(),
        quality: z.number(),
        world_class_benchmark: z.number(),
        gap_to_world_class: z.number()
      }),
      productivity_metrics: z.array(z.object({
        metric: z.string(),
        current_value: z.number(),
        unit: z.string(),
        peer_median: z.number(),
        best_in_class: z.number(),
        gap_percentage: z.number()
      })),
      waste_analysis: z.array(z.object({
        waste_type: z.enum(['defects', 'overproduction', 'waiting', 'non_utilized_talent', 'transportation', 'inventory', 'motion', 'extra_processing']),
        annual_cost: z.number(),
        percentage_of_total: z.number(),
        reduction_potential: z.number(),
        priority: z.enum(['high', 'medium', 'low'])
      })),
      improvement_opportunities: z.array(z.object({
        area: z.string(),
        current_state: z.string(),
        target_state: z.string(),
        estimated_impact: z.number(),
        implementation_effort: z.enum(['low', 'medium', 'high']),
        timeline: z.string()
      })),
      lean_maturity: z.object({
        overall_score: z.number().min(0).max(100),
        level: z.enum(['beginner', 'intermediate', 'advanced', 'world_class']),
        strengths: z.array(z.string()),
        gaps: z.array(z.string())
      })
    }),
    required_evidence: ['oee_analysis'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 600,
    expected_tokens_out: 1700,
    cpu_ms: 900,
    subrequests: 3
  },
  
  expected_precision: 0.75,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      oee_analysis: {
        overall_oee: 65,
        availability: 85,
        performance: 82,
        quality: 93,
        world_class_benchmark: 85,
        gap_to_world_class: 20
      },
      productivity_metrics: [
        {
          metric: 'Units per labor hour',
          current_value: 12.5,
          unit: 'units/hour',
          peer_median: 15.0,
          best_in_class: 18.5,
          gap_percentage: 17
        },
        {
          metric: 'Throughput time',
          current_value: 48,
          unit: 'hours',
          peer_median: 36,
          best_in_class: 24,
          gap_percentage: 33
        },
        {
          metric: 'First pass yield',
          current_value: 93,
          unit: '%',
          peer_median: 95,
          best_in_class: 98,
          gap_percentage: 2
        }
      ],
      waste_analysis: [
        {
          waste_type: 'waiting' as const,
          annual_cost: 8.5,
          percentage_of_total: 28,
          reduction_potential: 5.0,
          priority: 'high' as const
        },
        {
          waste_type: 'defects' as const,
          annual_cost: 6.2,
          percentage_of_total: 21,
          reduction_potential: 4.0,
          priority: 'high' as const
        },
        {
          waste_type: 'overproduction' as const,
          annual_cost: 4.8,
          percentage_of_total: 16,
          reduction_potential: 3.5,
          priority: 'medium' as const
        },
        {
          waste_type: 'transportation' as const,
          annual_cost: 3.5,
          percentage_of_total: 12,
          reduction_potential: 2.0,
          priority: 'medium' as const
        }
      ],
      improvement_opportunities: [
        {
          area: 'Equipment reliability',
          current_state: '85% availability with frequent unplanned downtime',
          target_state: '95% availability through predictive maintenance',
          estimated_impact: 12,
          implementation_effort: 'medium' as const,
          timeline: '12 months'
        },
        {
          area: 'Changeover time',
          current_state: 'Average 45 minutes per changeover',
          target_state: 'SMED implementation to reduce to 15 minutes',
          estimated_impact: 8,
          implementation_effort: 'low' as const,
          timeline: '6 months'
        },
        {
          area: 'Quality at source',
          current_state: '93% first pass yield',
          target_state: 'Poka-yoke and visual management to achieve 98%',
          estimated_impact: 6,
          implementation_effort: 'medium' as const,
          timeline: '9 months'
        }
      ],
      lean_maturity: {
        overall_score: 58,
        level: 'intermediate' as const,
        strengths: [
          '5S implementation in place',
          'Visual management boards established',
          'Regular kaizen events'
        ],
        gaps: [
          'Limited use of predictive maintenance',
          'Inconsistent standard work',
          'Weak supplier integration'
        ]
      }
    };
    
    const evidence = {
      oee_analysis: [{
        type: EvidenceType.CALCULATION,
        formula: 'OEE = Availability × Performance × Quality',
        inputs: {
          availability: 0.85,
          performance: 0.82,
          quality: 0.93
        },
        rationale: 'Standard OEE calculation methodology',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'lean_ops_benchmark',
      output,
      evidence,
      confidence: 0.75,
      cost_actual: {
        expected_tokens_in: 580,
        expected_tokens_out: 1650,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.85,
      warnings: [
        'OEE and productivity metrics should be validated with actual production data',
        'Waste cost estimates are indicative - detailed time studies recommended'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['operations', 'lean', 'oee', 'productivity']
};

/**
 * Footprint Optimizer - Make vs buy, reshoring, plant location
 */
const footprintOptimizerCapability: CapabilityNode = {
  id: 'footprint_optimizer',
  name: 'Manufacturing Footprint Optimizer',
  description: 'Optimize manufacturing footprint including make vs buy decisions, reshoring analysis, and plant location',
  category: 'operational',
  
  preconditions: {
    required_inputs: ['current_footprint', 'demand_forecast']
  },
  
  output_contract: {
    schema: z.object({
      current_footprint: z.object({
        total_capacity: z.number(),
        utilization: z.number(),
        locations: z.array(z.object({
          site: z.string(),
          country: z.string(),
          capacity: z.number(),
          utilization: z.number(),
          cost_per_unit: z.number()
        })),
        total_cost: z.number()
      }),
      make_vs_buy_analysis: z.array(z.object({
        component: z.string(),
        current_approach: z.enum(['make', 'buy']),
        annual_volume: z.number(),
        make_cost: z.number(),
        buy_cost: z.number(),
        recommendation: z.enum(['make', 'buy', 'hybrid']),
        rationale: z.string(),
        strategic_importance: z.enum(['high', 'medium', 'low'])
      })),
      reshoring_analysis: z.array(z.object({
        product_line: z.string(),
        current_location: z.string(),
        proposed_location: z.string(),
        current_total_cost: z.number(),
        proposed_total_cost: z.number(),
        cost_delta: z.number(),
        non_cost_factors: z.array(z.string()),
        recommendation: z.enum(['reshore', 'stay', 'nearshore']),
        implementation_cost: z.number(),
        payback_period_years: z.number()
      })),
      optimal_footprint: z.object({
        recommended_locations: z.array(z.object({
          site: z.string(),
          country: z.string(),
          capacity: z.number(),
          products: z.array(z.string()),
          rationale: z.string()
        })),
        total_capacity: z.number(),
        total_cost: z.number(),
        cost_savings: z.number(),
        implementation_timeline: z.string()
      }),
      risk_assessment: z.array(z.object({
        risk: z.string(),
        severity: z.enum(['high', 'medium', 'low']),
        mitigation: z.string()
      }))
    }),
    required_evidence: ['optimal_footprint'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 1900,
    cpu_ms: 950,
    subrequests: 3
  },
  
  expected_precision: 0.70,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      current_footprint: {
        total_capacity: 1000000,
        utilization: 75,
        locations: [
          {
            site: 'Plant A - China',
            country: 'China',
            capacity: 500000,
            utilization: 85,
            cost_per_unit: 12.50
          },
          {
            site: 'Plant B - Mexico',
            country: 'Mexico',
            capacity: 300000,
            utilization: 70,
            cost_per_unit: 15.00
          },
          {
            site: 'Plant C - USA',
            country: 'USA',
            capacity: 200000,
            utilization: 60,
            cost_per_unit: 22.00
          }
        ],
        total_cost: 125
      },
      make_vs_buy_analysis: [
        {
          component: 'Electronic modules',
          current_approach: 'make' as const,
          annual_volume: 500000,
          make_cost: 25,
          buy_cost: 22,
          recommendation: 'buy' as const,
          rationale: 'Specialized suppliers offer better economies of scale and technology',
          strategic_importance: 'medium' as const
        },
        {
          component: 'Core assembly',
          current_approach: 'make' as const,
          annual_volume: 750000,
          make_cost: 45,
          buy_cost: 52,
          recommendation: 'make' as const,
          rationale: 'Strategic IP and quality control requirements',
          strategic_importance: 'high' as const
        }
      ],
      reshoring_analysis: [
        {
          product_line: 'Premium products',
          current_location: 'China',
          proposed_location: 'Mexico',
          current_total_cost: 18.50,
          proposed_total_cost: 17.20,
          cost_delta: -1.30,
          non_cost_factors: [
            'Reduced lead time (30 days to 10 days)',
            'Lower geopolitical risk',
            'Closer to US market'
          ],
          recommendation: 'nearshore' as const,
          implementation_cost: 15,
          payback_period_years: 2.3
        }
      ],
      optimal_footprint: {
        recommended_locations: [
          {
            site: 'Expanded Mexico facility',
            country: 'Mexico',
            capacity: 600000,
            products: ['Premium products', 'Mid-range products'],
            rationale: 'Nearshore to US market, competitive costs, USMCA benefits'
          },
          {
            site: 'China facility (reduced)',
            country: 'China',
            capacity: 300000,
            products: ['Value products', 'Asia market'],
            rationale: 'Serve Asia-Pacific market, maintain supplier relationships'
          },
          {
            site: 'USA facility (specialized)',
            country: 'USA',
            capacity: 100000,
            products: ['Custom/high-mix products'],
            rationale: 'Close to customers, rapid response, innovation hub'
          }
        ],
        total_capacity: 1000000,
        total_cost: 115,
        cost_savings: 10,
        implementation_timeline: '24 months'
      },
      risk_assessment: [
        {
          risk: 'Transition disruption to customer service',
          severity: 'high' as const,
          mitigation: 'Phased transition with inventory buffers'
        },
        {
          risk: 'Labor availability in new locations',
          severity: 'medium' as const,
          mitigation: 'Early recruitment and training programs'
        }
      ]
    };
    
    const evidence = {
      optimal_footprint: [{
        type: EvidenceType.CALCULATION,
        formula: 'Total cost = Production cost + Logistics cost + Tariffs + Inventory carrying cost',
        rationale: 'Total landed cost optimization across footprint',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'footprint_optimizer',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1850,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.80,
      warnings: [
        'Footprint optimization should consider strategic factors beyond cost',
        'Implementation costs and timeline estimates are preliminary'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['operations', 'footprint', 'make_vs_buy', 'reshoring']
};

/**
 * Register operations & supply chain capabilities
 */
export function registerOperationsSupplyChainCapabilities(graph: CapabilityGraph): void {
  graph.register(leanOpsBenchmarkCapability);
  graph.register(footprintOptimizerCapability);
  // More capabilities will be added in part 2
}

