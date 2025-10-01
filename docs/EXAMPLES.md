# Advanced Examples

Real-world use cases and patterns for MCP PTU Server.

**Core Principle**: ChatGPT is the sole deliberative agent. MCP provides guardrails (diversity validation) and persistent memory. You orchestrate the analysis.

---

## Table of Contents

1. [Parallel Reasoning Workflows](#parallel-reasoning-workflows)
2. [Diversity Patterns](#diversity-patterns)
3. [Contamination Strategies](#contamination-strategies)
4. [Peer Review Techniques](#peer-review-techniques)
5. [Mediation Approaches](#mediation-approaches)

---

## Parallel Reasoning Workflows

### Example 3: Market Entry Strategy (Fintech)

**Scenario**: Multi-path analysis for B2B payment platform launch in EU.

#### Step 1: Initialize Session

```typescript
{
  "name": "init_parallel_reasoning",
  "arguments": {
    "session_id": "fintech_entry_001",
    "task_description": "Develop market entry strategy for B2B payment platform in EU. Target: SME merchants, €50M ARR by Year 3.",
    "required_diversity_axes": ["data_sources", "analytical_models", "stakeholder_views"],
    "min_plans": 3
  }
}
```

#### Step 2: Submit Plan A (Data-Driven)

```typescript
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "fintech_entry_001",
    "plan": {
      "plan_id": "plan_data_driven",
      "description": "Quantitative market sizing with regression-based TAM/SAM/SOM",
      "diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
      "capability_chain": [
        "market_sizing_tam_sam_som",
        "customer_segmentation_advanced",
        "pricing_optimization_ai",
        "gtm_strategy_b2b",
        "scenario_forecasting_monte_carlo",
        "competitive_positioning_perceptual_map",
        "digital_marketing_roi_attribution",
        "churn_prediction_ml"
      ],
      "rationale": "Use official statistics (Eurostat, ECB) + regression models for conservative, data-backed estimates",
      "expected_outputs": [
        "TAM/SAM/SOM with confidence intervals",
        "Customer segments with LTV/CAC",
        "Pricing strategy with elasticity analysis",
        "GTM roadmap with budget allocation",
        "3-year revenue forecast (P10/P50/P90)"
      ]
    }
  }
}
```

#### Step 3: Submit Plan B (Risk-Adjusted)

```typescript
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "fintech_entry_001",
    "plan": {
      "plan_id": "plan_risk_adjusted",
      "description": "Monte Carlo simulation with regulatory and competitive risk scenarios",
      "diversity_axes": ["analytical_models", "risk_perspectives", "quality_metrics"],
      "capability_chain": [
        "scenario_planning_wargaming",
        "regulatory_landscape_scanning",
        "competitive_intelligence_monitoring",
        "monte_carlo_financial_modeling",
        "risk_assessment_enterprise",
        "capital_structure_optimization",
        "working_capital_optimization",
        "ipo_readiness_assessment"
      ],
      "rationale": "Use Monte Carlo + scenario planning to model regulatory changes (PSD2, PSD3) and competitive responses",
      "expected_outputs": [
        "Risk-adjusted NPV with sensitivity analysis",
        "Regulatory compliance roadmap",
        "Competitive response scenarios",
        "Capital requirements by scenario",
        "Exit strategy options"
      ]
    }
  }
}
```

#### Step 4: Submit Plan C (Stakeholder-Centric)

```typescript
{
  "name": "submit_reasoning_plan",
  "arguments": {
    "session_id": "fintech_entry_001",
    "plan": {
      "plan_id": "plan_stakeholder",
      "description": "Qualitative analysis from merchant, investor, and regulator perspectives",
      "diversity_axes": ["stakeholder_views", "data_sources", "quality_metrics"],
      "capability_chain": [
        "customer_journey_mapping",
        "brand_equity_measurement",
        "voice_of_customer_text_mining",
        "organizational_health_assessment",
        "change_management_readiness",
        "talent_acquisition_economics",
        "compensation_benchmarking",
        "innovation_radar_emerging_tech"
      ],
      "rationale": "Use interviews + text mining to understand merchant pain points, investor concerns, and regulatory expectations",
      "expected_outputs": [
        "Merchant journey map with pain points",
        "Investor value proposition",
        "Regulatory engagement strategy",
        "Organizational design and talent plan",
        "Brand positioning and messaging"
      ]
    }
  }
}
```

#### Step 5: Execute Plans

```typescript
// Execute Plan A
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "fintech_entry_001",
    "plan_id": "plan_data_driven",
    "task": "Perform market sizing for B2B payment platform in EU. Use Eurostat data for SME population, ECB data for payment volumes.",
    "adapter_id": "commercial",
    "budget": { "max_tokens_in": 15000, "max_tokens_out": 15000 }
  }
}

// Execute Plan B
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "fintech_entry_001",
    "plan_id": "plan_risk_adjusted",
    "task": "Run Monte Carlo simulation for revenue forecast. Base case: €50M ARR by Year 3, 30% std dev. Include regulatory delay scenarios.",
    "adapter_id": "finance",
    "enable_native_capabilities": true,
    "budget": { "max_tokens_in": 15000, "max_tokens_out": 15000 }
  }
}

// Execute Plan C
{
  "name": "execute_plan_step",
  "arguments": {
    "session_id": "fintech_entry_001",
    "plan_id": "plan_stakeholder",
    "task": "Map customer journey for SME merchants adopting B2B payment platform. Identify pain points in onboarding, integration, and support.",
    "adapter_id": "commercial",
    "budget": { "max_tokens_in": 15000, "max_tokens_out": 15000 }
  }
}
```

#### Step 6: Cross-Contamination

```typescript
// Share insight from Plan A to Plan B
{
  "name": "submit_cross_plan_note",
  "arguments": {
    "session_id": "fintech_entry_001",
    "note": {
      "from_plan_id": "plan_data_driven",
      "to_plan_id": "plan_risk_adjusted",
      "note": "Market sizing shows €2.5B TAM with 15% CAGR. Suggest using this as base case for Monte Carlo simulation.",
      "references": ["evidence_market_sizing_001"],
      "timestamp": Date.now()
    }
  }
}

// Share insight from Plan C to Plan A
{
  "name": "submit_cross_plan_note",
  "arguments": {
    "session_id": "fintech_entry_001",
    "note": {
      "from_plan_id": "plan_stakeholder",
      "to_plan_id": "plan_data_driven",
      "note": "Customer interviews reveal 40% churn due to poor integration support. Adjust CAC/LTV assumptions accordingly.",
      "references": ["evidence_customer_journey_001"],
      "timestamp": Date.now()
    }
  }
}
```

#### Step 7: Peer Review

```typescript
// Plan A reviews Plan B
{
  "name": "submit_peer_critique",
  "arguments": {
    "session_id": "fintech_entry_001",
    "critique": {
      "reviewer_plan_id": "plan_data_driven",
      "reviewed_plan_id": "plan_risk_adjusted",
      "strengths": [
        "Comprehensive risk modeling with regulatory scenarios",
        "Monte Carlo provides probabilistic outcomes"
      ],
      "weaknesses": [
        "Assumes normal distribution for revenue, may underestimate tail risks",
        "Regulatory delay scenarios lack specific trigger events"
      ],
      "suggestions": [
        "Use log-normal distribution for revenue to capture upside potential",
        "Define specific regulatory triggers (e.g., PSD3 implementation date)"
      ],
      "confidence": 0.75
    }
  }
}
```

#### Step 8: Mediation

```typescript
{
  "name": "submit_mediation_decision",
  "arguments": {
    "session_id": "fintech_entry_001",
    "decision": {
      "decision_point": "Target market selection",
      "chosen_from_plan": "plan_data_driven",
      "rationale": "Data-driven TAM/SAM/SOM analysis provides most defensible market sizing. However, incorporate risk-adjusted NPV from Plan B and customer pain points from Plan C.",
      "evidence_ids": [
        "evidence_market_sizing_001",
        "evidence_monte_carlo_001",
        "evidence_customer_journey_001"
      ],
      "confidence": 0.85
    }
  }
}
```

#### Step 9: Finalize

```typescript
{
  "name": "finalize_parallel_reasoning",
  "arguments": {
    "session_id": "fintech_entry_001"
  }
}
```

**Expected Output**:
- Integrated market entry strategy with evidence from all 3 plans
- Risk-adjusted financial projections
- Customer-centric GTM roadmap
- Regulatory compliance plan
- Organizational design and talent requirements
- Complete audit trail with evidence IDs

---

## Industry-Specific Scenarios

### Example 4: Clinical Trial Design (Pharmaceutical)

```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "pharma_trial_design_001",
    "task": "Design Phase III clinical trial for oncology drug. Indication: Non-small cell lung cancer (NSCLC), PD-L1 positive. Endpoints: Overall survival (OS), progression-free survival (PFS), objective response rate (ORR). Comparator: Standard of care (pembrolizumab).",
    "adapter_id": "comprehensive",
    "context": {
      "industry": "pharmaceutical",
      "indication": "NSCLC, PD-L1 positive",
      "phase": "Phase III",
      "comparator": "pembrolizumab",
      "target_enrollment": "600 patients",
      "regions": ["US", "EU", "Japan"]
    },
    "enable_native_capabilities": true
  }
}
```

---

## Native Capabilities Integration

### Example 5: Monte Carlo Financial Modeling

```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "finance_mc_001",
    "task": "Perform Monte Carlo simulation for 5-year revenue forecast. Base case: $500M Year 1, 20% CAGR, 15% std dev. Run 10,000 iterations. Provide P10, P50, P90 scenarios.",
    "adapter_id": "finance",
    "enable_native_capabilities": true,  // Enables Python execution
    "budget": {
      "max_tokens_in": 10000,
      "max_tokens_out": 10000
    }
  }
}
```

**Python Code Generated**:
```python
import numpy as np
import matplotlib.pyplot as plt

# Parameters
base_revenue = 500  # $M
cagr = 0.20
std_dev = 0.15
years = 5
iterations = 10000

# Monte Carlo simulation
results = []
for _ in range(iterations):
    revenue = base_revenue
    for year in range(years):
        growth = np.random.normal(cagr, std_dev)
        revenue *= (1 + growth)
    results.append(revenue)

# Calculate percentiles
p10 = np.percentile(results, 10)
p50 = np.percentile(results, 50)
p90 = np.percentile(results, 90)

print(f"P10: ${p10:.1f}M")
print(f"P50: ${p50:.1f}M")
print(f"P90: ${p90:.1f}M")
```

---

## Budget Optimization

### Example 6: Cost-Constrained Analysis

```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "budget_constrained_001",
    "task": "Quick competitive analysis for retail market entry. Focus on top 3 competitors only.",
    "adapter_id": "strategy",
    "budget": {
      "max_tokens_in": 5000,   // Low budget
      "max_tokens_out": 5000,
      "max_cpu_ms": 10000
    },
    "tournament_mode": false,  // Disable for speed
    "peer_review_mode": false  // Disable for speed
  }
}
```

**Result**: Fast, focused analysis with reduced quality but within budget constraints.

---

For more examples, see the test suite in `__tests__/` directory.

