# Parallel Reasoning Tools - Complete Reference

## Tool 1: `init_parallel_reasoning`

Initialize parallel reasoning session with diversity requirements.

### Arguments
- `session_id` - Unique session identifier (will become Durable Object ID)
- `task_description` - Task to analyze
- `required_diversity_axes` - Axes that must differ (min 2)
- `min_plans` - Minimum number of plans (3-32, default 3)

### Example Request
```json
{
  "session_id": "market_analysis_001",
  "task_description": "Analyze European fintech market",
  "required_diversity_axes": ["data_sources", "analytical_models"],
  "min_plans": 3
}
```

### Example Response
```json
{
  "content": [{
    "type": "text",
    "text": "✅ Parallel Reasoning Session Initialized\n\nSession ID: `market_analysis_001`\n..."
  }]
}
```

### Best Practices
- ✅ Use descriptive session IDs (e.g., `fintech_analysis_2025_01`)
- ✅ Choose 2-3 required axes that ensure meaningful diversity
- ✅ Set `min_plans` to 3-5 for most analyses (more for complex tasks)
- ⚠️ Save the session ID from response header for subsequent requests

### Common Errors
- `session_id` already exists → Use unique ID or finalize previous session
- Invalid `required_diversity_axes` → Must be from enum: data_sources, analytical_models, time_horizons, quality_metrics, risk_perspectives, stakeholder_views

---

## Tool 2: `submit_reasoning_plan`

Submit reasoning plan with diversity validation (≥2 axes differ from existing plans).

### Arguments
- `session_id` - Session identifier (must match init)
- `plan` - Plan object with:
  - `plan_id` - Unique plan identifier
  - `description` - Human-readable description
  - `diversity_axes` - Array of axes (must include required axes)
  - `capability_chain` - Array of 8-32 capability IDs
  - `rationale` - Why this plan adds value
  - `expected_outputs` - Expected artifact types

### Example Request
```json
{
  "session_id": "market_analysis_001",
  "plan": {
    "plan_id": "plan_A",
    "description": "Data-driven baseline",
    "diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
    "capability_chain": [
      "market_scan", "tam_sam_som_build", "competitor_analysis",
      "customer_segmentation", "wtp_analysis", "gtm_playbook",
      "dcf_modeler", "scenario_forecasting"
    ],
    "rationale": "Provides reliable baseline using official statistics",
    "expected_outputs": ["market_map", "tam_sam_som"]
  }
}
```

### Example Success Response
```json
{
  "content": [{
    "type": "text",
    "text": "Plan Submission: plan_A\n\n✅ Plan Accepted\n\nDiversity Validation:\n- Axes declared: 3\n- Required axes satisfied: ✓\n- Unique from existing plans: ✓"
  }]
}
```

### Example Rejection Response
```json
{
  "content": [{
    "type": "text",
    "text": "Plan Submission: plan_B\n\n❌ Plan Rejected\n\nReason: Plan diversity axes too similar to existing plans (at least 2 axes must differ)\n\nDiversity Validation:\n- Axes declared: data_sources, analytical_models, time_horizons\n- Axes unique: ✗ (only 1 axis differs from plan_A)"
  }]
}
```

### Best Practices
- ✅ Always include session's `required_diversity_axes` in every plan
- ✅ Add 1-2 additional axes to differentiate from other plans
- ✅ Use descriptive plan IDs (e.g., `plan_baseline`, `plan_risk_focused`)
- ✅ Ensure capability_chain has 8-32 capabilities
- ⚠️ Test diversity before submitting (symmetric difference ≥2)

### Common Errors
- `Session not found` → Verify session_id and mcp-session-id header match
- `Plan must declare at least 2 diversity axes` → Add more axes
- `Plan must include required diversity axes` → Include all required axes from init
- `Plan diversity axes too similar` → Change at least 2 axes from existing plans
- `Plan ID already exists` → Use unique plan_id per session

---

## Tool 3: `execute_plan_step`

Execute capability for specific plan (enables parallel execution).

### Arguments
- `session_id` - Session identifier
- `plan_id` - Plan identifier
- `task` - Task description for capability
- `adapter_id` - Optional adapter (strategy, finance, commercial, risk, comprehensive)
- `budget` - Optional budget constraints

### Example Request
```json
{
  "session_id": "market_analysis_001",
  "plan_id": "plan_A",
  "task": "Analyze European fintech market size and growth",
  "adapter_id": "strategy"
}
```

### Example Response
```json
{
  "content": [{
    "type": "text",
    "text": "# Plan Step Executed: plan_A\n\n## Market Analysis\n\n[Capability output...]"
  }]
}
```

### Best Practices
- ✅ Execute steps in logical order (ChatGPT orchestrates)
- ✅ Use specific task descriptions for better results
- ✅ Set budget constraints for cost control
- ⚠️ Results are automatically saved to plan_results

### Common Errors
- `Session not found` → Verify mcp-session-id header
- `Plan ID not found` → Submit plan before executing steps

---

## Tool 4: `submit_cross_plan_note`

Submit note from one plan to another (contamination).

### Arguments
- `session_id` - Session identifier
- `note` - Note object with:
  - `from_plan_id` - Source plan
  - `to_plan_id` - Target plan
  - `note` - Message content
  - `references` - Evidence IDs referenced
  - `timestamp` - Unix timestamp

### Example Request
```json
{
  "session_id": "market_analysis_001",
  "note": {
    "from_plan_id": "plan_A",
    "to_plan_id": "plan_B",
    "note": "Found market size €50B using official statistics. Consider this baseline in your Monte Carlo simulation.",
    "references": ["evidence_001", "evidence_002"],
    "timestamp": 1704067200000
  }
}
```

### Best Practices
- ✅ Use cross-plan notes to share key findings
- ✅ Reference specific evidence IDs for traceability
- ✅ Keep notes concise and actionable
- ⚠️ Contamination enables plans to learn from each other

---

## Tool 5: `submit_peer_critique`

Submit peer critique (ChatGPT-generated).

### Arguments
- `session_id` - Session identifier
- `critique` - Critique object with:
  - `reviewer_plan_id` - Reviewing plan
  - `reviewed_plan_id` - Reviewed plan
  - `claims_challenged` - Array of challenged claims
  - `residual_risks` - Identified risks
  - `agreement_score` - 0-1 score
  - `timestamp` - Unix timestamp

### Example Request
```json
{
  "session_id": "market_analysis_001",
  "critique": {
    "reviewer_plan_id": "plan_B",
    "reviewed_plan_id": "plan_A",
    "claims_challenged": [{
      "claim": "Market will grow linearly at 15% CAGR",
      "evidence_ids": ["evidence_003"],
      "challenge": "Assumes linear growth, but market shows high volatility",
      "falsification_test": "Test with 2008 crisis data"
    }],
    "residual_risks": ["Regulatory changes not considered", "Competition underestimated"],
    "agreement_score": 0.65,
    "timestamp": 1704067200000
  }
}
```

### Best Practices
- ✅ Challenge specific claims with evidence
- ✅ Propose falsification tests
- ✅ Identify residual risks
- ✅ Provide honest agreement scores
- ⚠️ Peer review improves overall quality

---

## Tool 6: `submit_mediation_decision`

Submit mediation decision with evidence citations.

### Arguments
- `session_id` - Session identifier
- `decision` - Decision object with:
  - `decision_point` - What is being decided
  - `chosen_from_plan` - Which plan's approach is chosen
  - `rationale` - Why this choice
  - `evidence_ids` - Supporting evidence
  - `confidence` - 0-1 confidence score

### Example Request
```json
{
  "session_id": "market_analysis_001",
  "decision": {
    "decision_point": "Market size estimation method",
    "chosen_from_plan": "plan_B",
    "rationale": "Monte Carlo provides confidence intervals, more robust than point estimate",
    "evidence_ids": ["evidence_005", "evidence_006"],
    "confidence": 0.82
  }
}
```

### Best Practices
- ✅ Make decisions for each major analysis point
- ✅ Always cite evidence IDs
- ✅ Provide clear rationale
- ✅ Assign realistic confidence scores
- ⚠️ Mediation creates final synthesized result

---

## Tool 7: `list_plan_status`

List pending frames (passive status listing).

### Arguments
- `session_id` - Session identifier

### Example Request
```json
{
  "session_id": "market_analysis_001"
}
```

### Example Response
```json
{
  "content": [{
    "type": "text",
    "text": "Session Status: market_analysis_001\n\nPlans submitted: 3\nPending frames: 2\n- plan_execution:plan_C\n- peer_review:3_remaining"
  }]
}
```

### Best Practices
- ✅ Check status before finalizing
- ✅ Ensure all plans executed
- ✅ Verify peer reviews complete
- ⚠️ Use for progress tracking only

---

## Tool 8: `finalize_parallel_reasoning`

Finalize session with completeness validation.

### Arguments
- `session_id` - Session identifier

### Example Request
```json
{
  "session_id": "market_analysis_001"
}
```

### Example Response
```json
{
  "content": [{
    "type": "text",
    "text": "✅ Session Finalized\n\nCompleteness Check:\n- All plans executed: ✓\n- All decisions have evidence: ✓\n\nDecision Map: [...]"
  }]
}
```

### Best Practices
- ✅ Finalize only when all work complete
- ✅ Review completeness check
- ✅ Use decision map for final synthesis
- ⚠️ Finalization validates structural completeness

