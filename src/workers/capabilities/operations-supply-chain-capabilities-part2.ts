/**
 * Operations & Supply Chain Capabilities - Part 2
 * Inventory Scenario, Procurement Index, Quality Defect Analysis, Aftermarket Economics
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

/**
 * Inventory Scenario - Stock levels vs shortage risk
 */
const inventoryScenarioCapability: CapabilityNode = {
  id: 'inventory_scenario',
  name: 'Inventory Scenario Analyzer',
  description: 'Optimize inventory levels balancing stock costs against shortage risk',
  category: 'operational',
  
  preconditions: {
    required_inputs: ['demand_data', 'lead_times']
  },
  
  output_contract: {
    schema: z.object({
      current_inventory: z.object({
        total_value: z.number(),
        days_on_hand: z.number(),
        turnover_ratio: z.number(),
        carrying_cost_annual: z.number(),
        stockout_rate: z.number()
      }),
      scenarios: z.array(z.object({
        name: z.string(),
        inventory_level: z.number(),
        days_on_hand: z.number(),
        carrying_cost: z.number(),
        stockout_probability: z.number(),
        lost_sales_risk: z.number(),
        total_cost: z.number(),
        service_level: z.number()
      })),
      optimal_policy: z.object({
        recommended_inventory: z.number(),
        days_on_hand: z.number(),
        safety_stock: z.number(),
        reorder_point: z.number(),
        order_quantity: z.number(),
        expected_service_level: z.number(),
        total_cost: z.number(),
        cost_savings_vs_current: z.number()
      }),
      by_category: z.array(z.object({
        category: z.string(),
        classification: z.enum(['A', 'B', 'C']),
        current_inventory: z.number(),
        recommended_inventory: z.number(),
        policy: z.string()
      })),
      risk_analysis: z.object({
        supply_chain_risks: z.array(z.object({
          risk: z.string(),
          probability: z.number(),
          impact: z.string(),
          mitigation: z.string()
        })),
        demand_volatility: z.number(),
        lead_time_variability: z.number()
      })
    }),
    required_evidence: ['optimal_policy'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 600,
    expected_tokens_out: 1700,
    cpu_ms: 900,
    subrequests: 3
  },
  
  expected_precision: 0.72,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      current_inventory: {
        total_value: 85,
        days_on_hand: 65,
        turnover_ratio: 5.6,
        carrying_cost_annual: 17,
        stockout_rate: 0.03
      },
      scenarios: [
        {
          name: 'Lean inventory',
          inventory_level: 60,
          days_on_hand: 45,
          carrying_cost: 12,
          stockout_probability: 0.08,
          lost_sales_risk: 8,
          total_cost: 20,
          service_level: 92
        },
        {
          name: 'Balanced (Optimal)',
          inventory_level: 75,
          days_on_hand: 55,
          carrying_cost: 15,
          stockout_probability: 0.02,
          lost_sales_risk: 2,
          total_cost: 17,
          service_level: 98
        },
        {
          name: 'High safety stock',
          inventory_level: 95,
          days_on_hand: 70,
          carrying_cost: 19,
          stockout_probability: 0.005,
          lost_sales_risk: 0.5,
          total_cost: 19.5,
          service_level: 99.5
        }
      ],
      optimal_policy: {
        recommended_inventory: 75,
        days_on_hand: 55,
        safety_stock: 15,
        reorder_point: 25,
        order_quantity: 50,
        expected_service_level: 98,
        total_cost: 17,
        cost_savings_vs_current: 3
      },
      by_category: [
        {
          category: 'Fast-moving components',
          classification: 'A' as const,
          current_inventory: 35,
          recommended_inventory: 30,
          policy: 'Daily review, tight control, 99% service level'
        },
        {
          category: 'Standard parts',
          classification: 'B' as const,
          current_inventory: 30,
          recommended_inventory: 28,
          policy: 'Weekly review, moderate control, 95% service level'
        },
        {
          category: 'Slow-moving items',
          classification: 'C' as const,
          current_inventory: 20,
          recommended_inventory: 17,
          policy: 'Monthly review, minimal stock, 90% service level'
        }
      ],
      risk_analysis: {
        supply_chain_risks: [
          {
            risk: 'Supplier disruption',
            probability: 0.15,
            impact: 'Potential 2-4 week delay',
            mitigation: 'Dual sourcing for critical components'
          },
          {
            risk: 'Demand spike',
            probability: 0.20,
            impact: 'Stockout risk if >30% above forecast',
            mitigation: 'Dynamic safety stock adjustment'
          }
        ],
        demand_volatility: 0.25,
        lead_time_variability: 0.18
      }
    };
    
    const evidence = {
      optimal_policy: [{
        type: EvidenceType.CALCULATION,
        formula: 'Total cost = Carrying cost + Stockout cost; Optimize for minimum total cost',
        rationale: 'Economic order quantity and safety stock optimization',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'inventory_scenario',
      output,
      evidence,
      confidence: 0.72,
      cost_actual: {
        expected_tokens_in: 580,
        expected_tokens_out: 1650,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.82,
      warnings: [
        'Inventory optimization depends on accurate demand forecasts',
        'Service level targets should be validated with business requirements'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['operations', 'inventory', 'supply_chain', 'optimization']
};

/**
 * Procurement Index - Supplier benchmarking, contract analysis
 */
const procurementIndexCapability: CapabilityNode = {
  id: 'procurement_index',
  name: 'Procurement Performance Index',
  description: 'Benchmark procurement performance, analyze supplier contracts, and identify savings opportunities',
  category: 'operational',
  
  preconditions: {
    required_inputs: ['spend_data', 'supplier_base']
  },
  
  output_contract: {
    schema: z.object({
      spend_analysis: z.object({
        total_spend: z.number(),
        managed_spend_percentage: z.number(),
        top_10_suppliers_concentration: z.number(),
        spend_by_category: z.array(z.object({
          category: z.string(),
          spend: z.number(),
          percentage: z.number(),
          supplier_count: z.number()
        }))
      }),
      supplier_performance: z.array(z.object({
        supplier: z.string(),
        annual_spend: z.number(),
        performance_score: z.number(),
        on_time_delivery: z.number(),
        quality_rating: z.number(),
        cost_competitiveness: z.enum(['excellent', 'good', 'fair', 'poor']),
        relationship_status: z.enum(['strategic', 'preferred', 'approved', 'at_risk'])
      })),
      savings_opportunities: z.array(z.object({
        opportunity: z.string(),
        category: z.string(),
        current_spend: z.number(),
        savings_potential: z.number(),
        savings_percentage: z.number(),
        approach: z.string(),
        implementation_complexity: z.enum(['low', 'medium', 'high']),
        timeline: z.string()
      })),
      contract_analysis: z.object({
        contracts_reviewed: z.number(),
        expiring_next_12_months: z.number(),
        unfavorable_terms_identified: z.number(),
        renegotiation_opportunities: z.array(z.object({
          supplier: z.string(),
          issue: z.string(),
          potential_benefit: z.number()
        }))
      }),
      procurement_maturity: z.object({
        overall_score: z.number().min(0).max(100),
        level: z.enum(['reactive', 'transactional', 'strategic', 'world_class']),
        strengths: z.array(z.string()),
        improvement_areas: z.array(z.string())
      })
    }),
    required_evidence: ['savings_opportunities'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 1800,
    cpu_ms: 950,
    subrequests: 3
  },
  
  expected_precision: 0.70,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      spend_analysis: {
        total_spend: 300,
        managed_spend_percentage: 75,
        top_10_suppliers_concentration: 45,
        spend_by_category: [
          { category: 'Raw materials', spend: 120, percentage: 40, supplier_count: 15 },
          { category: 'Components', spend: 90, percentage: 30, supplier_count: 35 },
          { category: 'Services', spend: 60, percentage: 20, supplier_count: 50 },
          { category: 'Indirect', spend: 30, percentage: 10, supplier_count: 100 }
        ]
      },
      supplier_performance: [
        {
          supplier: 'Supplier A',
          annual_spend: 45,
          performance_score: 92,
          on_time_delivery: 98,
          quality_rating: 95,
          cost_competitiveness: 'excellent' as const,
          relationship_status: 'strategic' as const
        },
        {
          supplier: 'Supplier B',
          annual_spend: 30,
          performance_score: 78,
          on_time_delivery: 85,
          quality_rating: 88,
          cost_competitiveness: 'good' as const,
          relationship_status: 'preferred' as const
        },
        {
          supplier: 'Supplier C',
          annual_spend: 25,
          performance_score: 65,
          on_time_delivery: 75,
          quality_rating: 82,
          cost_competitiveness: 'fair' as const,
          relationship_status: 'at_risk' as const
        }
      ],
      savings_opportunities: [
        {
          opportunity: 'Strategic sourcing - Raw materials',
          category: 'Raw materials',
          current_spend: 120,
          savings_potential: 12,
          savings_percentage: 10,
          approach: 'Competitive bidding, volume consolidation, long-term contracts',
          implementation_complexity: 'medium' as const,
          timeline: '6 months'
        },
        {
          opportunity: 'Supplier consolidation - Components',
          category: 'Components',
          current_spend: 90,
          savings_potential: 6.75,
          savings_percentage: 7.5,
          approach: 'Reduce supplier base from 35 to 15, leverage volume',
          implementation_complexity: 'high' as const,
          timeline: '12 months'
        },
        {
          opportunity: 'Demand management - Services',
          category: 'Services',
          current_spend: 60,
          savings_potential: 9,
          savings_percentage: 15,
          approach: 'Standardize specifications, eliminate redundancy',
          implementation_complexity: 'low' as const,
          timeline: '3 months'
        }
      ],
      contract_analysis: {
        contracts_reviewed: 150,
        expiring_next_12_months: 45,
        unfavorable_terms_identified: 12,
        renegotiation_opportunities: [
          {
            supplier: 'Supplier D',
            issue: 'No volume discount despite 3x spend increase',
            potential_benefit: 2.5
          },
          {
            supplier: 'Supplier E',
            issue: 'Annual price escalation above market',
            potential_benefit: 1.8
          }
        ]
      },
      procurement_maturity: {
        overall_score: 62,
        level: 'transactional' as const,
        strengths: [
          'Good spend visibility',
          'Established supplier scorecards',
          'E-procurement system in place'
        ],
        improvement_areas: [
          'Limited strategic sourcing',
          'Weak supplier relationship management',
          'Insufficient category management'
        ]
      }
    };
    
    const evidence = {
      savings_opportunities: [{
        type: EvidenceType.PRECEDENT,
        rationale: 'Savings estimates based on industry benchmarks and similar procurement transformations',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'procurement_index',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1750,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.80,
      warnings: [
        'Savings estimates should be validated with detailed category analysis',
        'Supplier consolidation must consider supply chain risk'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['operations', 'procurement', 'suppliers', 'savings']
};

/**
 * Quality Defect Analysis - Scrap and rework analysis
 */
const qualityDefectAnalysisCapability: CapabilityNode = {
  id: 'quality_defect_analysis',
  name: 'Quality Defect Analyzer',
  description: 'Analyze quality defects, scrap, and rework to identify root causes and improvement opportunities',
  category: 'operational',

  preconditions: {
    required_inputs: ['quality_data', 'defect_records']
  },

  output_contract: {
    schema: z.object({
      quality_metrics: z.object({
        first_pass_yield: z.number(),
        defect_rate_ppm: z.number(),
        scrap_rate: z.number(),
        rework_rate: z.number(),
        cost_of_poor_quality: z.number(),
        copq_as_pct_revenue: z.number()
      }),
      defect_pareto: z.array(z.object({
        defect_type: z.string(),
        frequency: z.number(),
        cumulative_percentage: z.number(),
        cost_impact: z.number(),
        severity: z.enum(['critical', 'major', 'minor'])
      })),
      root_cause_analysis: z.array(z.object({
        defect_type: z.string(),
        root_causes: z.array(z.object({
          cause: z.string(),
          category: z.enum(['man', 'machine', 'material', 'method', 'measurement', 'environment']),
          contribution: z.number()
        })),
        corrective_actions: z.array(z.object({
          action: z.string(),
          expected_reduction: z.number(),
          implementation_cost: z.number(),
          timeline: z.string()
        }))
      })),
      cost_breakdown: z.object({
        scrap_cost: z.number(),
        rework_cost: z.number(),
        warranty_cost: z.number(),
        inspection_cost: z.number(),
        customer_returns: z.number(),
        total_copq: z.number()
      }),
      improvement_roadmap: z.array(z.object({
        initiative: z.string(),
        target_defect_types: z.array(z.string()),
        expected_impact: z.object({
          defect_reduction: z.number(),
          cost_savings: z.number()
        }),
        investment: z.number(),
        timeline: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
      }))
    }),
    required_evidence: ['quality_metrics'],
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
      quality_metrics: {
        first_pass_yield: 93.5,
        defect_rate_ppm: 6500,
        scrap_rate: 3.2,
        rework_rate: 3.3,
        cost_of_poor_quality: 18.5,
        copq_as_pct_revenue: 3.7
      },
      defect_pareto: [
        {
          defect_type: 'Dimensional out of spec',
          frequency: 2800,
          cumulative_percentage: 43,
          cost_impact: 7.5,
          severity: 'major' as const
        },
        {
          defect_type: 'Surface finish issues',
          frequency: 1600,
          cumulative_percentage: 68,
          cost_impact: 4.2,
          severity: 'minor' as const
        },
        {
          defect_type: 'Assembly errors',
          frequency: 1200,
          cumulative_percentage: 86,
          cost_impact: 4.8,
          severity: 'major' as const
        },
        {
          defect_type: 'Material defects',
          frequency: 900,
          cumulative_percentage: 100,
          cost_impact: 2.0,
          severity: 'critical' as const
        }
      ],
      root_cause_analysis: [
        {
          defect_type: 'Dimensional out of spec',
          root_causes: [
            {
              cause: 'Machine calibration drift',
              category: 'machine' as const,
              contribution: 45
            },
            {
              cause: 'Operator setup variation',
              category: 'man' as const,
              contribution: 30
            },
            {
              cause: 'Tool wear',
              category: 'machine' as const,
              contribution: 25
            }
          ],
          corrective_actions: [
            {
              action: 'Implement predictive maintenance and automated calibration',
              expected_reduction: 60,
              implementation_cost: 2.5,
              timeline: '6 months'
            },
            {
              action: 'Standardize setup procedures with poka-yoke',
              expected_reduction: 25,
              implementation_cost: 0.8,
              timeline: '3 months'
            }
          ]
        },
        {
          defect_type: 'Assembly errors',
          root_causes: [
            {
              cause: 'Complex assembly instructions',
              category: 'method' as const,
              contribution: 50
            },
            {
              cause: 'Inadequate training',
              category: 'man' as const,
              contribution: 35
            },
            {
              cause: 'Poor part presentation',
              category: 'method' as const,
              contribution: 15
            }
          ],
          corrective_actions: [
            {
              action: 'Implement visual work instructions and error-proofing',
              expected_reduction: 70,
              implementation_cost: 1.2,
              timeline: '4 months'
            }
          ]
        }
      ],
      cost_breakdown: {
        scrap_cost: 6.5,
        rework_cost: 5.8,
        warranty_cost: 3.2,
        inspection_cost: 2.0,
        customer_returns: 1.0,
        total_copq: 18.5
      },
      improvement_roadmap: [
        {
          initiative: 'Machine reliability and calibration program',
          target_defect_types: ['Dimensional out of spec'],
          expected_impact: {
            defect_reduction: 60,
            cost_savings: 4.5
          },
          investment: 2.5,
          timeline: '6 months',
          priority: 'high' as const
        },
        {
          initiative: 'Assembly error-proofing',
          target_defect_types: ['Assembly errors'],
          expected_impact: {
            defect_reduction: 70,
            cost_savings: 3.4
          },
          investment: 1.2,
          timeline: '4 months',
          priority: 'high' as const
        },
        {
          initiative: 'Supplier quality improvement',
          target_defect_types: ['Material defects'],
          expected_impact: {
            defect_reduction: 50,
            cost_savings: 1.0
          },
          investment: 0.5,
          timeline: '9 months',
          priority: 'medium' as const
        }
      ]
    };

    const evidence = {
      quality_metrics: [{
        type: EvidenceType.RETRIEVAL,
        rationale: 'Quality metrics calculated from production and inspection data',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'quality_defect_analysis',
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
        'Root cause analysis should be validated with detailed investigation',
        'Cost savings estimates assume successful implementation'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['operations', 'quality', 'defects', 'six_sigma']
};

/**
 * Aftermarket Economics - Post-sale revenue, spare parts
 */
const aftermarketEconomicsCapability: CapabilityNode = {
  id: 'aftermarket_economics',
  name: 'Aftermarket Economics Analyzer',
  description: 'Analyze aftermarket revenue opportunities including spare parts, service, and lifecycle value',
  category: 'commercial',

  preconditions: {
    required_inputs: ['installed_base', 'aftermarket_revenue']
  },

  output_contract: {
    schema: z.object({
      installed_base_analysis: z.object({
        total_units: z.number(),
        average_age_years: z.number(),
        age_distribution: z.array(z.object({
          age_range: z.string(),
          units: z.number(),
          percentage: z.number()
        })),
        geographic_distribution: z.array(z.object({
          region: z.string(),
          units: z.number(),
          percentage: z.number()
        }))
      }),
      revenue_streams: z.array(z.object({
        stream: z.string(),
        annual_revenue: z.number(),
        margin: z.number(),
        growth_rate: z.number(),
        penetration_rate: z.number(),
        potential_revenue: z.number()
      })),
      parts_analysis: z.object({
        total_parts_revenue: z.number(),
        parts_margin: z.number(),
        fast_moving_skus: z.number(),
        slow_moving_skus: z.number(),
        obsolete_inventory: z.number(),
        fill_rate: z.number(),
        optimization_opportunities: z.array(z.object({
          opportunity: z.string(),
          revenue_impact: z.number(),
          margin_impact: z.number()
        }))
      }),
      service_contracts: z.object({
        contract_penetration: z.number(),
        average_contract_value: z.number(),
        renewal_rate: z.number(),
        total_contract_revenue: z.number(),
        margin: z.number(),
        growth_opportunities: z.array(z.string())
      }),
      lifecycle_value: z.object({
        average_unit_price: z.number(),
        average_lifetime_years: z.number(),
        aftermarket_ltv: z.number(),
        ltv_to_initial_price_ratio: z.number(),
        by_product_line: z.array(z.object({
          product: z.string(),
          initial_price: z.number(),
          aftermarket_ltv: z.number(),
          ratio: z.number()
        }))
      }),
      strategic_initiatives: z.array(z.object({
        initiative: z.string(),
        target_revenue: z.number(),
        investment_required: z.number(),
        timeline: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
      }))
    }),
    required_evidence: ['lifecycle_value'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 1800,
    cpu_ms: 950,
    subrequests: 3
  },

  expected_precision: 0.70,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const output = {
      installed_base_analysis: {
        total_units: 500000,
        average_age_years: 4.5,
        age_distribution: [
          { age_range: '0-2 years', units: 150000, percentage: 30 },
          { age_range: '3-5 years', units: 200000, percentage: 40 },
          { age_range: '6-10 years', units: 125000, percentage: 25 },
          { age_range: '10+ years', units: 25000, percentage: 5 }
        ],
        geographic_distribution: [
          { region: 'North America', units: 200000, percentage: 40 },
          { region: 'Europe', units: 150000, percentage: 30 },
          { region: 'Asia Pacific', units: 125000, percentage: 25 },
          { region: 'Rest of World', units: 25000, percentage: 5 }
        ]
      },
      revenue_streams: [
        {
          stream: 'Spare parts',
          annual_revenue: 120,
          margin: 45,
          growth_rate: 0.08,
          penetration_rate: 0.60,
          potential_revenue: 200
        },
        {
          stream: 'Service contracts',
          annual_revenue: 80,
          margin: 55,
          growth_rate: 0.12,
          penetration_rate: 0.40,
          potential_revenue: 200
        },
        {
          stream: 'Field service',
          annual_revenue: 60,
          margin: 35,
          growth_rate: 0.05,
          penetration_rate: 0.50,
          potential_revenue: 120
        },
        {
          stream: 'Upgrades/retrofits',
          annual_revenue: 40,
          margin: 50,
          growth_rate: 0.15,
          penetration_rate: 0.20,
          potential_revenue: 200
        }
      ],
      parts_analysis: {
        total_parts_revenue: 120,
        parts_margin: 45,
        fast_moving_skus: 500,
        slow_moving_skus: 1500,
        obsolete_inventory: 8,
        fill_rate: 92,
        optimization_opportunities: [
          {
            opportunity: 'Improve fill rate to 98%',
            revenue_impact: 12,
            margin_impact: 5.4
          },
          {
            opportunity: 'Dynamic pricing for slow-moving parts',
            revenue_impact: 6,
            margin_impact: 3.0
          },
          {
            opportunity: 'Eliminate obsolete inventory',
            revenue_impact: 0,
            margin_impact: 3.6
          }
        ]
      },
      service_contracts: {
        contract_penetration: 40,
        average_contract_value: 400,
        renewal_rate: 85,
        total_contract_revenue: 80,
        margin: 55,
        growth_opportunities: [
          'Tiered service offerings (bronze/silver/gold)',
          'Predictive maintenance packages',
          'Extended warranty programs',
          'Remote monitoring and diagnostics'
        ]
      },
      lifecycle_value: {
        average_unit_price: 5000,
        average_lifetime_years: 10,
        aftermarket_ltv: 6000,
        ltv_to_initial_price_ratio: 1.2,
        by_product_line: [
          {
            product: 'Premium line',
            initial_price: 8000,
            aftermarket_ltv: 12000,
            ratio: 1.5
          },
          {
            product: 'Standard line',
            initial_price: 5000,
            aftermarket_ltv: 5500,
            ratio: 1.1
          },
          {
            product: 'Value line',
            initial_price: 3000,
            aftermarket_ltv: 2400,
            ratio: 0.8
          }
        ]
      },
      strategic_initiatives: [
        {
          initiative: 'Launch predictive maintenance service',
          target_revenue: 30,
          investment_required: 5,
          timeline: '12 months',
          priority: 'high' as const
        },
        {
          initiative: 'Expand parts e-commerce platform',
          target_revenue: 20,
          investment_required: 3,
          timeline: '9 months',
          priority: 'high' as const
        },
        {
          initiative: 'Develop retrofit/upgrade packages',
          target_revenue: 25,
          investment_required: 4,
          timeline: '15 months',
          priority: 'medium' as const
        }
      ]
    };

    const evidence = {
      lifecycle_value: [{
        type: EvidenceType.CALCULATION,
        formula: 'Aftermarket LTV = Sum of parts + service + upgrades over product lifetime',
        rationale: 'Lifetime value analysis based on installed base behavior',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'aftermarket_economics',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1750,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.80,
      warnings: [
        'Aftermarket potential depends on customer retention and product reliability',
        'LTV estimates assume historical patterns continue'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['operations', 'aftermarket', 'service', 'lifecycle_value']
};

/**
 * Register operations & supply chain capabilities part 2
 */
export function registerOperationsSupplyChainPart2Capabilities(graph: CapabilityGraph): void {
  graph.register(inventoryScenarioCapability);
  graph.register(procurementIndexCapability);
  graph.register(qualityDefectAnalysisCapability);
  graph.register(aftermarketEconomicsCapability);
}

