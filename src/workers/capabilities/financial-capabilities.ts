/**
 * Financial Analysis Capabilities
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';

/**
 * Unit Economics Model
 */
const unitEconomicsCapability: CapabilityNode = {
  id: 'unit_economics_model',
  name: 'Unit Economics Model',
  description: 'Build unit economics model with LTV, CAC, payback period, and contribution margin',
  category: 'financial',
  
  preconditions: {
    required_inputs: ['business_model', 'pricing', 'cost_structure']
  },
  
  output_contract: {
    schema: z.object({
      ltv: z.object({
        value: z.number(),
        unit: z.literal('USD'),
        calculation_method: z.string(),
        assumptions: z.array(z.string())
      }),
      cac: z.object({
        value: z.number(),
        unit: z.literal('USD'),
        breakdown: z.record(z.number()),
        channels: z.array(z.object({
          channel: z.string(),
          cac: z.number(),
          volume: z.number()
        }))
      }),
      ltv_cac_ratio: z.object({
        value: z.number(),
        assessment: z.enum(['excellent', 'good', 'acceptable', 'poor']),
        benchmark: z.number()
      }),
      payback_period_months: z.object({
        value: z.number(),
        unit: z.literal('months'),
        assessment: z.enum(['excellent', 'good', 'acceptable', 'poor'])
      }),
      contribution_margin: z.object({
        value: z.number(),
        unit: z.literal('%'),
        breakdown: z.object({
          revenue: z.number(),
          cogs: z.number(),
          gross_profit: z.number()
        })
      }),
      sensitivity: z.object({
        churn_rate: z.object({
          base: z.number(),
          plus_10pct: z.number(),
          minus_10pct: z.number()
        }),
        pricing: z.object({
          base: z.number(),
          plus_10pct: z.number(),
          minus_10pct: z.number()
        })
      }),
      explain: z.string()
    }),
    units: {
      ltv: 'USD',
      cac: 'USD',
      contribution_margin: '%',
      payback_period: 'months'
    },
    required_evidence: ['ltv', 'cac', 'ltv_cac_ratio'],
    quality_checks: [
      {
        name: 'ltv_positive',
        check: (output) => output.ltv.value > 0,
        error_message: 'LTV must be positive'
      },
      {
        name: 'cac_positive',
        check: (output) => output.cac.value > 0,
        error_message: 'CAC must be positive'
      },
      {
        name: 'ltv_cac_ratio_calculated',
        check: (output) => Math.abs(output.ltv_cac_ratio.value - (output.ltv.value / output.cac.value)) < 0.01,
        error_message: 'LTV/CAC ratio calculation error'
      },
      {
        name: 'ltv_cac_ratio_viable',
        check: (output) => output.ltv_cac_ratio.value >= 1.5,
        error_message: 'LTV/CAC ratio below 1.5 indicates poor unit economics'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 600,
    expected_tokens_out: 1800,
    cpu_ms: 1000,
    subrequests: 2
  },
  
  expected_precision: 0.70,
  sensitivity_data: {
    churn_rate: 0.9,
    pricing: 0.8,
    cac: 0.7
  },
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    // Simulate unit economics calculation
    const avgRevenuePerCustomer = 1200; // Annual
    const churnRate = 0.15; // 15% annual
    const grossMargin = 0.75;
    const customerLifetimeYears = 1 / churnRate;
    
    const ltv = avgRevenuePerCustomer * customerLifetimeYears * grossMargin;
    const cac = 800;
    const ltvCacRatio = ltv / cac;
    
    const output = {
      ltv: {
        value: ltv,
        unit: 'USD' as const,
        calculation_method: 'LTV = ARPU × Customer Lifetime × Gross Margin',
        assumptions: [
          `Average revenue per customer: $${avgRevenuePerCustomer}/year`,
          `Annual churn rate: ${(churnRate * 100).toFixed(1)}%`,
          `Gross margin: ${(grossMargin * 100).toFixed(0)}%`,
          `Customer lifetime: ${customerLifetimeYears.toFixed(1)} years`
        ]
      },
      cac: {
        value: cac,
        unit: 'USD' as const,
        breakdown: {
          sales: 400,
          marketing: 300,
          overhead: 100
        },
        channels: [
          { channel: 'Direct Sales', cac: 1200, volume: 40 },
          { channel: 'Digital Marketing', cac: 500, volume: 60 }
        ]
      },
      ltv_cac_ratio: {
        value: ltvCacRatio,
        assessment: ltvCacRatio >= 4 ? 'excellent' : ltvCacRatio >= 3 ? 'good' : ltvCacRatio >= 1.5 ? 'acceptable' : 'poor',
        benchmark: 3.0
      },
      payback_period_months: {
        value: (cac / (avgRevenuePerCustomer * grossMargin / 12)),
        unit: 'months' as const,
        assessment: 'good'
      },
      contribution_margin: {
        value: grossMargin * 100,
        unit: '%' as const,
        breakdown: {
          revenue: avgRevenuePerCustomer,
          cogs: avgRevenuePerCustomer * (1 - grossMargin),
          gross_profit: avgRevenuePerCustomer * grossMargin
        }
      },
      sensitivity: {
        churn_rate: {
          base: ltv,
          plus_10pct: avgRevenuePerCustomer * (1 / (churnRate * 1.1)) * grossMargin,
          minus_10pct: avgRevenuePerCustomer * (1 / (churnRate * 0.9)) * grossMargin
        },
        pricing: {
          base: ltv,
          plus_10pct: (avgRevenuePerCustomer * 1.1) * customerLifetimeYears * grossMargin,
          minus_10pct: (avgRevenuePerCustomer * 0.9) * customerLifetimeYears * grossMargin
        }
      },
      explain: `Unit economics show LTV of $${ltv.toFixed(0)} vs CAC of $${cac}, yielding ${ltvCacRatio.toFixed(1)}x ratio (${ltvCacRatio >= 3 ? 'healthy' : 'needs improvement'}). Payback period is ${(cac / (avgRevenuePerCustomer * grossMargin / 12)).toFixed(1)} months.`
    };
    
    const evidence = {
      ltv: [{
        type: EvidenceType.CALCULATION,
        formula: 'LTV = ARPU × (1 / Churn Rate) × Gross Margin',
        inputs: {
          arpu: avgRevenuePerCustomer,
          churn_rate: churnRate,
          gross_margin: grossMargin
        },
        timestamp: Date.now()
      }],
      cac: [{
        type: EvidenceType.ASSUMPTION,
        rationale: 'Based on typical B2B SaaS CAC benchmarks and channel mix',
        confidence: 0.65,
        timestamp: Date.now()
      }],
      ltv_cac_ratio: [{
        type: EvidenceType.CALCULATION,
        formula: 'LTV/CAC Ratio = LTV ÷ CAC',
        inputs: { ltv, cac },
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'unit_economics_model',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 580,
        expected_tokens_out: 1750,
        cpu_ms: executionTime,
        subrequests: 2
      },
      quality_score: 0.85,
      warnings: ltvCacRatio < 3 ? ['LTV/CAC ratio below 3x benchmark - consider improving retention or reducing CAC'] : [],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['financial', 'unit-economics', 'ltv', 'cac']
};

/**
 * Pricing Sensitivity Analysis
 */
const pricingSensitivityCapability: CapabilityNode = {
  id: 'pricing_sensitivity',
  name: 'Pricing Sensitivity Analysis',
  description: 'Analyze price elasticity and optimal pricing strategy',
  category: 'commercial',
  
  preconditions: {
    required_inputs: ['current_pricing', 'customer_segments', 'competitive_pricing']
  },
  
  output_contract: {
    schema: z.object({
      price_elasticity: z.object({
        coefficient: z.number(),
        interpretation: z.string()
      }),
      optimal_price_range: z.object({
        min: z.number(),
        max: z.number(),
        recommended: z.number(),
        rationale: z.string()
      }),
      revenue_scenarios: z.array(z.object({
        price: z.number(),
        volume: z.number(),
        revenue: z.number(),
        margin: z.number()
      })),
      pricing_fences: z.array(z.object({
        segment: z.string(),
        price_point: z.number(),
        value_drivers: z.array(z.string())
      })),
      explain: z.string()
    }),
    required_evidence: ['price_elasticity', 'optimal_price_range'],
    quality_checks: [
      {
        name: 'elasticity_reasonable',
        check: (output) => output.price_elasticity.coefficient < 0 && output.price_elasticity.coefficient > -5,
        error_message: 'Price elasticity should be negative and reasonable'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 500,
    expected_tokens_out: 1200,
    cpu_ms: 700,
    subrequests: 2
  },
  
  expected_precision: 0.65,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const currentPrice = inputs.current_pricing?.base_price || 100;
    const elasticity = -1.5; // Typical B2B elasticity
    
    const output = {
      price_elasticity: {
        coefficient: elasticity,
        interpretation: 'Moderately elastic - 10% price increase leads to 15% volume decrease'
      },
      optimal_price_range: {
        min: currentPrice * 0.9,
        max: currentPrice * 1.3,
        recommended: currentPrice * 1.15,
        rationale: '15% price increase maximizes revenue given elasticity and competitive positioning'
      },
      revenue_scenarios: [
        { price: currentPrice * 0.9, volume: 1100, revenue: 99000, margin: 0.70 },
        { price: currentPrice, volume: 1000, revenue: 100000, margin: 0.72 },
        { price: currentPrice * 1.15, volume: 850, revenue: 97750, margin: 0.76 },
        { price: currentPrice * 1.3, volume: 700, revenue: 91000, margin: 0.78 }
      ],
      pricing_fences: [
        {
          segment: 'Enterprise',
          price_point: currentPrice * 1.5,
          value_drivers: ['Premium support', 'Custom integrations', 'SLA guarantees']
        },
        {
          segment: 'Mid-market',
          price_point: currentPrice,
          value_drivers: ['Standard features', 'Email support', 'Self-service']
        },
        {
          segment: 'SMB',
          price_point: currentPrice * 0.7,
          value_drivers: ['Basic features', 'Community support', 'Annual commitment']
        }
      ],
      explain: `Price elasticity of ${elasticity} suggests moderate sensitivity. Optimal price point is $${(currentPrice * 1.15).toFixed(0)}, balancing volume and margin.`
    };
    
    const evidence = {
      price_elasticity: [{
        type: EvidenceType.ASSUMPTION,
        rationale: 'Based on typical B2B SaaS price elasticity benchmarks',
        confidence: 0.6,
        timestamp: Date.now()
      }],
      optimal_price_range: [{
        type: EvidenceType.CALCULATION,
        formula: 'Revenue = Price × Volume(Price), where Volume(Price) = Base_Volume × (1 + Elasticity × (Price_Change / Base_Price))',
        inputs: { base_price: currentPrice, elasticity, base_volume: 1000 },
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'pricing_sensitivity',
      output,
      evidence,
      confidence: 0.65,
      cost_actual: {
        expected_tokens_in: 480,
        expected_tokens_out: 1150,
        cpu_ms: executionTime,
        subrequests: 2
      },
      quality_score: 0.78,
      warnings: ['Price elasticity should be validated with customer surveys or A/B tests'],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['financial', 'pricing', 'commercial']
};

/**
 * Register all financial capabilities
 */
export function registerFinancialCapabilities(graph: CapabilityGraph): void {
  graph.register(unitEconomicsCapability);
  graph.register(pricingSensitivityCapability);
}

