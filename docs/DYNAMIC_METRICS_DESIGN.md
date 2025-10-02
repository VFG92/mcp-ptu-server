# Dynamic Quality Metrics Design

## Problem Statement

Current quality indicators (confidence, coverage, consensus) are placeholder cosmetici that don't drive workflow behavior or provide actionable feedback. They need to become real metrics that:

1. Calculate based on actual session data
2. Provide thresholds that guide completion
3. Show up in finalization with clear actionable feedback
4. Influence whether finalization should proceed

## Metric Definitions

### 1. Confidence (0-1)

**Formula**:
```
confidence = base_confidence + evidence_bonus - quality_penalty
```

**Components**:
- `base_confidence`: 0.5 (starting point)
- `evidence_bonus`: +0.1 per unique evidence ID referenced (max +0.3)
- `quality_penalty`: -0.2 for each `evidence_low` signal (max -0.4)
- Clamped to [0, 1]

**Calculation**:
```typescript
function calculateConfidence(session: ParallelReasoningSession): number {
  const baseConfidence = 0.5;
  
  // Count unique evidence IDs across all artifacts
  const uniqueEvidenceIds = new Set<string>();
  
  // From plan results
  for (const results of session.plan_results.values()) {
    for (const result of results) {
      if (result.evidence_id) {
        uniqueEvidenceIds.add(result.evidence_id);
      }
    }
  }
  
  // From mediation decisions
  for (const decision of session.mediation_decisions) {
    for (const evidenceId of decision.evidence_ids) {
      uniqueEvidenceIds.add(evidenceId);
    }
  }
  
  const evidenceBonus = Math.min(0.3, uniqueEvidenceIds.size * 0.1);
  
  // Count evidence_low signals
  let evidenceLowCount = 0;
  for (const plan of session.plans.values()) {
    if (plan.signals?.signals.some(s => s.type === 'evidence_low')) {
      evidenceLowCount++;
    }
  }
  for (const critique of session.peer_critiques) {
    if (critique.signals?.signals.some(s => s.type === 'evidence_low')) {
      evidenceLowCount++;
    }
  }
  for (const decision of session.mediation_decisions) {
    if (decision.signals?.signals.some(s => s.type === 'evidence_low')) {
      evidenceLowCount++;
    }
  }
  
  const qualityPenalty = Math.min(0.4, evidenceLowCount * 0.2);
  
  return Math.max(0, Math.min(1, baseConfidence + evidenceBonus - qualityPenalty));
}
```

**Threshold**: 0.6 (warning if below)

### 2. Coverage (0-1)

**Formula**:
```
coverage = executed_steps / total_declared_steps
```

**Calculation**:
```typescript
function calculateCoverage(session: ParallelReasoningSession): number {
  let totalDeclaredSteps = 0;
  let executedSteps = 0;
  
  for (const [planId, plan] of session.plans) {
    totalDeclaredSteps += plan.capability_chain.length;
    
    const results = session.plan_results.get(planId);
    if (results) {
      executedSteps += results.length;
    }
  }
  
  if (totalDeclaredSteps === 0) return 0;
  
  return executedSteps / totalDeclaredSteps;
}
```

**Threshold**: 0.8 (warning if below)

### 3. Consensus (0-1)

**Formula**:
```
consensus = (agreements - conflicts) / total_interactions
```

**Components**:
- `agreements`: Count of peer critiques with `agreement_score > 0.7`
- `conflicts`: Count of peer critiques with `agreement_score < 0.4`
- `total_interactions`: Total number of peer critiques + cross-plan notes

**Calculation**:
```typescript
function calculateConsensus(session: ParallelReasoningSession): number {
  if (session.peer_critiques.length === 0) {
    return 0.5; // Neutral if no critiques
  }
  
  let agreements = 0;
  let conflicts = 0;
  
  for (const critique of session.peer_critiques) {
    if (critique.agreement_score > 0.7) {
      agreements++;
    } else if (critique.agreement_score < 0.4) {
      conflicts++;
    }
  }
  
  const totalInteractions = session.peer_critiques.length + session.cross_plan_notes.length;
  
  if (totalInteractions === 0) return 0.5;
  
  const score = (agreements - conflicts) / totalInteractions;
  
  // Normalize to [0, 1]
  return Math.max(0, Math.min(1, (score + 1) / 2));
}
```

**Threshold**: 0.5 (warning if below)

## Integration Points

### 1. Session State Extension

Add metrics tracking to `ParallelReasoningSession`:

```typescript
export interface ParallelReasoningSession {
  // ... existing fields ...
  
  // NEW: Computed metrics (cached)
  metrics?: {
    confidence: number;
    coverage: number;
    consensus: number;
    computed_at: number;
  };
}
```

### 2. Metric Computation

Add method to `ParallelReasoningSessionManager`:

```typescript
computeSessionMetrics(session_id: string): SessionMetrics {
  const session = this.sessions.get(session_id);
  if (!session) {
    throw new Error(`Session ${session_id} not found`);
  }
  
  const metrics = {
    confidence: calculateConfidence(session),
    coverage: calculateCoverage(session),
    consensus: calculateConsensus(session),
    computed_at: Date.now()
  };
  
  // Cache metrics
  session.metrics = metrics;
  
  return metrics;
}
```

### 3. Finalization Integration

Modify `finalizeSession()` to compute and validate metrics:

```typescript
finalizeSession(session_id: string): {
  finalized: boolean;
  completeness_check: { /* ... */ };
  metrics?: SessionMetrics;
  warnings?: string[];
  quality_summary?: { /* ... */ };
} {
  // ... existing validation ...
  
  // Compute metrics
  const metrics = this.computeSessionMetrics(session_id);
  
  // Add metric warnings
  const metricWarnings: string[] = [];
  
  if (metrics.confidence < 0.6) {
    metricWarnings.push(
      `⚠️ Low Confidence (${(metrics.confidence * 100).toFixed(1)}%): ` +
      `Add more evidence references or improve quality signals`
    );
  }
  
  if (metrics.coverage < 0.8) {
    metricWarnings.push(
      `⚠️ Low Coverage (${(metrics.coverage * 100).toFixed(1)}%): ` +
      `Execute ${Math.ceil((0.8 - metrics.coverage) * totalDeclaredSteps)} more capability steps`
    );
  }
  
  if (metrics.consensus < 0.5) {
    metricWarnings.push(
      `⚠️ Low Consensus (${(metrics.consensus * 100).toFixed(1)}%): ` +
      `Resolve conflicts through additional peer reviews or mediation`
    );
  }
  
  return {
    finalized: /* ... */,
    completeness_check: /* ... */,
    metrics,
    warnings: [...existingWarnings, ...metricWarnings],
    quality_summary: /* ... */
  };
}
```

### 4. Guided Responses

Update `guided-responses.ts` to show metrics:

```typescript
export function formatFinalizationSuccess(
  session_id: string,
  plans_count: number,
  decisions_count: number,
  metrics?: SessionMetrics
): string {
  let response = `# ✅ Session Finalized Successfully\n\n`;
  
  // ... existing content ...
  
  if (metrics) {
    response += `\n## 📊 Quality Metrics\n\n`;
    response += `- **Confidence**: ${(metrics.confidence * 100).toFixed(1)}% `;
    response += metrics.confidence >= 0.6 ? '✅' : '⚠️';
    response += `\n`;
    
    response += `- **Coverage**: ${(metrics.coverage * 100).toFixed(1)}% `;
    response += metrics.coverage >= 0.8 ? '✅' : '⚠️';
    response += `\n`;
    
    response += `- **Consensus**: ${(metrics.consensus * 100).toFixed(1)}% `;
    response += metrics.consensus >= 0.5 ? '✅' : '⚠️';
    response += `\n`;
  }
  
  return response;
}
```

## Implementation Plan

1. ✅ Create metric calculation functions
2. ✅ Add metrics field to session interface
3. ✅ Implement `computeSessionMetrics()` method
4. ✅ Integrate metrics into `finalizeSession()`
5. ✅ Update guided responses to display metrics
6. ✅ Add tests for metric calculations
7. ✅ Update documentation

## Testing Strategy

### Unit Tests

- Test each metric calculation with edge cases
- Test metric caching
- Test threshold validation
- Test warning generation

### Integration Tests

- Test full workflow with metric tracking
- Test finalization with low metrics
- Test finalization with high metrics
- Test metric display in responses

## Non-Blocking Philosophy

**IMPORTANT**: Metrics are **recommendations, not requirements**. They:

- ✅ Provide actionable feedback
- ✅ Guide improvement
- ✅ Show up in finalization
- ❌ DO NOT block finalization
- ❌ DO NOT prevent workflow completion

This maintains the forcing mechanism while reducing friction.

