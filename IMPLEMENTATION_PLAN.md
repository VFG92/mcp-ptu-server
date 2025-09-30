# Native Integration Implementation Plan

## ✅ Phase 1: Financial Capabilities (COMPLETE - 5/5)

1. ✅ `dcf_modeler` - DCF with Python
2. ✅ `tsr_simulator` - TSR Monte Carlo with Python  
3. ✅ `capital_structure_optimizer` - WACC optimization with Python
4. ✅ `working_capital_diagnostic` - DIO/DSO/DPO with Python
5. ✅ `scenario_forecasting` - Monte Carlo forecasting with Python

**Results**: Confidence 0.85-0.87, Quality 0.88-0.90

---

## 🔄 Phase 2: Market Intelligence (IN PROGRESS - 0/3)

### 6. competitor_analysis (market-capabilities.ts)
- **Type**: Web Search
- **Integration**: Real-time competitive intelligence
- **Queries**: 
  - `{competitor} recent news acquisitions M&A {year}`
  - `{industry} competitive landscape market share`
  - `{competitor} product launches new features`

### 7. regulatory_scan_enhanced (legal-regulatory-capabilities.ts)
- **Type**: Web Search  
- **Integration**: Real-time regulatory monitoring
- **Queries**:
  - `{industry} new regulations {region} {year}`
  - `{industry} compliance requirements changes`
  - `{region} regulatory updates {industry} sector`

### 8. innovation_radar (advanced-analytics-capabilities.ts)
- **Type**: Web Search
- **Integration**: Technology trends and patent monitoring
- **Queries**:
  - `{technology} breakthrough innovations {year}`
  - `{technology} patent filings {year}`
  - `{industry} emerging technologies {technology}`

---

## 📊 Phase 3: Advanced Analytics (TODO - 0/3)

### 9. pricing_ai_optimizer (advanced-analytics-capabilities.ts)
- **Type**: Python
- **Integration**: Dynamic pricing optimization with ML
- **Code**: Price elasticity, demand curves, profit maximization

### 10. digital_twin_ops (advanced-analytics-capabilities.ts)
- **Type**: Python
- **Integration**: Operational simulation
- **Code**: Capacity utilization, efficiency, downtime modeling

### 11. scenario_engine (advanced-analytics-capabilities.ts)
- **Type**: Python
- **Integration**: Probabilistic scenario generation
- **Code**: Monte Carlo multi-variable scenarios

---

## 🛡️ Phase 4: Risk Capabilities (TODO - 0/2)

### 12. cybersecurity_risk_model (risk-capabilities.ts)
- **Type**: Web Search
- **Integration**: Threat intelligence
- **Queries**:
  - `{industry} cybersecurity threats {year}`
  - `latest CVE vulnerabilities {year}`
  - `{industry} data breach incidents`

### 13. geostrategic_risk_scan (risk-capabilities.ts)
- **Type**: Web Search
- **Integration**: Geopolitical risk monitoring
- **Queries**:
  - `{region} geopolitical risks {year}`
  - `trade war sanctions {year}`
  - `supply chain disruptions {region}`

---

## Implementation Strategy

### For Web Search Capabilities:

```typescript
// Add at start of execute(), after const startTime
const nativeCapabilities = getNativeCapabilities(context);
let realTimeData: any[] = [];
let evidenceType = EvidenceType.HEURISTIC;
let warnings: string[] = [];

if (nativeCapabilities?.isAvailable(NativeCapabilityType.WEB_SEARCH)) {
  const searchQueries = [
    // Capability-specific queries
  ];

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
      warnings.push(`Real-time intelligence: ${realTimeData.length} sources via LLM web search`);
    }
  } catch (error) {
    warnings.push('LLM web search unavailable - using heuristic estimates');
  }
}

// Then enrich output with realTimeData if available
const output = realTimeData.length > 0 ? enrichWithRealData(realTimeData) : { /* heuristics */ };
```

### For Python Capabilities:

```typescript
// Add at start of execute(), after const startTime
const nativeCapabilities = getNativeCapabilities(context);
let nativeResults: any = null;
let evidenceType = EvidenceType.HEURISTIC;
let warnings: string[] = [];

if (nativeCapabilities?.isAvailable(NativeCapabilityType.PYTHON_EXECUTION)) {
  const pythonCode = `
import json
import numpy as np

# Capability-specific Python code

print(json.dumps(result))
`;

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
        evidenceType = EvidenceType.CALCULATION; // or SIMULATION
        warnings.push('Real calculation via LLM native Python');
      }
    }
  } catch (error) {
    warnings.push('LLM native capabilities unavailable - using heuristic estimates');
  }
}

const output = nativeResults || { /* heuristics */ };
```

### Update return statement:

```typescript
return {
  capability_id: 'capability_name',
  output,
  evidence: {
    key_field: [{
      type: evidenceType,  // Use variable instead of hardcoded
      rationale: nativeResults ? 'Real data via LLM native...' : 'Heuristic...',
      timestamp: Date.now()
    }]
  },
  confidence: nativeResults ? 0.86 : 0.72,  // Boost when real data
  quality_score: nativeResults ? 0.89 : 0.82,  // Boost when real data
  warnings: nativeResults ? warnings : ['Heuristic warnings...'],
  // ... rest
};
```

---

## Progress Tracking

- **Total**: 13 capabilities
- **Completed**: 5 (38%)
- **Remaining**: 8 (62%)
  - Market: 3
  - Advanced Analytics: 3
  - Risk: 2

**Target**: Complete all 13 by end of session

