/**
 * Guardrail Output Format
 * 
 * Capabilities should return guardrails (perspectives, questions, dimensions)
 * instead of pre-formatted output. This guides the LLM toward holistic analysis
 * rather than providing deterministic results.
 */

import { z } from 'zod';

/**
 * Guardrail output schema
 * Capabilities return analytical perspectives, not final answers
 */
export const GuardrailOutputSchema = z.object({
  // Core analytical perspectives
  key_questions: z.array(z.string()).describe('Critical questions the LLM should explore for this analysis'),
  analysis_dimensions: z.array(z.object({
    dimension: z.string().describe('Dimension name (e.g., "market_size", "competitive_intensity")'),
    description: z.string().describe('What this dimension measures'),
    considerations: z.array(z.string()).describe('Key factors to consider when analyzing this dimension'),
    data_sources: z.array(z.string()).optional().describe('Suggested data sources for this dimension')
  })).describe('Dimensions of analysis to consider'),
  
  // Trade-offs and constraints
  trade_offs: z.array(z.object({
    trade_off: z.string().describe('Trade-off description (e.g., "precision vs speed")'),
    option_a: z.string().describe('First option'),
    option_b: z.string().describe('Second option'),
    context: z.string().describe('When this trade-off matters')
  })).describe('Key trade-offs to evaluate'),
  
  // Risk monitoring
  risks_to_monitor: z.array(z.object({
    risk: z.string().describe('Risk description'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Risk severity'),
    indicators: z.array(z.string()).describe('Early warning indicators for this risk'),
    mitigation_approaches: z.array(z.string()).optional().describe('Potential mitigation strategies')
  })).describe('Risks to monitor during analysis'),
  
  // Validation criteria
  validation_criteria: z.array(z.object({
    criterion: z.string().describe('What to validate'),
    method: z.string().describe('How to validate it'),
    threshold: z.string().optional().describe('Acceptable threshold if applicable')
  })).optional().describe('Criteria for validating the analysis'),
  
  // Context and constraints
  context: z.object({
    assumptions: z.array(z.string()).optional().describe('Key assumptions underlying this analysis'),
    constraints: z.array(z.string()).optional().describe('Known constraints or limitations'),
    dependencies: z.array(z.string()).optional().describe('Dependencies on other analyses or data')
  }).optional().describe('Contextual information'),
  
  // Suggested next steps
  suggested_next_steps: z.array(z.string()).optional().describe('Recommended follow-up analyses or actions')
});

export type GuardrailOutput = z.infer<typeof GuardrailOutputSchema>;

/**
 * Helper function to create guardrail output
 */
export function createGuardrailOutput(params: {
  key_questions: string[];
  analysis_dimensions: Array<{
    dimension: string;
    description: string;
    considerations: string[];
    data_sources?: string[];
  }>;
  trade_offs: Array<{
    trade_off: string;
    option_a: string;
    option_b: string;
    context: string;
  }>;
  risks_to_monitor: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    mitigation_approaches?: string[];
  }>;
  validation_criteria?: Array<{
    criterion: string;
    method: string;
    threshold?: string;
  }>;
  context?: {
    assumptions?: string[];
    constraints?: string[];
    dependencies?: string[];
  };
  suggested_next_steps?: string[];
}): GuardrailOutput {
  return GuardrailOutputSchema.parse(params);
}

/**
 * Example guardrail output for market sizing capability
 */
export const EXAMPLE_MARKET_SIZING_GUARDRAIL: GuardrailOutput = {
  key_questions: [
    'What is the total addressable market (TAM) and how is it defined?',
    'What are the key market segments and their relative sizes?',
    'What is the historical growth rate and what drives it?',
    'What are the barriers to entry and market saturation indicators?'
  ],
  analysis_dimensions: [
    {
      dimension: 'market_size',
      description: 'Total addressable market and serviceable obtainable market',
      considerations: [
        'Top-down vs bottom-up estimation approaches',
        'Geographic scope and regional variations',
        'Market definition boundaries (what to include/exclude)',
        'Currency and time period for estimates'
      ],
      data_sources: ['Industry reports', 'Government statistics', 'Company filings', 'Expert interviews']
    },
    {
      dimension: 'growth_trajectory',
      description: 'Historical and projected market growth',
      considerations: [
        'CAGR over different time periods',
        'Growth drivers and inhibitors',
        'Cyclicality and seasonality patterns',
        'Inflection points and discontinuities'
      ],
      data_sources: ['Historical data', 'Analyst forecasts', 'Economic indicators']
    },
    {
      dimension: 'market_structure',
      description: 'Competitive landscape and market concentration',
      considerations: [
        'Number and size of competitors',
        'Market share distribution (HHI index)',
        'Barriers to entry and exit',
        'Vertical integration and value chain dynamics'
      ]
    }
  ],
  trade_offs: [
    {
      trade_off: 'Precision vs Speed',
      option_a: 'Detailed bottom-up analysis with primary research',
      option_b: 'Quick top-down estimate using secondary sources',
      context: 'Early-stage opportunity assessment vs detailed business case'
    },
    {
      trade_off: 'Breadth vs Depth',
      option_a: 'Analyze multiple market segments broadly',
      option_b: 'Deep dive into most promising segment',
      context: 'Exploration phase vs execution phase'
    }
  ],
  risks_to_monitor: [
    {
      risk: 'Market definition too broad or narrow',
      severity: 'high',
      indicators: [
        'TAM estimate significantly different from peer analyses',
        'Difficulty identifying clear customer segments',
        'Overlap with adjacent markets'
      ],
      mitigation_approaches: [
        'Validate definition with industry experts',
        'Compare with multiple data sources',
        'Test definition with potential customers'
      ]
    },
    {
      risk: 'Outdated or unreliable data',
      severity: 'medium',
      indicators: [
        'Data sources older than 2 years',
        'Conflicting estimates from different sources',
        'Lack of transparency in methodology'
      ],
      mitigation_approaches: [
        'Triangulate with multiple sources',
        'Adjust for known market changes',
        'Conduct primary research to validate'
      ]
    }
  ],
  validation_criteria: [
    {
      criterion: 'Data source credibility',
      method: 'Verify source reputation, methodology transparency, and recency',
      threshold: 'Sources should be <2 years old and from recognized industry analysts'
    },
    {
      criterion: 'Estimate consistency',
      method: 'Compare top-down and bottom-up estimates',
      threshold: 'Estimates should be within 20% of each other'
    }
  ],
  context: {
    assumptions: [
      'Market boundaries remain stable over forecast period',
      'No major regulatory changes that redefine the market',
      'Historical growth patterns are indicative of future trends'
    ],
    constraints: [
      'Limited access to proprietary market data',
      'Emerging market with sparse historical data',
      'Rapid technological change affecting market definition'
    ],
    dependencies: [
      'Competitive analysis to understand market share dynamics',
      'Customer segmentation to refine TAM/SAM/SOM',
      'Regulatory scan to identify market access barriers'
    ]
  },
  suggested_next_steps: [
    'Conduct customer interviews to validate market size assumptions',
    'Analyze competitor financials to triangulate market estimates',
    'Build sensitivity analysis around key growth drivers',
    'Identify leading indicators for market inflection points'
  ]
};

