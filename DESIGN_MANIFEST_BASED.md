# 🎯 Design: Manifest-Based Execution System

## Problema Attuale

### Frammentazione dell'Esecuzione
- Ogni step di ogni piano richiede una chiamata separata a `execute_plan_step`
- Overhead cognitivo per ChatGPT
- Interruzione del flusso di reasoning naturale
- Evidence generation artificiale invece che organica

### Forzatura Tool MCP vs Reasoning Nativo
- Spingiamo ChatGPT a invocare tool MCP invece di usare tool nativi (web search, Python, code interpreter)
- Confidenza bassa (40%) perché evidence "dichiarate" non "generate"
- Evidence non "load bearing" (non sostanziali)

### Mancanza di Diagnostica Specifica
- Sistema dice "serve più evidenza" ma non specifica QUALE
- ChatGPT non sa come migliorare

### Consenso Penalizza Dissenso
- Sistema penalizza divergenza invece di valorizzare dissenso argomentato
- Perdita di ricchezza cognitiva

### Mancanza di Metariflessione
- Nessun momento di sintesi riflessiva post-mediazione
- Lezione cognitiva si perde

### Mancanza di Persistenza
- Nessun save/resume
- Interruzioni causano perdita totale

---

## Soluzione: Manifest-Based Execution

### Workflow Nuovo

```
1. PLANNING PHASE (invariato)
   - init_parallel_reasoning
   - submit_reasoning_plan × N

2. EXECUTION MANIFEST (NUOVO)
   - execute_reasoning_manifest
     → Genera manifest completo con tutti gli step
     → ChatGPT esegue reasoning nativo con tool nativi
     → Produce workpapers strutturati

3. EVIDENCE REGISTRATION (NUOVO)
   - register_execution_results
     → Registra tutti i risultati in batch
     → Calcola quality signals
     → Genera saliency report

4. CRITIQUE & MEDIATION (evoluto)
   - submit_peer_critique (con dissenso valorizzato)
   - submit_mediation_decision
   - generate_meta_reflection (NUOVO)

5. FINALIZATION
   - finalize_parallel_reasoning
```

---

## Componenti Chiave

### 1. Execution Manifest

**Tool**: `execute_reasoning_manifest`

**Input**:
```typescript
{
  session_id: string
}
```

**Output**:
```typescript
{
  execution_token: string,
  manifest: {
    session_id: string,
    plans: {
      plan_id: string,
      description: string,
      diversity_axes: string[],
      steps: {
        step_id: string,
        capability: string,
        context: string,
        expected_outputs: string[]
      }[]
    }[],
    quality_targets: {
      coverage: number,
      confidence: number,
      consensus: number
    },
    guidance: string
  }
}
```

**Guidance Template**:
```
You have received an execution manifest for parallel reasoning session {session_id}.

CRITICAL INSTRUCTIONS:
1. Execute ALL steps across ALL plans using your NATIVE reasoning and tools
2. Use web search, Python, code interpreter, and other native capabilities
3. Generate WORKPAPERS for each analysis (datasets, calculations, comparisons)
4. Cite EXTERNAL SOURCES with URLs and specific data points
5. Produce "load bearing" evidence that can be independently verified

EXECUTION APPROACH:
- Work through each plan systematically
- For quantitative analysis: create datasets, run calculations, show methodology
- For comparative analysis: build comparison tables with specific metrics
- For research: cite sources with URLs, dates, specific claims
- Document your reasoning process and intermediate findings

QUALITY STANDARDS:
- Each finding must be traceable to specific evidence
- Quantitative claims must show data and calculations
- Qualitative claims must cite sources
- Comparative claims must show explicit comparisons

After completing all steps, call register_execution_results with your findings.
```

### 2. Evidence Registration

**Tool**: `register_execution_results`

**Input**:
```typescript
{
  execution_token: string,
  results: {
    plan_id: string,
    step_id: string,
    findings: string,
    evidence_refs: string[],  // URLs, citations, data sources
    workpapers: {
      type: 'dataset' | 'calculation' | 'comparison' | 'analysis',
      title: string,
      content: string,
      format: 'markdown' | 'json' | 'csv'
    }[]
  }[]
}
```

**Processing**:
1. Validate execution_token
2. Register all evidence in batch
3. Calculate quality signals:
   - Check for external sources (URLs, citations)
   - Check for quantitative data (numbers, calculations)
   - Check for workpapers (structured artifacts)
   - Check for comparative analysis (explicit comparisons)
4. Generate saliency report
5. Update session metrics

### 3. Saliency Report

**Aggiunto a**: `list_plan_status`

**Structure**:
```typescript
{
  missing_evidence_types: [
    {
      type: 'quantitative_data',
      description: 'Numerical analysis with calculations',
      examples: [
        'Market size calculations with data sources',
        'Revenue estimates with methodology',
        'Growth rate comparisons with historical data'
      ],
      priority: 'critical',
      affected_plans: ['plan_A', 'plan_B']
    },
    {
      type: 'external_sources',
      description: 'Citations from authoritative sources',
      examples: [
        'Industry reports with URLs',
        'Company financial data from public sources',
        'Academic research citations'
      ],
      priority: 'high',
      affected_plans: ['plan_A']
    }
  ],
  weak_steps: [
    {
      plan_id: 'plan_A',
      step_id: 'step_2',
      issue: 'No external sources cited',
      suggestion: 'Add URLs to industry reports or company websites'
    }
  ],
  consensus_gaps: [
    {
      topic: 'Market size estimation methodology',
      divergent_plans: ['plan_A', 'plan_B'],
      requires_mediation: true
    }
  ]
}
```

### 4. Consensus Evolution

**Nuova Formula**:
```typescript
consensus_score = (
  agreement_weight * agreement_score +
  productive_disagreement_weight * productive_disagreement_score +
  convergence_weight * convergence_quality
) / (agreement_weight + productive_disagreement_weight + convergence_weight)

// Weights
agreement_weight = 0.4
productive_disagreement_weight = 0.3  // NUOVO
convergence_weight = 0.3  // NUOVO
```

**Productive Disagreement Score**:
- Dissenso argomentato con evidence: +1.0
- Dissenso che porta a raffinamento: +0.8
- Dissenso superficiale: +0.2
- Accordo senza argomentazione: +0.5

**Convergence Quality**:
- Convergenza dopo confronto costruttivo: +1.0
- Convergenza prematura: +0.3
- Divergenza persistente ma argomentata: +0.7

### 5. Meta-Reflection

**Tool**: `generate_meta_reflection`

**Input**:
```typescript
{
  session_id: string
}
```

**Output**:
```typescript
{
  key_insights: string[],
  judgment_categories_revealed: string[],
  process_learnings: string[],
  cognitive_patterns: string[],
  recommendations_for_future: string[]
}
```

**Guidance**:
```
Generate a meta-reflection on the parallel reasoning process.

FOCUS AREAS:
1. Key Insights: What did the process reveal that wasn't obvious at the start?
2. Judgment Categories: What criteria emerged as most important for evaluation?
3. Process Learnings: What worked well? What could be improved?
4. Cognitive Patterns: What patterns of thinking emerged across plans?
5. Future Recommendations: How should similar problems be approached?

This is NOT a summary of conclusions. This is a reflection on the PROCESS itself
and what it revealed about how to think about this type of problem.
```

### 6. Session Persistence

**Auto-save**: Every 5 minutes or after significant state changes

**Checkpoint Structure**:
```typescript
{
  session_id: string,
  checkpoint_id: string,
  timestamp: number,
  phase: 'planning' | 'execution' | 'critique' | 'mediation' | 'finalization',
  state: ParallelReasoningSession,
  resume_token: string
}
```

**Resume Tool**: `resume_session`

**Input**:
```typescript
{
  resume_token: string
}
```

**Output**:
```typescript
{
  session_id: string,
  phase: string,
  next_steps: string[],
  context_summary: string
}
```

---

## Migration Strategy

### Phase 1: Backward Compatibility
- Keep existing `execute_plan_step` working
- Add new `execute_reasoning_manifest` as optional
- Both workflows coexist

### Phase 2: Gradual Adoption
- Update guidance to recommend manifest-based approach
- Show comparison of results (confidence, quality)
- Collect feedback

### Phase 3: Deprecation
- Mark `execute_plan_step` as deprecated
- Provide migration guide
- Eventually remove old workflow

---

## Success Metrics

### Quantitative
- Confidence score: target ≥85% (vs current 40%)
- Evidence quality: ≥80% with external sources
- Consensus quality: ≥80% with productive disagreement
- Session completion rate: ≥90% (vs current ~50% due to interruptions)

### Qualitative
- ChatGPT reports less cognitive overhead
- Evidence is "load bearing" and independently verifiable
- Meta-reflections provide genuine insights
- Users can resume interrupted sessions successfully

---

## Implementation Priority

1. **High Priority** (Fase 1-3): Execution Manifest + Evidence Registration
   - Biggest impact on confidence and quality
   - Enables natural reasoning flow

2. **Medium Priority** (Fase 4-6): Saliency Report + Consensus Evolution + Meta-Reflection
   - Improves diagnostics and cognitive depth
   - Enhances learning from process

3. **Low Priority** (Fase 7): Session Persistence
   - Quality of life improvement
   - Can be added incrementally

---

## Next Steps

1. Review and approve design
2. Start with Fase 1: Detailed architecture design
3. Prototype execution manifest generation
4. Test with real ChatGPT session
5. Iterate based on results

