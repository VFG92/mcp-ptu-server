/**
 * Market Analysis Capabilities - GUARDRAIL VERSION
 * 
 * These capabilities return analytical perspectives (guardrails) instead of
 * pre-formatted output. They guide the LLM toward holistic analysis rather
 * than providing deterministic results.
 */

import { z } from 'zod';
import type {
  CapabilityNode,
  CapabilityResult,
  ExecutionContext
} from '../capability-graph.js';
import { EvidenceType } from '../capability-graph.js';
import { GuardrailOutputSchema, createGuardrailOutput, type GuardrailOutput } from '../guardrail-output.js';

/**
 * Market Scan - GUARDRAIL VERSION
 * Returns analytical perspectives instead of pre-formatted data
 */
const marketScanGuardrailCapability: CapabilityNode = {
  id: 'market_scan_guardrail',
  name: 'Market Scan (Guardrail)',
  description: 'Provides analytical perspectives for market structure analysis - guides LLM toward holistic market assessment',
  category: 'market',
  
  preconditions: {
    required_inputs: ['industry', 'geography']
  },
  
  output_contract: {
    schema: GuardrailOutputSchema,
    required_evidence: [],
    quality_checks: [
      {
        name: 'has_key_questions',
        check: (output) => output.key_questions && output.key_questions.length >= 3,
        error_message: 'Must provide at least 3 key questions'
      },
      {
        name: 'has_analysis_dimensions',
        check: (output) => output.analysis_dimensions && output.analysis_dimensions.length >= 2,
        error_message: 'Must provide at least 2 analysis dimensions'
      }
    ]
  },
  
  cost_estimate: {
    expected_tokens_in: 200,
    expected_tokens_out: 1200, // More tokens for guardrails than raw data
    cpu_ms: 300,
    subrequests: 0 // No external calls needed for guardrails
  },
  
  expected_precision: 0.85, // Higher precision because we're providing structure, not data
  
  async execute(inputs: any, context: ExecutionContext): Promise<CapabilityResult> {
    const startTime = Date.now();
    
    const industry = inputs.industry || 'technology';
    const geography = inputs.geography || 'global';
    
    // Return guardrails that guide the LLM's analysis
    const output: GuardrailOutput = createGuardrailOutput({
      key_questions: [
        `What is the total addressable market (TAM) for ${industry} in ${geography}?`,
        `Who are the dominant players and what are their competitive strategies?`,
        `What is the market structure (monopoly, oligopoly, fragmented)?`,
        `What are the key growth drivers and inhibitors?`,
        `What are the barriers to entry for new players?`,
        `How is the market segmented (by customer type, geography, product)?`
      ],
      
      analysis_dimensions: [
        {
          dimension: 'market_size_and_growth',
          description: 'Total market size, growth rate, and trajectory',
          considerations: [
            'Use multiple estimation methods (top-down, bottom-up, value theory)',
            'Consider different market definitions (TAM vs SAM vs SOM)',
            'Analyze historical growth patterns and future projections',
            'Identify inflection points and discontinuities',
            'Account for geographic and segment variations'
          ],
          data_sources: [
            'Industry analyst reports (Gartner, IDC, Forrester)',
            'Government statistics and trade associations',
            'Public company filings and investor presentations',
            'Academic research and market studies'
          ]
        },
        {
          dimension: 'competitive_landscape',
          description: 'Market structure, key players, and competitive dynamics',
          considerations: [
            'Identify top 5-10 players by market share',
            'Analyze competitive positioning (cost leadership, differentiation, niche)',
            'Assess market concentration (HHI index, CR4 ratio)',
            'Evaluate barriers to entry (capital, technology, regulation, brand)',
            'Understand competitive moves (M&A, partnerships, new products)'
          ],
          data_sources: [
            'Company websites and annual reports',
            'News articles and press releases',
            'Industry conferences and trade shows',
            'Customer reviews and analyst opinions'
          ]
        },
        {
          dimension: 'market_trends',
          description: 'Key trends shaping market evolution',
          considerations: [
            'Technology trends (automation, AI, cloud, mobile)',
            'Regulatory trends (new laws, compliance requirements)',
            'Customer behavior trends (preferences, buying patterns)',
            'Economic trends (GDP growth, interest rates, inflation)',
            'Social trends (demographics, values, lifestyle)'
          ],
          data_sources: [
            'Trend reports from consulting firms',
            'Technology adoption curves',
            'Regulatory filings and policy documents',
            'Consumer surveys and sentiment analysis'
          ]
        },
        {
          dimension: 'value_chain_dynamics',
          description: 'How value is created and captured in the market',
          considerations: [
            'Map the value chain from suppliers to end customers',
            'Identify where value is concentrated (which stages are most profitable)',
            'Analyze vertical integration vs specialization trends',
            'Assess power dynamics (supplier power, buyer power)',
            'Understand disintermediation and platform dynamics'
          ]
        }
      ],
      
      trade_offs: [
        {
          trade_off: 'Market definition breadth',
          option_a: 'Broad market definition (larger TAM, more competition)',
          option_b: 'Narrow market definition (smaller TAM, clearer positioning)',
          context: 'Affects addressable market size, competitive set, and positioning strategy'
        },
        {
          trade_off: 'Data recency vs reliability',
          option_a: 'Recent data (more current but potentially less validated)',
          option_b: 'Historical data (more reliable but potentially outdated)',
          context: 'Fast-moving markets require recent data; stable markets can use historical'
        },
        {
          trade_off: 'Geographic scope',
          option_a: 'Global market view (comprehensive but complex)',
          option_b: 'Regional focus (simpler but may miss opportunities)',
          context: 'Depends on business model, resources, and expansion strategy'
        }
      ],
      
      risks_to_monitor: [
        {
          risk: 'Market definition mismatch',
          severity: 'high',
          indicators: [
            'TAM estimate varies widely across sources',
            'Difficulty identifying clear customer segments',
            'Overlap with adjacent markets',
            'Customers describe the market differently than analysts'
          ],
          mitigation_approaches: [
            'Validate definition with industry experts and customers',
            'Use multiple market definition frameworks',
            'Test definition against actual buying behavior',
            'Iterate definition based on feedback'
          ]
        },
        {
          risk: 'Outdated or biased data',
          severity: 'medium',
          indicators: [
            'Data sources older than 18-24 months',
            'Single source dependency',
            'Conflicting estimates from different sources',
            'Lack of methodology transparency'
          ],
          mitigation_approaches: [
            'Triangulate with multiple independent sources',
            'Adjust historical data for known market changes',
            'Conduct primary research to validate',
            'Document data limitations and assumptions'
          ]
        },
        {
          risk: 'Missing emerging competitors',
          severity: 'medium',
          indicators: [
            'Focus only on established players',
            'Ignoring startups and new entrants',
            'Not monitoring adjacent markets',
            'Underestimating substitute products'
          ],
          mitigation_approaches: [
            'Monitor venture capital investments',
            'Track startup ecosystems and accelerators',
            'Analyze patent filings and R&D trends',
            'Conduct regular competitive intelligence scans'
          ]
        }
      ],
      
      validation_criteria: [
        {
          criterion: 'Market size reasonableness',
          method: 'Compare TAM estimate with related markets and economic indicators',
          threshold: 'Should be consistent with GDP, industry spending, or comparable markets'
        },
        {
          criterion: 'Competitive landscape completeness',
          method: 'Verify top players account for majority of market',
          threshold: 'Top 5-10 players should represent >50% of market in fragmented markets, >80% in concentrated markets'
        },
        {
          criterion: 'Data source credibility',
          method: 'Assess source reputation, methodology, and independence',
          threshold: 'Primary sources from recognized analysts or government agencies'
        }
      ],
      
      context: {
        assumptions: [
          'Market boundaries remain relatively stable over analysis period',
          'Historical growth patterns are indicative of future trends',
          'Competitive dynamics follow rational economic behavior',
          'Data sources provide representative view of market'
        ],
        constraints: [
          'Limited access to proprietary market data',
          'Emerging markets may lack historical data',
          'Rapid technological change may invalidate historical patterns',
          'Geographic variations may require localized analysis'
        ],
        dependencies: [
          'Customer segmentation analysis for SAM/SOM refinement',
          'Competitive analysis for market share validation',
          'Technology trend analysis for disruption assessment',
          'Regulatory scan for market access barriers'
        ]
      },
      
      suggested_next_steps: [
        'Conduct customer interviews to validate market size and segmentation',
        'Analyze top competitors in detail (products, pricing, positioning)',
        'Build market sizing model with sensitivity analysis',
        'Identify leading indicators for market inflection points',
        'Map value chain to understand profit pools',
        'Assess regulatory and technology trends that could reshape market'
      ]
    });
    
    return {
      capability_id: 'market_scan_guardrail',
      output,
      evidence: {},
      confidence: 0.85,
      cost_actual: {
        expected_tokens_in: 200,
        expected_tokens_out: 1200,
        cpu_ms: Date.now() - startTime,
        subrequests: 0
      },
      quality_score: 0.9,
      warnings: [],
      metadata: {
        execution_time_ms: Date.now() - startTime,
        timestamp: Date.now(),
        version: '1.0.0-guardrail'
      }
    };
  },
  
  version: '1.0.0-guardrail',
  tags: ['market', 'analysis', 'guardrail', 'holistic'],
  examples: [
    {
      input: { industry: 'fintech', geography: 'Europe' },
      expected_output: 'Guardrails for European fintech market analysis',
      description: 'Provides analytical framework for fintech market assessment'
    }
  ]
};

/**
 * Register guardrail capabilities
 */
export function registerMarketGuardrailCapabilities(graph: any): void {
  graph.register(marketScanGuardrailCapability);
}

export { marketScanGuardrailCapability };

