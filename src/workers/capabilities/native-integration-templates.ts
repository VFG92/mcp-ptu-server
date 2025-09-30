/**
 * Native Integration Templates
 * 
 * Python code templates for capabilities requiring explicit native integration.
 * These templates can be used directly in capability execute() functions.
 */

/**
 * TSR (Total Shareholder Return) Simulator Template
 * Monte Carlo simulation for stock price and dividend scenarios
 */
export const tsrSimulatorPythonTemplate = (inputs: any) => `
import json
import numpy as np

np.random.seed(42)

# TSR Simulation Parameters
initial_price = ${inputs.current_stock_price || 100}
initial_dividend_yield = ${inputs.dividend_yield || 0.02}
volatility = ${inputs.volatility || 0.25}
years = ${inputs.forecast_years || 5}
simulations = ${inputs.num_simulations || 10000}

# Simulate stock price paths
returns = np.random.normal(0.10, volatility, (simulations, years))
price_paths = initial_price * np.cumprod(1 + returns, axis=1)

# Simulate dividend growth
dividend_growth = np.random.normal(0.05, 0.03, (simulations, years))
dividends = initial_price * initial_dividend_yield * np.cumprod(1 + dividend_growth, axis=1)

# Calculate TSR for each simulation
final_prices = price_paths[:, -1]
total_dividends = np.sum(dividends, axis=1)
tsr = ((final_prices + total_dividends) / initial_price - 1) * 100

# Calculate statistics
result = {
    'mean_tsr': float(np.mean(tsr)),
    'median_tsr': float(np.median(tsr)),
    'std_dev': float(np.std(tsr)),
    'percentiles': {
        'p10': float(np.percentile(tsr, 10)),
        'p25': float(np.percentile(tsr, 25)),
        'p50': float(np.percentile(tsr, 50)),
        'p75': float(np.percentile(tsr, 75)),
        'p90': float(np.percentile(tsr, 90))
    },
    'probability_positive': float(np.sum(tsr > 0) / simulations),
    'probability_above_market': float(np.sum(tsr > 50) / simulations),
    'scenarios': [
        {
            'name': 'Bull Case (P90)',
            'tsr': float(np.percentile(tsr, 90)),
            'final_price': float(np.percentile(final_prices, 90)),
            'total_dividends': float(np.percentile(total_dividends, 90))
        },
        {
            'name': 'Base Case (P50)',
            'tsr': float(np.percentile(tsr, 50)),
            'final_price': float(np.percentile(final_prices, 50)),
            'total_dividends': float(np.percentile(total_dividends, 50))
        },
        {
            'name': 'Bear Case (P10)',
            'tsr': float(np.percentile(tsr, 10)),
            'final_price': float(np.percentile(final_prices, 10)),
            'total_dividends': float(np.percentile(total_dividends, 10))
        }
    ]
}

print(json.dumps(result))
`;

/**
 * Capital Structure Optimizer Template
 * Optimize debt-equity mix to minimize WACC
 */
export const capitalStructureOptimizerPythonTemplate = (inputs: any) => `
import json
import numpy as np

# Capital Structure Parameters
current_debt = ${inputs.current_debt || 500}
current_equity = ${inputs.current_equity || 1000}
ebitda = ${inputs.ebitda || 200}
tax_rate = ${inputs.tax_rate || 0.21}
risk_free_rate = ${inputs.risk_free_rate || 0.04}
equity_risk_premium = ${inputs.equity_risk_premium || 0.06}
beta_unlevered = ${inputs.beta_unlevered || 1.0}

# Test different debt levels
debt_levels = np.linspace(0, current_debt * 3, 50)
results = []

for debt in debt_levels:
    equity = current_equity
    total_capital = debt + equity
    debt_ratio = debt / total_capital
    
    # Cost of debt (increases with leverage)
    if debt / ebitda < 2:
        cost_of_debt = 0.05
        credit_rating = 'A'
    elif debt / ebitda < 3:
        cost_of_debt = 0.06
        credit_rating = 'BBB'
    elif debt / ebitda < 4:
        cost_of_debt = 0.07
        credit_rating = 'BB'
    else:
        cost_of_debt = 0.09
        credit_rating = 'B'
    
    # Levered beta
    beta_levered = beta_unlevered * (1 + (1 - tax_rate) * (debt / equity))
    
    # Cost of equity (CAPM)
    cost_of_equity = risk_free_rate + beta_levered * equity_risk_premium
    
    # WACC
    wacc = (debt / total_capital) * cost_of_debt * (1 - tax_rate) + \\
           (equity / total_capital) * cost_of_equity
    
    # Enterprise value (simplified)
    ev = ebitda * (1 - tax_rate) / wacc
    
    results.append({
        'debt': float(debt),
        'equity': float(equity),
        'debt_to_equity': float(debt / equity) if equity > 0 else 0,
        'debt_to_ebitda': float(debt / ebitda) if ebitda > 0 else 0,
        'wacc': float(wacc),
        'enterprise_value': float(ev),
        'credit_rating': credit_rating,
        'cost_of_debt': float(cost_of_debt),
        'cost_of_equity': float(cost_of_equity)
    })

# Find optimal structure (minimum WACC)
optimal_idx = np.argmin([r['wacc'] for r in results])
optimal = results[optimal_idx]

result = {
    'current_structure': results[int(current_debt / (debt_levels[1] - debt_levels[0]))],
    'optimal_structure': optimal,
    'leverage_scenarios': [
        results[0],  # No debt
        results[len(results)//4],  # Low leverage
        results[len(results)//2],  # Medium leverage
        results[3*len(results)//4],  # High leverage
        results[-1]  # Maximum leverage
    ],
    'value_creation': float(optimal['enterprise_value'] - results[int(current_debt / (debt_levels[1] - debt_levels[0]))]['enterprise_value'])
}

print(json.dumps(result))
`;

/**
 * Working Capital Diagnostic Template
 * Calculate DIO, DSO, DPO and cash conversion cycle
 */
export const workingCapitalDiagnosticPythonTemplate = (inputs: any) => `
import json

# Working Capital Parameters
revenue = ${inputs.revenue || 1000}
cogs = ${inputs.cogs || 600}
inventory = ${inputs.inventory || 100}
receivables = ${inputs.receivables || 150}
payables = ${inputs.payables || 80}

# Calculate metrics
days_in_year = 365

# Days Inventory Outstanding
dio = (inventory / cogs) * days_in_year if cogs > 0 else 0

# Days Sales Outstanding
dso = (receivables / revenue) * days_in_year if revenue > 0 else 0

# Days Payables Outstanding
dpo = (payables / cogs) * days_in_year if cogs > 0 else 0

# Cash Conversion Cycle
ccc = dio + dso - dpo

# Working capital as % of revenue
wc_pct_revenue = ((inventory + receivables - payables) / revenue) * 100 if revenue > 0 else 0

# Industry benchmarks (example)
industry_benchmarks = {
    'dio': 45,
    'dso': 40,
    'dpo': 35,
    'ccc': 50
}

# Calculate gaps
gaps = {
    'dio_gap': dio - industry_benchmarks['dio'],
    'dso_gap': dso - industry_benchmarks['dso'],
    'dpo_gap': dpo - industry_benchmarks['dpo'],
    'ccc_gap': ccc - industry_benchmarks['ccc']
}

# Opportunity sizing
cash_opportunity = (ccc - industry_benchmarks['ccc']) * (revenue / days_in_year) if ccc > industry_benchmarks['ccc'] else 0

result = {
    'current_metrics': {
        'dio': round(dio, 1),
        'dso': round(dso, 1),
        'dpo': round(dpo, 1),
        'ccc': round(ccc, 1),
        'wc_pct_revenue': round(wc_pct_revenue, 2)
    },
    'industry_benchmarks': industry_benchmarks,
    'gaps': {k: round(v, 1) for k, v in gaps.items()},
    'cash_opportunity': round(cash_opportunity, 2),
    'improvement_levers': [
        {
            'lever': 'Reduce DSO',
            'current': round(dso, 1),
            'target': industry_benchmarks['dso'],
            'cash_impact': round((dso - industry_benchmarks['dso']) * (revenue / days_in_year), 2) if dso > industry_benchmarks['dso'] else 0
        },
        {
            'lever': 'Reduce DIO',
            'current': round(dio, 1),
            'target': industry_benchmarks['dio'],
            'cash_impact': round((dio - industry_benchmarks['dio']) * (cogs / days_in_year), 2) if dio > industry_benchmarks['dio'] else 0
        },
        {
            'lever': 'Extend DPO',
            'current': round(dpo, 1),
            'target': industry_benchmarks['dpo'],
            'cash_impact': round((industry_benchmarks['dpo'] - dpo) * (cogs / days_in_year), 2) if dpo < industry_benchmarks['dpo'] else 0
        }
    ]
}

print(json.dumps(result))
`;

/**
 * Scenario Forecasting Template
 * Multi-scenario financial forecasting with probabilities
 */
export const scenarioForecastingPythonTemplate = (inputs: any) => `
import json
import numpy as np

np.random.seed(42)

# Scenario Parameters
base_revenue = ${inputs.base_revenue || 1000}
base_growth = ${inputs.base_growth_rate || 0.15}
base_margin = ${inputs.base_ebitda_margin || 0.24}
years = ${inputs.forecast_years || 5}
simulations = ${inputs.num_simulations || 1000}

# Define scenarios with probabilities
scenarios = [
    {'name': 'Bull', 'prob': 0.25, 'growth': 0.25, 'margin': 0.30, 'volatility': 0.10},
    {'name': 'Base', 'prob': 0.50, 'growth': 0.15, 'margin': 0.24, 'volatility': 0.15},
    {'name': 'Bear', 'prob': 0.25, 'growth': 0.05, 'margin': 0.18, 'volatility': 0.20}
]

all_forecasts = []

for scenario in scenarios:
    scenario_forecasts = []
    for _ in range(int(simulations * scenario['prob'])):
        revenue_path = [base_revenue]
        ebitda_path = []
        
        for year in range(years):
            # Add randomness to growth and margin
            growth = np.random.normal(scenario['growth'], scenario['volatility'])
            margin = np.random.normal(scenario['margin'], 0.02)
            margin = max(0.10, min(0.35, margin))  # Bound margin
            
            revenue = revenue_path[-1] * (1 + growth)
            ebitda = revenue * margin
            
            revenue_path.append(revenue)
            ebitda_path.append(ebitda)
        
        scenario_forecasts.append({
            'revenues': revenue_path[1:],
            'ebitdas': ebitda_path
        })
    
    all_forecasts.extend(scenario_forecasts)

# Calculate statistics
final_revenues = [f['revenues'][-1] for f in all_forecasts]
final_ebitdas = [f['ebitdas'][-1] for f in all_forecasts]

result = {
    'probabilistic_outcomes': {
        'revenue': {
            'p10': float(np.percentile(final_revenues, 10)),
            'p50': float(np.percentile(final_revenues, 50)),
            'p90': float(np.percentile(final_revenues, 90)),
            'mean': float(np.mean(final_revenues)),
            'std_dev': float(np.std(final_revenues))
        },
        'ebitda': {
            'p10': float(np.percentile(final_ebitdas, 10)),
            'p50': float(np.percentile(final_ebitdas, 50)),
            'p90': float(np.percentile(final_ebitdas, 90)),
            'mean': float(np.mean(final_ebitdas)),
            'std_dev': float(np.std(final_ebitdas))
        }
    },
    'scenario_breakdown': [
        {
            'name': s['name'],
            'probability': s['prob'],
            'revenue_year_5': float(np.percentile([f['revenues'][-1] for f in all_forecasts[:int(simulations*s['prob'])]], 50)),
            'ebitda_year_5': float(np.percentile([f['ebitdas'][-1] for f in all_forecasts[:int(simulations*s['prob'])]], 50))
        }
        for s in scenarios
    ]
}

print(json.dumps(result))
`;

/**
 * Competitor Analysis - Web Search Template
 * Real-time competitive intelligence gathering
 */
export const competitorAnalysisWebSearchQueries = (inputs: any) => {
  const competitors = inputs.competitors || ['Competitor A', 'Competitor B'];
  const industry = inputs.industry || 'Technology';

  return [
    `${competitors[0]} recent news acquisitions M&A ${new Date().getFullYear()}`,
    `${competitors[1]} product launches new features ${new Date().getFullYear()}`,
    `${industry} competitive landscape market share analysis`,
    `${competitors[0]} vs ${competitors[1]} comparison review`,
    `${industry} market trends competitive dynamics`
  ];
};

/**
 * Regulatory Scan - Web Search Template
 * Real-time regulatory monitoring
 */
export const regulatoryScanWebSearchQueries = (inputs: any) => {
  const industry = inputs.industry || 'Financial Services';
  const region = inputs.region || 'United States';
  const year = new Date().getFullYear();

  return [
    `${industry} new regulations ${region} ${year}`,
    `${industry} compliance requirements changes ${year}`,
    `${region} regulatory updates ${industry} sector`,
    `${industry} enforcement actions penalties ${year}`,
    `upcoming ${industry} regulations ${region} ${year + 1}`
  ];
};

/**
 * Innovation Radar - Web Search Template
 * Technology trends and patent monitoring
 */
export const innovationRadarWebSearchQueries = (inputs: any) => {
  const technology = inputs.technology_area || 'Artificial Intelligence';
  const industry = inputs.industry || 'Technology';
  const year = new Date().getFullYear();

  return [
    `${technology} breakthrough innovations ${year}`,
    `${technology} patent filings ${year}`,
    `${industry} emerging technologies ${technology}`,
    `${technology} startup funding rounds ${year}`,
    `${technology} research papers ${year} latest`
  ];
};

/**
 * Pricing AI Optimizer Template
 * Dynamic pricing optimization with ML
 */
export const pricingAIOptimizerPythonTemplate = (inputs: any) => `
import json
import numpy as np

# Pricing Parameters
current_price = ${inputs.current_price || 100}
cost = ${inputs.unit_cost || 40}
demand_elasticity = ${inputs.price_elasticity || -1.5}
base_demand = ${inputs.base_demand || 1000}
competitor_prices = ${JSON.stringify(inputs.competitor_prices || [95, 105, 110])}

# Price optimization
prices = np.linspace(cost * 1.2, current_price * 1.5, 100)
results = []

for price in prices:
    # Demand curve (price elasticity)
    price_change_pct = (price - current_price) / current_price
    demand_change_pct = demand_elasticity * price_change_pct
    demand = base_demand * (1 + demand_change_pct)
    demand = max(0, demand)  # Non-negative demand

    # Revenue and profit
    revenue = price * demand
    profit = (price - cost) * demand
    margin = ((price - cost) / price) * 100 if price > 0 else 0

    # Competitive position
    avg_competitor_price = np.mean(competitor_prices)
    price_index = (price / avg_competitor_price) * 100

    results.append({
        'price': float(price),
        'demand': float(demand),
        'revenue': float(revenue),
        'profit': float(profit),
        'margin': float(margin),
        'price_index': float(price_index)
    })

# Find optimal price (maximum profit)
optimal_idx = np.argmax([r['profit'] for r in results])
optimal = results[optimal_idx]

# Price sensitivity analysis
price_points = [
    results[len(results)//4],   # Low price
    results[len(results)//2],   # Medium price
    results[3*len(results)//4], # High price
    optimal                      # Optimal price
]

result = {
    'current_pricing': {
        'price': current_price,
        'demand': base_demand,
        'revenue': current_price * base_demand,
        'profit': (current_price - cost) * base_demand
    },
    'optimal_pricing': optimal,
    'price_scenarios': price_points,
    'recommendations': {
        'recommended_price': float(optimal['price']),
        'expected_demand': float(optimal['demand']),
        'expected_profit': float(optimal['profit']),
        'profit_improvement': float(optimal['profit'] - (current_price - cost) * base_demand),
        'price_change_pct': float((optimal['price'] - current_price) / current_price * 100)
    }
}

print(json.dumps(result))
`;

/**
 * Digital Twin Ops Template
 * Operational simulation and optimization
 */
export const digitalTwinOpsPythonTemplate = (inputs: any) => `
import json
import numpy as np

np.random.seed(42)

# Operational Parameters
capacity = ${inputs.capacity || 1000}
utilization = ${inputs.current_utilization || 0.75}
efficiency = ${inputs.efficiency || 0.85}
downtime_rate = ${inputs.downtime_rate || 0.05}
simulations = ${inputs.num_simulations || 1000}
days = ${inputs.simulation_days || 30}

# Simulate operations
daily_outputs = []
daily_downtimes = []

for _ in range(simulations):
    for day in range(days):
        # Random downtime events
        downtime = 1 if np.random.random() < downtime_rate else 0
        daily_downtimes.append(downtime)

        # Production output
        if downtime:
            output = 0
        else:
            # Add variability to efficiency
            actual_efficiency = np.random.normal(efficiency, 0.05)
            actual_efficiency = max(0.5, min(1.0, actual_efficiency))
            output = capacity * utilization * actual_efficiency

        daily_outputs.append(output)

# Calculate statistics
avg_output = np.mean(daily_outputs)
p10_output = np.percentile(daily_outputs, 10)
p90_output = np.percentile(daily_outputs, 90)
downtime_pct = np.mean(daily_downtimes) * 100

# Optimization scenarios
scenarios = []
for util in [0.70, 0.80, 0.90]:
    for eff in [0.80, 0.85, 0.90]:
        scenario_output = capacity * util * eff * (1 - downtime_rate)
        scenarios.append({
            'utilization': util,
            'efficiency': eff,
            'expected_output': float(scenario_output),
            'improvement_vs_current': float((scenario_output - avg_output) / avg_output * 100)
        })

# Find best scenario
best_scenario = max(scenarios, key=lambda x: x['expected_output'])

result = {
    'current_performance': {
        'avg_daily_output': float(avg_output),
        'p10_output': float(p10_output),
        'p90_output': float(p90_output),
        'downtime_pct': float(downtime_pct),
        'utilization': utilization,
        'efficiency': efficiency
    },
    'optimization_scenarios': scenarios[:6],  # Top 6 scenarios
    'recommended_scenario': best_scenario,
    'improvement_potential': {
        'output_increase': float(best_scenario['expected_output'] - avg_output),
        'output_increase_pct': float(best_scenario['improvement_vs_current'])
    }
}

print(json.dumps(result))
`;

/**
 * Cybersecurity Risk Model - Web Search Template
 * Threat intelligence and vulnerability monitoring
 */
export const cybersecurityRiskWebSearchQueries = (inputs: any) => {
  const industry = inputs.industry || 'Financial Services';
  const year = new Date().getFullYear();

  return [
    `${industry} cybersecurity threats ${year}`,
    `latest CVE vulnerabilities ${year}`,
    `${industry} data breach incidents ${year}`,
    `ransomware attacks ${industry} ${year}`,
    `cybersecurity threat intelligence ${year}`
  ];
};

/**
 * Geostrategic Risk Scan - Web Search Template
 * Geopolitical risk monitoring
 */
export const geostrategicRiskWebSearchQueries = (inputs: any) => {
  const regions = inputs.regions || ['China', 'Europe', 'Middle East'];
  const year = new Date().getFullYear();

  return [
    `${regions[0]} geopolitical risks ${year}`,
    `trade war sanctions ${year}`,
    `${regions[1]} political instability ${year}`,
    `supply chain disruptions ${regions[2]} ${year}`,
    `global economic risks ${year}`
  ];
};
