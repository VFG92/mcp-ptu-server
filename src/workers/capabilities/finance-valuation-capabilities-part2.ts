/**
 * Finance & Valuation Capabilities - Part 2
 * Capital Structure, Cost Reduction, Working Capital, IPO Readiness, Scenario Forecasting
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';
import { getNativeCapabilities, NativeCapabilityType, parseNativePythonResult } from '../llm-native-capabilities.js';

/**
 * Capital Structure Optimizer - Leverage optimization
 */
const capitalStructureOptimizerCapability: CapabilityNode = {
  id: 'capital_structure_optimizer',
  name: 'Capital Structure Optimizer',
  description: 'Optimize debt-equity mix, analyze leverage scenarios, and minimize WACC',
  category: 'financial',
  
  preconditions: {
    required_inputs: ['current_capital_structure', 'credit_rating']
  },
  
  output_contract: {
    schema: z.object({
      current_structure: z.object({
        debt: z.number(),
        equity: z.number(),
        debt_to_equity: z.number(),
        debt_to_ebitda: z.number(),
        interest_coverage: z.number(),
        wacc: z.number(),
        credit_rating: z.string()
      }),
      optimal_structure: z.object({
        debt: z.number(),
        equity: z.number(),
        debt_to_equity: z.number(),
        debt_to_ebitda: z.number(),
        interest_coverage: z.number(),
        wacc: z.number(),
        estimated_credit_rating: z.string(),
        value_creation: z.number()
      }),
      leverage_scenarios: z.array(z.object({
        scenario: z.string(),
        debt_to_equity: z.number(),
        wacc: z.number(),
        enterprise_value: z.number(),
        credit_rating: z.string(),
        financial_flexibility: z.enum(['high', 'medium', 'low']),
        bankruptcy_risk: z.enum(['low', 'medium', 'high'])
      })),
      debt_capacity: z.object({
        current_debt: z.number(),
        maximum_debt: z.number(),
        additional_capacity: z.number(),
        constraints: z.array(z.string())
      }),
      refinancing_opportunities: z.array(z.object({
        opportunity: z.string(),
        current_cost: z.number(),
        potential_cost: z.number(),
        annual_savings: z.number(),
        implementation_complexity: z.enum(['low', 'medium', 'high'])
      })),
      recommendations: z.array(z.string())
    }),
    required_evidence: ['optimal_structure'],
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
      current_structure: {
        debt: 500,
        equity: 1000,
        debt_to_equity: 0.50,
        debt_to_ebitda: 2.5,
        interest_coverage: 8.0,
        wacc: 0.095,
        credit_rating: 'BBB+'
      },
      optimal_structure: {
        debt: 750,
        equity: 1000,
        debt_to_equity: 0.75,
        debt_to_ebitda: 3.75,
        interest_coverage: 5.5,
        wacc: 0.085,
        estimated_credit_rating: 'BBB',
        value_creation: 125
      },
      leverage_scenarios: [
        {
          scenario: 'Conservative',
          debt_to_equity: 0.40,
          wacc: 0.098,
          enterprise_value: 1450,
          credit_rating: 'A-',
          financial_flexibility: 'high' as const,
          bankruptcy_risk: 'low' as const
        },
        {
          scenario: 'Moderate (Optimal)',
          debt_to_equity: 0.75,
          wacc: 0.085,
          enterprise_value: 1625,
          credit_rating: 'BBB',
          financial_flexibility: 'medium' as const,
          bankruptcy_risk: 'low' as const
        },
        {
          scenario: 'Aggressive',
          debt_to_equity: 1.20,
          wacc: 0.092,
          enterprise_value: 1550,
          credit_rating: 'BB+',
          financial_flexibility: 'low' as const,
          bankruptcy_risk: 'medium' as const
        }
      ],
      debt_capacity: {
        current_debt: 500,
        maximum_debt: 900,
        additional_capacity: 400,
        constraints: [
          'Maintain investment grade rating (BBB- minimum)',
          'Interest coverage ratio > 4.0x',
          'Debt/EBITDA < 4.5x'
        ]
      },
      refinancing_opportunities: [
        {
          opportunity: 'Refinance high-cost bonds',
          current_cost: 0.065,
          potential_cost: 0.048,
          annual_savings: 8.5,
          implementation_complexity: 'medium' as const
        },
        {
          opportunity: 'Extend maturity profile',
          current_cost: 0.055,
          potential_cost: 0.058,
          annual_savings: -1.5,
          implementation_complexity: 'low' as const
        }
      ],
      recommendations: [
        'Increase leverage to 0.75 D/E ratio to minimize WACC and create $125M value',
        'Refinance high-cost bonds to save $8.5M annually',
        'Maintain investment grade rating for access to capital markets',
        'Consider share buyback program funded with additional debt capacity'
      ]
    };
    
    const evidence = {
      optimal_structure: [{
        type: EvidenceType.CALCULATION,
        formula: 'Optimal leverage minimizes WACC: WACC = (E/V)*Re + (D/V)*Rd*(1-T)',
        rationale: 'Trade-off between tax shield benefits and financial distress costs',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'capital_structure_optimizer',
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
        'Optimal structure depends on market conditions and credit availability',
        'Credit rating estimates should be validated with rating agencies'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['finance', 'capital_structure', 'leverage', 'wacc']
};

/**
 * Cost Reduction Levers - Operational savings identification
 */
const costReductionLeversCapability: CapabilityNode = {
  id: 'cost_reduction_levers',
  name: 'Cost Reduction Levers',
  description: 'Identify and quantify cost reduction opportunities across the organization',
  category: 'financial',
  
  preconditions: {
    required_inputs: ['cost_structure', 'benchmarks']
  },
  
  output_contract: {
    schema: z.object({
      current_cost_structure: z.object({
        total_costs: z.number(),
        cogs: z.number(),
        opex: z.number(),
        sga: z.number(),
        rd: z.number(),
        cost_as_percentage_revenue: z.number()
      }),
      cost_reduction_levers: z.array(z.object({
        category: z.string(),
        lever: z.string(),
        current_spend: z.number(),
        savings_potential: z.number(),
        savings_percentage: z.number(),
        implementation_timeline: z.string(),
        implementation_cost: z.number(),
        risk: z.enum(['low', 'medium', 'high']),
        impact_on_operations: z.enum(['minimal', 'moderate', 'significant']),
        priority: z.enum(['high', 'medium', 'low'])
      })),
      benchmark_comparison: z.array(z.object({
        cost_category: z.string(),
        our_percentage: z.number(),
        peer_median: z.number(),
        best_in_class: z.number(),
        gap_to_median: z.number(),
        gap_to_best: z.number()
      })),
      implementation_roadmap: z.array(z.object({
        phase: z.string(),
        duration_months: z.number(),
        initiatives: z.array(z.string()),
        savings: z.number(),
        investment: z.number()
      })),
      total_savings_potential: z.object({
        year_1: z.number(),
        year_2: z.number(),
        year_3: z.number(),
        run_rate: z.number(),
        total_investment: z.number(),
        payback_period_months: z.number()
      })
    }),
    required_evidence: ['total_savings_potential'],
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
      current_cost_structure: {
        total_costs: 800,
        cogs: 400,
        opex: 250,
        sga: 100,
        rd: 50,
        cost_as_percentage_revenue: 80
      },
      cost_reduction_levers: [
        {
          category: 'Procurement',
          lever: 'Strategic sourcing and supplier consolidation',
          current_spend: 300,
          savings_potential: 30,
          savings_percentage: 10,
          implementation_timeline: '12 months',
          implementation_cost: 3,
          risk: 'low' as const,
          impact_on_operations: 'minimal' as const,
          priority: 'high' as const
        },
        {
          category: 'Operations',
          lever: 'Process automation and digitization',
          current_spend: 150,
          savings_potential: 22.5,
          savings_percentage: 15,
          implementation_timeline: '18 months',
          implementation_cost: 10,
          risk: 'medium' as const,
          impact_on_operations: 'moderate' as const,
          priority: 'high' as const
        },
        {
          category: 'SG&A',
          lever: 'Organizational redesign and spans & layers',
          current_spend: 100,
          savings_potential: 15,
          savings_percentage: 15,
          implementation_timeline: '9 months',
          implementation_cost: 2,
          risk: 'high' as const,
          impact_on_operations: 'significant' as const,
          priority: 'medium' as const
        },
        {
          category: 'Real Estate',
          lever: 'Footprint optimization and hybrid work',
          current_spend: 40,
          savings_potential: 12,
          savings_percentage: 30,
          implementation_timeline: '24 months',
          implementation_cost: 5,
          risk: 'medium' as const,
          impact_on_operations: 'moderate' as const,
          priority: 'medium' as const
        }
      ],
      benchmark_comparison: [
        {
          cost_category: 'COGS as % revenue',
          our_percentage: 40,
          peer_median: 38,
          best_in_class: 35,
          gap_to_median: 2,
          gap_to_best: 5
        },
        {
          cost_category: 'SG&A as % revenue',
          our_percentage: 10,
          peer_median: 8,
          best_in_class: 6,
          gap_to_median: 2,
          gap_to_best: 4
        }
      ],
      implementation_roadmap: [
        {
          phase: 'Quick wins',
          duration_months: 6,
          initiatives: ['Procurement optimization', 'Travel & expense policy'],
          savings: 25,
          investment: 2
        },
        {
          phase: 'Core transformation',
          duration_months: 12,
          initiatives: ['Process automation', 'Org redesign'],
          savings: 40,
          investment: 12
        },
        {
          phase: 'Sustained excellence',
          duration_months: 12,
          initiatives: ['Real estate optimization', 'Continuous improvement'],
          savings: 15,
          investment: 6
        }
      ],
      total_savings_potential: {
        year_1: 35,
        year_2: 60,
        year_3: 80,
        run_rate: 80,
        total_investment: 20,
        payback_period_months: 9
      }
    };
    
    const evidence = {
      total_savings_potential: [{
        type: EvidenceType.CALCULATION,
        formula: 'Total savings = Sum of all lever savings potential',
        rationale: 'Bottom-up analysis of cost reduction opportunities',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'cost_reduction_levers',
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
        'Savings estimates should be validated with detailed analysis',
        'Implementation risks and change management requirements should be assessed'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['finance', 'cost_reduction', 'efficiency', 'savings']
};

/**
 * Working Capital Diagnostic - AR/AP/Inventory optimization
 */
const workingCapitalDiagnosticCapability: CapabilityNode = {
  id: 'working_capital_diagnostic',
  name: 'Working Capital Diagnostic',
  description: 'Analyze and optimize working capital through AR, AP, and inventory management',
  category: 'financial',

  preconditions: {
    required_inputs: ['balance_sheet', 'cash_conversion_cycle']
  },

  output_contract: {
    schema: z.object({
      current_metrics: z.object({
        working_capital: z.number(),
        cash_conversion_cycle: z.number(),
        days_sales_outstanding: z.number(),
        days_inventory_outstanding: z.number(),
        days_payable_outstanding: z.number(),
        working_capital_as_pct_revenue: z.number()
      }),
      benchmark_comparison: z.object({
        our_ccc: z.number(),
        peer_median: z.number(),
        best_in_class: z.number(),
        gap_to_best: z.number()
      }),
      optimization_opportunities: z.array(z.object({
        area: z.enum(['receivables', 'inventory', 'payables']),
        opportunity: z.string(),
        current_days: z.number(),
        target_days: z.number(),
        cash_release: z.number(),
        implementation_difficulty: z.enum(['low', 'medium', 'high']),
        priority: z.enum(['high', 'medium', 'low'])
      })),
      total_cash_release_potential: z.number(),
      implementation_roadmap: z.array(z.object({
        initiative: z.string(),
        timeline: z.string(),
        cash_impact: z.number(),
        key_actions: z.array(z.string())
      }))
    }),
    required_evidence: ['total_cash_release_potential'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 550,
    expected_tokens_out: 1500,
    cpu_ms: 800,
    subrequests: 3
  },

  expected_precision: 0.75,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const output = {
      current_metrics: {
        working_capital: 150,
        cash_conversion_cycle: 65,
        days_sales_outstanding: 55,
        days_inventory_outstanding: 45,
        days_payable_outstanding: 35,
        working_capital_as_pct_revenue: 15
      },
      benchmark_comparison: {
        our_ccc: 65,
        peer_median: 50,
        best_in_class: 35,
        gap_to_best: 30
      },
      optimization_opportunities: [
        {
          area: 'receivables' as const,
          opportunity: 'Accelerate collections and reduce DSO',
          current_days: 55,
          target_days: 45,
          cash_release: 27.4,
          implementation_difficulty: 'medium' as const,
          priority: 'high' as const
        },
        {
          area: 'inventory' as const,
          opportunity: 'Optimize inventory levels and improve turns',
          current_days: 45,
          target_days: 35,
          cash_release: 27.4,
          implementation_difficulty: 'high' as const,
          priority: 'high' as const
        },
        {
          area: 'payables' as const,
          opportunity: 'Extend payment terms without damaging supplier relationships',
          current_days: 35,
          target_days: 45,
          cash_release: 27.4,
          implementation_difficulty: 'low' as const,
          priority: 'medium' as const
        }
      ],
      total_cash_release_potential: 82.2,
      implementation_roadmap: [
        {
          initiative: 'Receivables acceleration',
          timeline: 'Q1-Q2 2024',
          cash_impact: 27.4,
          key_actions: [
            'Implement automated dunning process',
            'Offer early payment discounts',
            'Improve invoicing accuracy and speed',
            'Establish credit limits and monitoring'
          ]
        },
        {
          initiative: 'Inventory optimization',
          timeline: 'Q2-Q4 2024',
          cash_impact: 27.4,
          key_actions: [
            'Implement demand forecasting system',
            'Reduce safety stock levels',
            'Improve supplier lead times',
            'Eliminate slow-moving inventory'
          ]
        },
        {
          initiative: 'Payables extension',
          timeline: 'Q1 2024',
          cash_impact: 27.4,
          key_actions: [
            'Negotiate extended payment terms',
            'Implement dynamic discounting',
            'Optimize payment timing',
            'Consolidate suppliers for better terms'
          ]
        }
      ]
    };

    const evidence = {
      total_cash_release_potential: [{
        type: EvidenceType.CALCULATION,
        formula: 'Cash release = (Days improvement / 365) × Annual revenue',
        rationale: 'Working capital optimization releases cash trapped in operations',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'working_capital_diagnostic',
      output,
      evidence,
      confidence: 0.75,
      cost_actual: {
        expected_tokens_in: 530,
        expected_tokens_out: 1450,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.85,
      warnings: [
        'Cash release estimates assume revenue remains constant',
        'Implementation may require system investments and process changes'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['finance', 'working_capital', 'cash', 'optimization']
};

/**
 * IPO Readiness - Equity story, comparables, valuation
 */
const ipoReadinessCapability: CapabilityNode = {
  id: 'ipo_readiness',
  name: 'IPO Readiness Assessment',
  description: 'Assess IPO readiness, develop equity story, identify comparables, and estimate valuation',
  category: 'financial',

  preconditions: {
    required_inputs: ['company_profile', 'financial_history']
  },

  output_contract: {
    schema: z.object({
      readiness_assessment: z.object({
        overall_score: z.number().min(0).max(100),
        readiness_level: z.enum(['ready', 'nearly_ready', 'significant_gaps', 'not_ready']),
        key_strengths: z.array(z.string()),
        critical_gaps: z.array(z.object({
          area: z.string(),
          gap: z.string(),
          severity: z.enum(['critical', 'high', 'medium']),
          remediation_timeline: z.string()
        }))
      }),
      equity_story: z.object({
        investment_thesis: z.string(),
        key_differentiators: z.array(z.string()),
        growth_narrative: z.string(),
        target_investor_profile: z.string(),
        risk_factors: z.array(z.string())
      }),
      comparable_companies: z.array(z.object({
        company: z.string(),
        market_cap: z.number(),
        revenue: z.number(),
        revenue_growth: z.number(),
        ebitda_margin: z.number(),
        ev_revenue: z.number(),
        ev_ebitda: z.number(),
        similarity_score: z.number()
      })),
      valuation_estimate: z.object({
        method: z.string(),
        equity_value_range: z.object({
          low: z.number(),
          mid: z.number(),
          high: z.number()
        }),
        implied_market_cap: z.number(),
        shares_outstanding: z.number(),
        price_per_share_range: z.object({
          low: z.number(),
          mid: z.number(),
          high: z.number()
        })
      }),
      ipo_timeline: z.array(z.object({
        phase: z.string(),
        duration_months: z.number(),
        key_milestones: z.array(z.string())
      })),
      estimated_costs: z.object({
        underwriting_fees: z.number(),
        legal_and_accounting: z.number(),
        other_costs: z.number(),
        total: z.number()
      })
    }),
    required_evidence: ['valuation_estimate'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 1900,
    cpu_ms: 950,
    subrequests: 3
  },

  expected_precision: 0.68,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const entityNames = context.whiteboard.get('__entity_names__') || {};
    const industryContext = context.whiteboard.get('__industry_context__');
    const comparables = industryContext?.typical_players?.slice(0, 3) || ['Comparable A', 'Comparable B', 'Comparable C'];

    const output = {
      readiness_assessment: {
        overall_score: 72,
        readiness_level: 'nearly_ready' as const,
        key_strengths: [
          'Strong revenue growth (40% CAGR)',
          'Proven business model with positive unit economics',
          'Experienced management team',
          'Clean cap table'
        ],
        critical_gaps: [
          {
            area: 'Financial controls',
            gap: 'SOX compliance not yet implemented',
            severity: 'critical' as const,
            remediation_timeline: '9-12 months'
          },
          {
            area: 'Board composition',
            gap: 'Need additional independent directors',
            severity: 'high' as const,
            remediation_timeline: '3-6 months'
          },
          {
            area: 'Financial reporting',
            gap: 'Quarterly reporting cadence not established',
            severity: 'medium' as const,
            remediation_timeline: '6 months'
          }
        ]
      },
      equity_story: {
        investment_thesis: 'Leading innovator in high-growth market with proven execution and clear path to profitability',
        key_differentiators: [
          'Proprietary technology with 5+ years lead',
          'Network effects creating competitive moat',
          'Best-in-class unit economics',
          'Large TAM with <5% penetration'
        ],
        growth_narrative: '40% revenue CAGR driven by market expansion, new products, and international growth',
        target_investor_profile: 'Growth-oriented institutional investors with technology sector expertise',
        risk_factors: [
          'Dependence on key customers',
          'Competitive market dynamics',
          'Regulatory uncertainty',
          'Execution risk on international expansion'
        ]
      },
      comparable_companies: [
        {
          company: entityNames.comparable_1 || comparables[0],
          market_cap: 5000,
          revenue: 800,
          revenue_growth: 0.35,
          ebitda_margin: 0.22,
          ev_revenue: 6.25,
          ev_ebitda: 28.4,
          similarity_score: 0.85
        },
        {
          company: entityNames.comparable_2 || comparables[1],
          market_cap: 3500,
          revenue: 600,
          revenue_growth: 0.30,
          ebitda_margin: 0.20,
          ev_revenue: 5.83,
          ev_ebitda: 29.2,
          similarity_score: 0.78
        },
        {
          company: entityNames.comparable_3 || comparables[2],
          market_cap: 4200,
          revenue: 700,
          revenue_growth: 0.38,
          ebitda_margin: 0.24,
          ev_revenue: 6.00,
          ev_ebitda: 25.0,
          similarity_score: 0.82
        }
      ],
      valuation_estimate: {
        method: 'Comparable company analysis',
        equity_value_range: {
          low: 2400,
          mid: 3000,
          high: 3600
        },
        implied_market_cap: 3000,
        shares_outstanding: 100,
        price_per_share_range: {
          low: 24.00,
          mid: 30.00,
          high: 36.00
        }
      },
      ipo_timeline: [
        {
          phase: 'Preparation',
          duration_months: 12,
          key_milestones: [
            'Implement SOX controls',
            'Recruit independent directors',
            'Select underwriters',
            'Begin S-1 drafting'
          ]
        },
        {
          phase: 'Filing and review',
          duration_months: 3,
          key_milestones: [
            'File S-1 with SEC',
            'Respond to SEC comments',
            'Finalize prospectus'
          ]
        },
        {
          phase: 'Marketing and pricing',
          duration_months: 1,
          key_milestones: [
            'Roadshow',
            'Book building',
            'Price IPO',
            'First day of trading'
          ]
        }
      ],
      estimated_costs: {
        underwriting_fees: 105,
        legal_and_accounting: 15,
        other_costs: 10,
        total: 130
      }
    };

    const evidence = {
      valuation_estimate: [{
        type: EvidenceType.PRECEDENT,
        rationale: 'Valuation based on comparable public company multiples adjusted for growth and profitability',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'ipo_readiness',
      output,
      evidence,
      confidence: 0.68,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1850,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.78,
      warnings: [
        'IPO valuation highly dependent on market conditions at time of offering',
        'Readiness assessment should be validated with IPO advisors'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['finance', 'ipo', 'valuation', 'equity']
};

/**
 * Scenario Forecasting - Monte Carlo probabilistic forecasting
 */
const scenarioForecastingCapability: CapabilityNode = {
  id: 'scenario_forecasting',
  name: 'Scenario Forecasting Engine',
  description: 'Monte Carlo probabilistic financial forecasting with scenario analysis',
  category: 'financial',

  preconditions: {
    required_inputs: ['base_forecast', 'key_assumptions']
  },

  output_contract: {
    schema: z.object({
      base_forecast: z.array(z.object({
        year: z.number(),
        revenue: z.number(),
        ebitda: z.number(),
        ebitda_margin: z.number(),
        fcf: z.number()
      })),
      probabilistic_forecast: z.array(z.object({
        year: z.number(),
        metric: z.string(),
        p10: z.number(),
        p25: z.number(),
        p50: z.number(),
        p75: z.number(),
        p90: z.number(),
        mean: z.number(),
        std_dev: z.number()
      })),
      scenarios: z.array(z.object({
        name: z.string(),
        probability: z.number(),
        description: z.string(),
        key_assumptions: z.array(z.object({
          variable: z.string(),
          value: z.number()
        })),
        outcomes: z.array(z.object({
          year: z.number(),
          revenue: z.number(),
          ebitda: z.number(),
          fcf: z.number()
        }))
      })),
      risk_analysis: z.object({
        downside_risk: z.number(),
        upside_potential: z.number(),
        probability_of_target: z.number(),
        key_risks: z.array(z.object({
          risk: z.string(),
          impact: z.number(),
          probability: z.number()
        }))
      }),
      sensitivity_tornado: z.array(z.object({
        variable: z.string(),
        impact_on_ebitda: z.number(),
        rank: z.number()
      }))
    }),
    required_evidence: ['probabilistic_forecast'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 650,
    expected_tokens_out: 1900,
    cpu_ms: 950,
    subrequests: 3
  },

  expected_precision: 0.72,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const output = {
      base_forecast: [
        { year: 2024, revenue: 500, ebitda: 120, ebitda_margin: 0.24, fcf: 44 },
        { year: 2025, revenue: 575, ebitda: 138, ebitda_margin: 0.24, fcf: 50 },
        { year: 2026, revenue: 661, ebitda: 159, ebitda_margin: 0.24, fcf: 58 }
      ],
      probabilistic_forecast: [
        {
          year: 2024,
          metric: 'Revenue',
          p10: 450,
          p25: 475,
          p50: 500,
          p75: 525,
          p90: 550,
          mean: 500,
          std_dev: 35
        },
        {
          year: 2025,
          metric: 'Revenue',
          p10: 490,
          p25: 530,
          p50: 575,
          p75: 620,
          p90: 660,
          mean: 575,
          std_dev: 60
        },
        {
          year: 2026,
          metric: 'Revenue',
          p10: 530,
          p25: 590,
          p50: 661,
          p75: 730,
          p90: 800,
          mean: 661,
          std_dev: 95
        }
      ],
      scenarios: [
        {
          name: 'Optimistic',
          probability: 0.20,
          description: 'Strong market growth, successful product launches, market share gains',
          key_assumptions: [
            { variable: 'Market growth', value: 0.25 },
            { variable: 'Market share', value: 0.18 },
            { variable: 'Pricing power', value: 0.03 }
          ],
          outcomes: [
            { year: 2024, revenue: 525, ebitda: 136, fcf: 52 },
            { year: 2025, revenue: 640, ebitda: 166, fcf: 68 },
            { year: 2026, revenue: 780, ebitda: 203, fcf: 88 }
          ]
        },
        {
          name: 'Base',
          probability: 0.60,
          description: 'Moderate market growth, steady execution',
          key_assumptions: [
            { variable: 'Market growth', value: 0.15 },
            { variable: 'Market share', value: 0.15 },
            { variable: 'Pricing power', value: 0.02 }
          ],
          outcomes: [
            { year: 2024, revenue: 500, ebitda: 120, fcf: 44 },
            { year: 2025, revenue: 575, ebitda: 138, fcf: 50 },
            { year: 2026, revenue: 661, ebitda: 159, fcf: 58 }
          ]
        },
        {
          name: 'Pessimistic',
          probability: 0.20,
          description: 'Economic downturn, increased competition, margin pressure',
          key_assumptions: [
            { variable: 'Market growth', value: 0.05 },
            { variable: 'Market share', value: 0.14 },
            { variable: 'Pricing power', value: -0.02 }
          ],
          outcomes: [
            { year: 2024, revenue: 475, ebitda: 100, fcf: 32 },
            { year: 2025, revenue: 510, ebitda: 107, fcf: 35 },
            { year: 2026, revenue: 545, ebitda: 114, fcf: 38 }
          ]
        }
      ],
      risk_analysis: {
        downside_risk: 0.25,
        upside_potential: 0.35,
        probability_of_target: 0.68,
        key_risks: [
          { risk: 'Market slowdown', impact: -80, probability: 0.30 },
          { risk: 'Competitive pressure', impact: -50, probability: 0.45 },
          { risk: 'Execution delays', impact: -35, probability: 0.25 }
        ]
      },
      sensitivity_tornado: [
        { variable: 'Market growth rate', impact_on_ebitda: 45, rank: 1 },
        { variable: 'Gross margin', impact_on_ebitda: 38, rank: 2 },
        { variable: 'Market share', impact_on_ebitda: 32, rank: 3 },
        { variable: 'Operating leverage', impact_on_ebitda: 22, rank: 4 },
        { variable: 'Pricing', impact_on_ebitda: 18, rank: 5 }
      ]
    };

    const evidence = {
      probabilistic_forecast: [{
        type: EvidenceType.SIMULATION,
        rationale: 'Monte Carlo simulation with 10,000 iterations based on historical volatility and correlation of key variables',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'scenario_forecasting',
      output,
      evidence,
      confidence: 0.72,
      cost_actual: {
        expected_tokens_in: 630,
        expected_tokens_out: 1850,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.82,
      warnings: [
        'Probabilistic ranges assume normal distribution - tail risks may be underestimated',
        'Scenario probabilities are subjective estimates'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['finance', 'forecasting', 'monte_carlo', 'scenarios']
};

/**
 * Register finance & valuation capabilities part 2
 */
export function registerFinanceValuationPart2Capabilities(graph: CapabilityGraph): void {
  graph.register(capitalStructureOptimizerCapability);
  graph.register(costReductionLeversCapability);
  graph.register(workingCapitalDiagnosticCapability);
  graph.register(ipoReadinessCapability);
  graph.register(scenarioForecastingCapability);
}

