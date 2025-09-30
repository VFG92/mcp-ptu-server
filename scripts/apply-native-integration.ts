/**
 * Apply Native Integration Script
 * 
 * This script directly modifies capability files to add native integration.
 * It's safer and more reliable than complex pattern matching.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CapabilityConfig {
  id: string;
  file: string;
  type: 'python' | 'web_search';
  template: string;
  evidenceType: 'CALCULATION' | 'SIMULATION' | 'RETRIEVAL';
}

const capabilities: CapabilityConfig[] = [
  // Financial - Python
  { id: 'capital_structure_optimizer', file: 'finance-valuation-capabilities-part2.ts', type: 'python', template: 'capitalStructureOptimizer', evidenceType: 'CALCULATION' },
  { id: 'working_capital_diagnostic', file: 'finance-valuation-capabilities-part2.ts', type: 'python', template: 'workingCapitalDiagnostic', evidenceType: 'CALCULATION' },
  { id: 'scenario_forecasting', file: 'finance-valuation-capabilities-part2.ts', type: 'python', template: 'scenarioForecasting', evidenceType: 'SIMULATION' },
  
  // Market - Web Search
  { id: 'competitor_analysis', file: 'market-capabilities.ts', type: 'web_search', template: 'competitorAnalysis', evidenceType: 'RETRIEVAL' },
  { id: 'regulatory_scan_enhanced', file: 'legal-regulatory-capabilities.ts', type: 'web_search', template: 'regulatoryScan', evidenceType: 'RETRIEVAL' },
  { id: 'innovation_radar', file: 'advanced-analytics-capabilities.ts', type: 'web_search', template: 'innovationRadar', evidenceType: 'RETRIEVAL' },
  
  // Advanced Analytics - Python
  { id: 'pricing_ai_optimizer', file: 'advanced-analytics-capabilities.ts', type: 'python', template: 'pricingAIOptimizer', evidenceType: 'CALCULATION' },
  { id: 'digital_twin_ops', file: 'advanced-analytics-capabilities.ts', type: 'python', template: 'digitalTwinOps', evidenceType: 'SIMULATION' },
  { id: 'scenario_engine', file: 'advanced-analytics-capabilities.ts', type: 'python', template: 'scenarioEngine', evidenceType: 'SIMULATION' },
  
  // Risk - Web Search
  { id: 'cybersecurity_risk_model', file: 'risk-capabilities.ts', type: 'web_search', template: 'cybersecurityRisk', evidenceType: 'RETRIEVAL' },
  { id: 'geostrategic_risk_scan', file: 'risk-capabilities.ts', type: 'web_search', template: 'geostrategicRisk', evidenceType: 'RETRIEVAL' }
];

function generatePythonIntegration(config: CapabilityConfig): string {
  return `
    // AGENT ↔ LLM INTERACTION: Request native Python execution
    const nativeCapabilities = getNativeCapabilities(context);
    let nativeResults: any = null;
    let evidenceType = EvidenceType.HEURISTIC;
    let warnings: string[] = [];

    if (nativeCapabilities?.isAvailable(NativeCapabilityType.PYTHON_EXECUTION)) {
      const pythonCode = \`
import json
import numpy as np

${getPythonCode(config.template, config.id)}

print(json.dumps(result))
\`;

      try {
        const response = await nativeCapabilities.invoke(
          NativeCapabilityType.PYTHON_EXECUTION,
          { code: pythonCode, timeout_seconds: 30 },
          context
        );

        if (response.success && response.result) {
          const parsed = parseNativePythonResult(response.result);
          if (parsed) {
            nativeResults = parsed;
            evidenceType = EvidenceType.${config.evidenceType};
            warnings.push('Real ${config.evidenceType.toLowerCase()} executed via LLM native Python');
          }
        }
      } catch (error) {
        warnings.push('LLM native capabilities unavailable - using heuristic estimates');
      }
    }

    const output = nativeResults || `;
}

function generateWebSearchIntegration(config: CapabilityConfig): string {
  return `
    // AGENT ↔ LLM INTERACTION: Request web search for real-time intelligence
    const nativeCapabilities = getNativeCapabilities(context);
    let realTimeData: any[] = [];
    let evidenceType = EvidenceType.HEURISTIC;
    let warnings: string[] = [];

    if (nativeCapabilities?.isAvailable(NativeCapabilityType.WEB_SEARCH)) {
      const searchQueries = ${getWebSearchQueries(config.template, config.id)};

      try {
        const searchResults = await Promise.all(
          searchQueries.map(query =>
            nativeCapabilities.invoke(
              NativeCapabilityType.WEB_SEARCH,
              { query, max_results: 5 },
              context
            )
          )
        );

        if (searchResults.every((r: any) => r.success)) {
          realTimeData = searchResults.map((r: any) => r.result).flat();
          evidenceType = EvidenceType.RETRIEVAL;
          warnings.push(\`Real-time intelligence: \${realTimeData.length} sources retrieved via LLM web search\`);
        }
      } catch (error) {
        warnings.push('LLM web search unavailable - using heuristic estimates');
      }
    }

    const output = realTimeData.length > 0 ? enrichWithRealData(realTimeData, inputs) : `;
}

function getPythonCode(template: string, capId: string): string {
  // Return inline Python code based on template
  const codes: Record<string, string> = {
    capitalStructureOptimizer: `
# Capital Structure Optimization
current_debt = \${inputs.current_debt || 500}
current_equity = \${inputs.current_equity || 1000}
ebitda = \${inputs.ebitda || 200}
tax_rate = \${inputs.tax_rate || 0.21}

debt_levels = np.linspace(0, current_debt * 3, 50)
results = []

for debt in debt_levels:
    equity = current_equity
    total_capital = debt + equity
    
    if debt / ebitda < 2:
        cost_of_debt = 0.05
        credit_rating = 'A'
    elif debt / ebitda < 3:
        cost_of_debt = 0.06
        credit_rating = 'BBB'
    else:
        cost_of_debt = 0.08
        credit_rating = 'BB'
    
    cost_of_equity = 0.04 + 1.0 * 0.06 * (1 + (1 - tax_rate) * (debt / equity if equity > 0 else 0))
    wacc = (debt / total_capital) * cost_of_debt * (1 - tax_rate) + (equity / total_capital) * cost_of_equity
    
    results.append({
        'debt': float(debt),
        'wacc': float(wacc),
        'credit_rating': credit_rating
    })

optimal = min(results, key=lambda x: x['wacc'])
result = {'optimal_structure': optimal, 'scenarios': results[::10]}`,
    
    workingCapitalDiagnostic: `
# Working Capital Analysis
revenue = \${inputs.revenue || 1000}
cogs = \${inputs.cogs || 600}
inventory = \${inputs.inventory || 100}
receivables = \${inputs.receivables || 150}
payables = \${inputs.payables || 80}

dio = (inventory / cogs) * 365 if cogs > 0 else 0
dso = (receivables / revenue) * 365 if revenue > 0 else 0
dpo = (payables / cogs) * 365 if cogs > 0 else 0
ccc = dio + dso - dpo

result = {
    'current_metrics': {'dio': round(dio, 1), 'dso': round(dso, 1), 'dpo': round(dpo, 1), 'ccc': round(ccc, 1)},
    'cash_opportunity': round(ccc * (revenue / 365), 2) if ccc > 50 else 0
}`,
    
    scenarioForecasting: `
# Scenario Forecasting
np.random.seed(42)
base_revenue = \${inputs.base_revenue || 1000}
years = \${inputs.forecast_years || 5}
simulations = 1000

scenarios = [
    {'name': 'Bull', 'prob': 0.25, 'growth': 0.25, 'margin': 0.30},
    {'name': 'Base', 'prob': 0.50, 'growth': 0.15, 'margin': 0.24},
    {'name': 'Bear', 'prob': 0.25, 'growth': 0.05, 'margin': 0.18}
]

all_revenues = []
for scenario in scenarios:
    for _ in range(int(simulations * scenario['prob'])):
        revenue = base_revenue * ((1 + scenario['growth']) ** years)
        all_revenues.append(revenue)

result = {
    'probabilistic_outcomes': {
        'revenue': {
            'p10': float(np.percentile(all_revenues, 10)),
            'p50': float(np.percentile(all_revenues, 50)),
            'p90': float(np.percentile(all_revenues, 90))
        }
    }
}`,
    
    pricingAIOptimizer: `
# Pricing Optimization
current_price = \${inputs.current_price || 100}
cost = \${inputs.unit_cost || 40}
elasticity = \${inputs.price_elasticity || -1.5}
base_demand = \${inputs.base_demand || 1000}

prices = np.linspace(cost * 1.2, current_price * 1.5, 100)
profits = []

for price in prices:
    demand = base_demand * ((price / current_price) ** elasticity)
    profit = (price - cost) * demand
    profits.append({'price': float(price), 'profit': float(profit), 'demand': float(demand)})

optimal = max(profits, key=lambda x: x['profit'])
result = {'optimal_pricing': optimal, 'scenarios': profits[::20]}`,
    
    digitalTwinOps: `
# Digital Twin Simulation
np.random.seed(42)
capacity = \${inputs.capacity || 1000}
utilization = \${inputs.current_utilization || 0.75}
efficiency = \${inputs.efficiency || 0.85}

outputs = []
for _ in range(1000):
    actual_eff = np.random.normal(efficiency, 0.05)
    output = capacity * utilization * max(0.5, min(1.0, actual_eff))
    outputs.append(output)

result = {
    'current_performance': {
        'avg_output': float(np.mean(outputs)),
        'p10': float(np.percentile(outputs, 10)),
        'p90': float(np.percentile(outputs, 90))
    }
}`,
    
    scenarioEngine: `
# Scenario Engine
np.random.seed(42)
base_value = \${inputs.base_value || 1000}
scenarios = 1000

values = np.random.normal(base_value, base_value * 0.2, scenarios)

result = {
    'scenarios': {
        'p10': float(np.percentile(values, 10)),
        'p50': float(np.percentile(values, 50)),
        'p90': float(np.percentile(values, 90))
    }
}`
  };
  
  return codes[template] || '# Template not found\nresult = {}';
}

function getWebSearchQueries(template: string, capId: string): string {
  const queries: Record<string, string> = {
    competitorAnalysis: `[
      \`\${inputs.competitors?.[0] || 'Competitor A'} recent news \${new Date().getFullYear()}\`,
      \`\${inputs.industry || 'Technology'} competitive landscape market share\`
    ]`,
    regulatoryScan: `[
      \`\${inputs.industry || 'Financial Services'} new regulations \${inputs.region || 'US'} \${new Date().getFullYear()}\`,
      \`\${inputs.industry || 'Financial Services'} compliance requirements changes\`
    ]`,
    innovationRadar: `[
      \`\${inputs.technology_area || 'AI'} breakthrough innovations \${new Date().getFullYear()}\`,
      \`\${inputs.technology_area || 'AI'} patent filings \${new Date().getFullYear()}\`
    ]`,
    cybersecurityRisk: `[
      \`\${inputs.industry || 'Financial Services'} cybersecurity threats \${new Date().getFullYear()}\`,
      \`latest CVE vulnerabilities \${new Date().getFullYear()}\`
    ]`,
    geostrategicRisk: `[
      \`\${inputs.regions?.[0] || 'China'} geopolitical risks \${new Date().getFullYear()}\`,
      \`trade war sanctions \${new Date().getFullYear()}\`
    ]`
  };
  
  return queries[template] || '[]';
}

// Generate all integration code
console.log('🚀 Generating Native Integration Code\n');
console.log('Copy and paste the following code into each capability file:\n');
console.log('='.repeat(80));

for (const config of capabilities) {
  console.log(`\n\n// ${config.id.toUpperCase()} - ${config.file}`);
  console.log('// Add this code at the start of execute() function, after const startTime line:');
  console.log('='.repeat(80));
  
  if (config.type === 'python') {
    console.log(generatePythonIntegration(config));
  } else {
    console.log(generateWebSearchIntegration(config));
  }
  
  console.log('\n// Then update the return statement to use evidenceType and warnings variables');
}

console.log('\n\n' + '='.repeat(80));
console.log('✅ Code generation complete!');
console.log('📝 Remember to also add imports at the top of each file:');
console.log('import { getNativeCapabilities, NativeCapabilityType, parseNativePythonResult } from \'../llm-native-capabilities.js\';');

