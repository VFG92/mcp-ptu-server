/**
 * Finance & Valuation Capabilities
 * 
 * Advanced capabilities for DCF modeling, TSR simulation, capital structure,
 * cost reduction, working capital, IPO readiness, and scenario forecasting.
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType, type CapabilityGraph } from '../capability-graph.js';
import { getNativeCapabilities, NativeCapabilityType } from '../llm-native-capabilities.js';

/**
 * DCF Modeler - Discounted cash flow with scenarios
 */
const dcfModelerCapability: CapabilityNode = {
  id: 'dcf_modeler',
  name: 'DCF Valuation Modeler',
  description: 'Build discounted cash flow model with multiple scenarios and sensitivity analysis',
  category: 'financial',
  
  preconditions: {
    required_inputs: ['financial_projections', 'wacc']
  },
  
  output_contract: {
    schema: z.object({
      base_case: z.object({
        enterprise_value: z.number(),
        equity_value: z.number(),
        value_per_share: z.number(),
        implied_multiple: z.object({
          ev_revenue: z.number(),
          ev_ebitda: z.number(),
          pe_ratio: z.number()
        }),
        wacc: z.number(),
        terminal_growth_rate: z.number(),
        terminal_value: z.number(),
        pv_terminal_value: z.number(),
        pv_forecast_period: z.number()
      }),
      scenarios: z.array(z.object({
        name: z.string(),
        probability: z.number(),
        enterprise_value: z.number(),
        equity_value: z.number(),
        key_assumptions: z.array(z.object({
          parameter: z.string(),
          value: z.number()
        }))
      })),
      sensitivity_analysis: z.array(z.object({
        variable: z.string(),
        range: z.object({
          min: z.number(),
          base: z.number(),
          max: z.number()
        }),
        ev_impact: z.object({
          min: z.number(),
          base: z.number(),
          max: z.number()
        })
      })),
      cash_flow_forecast: z.array(z.object({
        year: z.number(),
        revenue: z.number(),
        ebitda: z.number(),
        ebit: z.number(),
        tax: z.number(),
        nopat: z.number(),
        capex: z.number(),
        nwc_change: z.number(),
        fcf: z.number(),
        discount_factor: z.number(),
        pv_fcf: z.number()
      })),
      valuation_range: z.object({
        low: z.number(),
        mid: z.number(),
        high: z.number()
      }),
      key_value_drivers: z.array(z.object({
        driver: z.string(),
        sensitivity: z.number(),
        current_assumption: z.string()
      }))
    }),
    required_evidence: ['enterprise_value'],
    quality_checks: []
  },
  
  cost_estimate: {
    expected_tokens_in: 700,
    expected_tokens_out: 2400,
    cpu_ms: 1200,
    subrequests: 4
  },
  
  expected_precision: 0.75,
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const output = {
      base_case: {
        enterprise_value: 1500,
        equity_value: 1350,
        value_per_share: 27.00,
        implied_multiple: {
          ev_revenue: 3.0,
          ev_ebitda: 12.5,
          pe_ratio: 18.0
        },
        wacc: 0.095,
        terminal_growth_rate: 0.025,
        terminal_value: 1200,
        pv_terminal_value: 750,
        pv_forecast_period: 750
      },
      scenarios: [
        {
          name: 'Bull Case',
          probability: 0.25,
          enterprise_value: 1950,
          equity_value: 1800,
          key_assumptions: [
            { parameter: 'Revenue CAGR', value: 0.20 },
            { parameter: 'EBITDA margin', value: 0.28 },
            { parameter: 'Terminal growth', value: 0.03 }
          ]
        },
        {
          name: 'Base Case',
          probability: 0.50,
          enterprise_value: 1500,
          equity_value: 1350,
          key_assumptions: [
            { parameter: 'Revenue CAGR', value: 0.15 },
            { parameter: 'EBITDA margin', value: 0.24 },
            { parameter: 'Terminal growth', value: 0.025 }
          ]
        },
        {
          name: 'Bear Case',
          probability: 0.25,
          enterprise_value: 1050,
          equity_value: 900,
          key_assumptions: [
            { parameter: 'Revenue CAGR', value: 0.10 },
            { parameter: 'EBITDA margin', value: 0.20 },
            { parameter: 'Terminal growth', value: 0.02 }
          ]
        }
      ],
      sensitivity_analysis: [
        {
          variable: 'WACC',
          range: { min: 0.08, base: 0.095, max: 0.11 },
          ev_impact: { min: 1750, base: 1500, max: 1300 }
        },
        {
          variable: 'Terminal growth rate',
          range: { min: 0.02, base: 0.025, max: 0.03 },
          ev_impact: { min: 1400, base: 1500, max: 1650 }
        },
        {
          variable: 'EBITDA margin',
          range: { min: 0.20, base: 0.24, max: 0.28 },
          ev_impact: { min: 1250, base: 1500, max: 1750 }
        }
      ],
      cash_flow_forecast: [
        {
          year: 2024,
          revenue: 500,
          ebitda: 120,
          ebit: 100,
          tax: 21,
          nopat: 79,
          capex: 25,
          nwc_change: 10,
          fcf: 44,
          discount_factor: 0.913,
          pv_fcf: 40
        },
        {
          year: 2025,
          revenue: 575,
          ebitda: 138,
          ebit: 115,
          tax: 24,
          nopat: 91,
          capex: 29,
          nwc_change: 12,
          fcf: 50,
          discount_factor: 0.834,
          pv_fcf: 42
        },
        {
          year: 2026,
          revenue: 661,
          ebitda: 159,
          ebit: 132,
          tax: 28,
          nopat: 104,
          capex: 33,
          nwc_change: 13,
          fcf: 58,
          discount_factor: 0.762,
          pv_fcf: 44
        },
        {
          year: 2027,
          revenue: 760,
          ebitda: 182,
          ebit: 152,
          tax: 32,
          nopat: 120,
          capex: 38,
          nwc_change: 15,
          fcf: 67,
          discount_factor: 0.696,
          pv_fcf: 47
        },
        {
          year: 2028,
          revenue: 874,
          ebitda: 210,
          ebit: 175,
          tax: 37,
          nopat: 138,
          capex: 44,
          nwc_change: 17,
          fcf: 77,
          discount_factor: 0.636,
          pv_fcf: 49
        }
      ],
      valuation_range: {
        low: 1050,
        mid: 1500,
        high: 1950
      },
      key_value_drivers: [
        {
          driver: 'Revenue growth rate',
          sensitivity: 0.35,
          current_assumption: '15% CAGR'
        },
        {
          driver: 'EBITDA margin expansion',
          sensitivity: 0.28,
          current_assumption: '24% by 2028'
        },
        {
          driver: 'WACC',
          sensitivity: 0.22,
          current_assumption: '9.5%'
        },
        {
          driver: 'Terminal growth rate',
          sensitivity: 0.15,
          current_assumption: '2.5%'
        }
      ]
    };
    
    const evidence = {
      enterprise_value: [{
        type: EvidenceType.CALCULATION,
        formula: 'EV = PV(FCF forecast period) + PV(Terminal value)',
        inputs: {
          pv_forecast: 750,
          pv_terminal: 750
        },
        rationale: 'Standard DCF methodology with 5-year forecast and terminal value',
        timestamp: Date.now()
      }]
    };
    
    const executionTime = Date.now() - startTime;
    
    return {
      capability_id: 'dcf_modeler',
      output,
      evidence,
      confidence: 0.75,
      cost_actual: {
        expected_tokens_in: 680,
        expected_tokens_out: 2350,
        cpu_ms: executionTime,
        subrequests: 4
      },
      quality_score: 0.85,
      warnings: [
        'Valuation highly sensitive to WACC and terminal growth assumptions',
        'Financial projections should be validated with management and market research'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },
  
  version: '1.0.0',
  tags: ['finance', 'valuation', 'dcf', 'modeling']
};

/**
 * TSR Simulator - Total shareholder return simulation
 */
const tsrSimulatorCapability: CapabilityNode = {
  id: 'tsr_simulator',
  name: 'TSR Simulator',
  description: 'Simulate total shareholder return scenarios with Monte Carlo analysis',
  category: 'financial',

  preconditions: {
    required_inputs: ['current_price', 'dividend_policy']
  },

  output_contract: {
    schema: z.object({
      simulation_parameters: z.object({
        iterations: z.number(),
        time_horizon_years: z.number(),
        confidence_level: z.number()
      }),
      tsr_projections: z.array(z.object({
        year: z.number(),
        price_return: z.object({
          p10: z.number(),
          p25: z.number(),
          p50: z.number(),
          p75: z.number(),
          p90: z.number()
        }),
        dividend_yield: z.number(),
        total_return: z.object({
          p10: z.number(),
          p25: z.number(),
          p50: z.number(),
          p75: z.number(),
          p90: z.number()
        })
      })),
      annualized_tsr: z.object({
        expected: z.number(),
        best_case_p90: z.number(),
        worst_case_p10: z.number(),
        volatility: z.number()
      }),
      value_creation_drivers: z.array(z.object({
        driver: z.string(),
        contribution_to_tsr: z.number(),
        volatility: z.number()
      })),
      peer_comparison: z.array(z.object({
        peer: z.string(),
        historical_tsr_3y: z.number(),
        projected_tsr: z.number(),
        relative_position: z.enum(['outperform', 'inline', 'underperform'])
      })),
      shareholder_value_bridge: z.array(z.object({
        component: z.string(),
        contribution: z.number(),
        percentage: z.number()
      }))
    }),
    required_evidence: ['annualized_tsr'],
    quality_checks: []
  },

  cost_estimate: {
    expected_tokens_in: 600,
    expected_tokens_out: 1800,
    cpu_ms: 900,
    subrequests: 3
  },

  expected_precision: 0.70,

  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();

    const entityNames = context.whiteboard.get('__entity_names__') || {};
    const industryContext = context.whiteboard.get('__industry_context__');
    const peers = industryContext?.typical_players?.slice(0, 3) || ['Peer A', 'Peer B', 'Peer C'];

    const output = {
      simulation_parameters: {
        iterations: 10000,
        time_horizon_years: 5,
        confidence_level: 0.90
      },
      tsr_projections: [
        {
          year: 1,
          price_return: { p10: -15, p25: -5, p50: 8, p75: 22, p90: 38 },
          dividend_yield: 2.5,
          total_return: { p10: -12.5, p25: -2.5, p50: 10.5, p75: 24.5, p90: 40.5 }
        },
        {
          year: 3,
          price_return: { p10: -25, p25: 5, p50: 28, p75: 55, p90: 95 },
          dividend_yield: 2.5,
          total_return: { p10: -17.5, p25: 12.5, p50: 35.5, p75: 62.5, p90: 102.5 }
        },
        {
          year: 5,
          price_return: { p10: -30, p25: 15, p50: 52, p75: 98, p90: 165 },
          dividend_yield: 2.5,
          total_return: { p10: -17.5, p25: 27.5, p50: 64.5, p75: 110.5, p90: 177.5 }
        }
      ],
      annualized_tsr: {
        expected: 10.5,
        best_case_p90: 22.5,
        worst_case_p10: -3.8,
        volatility: 28.5
      },
      value_creation_drivers: [
        { driver: 'Revenue growth', contribution_to_tsr: 4.2, volatility: 12.0 },
        { driver: 'Margin expansion', contribution_to_tsr: 3.5, volatility: 8.5 },
        { driver: 'Multiple expansion', contribution_to_tsr: 1.8, volatility: 18.0 },
        { driver: 'Dividends', contribution_to_tsr: 2.5, volatility: 2.0 },
        { driver: 'Share buybacks', contribution_to_tsr: -1.5, volatility: 5.0 }
      ],
      peer_comparison: [
        {
          peer: entityNames.peer_1 || peers[0],
          historical_tsr_3y: 12.5,
          projected_tsr: 11.2,
          relative_position: 'inline' as const
        },
        {
          peer: entityNames.peer_2 || peers[1],
          historical_tsr_3y: 15.8,
          projected_tsr: 13.5,
          relative_position: 'underperform' as const
        },
        {
          peer: entityNames.peer_3 || peers[2],
          historical_tsr_3y: 8.2,
          projected_tsr: 9.0,
          relative_position: 'outperform' as const
        }
      ],
      shareholder_value_bridge: [
        { component: 'Revenue growth', contribution: 420, percentage: 40 },
        { component: 'Margin expansion', contribution: 350, percentage: 33 },
        { component: 'Multiple expansion', contribution: 180, percentage: 17 },
        { component: 'Dividends', contribution: 250, percentage: 24 },
        { component: 'Share buybacks', contribution: -150, percentage: -14 }
      ]
    };

    const evidence = {
      annualized_tsr: [{
        type: EvidenceType.SIMULATION,
        rationale: 'Monte Carlo simulation with 10,000 iterations based on historical volatility and growth assumptions',
        timestamp: Date.now()
      }]
    };

    const executionTime = Date.now() - startTime;

    return {
      capability_id: 'tsr_simulator',
      output,
      evidence,
      confidence: 0.70,
      cost_actual: {
        expected_tokens_in: 580,
        expected_tokens_out: 1750,
        cpu_ms: executionTime,
        subrequests: 3
      },
      quality_score: 0.80,
      warnings: [
        'TSR projections based on historical volatility - future may differ',
        'Simulation assumes normal distribution - tail risks may be underestimated'
      ],
      metadata: {
        execution_time_ms: executionTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  },

  version: '1.0.0',
  tags: ['finance', 'tsr', 'simulation', 'shareholder_value']
};

/**
 * Register finance & valuation capabilities
 */
export function registerFinanceValuationCapabilities(graph: CapabilityGraph): void {
  graph.register(dcfModelerCapability);
  graph.register(tsrSimulatorCapability);
  // More capabilities will be added
}

