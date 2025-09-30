/**
 * Peer Review System Example
 * 
 * Demonstrates how the peer review system enables critical evaluation
 * between agents, measuring consensus/conflict as robustness indicators.
 */

import { initializeCapabilitySystem } from '../src/workers/capability-tools.js';
import type { OrchestrationRequest } from '../src/workers/capability-orchestrator.js';

/**
 * Example 1: Market Analysis with Peer Review
 * 
 * Multiple capabilities analyze the market, then critique each other's results.
 * High consensus indicates robust findings.
 */
export async function exampleMarketAnalysisWithPeerReview() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Market Analysis with Peer Review ===\n');
  
  const request: OrchestrationRequest = {
    session_id: 'peer_review_market_001',
    task: 'Analyze the European fintech market for B2B SaaS opportunities. Assess market size, competitive landscape, and growth potential.',
    budget: {
      max_tokens_in: 20000,
      max_tokens_out: 40000,
      max_cpu_ms: 60000,
      max_subrequests: 40
    },
    policy: {
      allow_partial: true,
      require_evidence: true,
      min_confidence: 0.6,
      max_cost_overrun: 1.2
    },
    adapter_id: 'strategy',
    required_artifacts: ['market_map', 'tam_sam_som', 'competitive_landscape'],
    tournament_mode: true,      // Enable tournament
    peer_review_mode: true      // Enable peer review (default)
  };

  const result = await orchestrator.execute(request);

  console.log('📊 Results:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Artifacts: ${result.artifacts.length}`);
  console.log(`  Capabilities executed: ${result.capabilities_executed.length}`);
  console.log(`  Overall confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);

  // Peer review results
  if (result.peer_review) {
    console.log('\n🔍 Peer Review Analysis:');
    console.log(`  Consensus score: ${(result.peer_review.consensus_score * 100).toFixed(1)}%`);
    console.log(`  Conflict score: ${(result.peer_review.conflict_score * 100).toFixed(1)}%`);
    console.log(`  Robustness score: ${(result.peer_review.robustness_score * 100).toFixed(1)}%`);
    console.log(`  Critical disagreements: ${result.peer_review.critical_disagreements}`);
    console.log(`  Review quality: ${(result.peer_review.review_quality * 100).toFixed(1)}%`);

    // Interpretation
    console.log('\n💡 Interpretation:');
    if (result.peer_review.robustness_score >= 0.8) {
      console.log('  ✅ HIGH ROBUSTNESS: Results are highly validated by peer agents');
      console.log('  ✅ Strong consensus indicates reliable findings');
    } else if (result.peer_review.robustness_score >= 0.6) {
      console.log('  ⚠️  MODERATE ROBUSTNESS: Some disagreement among agents');
      console.log('  ⚠️  Review critical disagreements for areas of uncertainty');
    } else {
      console.log('  ❌ LOW ROBUSTNESS: Significant disagreement among agents');
      console.log('  ❌ Results may be unreliable - consider additional analysis');
    }

    if (result.peer_review.critical_disagreements > 0) {
      console.log(`  ⚠️  ${result.peer_review.critical_disagreements} critical disagreement(s) detected`);
      console.log('  → Review conflicting perspectives before making decisions');
    }
  }

  return result;
}

/**
 * Example 2: Financial Modeling with Conflict Detection
 * 
 * Multiple valuation approaches are used, peer review identifies
 * which approaches agree and which conflict.
 */
export async function exampleFinancialModelingWithConflictDetection() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Financial Modeling with Conflict Detection ===\n');
  
  const request: OrchestrationRequest = {
    session_id: 'peer_review_finance_001',
    task: 'Value a SaaS company with $10M ARR, 80% gross margin, 30% growth rate. Use multiple valuation methods and identify areas of agreement/disagreement.',
    budget: {
      max_tokens_in: 15000,
      max_tokens_out: 30000,
      max_cpu_ms: 45000,
      max_subrequests: 30
    },
    policy: {
      allow_partial: true,
      require_evidence: true,
      min_confidence: 0.7,
      max_cost_overrun: 1.2
    },
    adapter_id: 'finance',
    required_artifacts: ['dcf_valuation', 'comparable_multiples', 'precedent_transactions'],
    tournament_mode: true,
    peer_review_mode: true
  };

  const result = await orchestrator.execute(request);

  console.log('📊 Valuation Results:');
  console.log(`  Methods used: ${result.capabilities_executed.length}`);
  console.log(`  Overall confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);

  if (result.peer_review) {
    console.log('\n🔍 Peer Review - Method Agreement:');
    console.log(`  Consensus: ${(result.peer_review.consensus_score * 100).toFixed(1)}%`);
    console.log(`  Conflict: ${(result.peer_review.conflict_score * 100).toFixed(1)}%`);

    if (result.peer_review.consensus_score >= 0.8) {
      console.log('\n  ✅ HIGH CONSENSUS: Valuation methods agree on range');
      console.log('  → High confidence in valuation estimate');
    } else if (result.peer_review.consensus_score >= 0.6) {
      console.log('\n  ⚠️  MODERATE CONSENSUS: Some variation between methods');
      console.log('  → Consider using a range rather than point estimate');
    } else {
      console.log('\n  ❌ LOW CONSENSUS: Significant disagreement between methods');
      console.log('  → Wide valuation range - high uncertainty');
    }

    if (result.peer_review.critical_disagreements > 0) {
      console.log(`\n  🔴 ${result.peer_review.critical_disagreements} critical disagreement(s):`);
      console.log('  → Different methods may be using conflicting assumptions');
      console.log('  → Review methodology and inputs for each approach');
    }
  }

  return result;
}

/**
 * Example 3: Comparing With and Without Peer Review
 * 
 * Shows the difference in output when peer review is enabled vs disabled.
 */
export async function exampleCompareWithAndWithoutPeerReview() {
  const orchestrator = initializeCapabilitySystem();
  
  console.log('\n=== Comparison: With vs Without Peer Review ===\n');
  
  const baseRequest: Omit<OrchestrationRequest, 'session_id' | 'peer_review_mode'> = {
    task: 'Assess the competitive landscape for electric vehicles in Europe',
    budget: {
      max_tokens_in: 10000,
      max_tokens_out: 20000,
      max_cpu_ms: 30000,
      max_subrequests: 20
    },
    policy: {
      allow_partial: true,
      require_evidence: true,
      min_confidence: 0.6,
      max_cost_overrun: 1.2
    },
    adapter_id: 'strategy',
    tournament_mode: true
  };

  // Run WITHOUT peer review
  console.log('🔵 Running WITHOUT peer review...');
  const withoutPeerReview = await orchestrator.execute({
    ...baseRequest,
    session_id: 'compare_without_pr',
    peer_review_mode: false
  });

  console.log('\n📊 Results WITHOUT Peer Review:');
  console.log(`  Confidence: ${(withoutPeerReview.overall_confidence * 100).toFixed(1)}%`);
  console.log(`  Peer review data: ${withoutPeerReview.peer_review ? 'Available' : 'Not available'}`);

  // Run WITH peer review
  console.log('\n🟢 Running WITH peer review...');
  const withPeerReview = await orchestrator.execute({
    ...baseRequest,
    session_id: 'compare_with_pr',
    peer_review_mode: true
  });

  console.log('\n📊 Results WITH Peer Review:');
  console.log(`  Confidence: ${(withPeerReview.overall_confidence * 100).toFixed(1)}%`);
  if (withPeerReview.peer_review) {
    console.log(`  Consensus: ${(withPeerReview.peer_review.consensus_score * 100).toFixed(1)}%`);
    console.log(`  Robustness: ${(withPeerReview.peer_review.robustness_score * 100).toFixed(1)}%`);
    console.log(`  Critical disagreements: ${withPeerReview.peer_review.critical_disagreements}`);
  }

  console.log('\n💡 Key Differences:');
  console.log('  WITHOUT peer review:');
  console.log('    • Faster execution (no critique generation)');
  console.log('    • No robustness metrics');
  console.log('    • No conflict detection');
  console.log('    • Tournament based only on evidence/confidence');
  
  console.log('\n  WITH peer review:');
  console.log('    • Agents critique each other');
  console.log('    • Consensus/conflict measured');
  console.log('    • Robustness score calculated');
  console.log('    • Critical disagreements identified');
  console.log('    • Tournament enhanced with peer insights');

  return { withoutPeerReview, withPeerReview };
}

/**
 * Example 4: Interpreting Peer Review Metrics
 */
export function interpretPeerReviewMetrics(
  consensusScore: number,
  conflictScore: number,
  robustnessScore: number,
  criticalDisagreements: number
): void {
  console.log('\n📖 Peer Review Metrics Guide:\n');

  console.log('🎯 Consensus Score:', (consensusScore * 100).toFixed(1) + '%');
  if (consensusScore >= 0.8) {
    console.log('  → Strong agreement among agents');
    console.log('  → Results are well-validated');
  } else if (consensusScore >= 0.6) {
    console.log('  → Moderate agreement');
    console.log('  → Some variation in perspectives');
  } else {
    console.log('  → Low agreement');
    console.log('  → Significant divergence in agent opinions');
  }

  console.log('\n⚔️  Conflict Score:', (conflictScore * 100).toFixed(1) + '%');
  if (conflictScore <= 0.2) {
    console.log('  → Minimal conflict');
    console.log('  → Agents largely agree');
  } else if (conflictScore <= 0.4) {
    console.log('  → Moderate conflict');
    console.log('  → Some disagreements present');
  } else {
    console.log('  → High conflict');
    console.log('  → Major disagreements between agents');
  }

  console.log('\n💪 Robustness Score:', (robustnessScore * 100).toFixed(1) + '%');
  if (robustnessScore >= 0.8) {
    console.log('  → Highly robust results');
    console.log('  → Safe to rely on findings');
  } else if (robustnessScore >= 0.6) {
    console.log('  → Moderately robust');
    console.log('  → Consider additional validation');
  } else {
    console.log('  → Low robustness');
    console.log('  → Results may be unreliable');
  }

  console.log('\n🔴 Critical Disagreements:', criticalDisagreements);
  if (criticalDisagreements === 0) {
    console.log('  → No critical conflicts');
    console.log('  → All agents broadly aligned');
  } else {
    console.log(`  → ${criticalDisagreements} critical conflict(s) detected`);
    console.log('  → Review conflicting perspectives carefully');
    console.log('  → May indicate areas of genuine uncertainty');
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await exampleMarketAnalysisWithPeerReview();
      await exampleFinancialModelingWithConflictDetection();
      await exampleCompareWithAndWithoutPeerReview();
      
      // Example interpretation
      interpretPeerReviewMetrics(0.82, 0.18, 0.87, 1);
    } catch (error) {
      console.error('Error running examples:', error);
    }
  })();
}

