# Migration Guide: Persona-Based → Capability-Driven Architecture

## Overview

The MCP PTU Server is transitioning from a **persona-based** system to a **capability-driven** architecture. This guide helps you migrate your integrations.

## Why the Change?

### Old System (Persona-Based)
- ❌ Static personas with fixed expertise
- ❌ No evidence tracking or verification
- ❌ Limited budget awareness
- ❌ No confidence scoring
- ❌ Difficult to compose and extend

### New System (Capability-Driven)
- ✅ 80-120 atomic, composable capabilities
- ✅ Evidence-anchored reasoning with 6 evidence types
- ✅ Budget-aware scheduling with progressive disclosure
- ✅ Confidence calculus based on verification
- ✅ Strong output schemas with validation
- ✅ Tournament mode for best results
- ✅ Full audit trail for compliance

## Migration Path

### 1. Update Your Tool Calls

#### Old Way (Deprecated)
```typescript
// Using persona-based parallel reasoning
{
  "name": "parallel_reasoning_init",
  "arguments": {
    "session_id": "my_session",
    "task": "Analyze market opportunity",
    "perspectives": ["strategy_consultant", "financial_analyst"]
  }
}
```

#### New Way (Recommended)
```typescript
// Using capability-driven analysis
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "my_session",
    "task": "Analyze market opportunity",
    "adapter_id": "strategy",  // or "finance", "risk", "comprehensive"
    "budget": {
      "max_tokens_in": 10000,
      "max_tokens_out": 10000,
      "max_cpu_ms": 10000,
      "max_subrequests": 50
    }
  }
}
```

### 2. Persona → Adapter Mapping

| Old Persona | New Adapter | Capabilities Included |
|------------|-------------|----------------------|
| `strategy_consultant` | `strategy` | Market analysis, competitive positioning, strategic planning |
| `financial_analyst` | `finance` | Unit economics, financial modeling, valuation |
| `marketing_strategist` | `commercial` | GTM strategy, pricing, customer segmentation |
| `risk_analyst` | `risk` | Risk assessment, mitigation planning, compliance |
| Multiple personas | `comprehensive` | All capabilities with tournament mode |

### 3. New Features You Get

#### Evidence-Backed Results
```typescript
// Every artifact includes evidence
{
  "artifacts": [{
    "type": "market_map",
    "data": { /* your analysis */ },
    "confidence": 0.87,
    "evidence_quality": 0.92,
    "evidence": {
      "calculations": [...],
      "retrievals": [...],
      "assumptions": [...]
    }
  }]
}
```

#### Budget Tracking
```typescript
// Know exactly what you're spending
{
  "cost_actual": {
    "tokens_in": 2500,
    "tokens_out": 3200,
    "cpu_ms": 450,
    "subrequests": 12
  },
  "budget_remaining": { /* remaining budget */ }
}
```

#### Quality Metrics
```typescript
// Confidence and quality scores
{
  "overall_confidence": 0.85,
  "coverage": 0.92,
  "quality_flags": ["high_evidence_quality", "verified_calculations"]
}
```

### 4. Available Tools

#### ✅ New Capability Tools (Production Ready)
- `analyze_with_capabilities` - Main analysis tool | ✅ Tested & Verified
- `list_capabilities` - Browse available capabilities | ✅ Tested & Verified
- `get_capability_status` - Check session status | ✅ Production Ready
- `export_session` - Export for audit/compliance | ✅ Production Ready

#### ⚠️ Legacy Tools (Deprecated but Still Functional)
- `parallel_reasoning_init` - ⚠️ Deprecated | ✅ Tested & Functional
- `agent_reasoning_step` - ⚠️ Deprecated
- `cross_agent_communication` - ⚠️ Deprecated
- `synthesize_parallel_reasoning` - ⚠️ Deprecated
- `parallel_compute_status` - ⚠️ Deprecated
- `agent_debate` - ⚠️ Deprecated
- `list_agent_personas` - ⚠️ Deprecated
- `validate_session_spec` - ⚠️ Deprecated

**Note**: All 12 tools have been verified operational. See [TOOL_STATUS_REPORT.md](./TOOL_STATUS_REPORT.md) for detailed test results.

### 5. Code Examples

#### List Available Capabilities
```typescript
{
  "name": "list_capabilities",
  "arguments": {
    "category": "market"  // optional filter
  }
}
```

#### Run Analysis with Budget
```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "session_123",
    "task": "Calculate unit economics for SaaS business",
    "adapter_id": "finance",
    "budget": {
      "max_tokens_in": 5000,
      "max_tokens_out": 5000,
      "max_cpu_ms": 5000,
      "max_subrequests": 20
    }
  }
}
```

#### Export Session for Audit
```typescript
{
  "name": "export_session",
  "arguments": {
    "session_id": "session_123"
  }
}
```

### 6. Advanced Features

#### Tournament Mode
For highest quality results, enable tournament mode:
```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "session_123",
    "task": "Strategic market analysis",
    "tournament_mode": true  // Slower but higher quality
  }
}
```

#### Required Artifacts
Specify exactly what you need:
```typescript
{
  "name": "analyze_with_capabilities",
  "arguments": {
    "session_id": "session_123",
    "task": "Market analysis",
    "required_artifacts": ["market_map", "tam_sam_som", "competitive_matrix"]
  }
}
```

## Timeline

- **Now**: Both systems available
- **Q2 2025**: Persona system deprecated (warnings added)
- **Q3 2025**: Persona system removed

## Support

For questions or issues during migration:
1. Check the [TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md) for technical details
2. Review [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) for integration steps
3. Open an issue on GitHub

## Benefits Summary

| Feature | Persona-Based | Capability-Driven |
|---------|--------------|-------------------|
| Evidence tracking | ❌ | ✅ |
| Budget awareness | ❌ | ✅ |
| Confidence scoring | ❌ | ✅ |
| Output validation | ❌ | ✅ |
| Audit trail | ❌ | ✅ |
| Composability | ❌ | ✅ |
| Progressive disclosure | ❌ | ✅ |
| Tournament mode | ❌ | ✅ |

**Recommendation**: Start migrating to capability-driven architecture now to take advantage of these features!

