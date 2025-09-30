/**
 * Industry Context System
 * 
 * Provides domain-specific templates, regulatory frameworks, and benchmarks
 * to avoid generic consumer SaaS bias in analysis outputs.
 */

/**
 * Industry vertical definitions
 */
export type IndustryVertical = 
  | 'consumer_saas'
  | 'enterprise_saas'
  | 'automotive'
  | 'pharmaceutical'
  | 'energy'
  | 'financial_services'
  | 'manufacturing'
  | 'retail'
  | 'healthcare'
  | 'telecommunications'
  | 'aerospace'
  | 'agriculture'
  | 'construction'
  | 'education'
  | 'media_entertainment'
  | 'logistics'
  | 'real_estate'
  | 'professional_services'
  | 'government'
  | 'generic';

/**
 * Geographic region for regulatory context
 */
export type GeographicRegion = 
  | 'north_america'
  | 'europe'
  | 'asia_pacific'
  | 'latin_america'
  | 'middle_east'
  | 'africa'
  | 'global';

/**
 * Industry context configuration
 */
export interface IndustryContext {
  vertical: IndustryVertical;
  region: GeographicRegion;
  
  // Regulatory frameworks
  regulatory_frameworks: Array<{
    name: string;
    description: string;
    compliance_level: 'mandatory' | 'recommended' | 'optional';
    regions: GeographicRegion[];
  }>;
  
  // Key metrics and benchmarks
  key_metrics: Array<{
    name: string;
    description: string;
    typical_range?: string;
    unit?: string;
  }>;
  
  // Typical competitors/players
  typical_players?: string[];
  
  // Market characteristics
  market_characteristics: {
    typical_sales_cycle_days?: number;
    typical_cac_range?: string;
    typical_gross_margin?: string;
    typical_churn_rate?: string;
    capital_intensity: 'low' | 'medium' | 'high' | 'very_high';
    regulatory_burden: 'low' | 'medium' | 'high' | 'very_high';
    innovation_pace: 'slow' | 'moderate' | 'fast' | 'very_fast';
  };
  
  // Domain-specific terminology
  terminology: Record<string, string>;
}

/**
 * Industry context registry
 */
export const INDUSTRY_CONTEXTS: Record<IndustryVertical, IndustryContext> = {
  automotive: {
    vertical: 'automotive',
    region: 'global',
    regulatory_frameworks: [
      {
        name: 'Euro NCAP',
        description: 'European New Car Assessment Programme - safety ratings',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'GSR 2 (General Safety Regulation)',
        description: 'EU regulation for advanced safety features',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'UN R155 (Cybersecurity)',
        description: 'UN regulation for vehicle cybersecurity management',
        compliance_level: 'mandatory',
        regions: ['europe', 'asia_pacific']
      },
      {
        name: 'UN R156 (Software Updates)',
        description: 'UN regulation for software update management systems',
        compliance_level: 'mandatory',
        regions: ['europe', 'asia_pacific']
      },
      {
        name: 'FMVSS (Federal Motor Vehicle Safety Standards)',
        description: 'US federal safety standards',
        compliance_level: 'mandatory',
        regions: ['north_america']
      },
      {
        name: 'CAFE Standards',
        description: 'Corporate Average Fuel Economy standards',
        compliance_level: 'mandatory',
        regions: ['north_america']
      }
    ],
    key_metrics: [
      { name: 'Units Sold', description: 'Annual vehicle sales volume', unit: 'units' },
      { name: 'ASP (Average Selling Price)', description: 'Average vehicle price', unit: 'USD' },
      { name: 'Gross Margin', description: 'Vehicle gross margin', typical_range: '15-25%' },
      { name: 'R&D Intensity', description: 'R&D as % of revenue', typical_range: '4-8%' },
      { name: 'Warranty Cost', description: 'Warranty costs as % of revenue', typical_range: '2-4%' },
      { name: 'Inventory Days', description: 'Days of inventory', typical_range: '30-60 days' },
      { name: 'Capacity Utilization', description: 'Plant capacity utilization', typical_range: '70-85%' }
    ],
    typical_players: [
      'Toyota', 'Volkswagen Group', 'General Motors', 'Ford', 'Stellantis',
      'Honda', 'Nissan', 'Hyundai-Kia', 'BMW', 'Mercedes-Benz', 'Tesla',
      'BYD', 'Geely', 'SAIC', 'Renault'
    ],
    market_characteristics: {
      typical_sales_cycle_days: 30,
      typical_cac_range: '$500-2000',
      typical_gross_margin: '15-25%',
      capital_intensity: 'very_high',
      regulatory_burden: 'very_high',
      innovation_pace: 'fast'
    },
    terminology: {
      'customer': 'buyer/fleet operator',
      'product': 'vehicle/model',
      'feature': 'equipment/option',
      'subscription': 'connected services',
      'churn': 'brand switching rate'
    }
  },
  
  pharmaceutical: {
    vertical: 'pharmaceutical',
    region: 'global',
    regulatory_frameworks: [
      {
        name: 'EMA (European Medicines Agency)',
        description: 'EU drug approval and monitoring',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'FDA (Food and Drug Administration)',
        description: 'US drug approval and monitoring',
        compliance_level: 'mandatory',
        regions: ['north_america']
      },
      {
        name: 'ICH GCP',
        description: 'International Conference on Harmonisation - Good Clinical Practice',
        compliance_level: 'mandatory',
        regions: ['global']
      },
      {
        name: 'GMP (Good Manufacturing Practice)',
        description: 'Quality standards for pharmaceutical manufacturing',
        compliance_level: 'mandatory',
        regions: ['global']
      },
      {
        name: 'Pharmacovigilance Regulations',
        description: 'Post-market safety monitoring requirements',
        compliance_level: 'mandatory',
        regions: ['global']
      }
    ],
    key_metrics: [
      { name: 'Pipeline Value', description: 'NPV of drug pipeline', unit: 'USD' },
      { name: 'R&D Intensity', description: 'R&D as % of revenue', typical_range: '15-25%' },
      { name: 'Gross Margin', description: 'Product gross margin', typical_range: '70-85%' },
      { name: 'Patent Cliff Exposure', description: 'Revenue at risk from patent expiry', unit: '%' },
      { name: 'Clinical Trial Success Rate', description: 'Phase I-III success rate', typical_range: '10-15%' },
      { name: 'Time to Market', description: 'Development to approval', typical_range: '10-15 years' },
      { name: 'Peak Sales', description: 'Maximum annual sales per drug', unit: 'USD' }
    ],
    typical_players: [
      'Pfizer', 'Roche', 'Novartis', 'Johnson & Johnson', 'Merck',
      'AbbVie', 'Bristol Myers Squibb', 'AstraZeneca', 'GSK', 'Sanofi',
      'Eli Lilly', 'Amgen', 'Gilead', 'Novo Nordisk', 'Takeda'
    ],
    market_characteristics: {
      typical_sales_cycle_days: 180,
      typical_gross_margin: '70-85%',
      capital_intensity: 'high',
      regulatory_burden: 'very_high',
      innovation_pace: 'slow'
    },
    terminology: {
      'customer': 'patient/prescriber/payer',
      'product': 'drug/therapy',
      'feature': 'indication/formulation',
      'launch': 'market authorization',
      'churn': 'treatment discontinuation'
    }
  },
  
  energy: {
    vertical: 'energy',
    region: 'global',
    regulatory_frameworks: [
      {
        name: 'EU ETS (Emissions Trading System)',
        description: 'Carbon pricing mechanism',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'Renewable Energy Directive (RED)',
        description: 'EU renewable energy targets',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'FERC Regulations',
        description: 'Federal Energy Regulatory Commission rules',
        compliance_level: 'mandatory',
        regions: ['north_america']
      },
      {
        name: 'ISO 50001',
        description: 'Energy management systems standard',
        compliance_level: 'recommended',
        regions: ['global']
      }
    ],
    key_metrics: [
      { name: 'Generation Capacity', description: 'Installed capacity', unit: 'MW/GW' },
      { name: 'Capacity Factor', description: 'Actual vs theoretical output', typical_range: '30-90%' },
      { name: 'LCOE', description: 'Levelized Cost of Energy', unit: '$/MWh' },
      { name: 'Carbon Intensity', description: 'CO2 emissions per MWh', unit: 'tCO2/MWh' },
      { name: 'Grid Reliability', description: 'Uptime percentage', typical_range: '99.9%+' },
      { name: 'Renewable Mix', description: '% of renewable generation', unit: '%' }
    ],
    market_characteristics: {
      capital_intensity: 'very_high',
      regulatory_burden: 'very_high',
      innovation_pace: 'moderate'
    },
    terminology: {
      'customer': 'offtaker/utility/end-user',
      'product': 'generation asset/capacity',
      'subscription': 'PPA (Power Purchase Agreement)',
      'churn': 'contract non-renewal'
    }
  },
  
  financial_services: {
    vertical: 'financial_services',
    region: 'global',
    regulatory_frameworks: [
      {
        name: 'Basel III',
        description: 'International banking capital requirements',
        compliance_level: 'mandatory',
        regions: ['global']
      },
      {
        name: 'MiFID II',
        description: 'Markets in Financial Instruments Directive',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'Dodd-Frank',
        description: 'US financial reform legislation',
        compliance_level: 'mandatory',
        regions: ['north_america']
      },
      {
        name: 'GDPR',
        description: 'Data protection regulation',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'PSD2',
        description: 'Payment Services Directive',
        compliance_level: 'mandatory',
        regions: ['europe']
      }
    ],
    key_metrics: [
      { name: 'AUM', description: 'Assets Under Management', unit: 'USD' },
      { name: 'NIM', description: 'Net Interest Margin', typical_range: '2-4%' },
      { name: 'Cost-to-Income Ratio', description: 'Operating efficiency', typical_range: '50-70%' },
      { name: 'NPL Ratio', description: 'Non-Performing Loans ratio', typical_range: '<3%' },
      { name: 'CET1 Ratio', description: 'Common Equity Tier 1 capital ratio', typical_range: '>10%' },
      { name: 'ROE', description: 'Return on Equity', typical_range: '8-15%' }
    ],
    market_characteristics: {
      capital_intensity: 'medium',
      regulatory_burden: 'very_high',
      innovation_pace: 'moderate'
    },
    terminology: {
      'customer': 'client/account holder',
      'product': 'financial product/service',
      'churn': 'attrition rate'
    }
  },
  
  // Generic fallback
  consumer_saas: {
    vertical: 'consumer_saas',
    region: 'global',
    regulatory_frameworks: [
      {
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        compliance_level: 'mandatory',
        regions: ['europe']
      },
      {
        name: 'SOC 2',
        description: 'Security and availability controls',
        compliance_level: 'recommended',
        regions: ['global']
      }
    ],
    key_metrics: [
      { name: 'MRR', description: 'Monthly Recurring Revenue', unit: 'USD' },
      { name: 'CAC', description: 'Customer Acquisition Cost', unit: 'USD' },
      { name: 'LTV', description: 'Lifetime Value', unit: 'USD' },
      { name: 'Churn Rate', description: 'Monthly customer churn', typical_range: '3-7%' },
      { name: 'NRR', description: 'Net Revenue Retention', typical_range: '100-120%' }
    ],
    market_characteristics: {
      typical_sales_cycle_days: 30,
      typical_cac_range: '$100-500',
      typical_gross_margin: '70-85%',
      typical_churn_rate: '3-7%',
      capital_intensity: 'low',
      regulatory_burden: 'medium',
      innovation_pace: 'very_fast'
    },
    terminology: {}
  },
  
  enterprise_saas: {
    vertical: 'enterprise_saas',
    region: 'global',
    regulatory_frameworks: [],
    key_metrics: [],
    market_characteristics: {
      capital_intensity: 'low',
      regulatory_burden: 'medium',
      innovation_pace: 'fast'
    },
    terminology: {}
  },
  
  manufacturing: {
    vertical: 'manufacturing',
    region: 'global',
    regulatory_frameworks: [],
    key_metrics: [],
    market_characteristics: {
      capital_intensity: 'high',
      regulatory_burden: 'medium',
      innovation_pace: 'moderate'
    },
    terminology: {}
  },
  
  retail: { vertical: 'retail', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'medium', regulatory_burden: 'low', innovation_pace: 'fast' }, terminology: {} },
  healthcare: { vertical: 'healthcare', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'high', regulatory_burden: 'very_high', innovation_pace: 'moderate' }, terminology: {} },
  telecommunications: { vertical: 'telecommunications', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'very_high', regulatory_burden: 'high', innovation_pace: 'moderate' }, terminology: {} },
  aerospace: { vertical: 'aerospace', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'very_high', regulatory_burden: 'very_high', innovation_pace: 'slow' }, terminology: {} },
  agriculture: { vertical: 'agriculture', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'high', regulatory_burden: 'medium', innovation_pace: 'moderate' }, terminology: {} },
  construction: { vertical: 'construction', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'medium', regulatory_burden: 'high', innovation_pace: 'slow' }, terminology: {} },
  education: { vertical: 'education', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'medium', regulatory_burden: 'high', innovation_pace: 'moderate' }, terminology: {} },
  media_entertainment: { vertical: 'media_entertainment', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'medium', regulatory_burden: 'medium', innovation_pace: 'very_fast' }, terminology: {} },
  logistics: { vertical: 'logistics', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'high', regulatory_burden: 'medium', innovation_pace: 'moderate' }, terminology: {} },
  real_estate: { vertical: 'real_estate', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'very_high', regulatory_burden: 'high', innovation_pace: 'slow' }, terminology: {} },
  professional_services: { vertical: 'professional_services', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'low', regulatory_burden: 'medium', innovation_pace: 'moderate' }, terminology: {} },
  government: { vertical: 'government', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'medium', regulatory_burden: 'very_high', innovation_pace: 'slow' }, terminology: {} },
  generic: { vertical: 'generic', region: 'global', regulatory_frameworks: [], key_metrics: [], market_characteristics: { capital_intensity: 'medium', regulatory_burden: 'medium', innovation_pace: 'moderate' }, terminology: {} }
};

/**
 * Detect industry from task description
 */
export function detectIndustry(taskDescription: string): IndustryVertical {
  const text = taskDescription.toLowerCase();
  
  // Automotive keywords
  if (/(automotive|vehicle|car|oem|tier[- ]?[123]|ncap|adas|ev|electric vehicle)/i.test(text)) {
    return 'automotive';
  }
  
  // Pharmaceutical keywords
  if (/(pharma|drug|clinical trial|fda|ema|biotech|therapeutic)/i.test(text)) {
    return 'pharmaceutical';
  }
  
  // Energy keywords
  if (/(energy|power|renewable|solar|wind|grid|utility|generation)/i.test(text)) {
    return 'energy';
  }
  
  // Financial services keywords
  if (/(bank|financial services|fintech|payment|lending|insurance|asset management)/i.test(text)) {
    return 'financial_services';
  }
  
  // Add more detection logic...
  
  return 'generic';
}

/**
 * Get industry context
 */
export function getIndustryContext(vertical: IndustryVertical, region?: GeographicRegion): IndustryContext {
  const context = INDUSTRY_CONTEXTS[vertical] || INDUSTRY_CONTEXTS.generic;
  
  if (region && region !== context.region) {
    // Filter regulatory frameworks by region
    return {
      ...context,
      region,
      regulatory_frameworks: context.regulatory_frameworks.filter(
        rf => rf.regions.includes(region) || rf.regions.includes('global')
      )
    };
  }
  
  return context;
}

