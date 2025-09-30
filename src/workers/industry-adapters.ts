/**
 * Industry Adapters
 * 
 * Specialized adapters that combine domain-specific templates with regulatory frameworks
 * and industry-specific analysis logic for each vertical.
 */

import type { IndustryVertical, IndustryContext, GeographicRegion } from './industry-context.js';
import { getIndustryContext } from './industry-context.js';

/**
 * Base Industry Adapter interface
 */
export interface IndustryAdapter {
  vertical: IndustryVertical;
  
  /**
   * Adapt generic analysis output to industry-specific format
   */
  adaptOutput(genericOutput: any, context: IndustryContext): any;
  
  /**
   * Get industry-specific KPIs and benchmarks
   */
  getKPIs(): Array<{ name: string; description: string; benchmark?: string }>;
  
  /**
   * Get regulatory compliance requirements
   */
  getRegulatoryRequirements(region: GeographicRegion): Array<{
    framework: string;
    requirements: string[];
    deadline?: string;
    penalties?: string;
  }>;
  
  /**
   * Translate generic terminology to industry-specific terms
   */
  translateTerminology(term: string): string;
  
  /**
   * Get industry-specific risk factors
   */
  getRiskFactors(): Array<{ risk: string; severity: 'critical' | 'high' | 'medium' | 'low'; mitigation: string }>;
  
  /**
   * Get competitive landscape insights
   */
  getCompetitiveLandscape(): {
    market_structure: string;
    key_success_factors: string[];
    barriers_to_entry: string[];
    typical_players: string[];
  };
}

/**
 * Automotive Industry Adapter
 */
export class AutomotiveAdapter implements IndustryAdapter {
  vertical: IndustryVertical = 'automotive';
  
  adaptOutput(genericOutput: any, context: IndustryContext): any {
    return {
      ...genericOutput,
      industry_context: {
        vertical: 'automotive',
        key_trends: [
          'Electrification (BEV/PHEV transition)',
          'Autonomous driving (L2-L4 ADAS)',
          'Software-defined vehicles',
          'Direct-to-consumer sales models',
          'Circular economy / battery recycling'
        ],
        regulatory_focus: context.regulatory_frameworks.map(rf => rf.name),
        supply_chain_considerations: [
          'Semiconductor shortage mitigation',
          'Battery supply chain (lithium, cobalt)',
          'Tier 1/2/3 supplier dependencies',
          'Reshoring vs offshoring trade-offs'
        ]
      }
    };
  }
  
  getKPIs() {
    return [
      { name: 'Units Sold', description: 'Annual vehicle sales volume', benchmark: 'Top OEMs: 5-10M units/year' },
      { name: 'ASP', description: 'Average Selling Price', benchmark: '$25K-$50K (mass market), $50K+ (premium)' },
      { name: 'Gross Margin', description: 'Vehicle gross margin', benchmark: '15-25%' },
      { name: 'R&D Intensity', description: 'R&D as % of revenue', benchmark: '4-8%' },
      { name: 'Warranty Cost', description: 'Warranty as % of revenue', benchmark: '2-4%' },
      { name: 'Capacity Utilization', description: 'Plant utilization', benchmark: '70-85%' },
      { name: 'BEV Mix', description: '% of electric vehicles', benchmark: 'Target: 50%+ by 2030' }
    ];
  }
  
  getRegulatoryRequirements(region: GeographicRegion) {
    const requirements = [];
    
    if (region === 'europe' || region === 'global') {
      requirements.push({
        framework: 'Euro NCAP',
        requirements: ['5-star safety rating', 'Advanced safety features (AEB, LKA)', 'Pedestrian protection'],
        deadline: 'Ongoing',
        penalties: 'Market reputation damage, reduced sales'
      });
      requirements.push({
        framework: 'UN R155/R156 (Cybersecurity & OTA)',
        requirements: ['CSMS certification', 'OTA update management', 'Vulnerability monitoring'],
        deadline: 'July 2024 (new models)',
        penalties: 'Type approval denial'
      });
      requirements.push({
        framework: 'CO2 Emission Standards',
        requirements: ['Fleet average <95g CO2/km', 'ZEV credits', 'Penalty payments for excess'],
        deadline: 'Ongoing',
        penalties: '€95 per g/km excess × vehicles sold'
      });
    }
    
    if (region === 'north_america' || region === 'global') {
      requirements.push({
        framework: 'FMVSS',
        requirements: ['Crash test compliance', 'ADAS validation', 'Recall management'],
        deadline: 'Ongoing',
        penalties: 'NHTSA fines, recalls'
      });
      requirements.push({
        framework: 'CAFE Standards',
        requirements: ['Fleet fuel economy targets', 'Credit trading', 'Alternative fuel credits'],
        deadline: 'Ongoing',
        penalties: '$5.50 per 0.1 mpg × vehicles sold'
      });
    }
    
    return requirements;
  }
  
  translateTerminology(term: string): string {
    const translations: Record<string, string> = {
      'customer': 'buyer / fleet operator',
      'product': 'vehicle / model',
      'feature': 'equipment package / option',
      'subscription': 'connected services / OTA features',
      'churn': 'brand switching rate',
      'retention': 'brand loyalty',
      'upsell': 'trim upgrade / option attach',
      'revenue': 'vehicle sales + aftermarket + services'
    };
    return translations[term.toLowerCase()] || term;
  }
  
  getRiskFactors() {
    return [
      { risk: 'Battery supply chain disruption', severity: 'critical' as const, mitigation: 'Vertical integration, multiple suppliers, recycling programs' },
      { risk: 'Semiconductor shortage', severity: 'high' as const, mitigation: 'Long-term supply agreements, inventory buffers, design simplification' },
      { risk: 'Regulatory non-compliance (emissions)', severity: 'critical' as const, mitigation: 'Accelerate BEV transition, hybrid portfolio, credit purchases' },
      { risk: 'Cybersecurity vulnerabilities', severity: 'high' as const, mitigation: 'CSMS implementation, SOC operations, bug bounty programs' },
      { risk: 'Autonomous driving liability', severity: 'high' as const, mitigation: 'Insurance partnerships, regulatory engagement, gradual rollout' }
    ];
  }
  
  getCompetitiveLandscape() {
    return {
      market_structure: 'Oligopolistic with emerging disruptors (Tesla, BYD, new EV startups)',
      key_success_factors: [
        'BEV platform competitiveness (range, charging, cost)',
        'Software capabilities (OTA, ADAS, infotainment)',
        'Brand strength and dealer network',
        'Manufacturing scale and efficiency',
        'Battery technology and supply chain'
      ],
      barriers_to_entry: [
        'Capital intensity ($5-10B for new plant)',
        'Regulatory compliance (type approval, safety)',
        'Dealer network / service infrastructure',
        'Brand recognition and trust',
        'Supply chain complexity (20K+ parts)'
      ],
      typical_players: ['Toyota', 'VW Group', 'GM', 'Ford', 'Stellantis', 'Tesla', 'BYD', 'Hyundai-Kia', 'BMW', 'Mercedes']
    };
  }
}

/**
 * Pharmaceutical Industry Adapter
 */
export class PharmaceuticalAdapter implements IndustryAdapter {
  vertical: IndustryVertical = 'pharmaceutical';
  
  adaptOutput(genericOutput: any, context: IndustryContext): any {
    return {
      ...genericOutput,
      industry_context: {
        vertical: 'pharmaceutical',
        key_trends: [
          'Precision medicine / personalized therapies',
          'Cell & gene therapy',
          'AI-driven drug discovery',
          'Biosimilars competition',
          'Value-based pricing models'
        ],
        regulatory_focus: context.regulatory_frameworks.map(rf => rf.name),
        pipeline_considerations: [
          'Patent cliff management',
          'Clinical trial success rates',
          'Regulatory approval timelines',
          'Reimbursement negotiations'
        ]
      }
    };
  }
  
  getKPIs() {
    return [
      { name: 'Pipeline Value', description: 'NPV of drug pipeline', benchmark: '$10B-$50B+ for major pharma' },
      { name: 'R&D Intensity', description: 'R&D as % of revenue', benchmark: '15-25%' },
      { name: 'Gross Margin', description: 'Product gross margin', benchmark: '70-85%' },
      { name: 'Patent Cliff Exposure', description: 'Revenue at risk from LOE', benchmark: '<20% in next 3 years' },
      { name: 'Clinical Success Rate', description: 'Phase I-III success', benchmark: '10-15%' },
      { name: 'Time to Market', description: 'Discovery to approval', benchmark: '10-15 years' },
      { name: 'Peak Sales', description: 'Blockbuster threshold', benchmark: '$1B+ annual sales' }
    ];
  }
  
  getRegulatoryRequirements(region: GeographicRegion) {
    const requirements = [];
    
    requirements.push({
      framework: 'ICH GCP (Good Clinical Practice)',
      requirements: ['Clinical trial protocols', 'Informed consent', 'Data integrity', 'Safety reporting'],
      deadline: 'Ongoing',
      penalties: 'Trial suspension, regulatory action'
    });
    
    requirements.push({
      framework: 'GMP (Good Manufacturing Practice)',
      requirements: ['Quality management system', 'Batch records', 'Contamination control', 'Validation'],
      deadline: 'Ongoing',
      penalties: 'Manufacturing shutdown, product recalls'
    });
    
    if (region === 'europe' || region === 'global') {
      requirements.push({
        framework: 'EMA Marketing Authorization',
        requirements: ['Clinical dossier', 'Risk management plan', 'Pharmacovigilance', 'Pediatric investigation plan'],
        deadline: 'Pre-launch',
        penalties: 'Market access denial'
      });
    }
    
    if (region === 'north_america' || region === 'global') {
      requirements.push({
        framework: 'FDA NDA/BLA Approval',
        requirements: ['Phase I-III data', 'CMC documentation', 'REMS if required', 'Post-market surveillance'],
        deadline: 'Pre-launch',
        penalties: 'Approval delay/denial, black box warnings'
      });
    }
    
    return requirements;
  }
  
  translateTerminology(term: string): string {
    const translations: Record<string, string> = {
      'customer': 'patient / prescriber / payer',
      'product': 'drug / therapy / indication',
      'feature': 'formulation / dosing / delivery method',
      'launch': 'market authorization / commercialization',
      'churn': 'treatment discontinuation',
      'retention': 'treatment persistence',
      'upsell': 'indication expansion',
      'pipeline': 'clinical development portfolio'
    };
    return translations[term.toLowerCase()] || term;
  }
  
  getRiskFactors() {
    return [
      { risk: 'Clinical trial failure', severity: 'critical' as const, mitigation: 'Diversified pipeline, adaptive trial designs, biomarker selection' },
      { risk: 'Patent expiry / LOE', severity: 'critical' as const, mitigation: 'Life-cycle management, new indications, authorized generics' },
      { risk: 'Pricing pressure / reimbursement', severity: 'high' as const, mitigation: 'Value-based contracts, real-world evidence, patient assistance' },
      { risk: 'Manufacturing quality issues', severity: 'high' as const, mitigation: 'Robust QMS, supplier audits, redundant capacity' },
      { risk: 'Safety signals / adverse events', severity: 'critical' as const, mitigation: 'Pharmacovigilance, risk management plans, proactive communication' }
    ];
  }
  
  getCompetitiveLandscape() {
    return {
      market_structure: 'Concentrated with specialized biotech disruptors',
      key_success_factors: [
        'Innovative pipeline (first-in-class, best-in-class)',
        'Clinical development expertise',
        'Regulatory affairs capabilities',
        'Commercial infrastructure (sales force, market access)',
        'M&A and licensing capabilities'
      ],
      barriers_to_entry: [
        'R&D capital requirements ($2-3B per approved drug)',
        'Regulatory expertise and relationships',
        'Clinical trial infrastructure',
        'Manufacturing capabilities (especially biologics)',
        'Reimbursement and market access'
      ],
      typical_players: ['Pfizer', 'Roche', 'Novartis', 'J&J', 'Merck', 'AbbVie', 'BMS', 'AstraZeneca', 'GSK', 'Sanofi']
    };
  }
}

/**
 * Energy Industry Adapter
 */
export class EnergyAdapter implements IndustryAdapter {
  vertical: IndustryVertical = 'energy';

  adaptOutput(genericOutput: any, context: IndustryContext): any {
    return {
      ...genericOutput,
      industry_context: {
        vertical: 'energy',
        key_trends: [
          'Renewable energy transition (solar, wind, storage)',
          'Grid modernization and smart grids',
          'Hydrogen economy development',
          'Carbon capture and storage (CCS)',
          'Distributed energy resources (DER)'
        ],
        regulatory_focus: context.regulatory_frameworks.map(rf => rf.name),
        operational_considerations: [
          'Capacity factor optimization',
          'Grid reliability and balancing',
          'PPA contract structures',
          'Carbon pricing mechanisms'
        ]
      }
    };
  }

  getKPIs() {
    return [
      { name: 'Generation Capacity', description: 'Installed capacity', benchmark: 'Utility scale: 100MW-1GW+' },
      { name: 'Capacity Factor', description: 'Actual vs theoretical output', benchmark: 'Solar: 20-30%, Wind: 30-45%, Gas: 50-70%' },
      { name: 'LCOE', description: 'Levelized Cost of Energy', benchmark: 'Solar: $30-50/MWh, Wind: $25-45/MWh' },
      { name: 'Carbon Intensity', description: 'CO2 per MWh', benchmark: 'Target: <100g CO2/kWh by 2030' },
      { name: 'Grid Reliability', description: 'Uptime', benchmark: '99.9%+' },
      { name: 'Renewable Mix', description: '% renewable generation', benchmark: 'Target: 50%+ by 2030' }
    ];
  }

  getRegulatoryRequirements(region: GeographicRegion) {
    const requirements = [];

    if (region === 'europe' || region === 'global') {
      requirements.push({
        framework: 'EU ETS (Emissions Trading)',
        requirements: ['Carbon allowance management', 'Emissions monitoring', 'Annual compliance'],
        deadline: 'Ongoing',
        penalties: '€100 per tonne excess emissions'
      });
      requirements.push({
        framework: 'Renewable Energy Directive',
        requirements: ['32% renewable target by 2030', 'Sustainability criteria', 'Guarantees of origin'],
        deadline: '2030',
        penalties: 'National penalties, subsidy loss'
      });
    }

    if (region === 'north_america' || region === 'global') {
      requirements.push({
        framework: 'FERC Regulations',
        requirements: ['Market participation rules', 'Interconnection standards', 'Reliability standards'],
        deadline: 'Ongoing',
        penalties: 'Fines, market suspension'
      });
    }

    return requirements;
  }

  translateTerminology(term: string): string {
    const translations: Record<string, string> = {
      'customer': 'offtaker / utility / end-user',
      'product': 'generation asset / capacity',
      'subscription': 'PPA (Power Purchase Agreement)',
      'churn': 'contract non-renewal',
      'retention': 'contract extension',
      'revenue': 'energy sales + capacity payments + ancillary services'
    };
    return translations[term.toLowerCase()] || term;
  }

  getRiskFactors() {
    return [
      { risk: 'Intermittency (renewable)', severity: 'high' as const, mitigation: 'Battery storage, grid balancing, diversified portfolio' },
      { risk: 'Regulatory changes (carbon pricing)', severity: 'high' as const, mitigation: 'Scenario planning, renewable transition, advocacy' },
      { risk: 'Grid congestion / curtailment', severity: 'medium' as const, mitigation: 'Strategic siting, transmission upgrades, storage' },
      { risk: 'Commodity price volatility', severity: 'high' as const, mitigation: 'Hedging, long-term contracts, fuel diversification' },
      { risk: 'Extreme weather events', severity: 'high' as const, mitigation: 'Asset hardening, insurance, geographic diversification' }
    ];
  }

  getCompetitiveLandscape() {
    return {
      market_structure: 'Regulated utilities + competitive generation + renewable developers',
      key_success_factors: [
        'Low-cost generation (LCOE leadership)',
        'Grid access and transmission rights',
        'Long-term PPA contracts',
        'Regulatory relationships',
        'Technology and operational excellence'
      ],
      barriers_to_entry: [
        'Capital intensity ($1-2M per MW)',
        'Grid interconnection queues (2-5 years)',
        'Permitting and environmental approvals',
        'PPA creditworthiness requirements',
        'Transmission access'
      ],
      typical_players: ['NextEra', 'Duke Energy', 'Iberdrola', 'Enel', 'EDF', 'RWE', 'Ørsted', 'Engie']
    };
  }
}

/**
 * Financial Services Industry Adapter
 */
export class FinancialServicesAdapter implements IndustryAdapter {
  vertical: IndustryVertical = 'financial_services';

  adaptOutput(genericOutput: any, context: IndustryContext): any {
    return {
      ...genericOutput,
      industry_context: {
        vertical: 'financial_services',
        key_trends: [
          'Digital banking and neobanks',
          'Open banking / API economy',
          'Embedded finance',
          'AI/ML for risk and fraud',
          'Crypto and DeFi integration'
        ],
        regulatory_focus: context.regulatory_frameworks.map(rf => rf.name),
        risk_considerations: [
          'Capital adequacy (Basel III)',
          'Liquidity management',
          'Credit risk / NPL management',
          'Cybersecurity and fraud prevention'
        ]
      }
    };
  }

  getKPIs() {
    return [
      { name: 'AUM', description: 'Assets Under Management', benchmark: 'Top banks: $1T+' },
      { name: 'NIM', description: 'Net Interest Margin', benchmark: '2-4%' },
      { name: 'Cost-to-Income', description: 'Operating efficiency', benchmark: '50-70%' },
      { name: 'NPL Ratio', description: 'Non-Performing Loans', benchmark: '<3%' },
      { name: 'CET1 Ratio', description: 'Capital adequacy', benchmark: '>10%' },
      { name: 'ROE', description: 'Return on Equity', benchmark: '8-15%' },
      { name: 'Digital Adoption', description: '% digital transactions', benchmark: 'Target: 80%+' }
    ];
  }

  getRegulatoryRequirements(region: GeographicRegion) {
    const requirements = [];

    requirements.push({
      framework: 'Basel III',
      requirements: ['CET1 ratio >4.5%', 'Tier 1 capital >6%', 'Total capital >8%', 'Liquidity coverage ratio'],
      deadline: 'Ongoing',
      penalties: 'Regulatory intervention, capital restrictions'
    });

    if (region === 'europe' || region === 'global') {
      requirements.push({
        framework: 'MiFID II',
        requirements: ['Best execution', 'Transaction reporting', 'Product governance', 'Investor protection'],
        deadline: 'Ongoing',
        penalties: 'Fines up to €5M or 10% of turnover'
      });
      requirements.push({
        framework: 'PSD2',
        requirements: ['Strong customer authentication', 'Open banking APIs', 'Third-party access'],
        deadline: 'Ongoing',
        penalties: 'Fines, license suspension'
      });
    }

    if (region === 'north_america' || region === 'global') {
      requirements.push({
        framework: 'Dodd-Frank',
        requirements: ['Stress testing', 'Volcker Rule compliance', 'Swap dealer registration', 'Consumer protection'],
        deadline: 'Ongoing',
        penalties: 'Fines, enforcement actions'
      });
    }

    return requirements;
  }

  translateTerminology(term: string): string {
    const translations: Record<string, string> = {
      'customer': 'client / account holder / counterparty',
      'product': 'financial product / service',
      'churn': 'attrition rate',
      'retention': 'client retention',
      'upsell': 'cross-sell / wallet share',
      'revenue': 'net interest income + fee income'
    };
    return translations[term.toLowerCase()] || term;
  }

  getRiskFactors() {
    return [
      { risk: 'Credit risk / loan defaults', severity: 'critical' as const, mitigation: 'Credit scoring, diversification, provisioning' },
      { risk: 'Cybersecurity / fraud', severity: 'critical' as const, mitigation: 'Multi-factor auth, AI fraud detection, SOC operations' },
      { risk: 'Regulatory compliance', severity: 'high' as const, mitigation: 'Compliance programs, RegTech, audits' },
      { risk: 'Interest rate risk', severity: 'high' as const, mitigation: 'Asset-liability management, hedging' },
      { risk: 'Fintech disruption', severity: 'medium' as const, mitigation: 'Digital transformation, partnerships, innovation labs' }
    ];
  }

  getCompetitiveLandscape() {
    return {
      market_structure: 'Concentrated incumbents + fintech disruptors + neobanks',
      key_success_factors: [
        'Digital capabilities and user experience',
        'Risk management and credit quality',
        'Regulatory compliance',
        'Brand trust and reputation',
        'Scale and cost efficiency'
      ],
      barriers_to_entry: [
        'Banking license requirements',
        'Capital requirements (Basel III)',
        'Regulatory compliance costs',
        'Customer trust and brand',
        'Technology infrastructure'
      ],
      typical_players: ['JPMorgan', 'Bank of America', 'HSBC', 'BNP Paribas', 'Goldman Sachs', 'Morgan Stanley', 'Revolut', 'Nubank']
    };
  }
}

/**
 * Industry Adapter Factory
 */
export class IndustryAdapterFactory {
  private static adapters: Map<IndustryVertical, IndustryAdapter> = new Map([
    ['automotive', new AutomotiveAdapter()],
    ['pharmaceutical', new PharmaceuticalAdapter()],
    ['energy', new EnergyAdapter()],
    ['financial_services', new FinancialServicesAdapter()]
    // Add more adapters as needed
  ]);
  
  static getAdapter(vertical: IndustryVertical): IndustryAdapter | null {
    return this.adapters.get(vertical) || null;
  }
  
  static registerAdapter(vertical: IndustryVertical, adapter: IndustryAdapter): void {
    this.adapters.set(vertical, adapter);
  }
  
  static hasAdapter(vertical: IndustryVertical): boolean {
    return this.adapters.has(vertical);
  }
}

/**
 * Helper function to enrich capability output with industry-specific context
 */
export function enrichWithIndustryContext(
  output: any,
  vertical: IndustryVertical,
  region: GeographicRegion = 'global'
): any {
  const adapter = IndustryAdapterFactory.getAdapter(vertical);
  const context = getIndustryContext(vertical, region);
  
  if (!adapter) {
    // No specialized adapter, return output with basic context
    return {
      ...output,
      industry_context: {
        vertical,
        region,
        regulatory_frameworks: context.regulatory_frameworks.map(rf => rf.name),
        key_metrics: context.key_metrics.map(m => m.name)
      }
    };
  }
  
  // Use specialized adapter
  return adapter.adaptOutput(output, context);
}

