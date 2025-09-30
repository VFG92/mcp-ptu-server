/**
 * Synthesis Strategies for Multi-Agent Parallel Reasoning
 * 
 * Different algorithms for combining agent outputs into final results
 */

export interface AgentResult {
  agent_id: string;
  role: string;
  reasoning: string;
  confidence: number;
  key_points: string[];
  concerns?: string[];
  recommendations?: string[];
}

export interface SynthesisResult {
  final_answer: string;
  confidence: number;
  strategy_used: string;
  agent_contributions: Record<string, {
    weight: number;
    key_insights: string[];
    influence: number;
  }>;
  conflicts_resolved?: Array<{
    between: string[];
    conflict: string;
    resolution: string;
  }>;
  consensus_level: number;
}

/**
 * Consensus Strategy: Find common ground and agreements
 */
export function consensusSynthesis(results: AgentResult[]): SynthesisResult {
  // Find common themes across all agents
  const allPoints = results.flatMap(r => r.key_points);
  const pointFrequency = new Map<string, number>();
  
  allPoints.forEach(point => {
    const normalized = point.toLowerCase().trim();
    pointFrequency.set(normalized, (pointFrequency.get(normalized) || 0) + 1);
  });
  
  // Points mentioned by majority are consensus
  const threshold = Math.ceil(results.length / 2);
  const consensusPoints = Array.from(pointFrequency.entries())
    .filter(([_, count]) => count >= threshold)
    .map(([point, _]) => point);
  
  // Calculate overall confidence (average of all agents)
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  // Build agent contributions
  const contributions: Record<string, any> = {};
  results.forEach(result => {
    contributions[result.agent_id] = {
      weight: result.confidence,
      key_insights: result.key_points,
      influence: result.confidence * (result.key_points.length / allPoints.length)
    };
  });
  
  return {
    final_answer: `Consensus reached across ${results.length} agents. Key agreements: ${consensusPoints.join('; ')}`,
    confidence: avgConfidence,
    strategy_used: 'consensus',
    agent_contributions: contributions,
    consensus_level: consensusPoints.length / allPoints.length
  };
}

/**
 * Weighted Strategy: Weight by agent confidence and expertise
 */
export function weightedSynthesis(results: AgentResult[]): SynthesisResult {
  // Sort by confidence
  const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence);
  
  // Top 3 agents get higher weight
  const weights = sortedResults.map((_, idx) => {
    if (idx === 0) return 0.4; // Highest confidence
    if (idx === 1) return 0.3;
    if (idx === 2) return 0.2;
    return 0.1 / (results.length - 3); // Remaining split equally
  });
  
  // Calculate weighted confidence
  const weightedConfidence = sortedResults.reduce((sum, result, idx) => 
    sum + (result.confidence * weights[idx]), 0
  );
  
  // Build contributions
  const contributions: Record<string, any> = {};
  sortedResults.forEach((result, idx) => {
    contributions[result.agent_id] = {
      weight: weights[idx],
      key_insights: result.key_points,
      influence: weights[idx] * result.confidence
    };
  });
  
  // Primary answer from highest confidence agent
  const primaryAgent = sortedResults[0];
  
  return {
    final_answer: `Primary recommendation from ${primaryAgent.role}: ${primaryAgent.reasoning}. Supported by ${results.length - 1} other perspectives.`,
    confidence: weightedConfidence,
    strategy_used: 'weighted',
    agent_contributions: contributions,
    consensus_level: weightedConfidence
  };
}

/**
 * Dialectic Strategy: Thesis-Antithesis-Synthesis
 */
export function dialecticSynthesis(results: AgentResult[]): SynthesisResult {
  // Find conflicting viewpoints
  const conflicts: Array<{ between: string[]; conflict: string; resolution: string }> = [];
  
  // Compare each pair of agents for conflicts
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const agent1 = results[i];
      const agent2 = results[j];
      
      // Check if they have conflicting concerns
      const concerns1 = agent1.concerns || [];
      const concerns2 = agent2.concerns || [];
      
      if (concerns1.length > 0 || concerns2.length > 0) {
        conflicts.push({
          between: [agent1.agent_id, agent2.agent_id],
          conflict: `${agent1.role} vs ${agent2.role}: Different priorities`,
          resolution: `Balance both perspectives: consider ${agent1.role}'s concerns while addressing ${agent2.role}'s priorities`
        });
      }
    }
  }
  
  // Build contributions
  const contributions: Record<string, any> = {};
  results.forEach(result => {
    contributions[result.agent_id] = {
      weight: 1 / results.length, // Equal weight in dialectic
      key_insights: result.key_points,
      influence: result.confidence / results.length
    };
  });
  
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  return {
    final_answer: `Dialectic synthesis: Integrated ${results.length} perspectives, resolved ${conflicts.length} conflicts. Balanced solution considering all viewpoints.`,
    confidence: avgConfidence,
    strategy_used: 'dialectic',
    agent_contributions: contributions,
    conflicts_resolved: conflicts,
    consensus_level: 1 - (conflicts.length / (results.length * (results.length - 1) / 2))
  };
}

/**
 * Best-of-N Strategy: Select single best result
 */
export function bestOfNSynthesis(results: AgentResult[]): SynthesisResult {
  // Find agent with highest confidence
  const bestAgent = results.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
  
  // Build contributions showing why this one won
  const contributions: Record<string, any> = {};
  results.forEach(result => {
    contributions[result.agent_id] = {
      weight: result.agent_id === bestAgent.agent_id ? 1.0 : 0.0,
      key_insights: result.key_points,
      influence: result.agent_id === bestAgent.agent_id ? 1.0 : 0.0
    };
  });
  
  return {
    final_answer: `Selected best result from ${bestAgent.role}: ${bestAgent.reasoning}`,
    confidence: bestAgent.confidence,
    strategy_used: 'best_of_n',
    agent_contributions: contributions,
    consensus_level: bestAgent.confidence
  };
}

/**
 * Ensemble Strategy: Combine all insights
 */
export function ensembleSynthesis(results: AgentResult[]): SynthesisResult {
  // Collect all unique insights
  const allInsights = new Set<string>();
  results.forEach(result => {
    result.key_points.forEach(point => allInsights.add(point));
    result.recommendations?.forEach(rec => allInsights.add(rec));
  });
  
  // Build comprehensive answer
  const sections = results.map(result => 
    `**${result.role}**: ${result.key_points.join(', ')}`
  ).join('\n\n');
  
  // Build contributions
  const contributions: Record<string, any> = {};
  results.forEach(result => {
    contributions[result.agent_id] = {
      weight: 1 / results.length,
      key_insights: result.key_points,
      influence: result.key_points.length / allInsights.size
    };
  });
  
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  return {
    final_answer: `Ensemble of ${results.length} perspectives:\n\n${sections}\n\nTotal unique insights: ${allInsights.size}`,
    confidence: avgConfidence,
    strategy_used: 'ensemble',
    agent_contributions: contributions,
    consensus_level: avgConfidence
  };
}

/**
 * Main synthesis function - routes to appropriate strategy
 */
export function synthesizeResults(
  results: AgentResult[],
  strategy: 'consensus' | 'weighted' | 'dialectic' | 'best_of_n' | 'ensemble' = 'consensus'
): SynthesisResult {
  switch (strategy) {
    case 'consensus':
      return consensusSynthesis(results);
    case 'weighted':
      return weightedSynthesis(results);
    case 'dialectic':
      return dialecticSynthesis(results);
    case 'best_of_n':
      return bestOfNSynthesis(results);
    case 'ensemble':
      return ensembleSynthesis(results);
    default:
      return consensusSynthesis(results);
  }
}

/**
 * Detect conflicts between agent results
 */
export function detectConflicts(results: AgentResult[]): Array<{
  agents: string[];
  conflict_type: string;
  description: string;
}> {
  const conflicts: Array<any> = [];
  
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const agent1 = results[i];
      const agent2 = results[j];
      
      // Confidence conflict: both high confidence but different conclusions
      if (agent1.confidence > 0.8 && agent2.confidence > 0.8) {
        const overlap = agent1.key_points.filter(p => 
          agent2.key_points.some(p2 => p2.toLowerCase().includes(p.toLowerCase()))
        );
        
        if (overlap.length === 0) {
          conflicts.push({
            agents: [agent1.agent_id, agent2.agent_id],
            conflict_type: 'divergent_conclusions',
            description: `${agent1.role} and ${agent2.role} have high confidence but different conclusions`
          });
        }
      }
      
      // Concern conflict: one agent's recommendation conflicts with another's concern
      if (agent1.concerns && agent2.recommendations) {
        const conflicting = agent1.concerns.some(concern =>
          agent2.recommendations?.some(rec => 
            rec.toLowerCase().includes(concern.toLowerCase().split(' ')[0])
          )
        );
        
        if (conflicting) {
          conflicts.push({
            agents: [agent1.agent_id, agent2.agent_id],
            conflict_type: 'concern_vs_recommendation',
            description: `${agent1.role}'s concerns conflict with ${agent2.role}'s recommendations`
          });
        }
      }
    }
  }
  
  return conflicts;
}

/**
 * Calculate consensus score (0-1)
 */
export function calculateConsensusScore(results: AgentResult[]): number {
  if (results.length < 2) return 1.0;
  
  // Count overlapping key points
  let totalOverlap = 0;
  let totalComparisons = 0;
  
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const points1 = results[i].key_points;
      const points2 = results[j].key_points;
      
      const overlap = points1.filter(p1 =>
        points2.some(p2 => 
          p1.toLowerCase().includes(p2.toLowerCase()) ||
          p2.toLowerCase().includes(p1.toLowerCase())
        )
      ).length;
      
      totalOverlap += overlap;
      totalComparisons++;
    }
  }
  
  const avgOverlap = totalOverlap / totalComparisons;
  const avgPointsPerAgent = results.reduce((sum, r) => sum + r.key_points.length, 0) / results.length;
  
  return Math.min(1.0, avgOverlap / avgPointsPerAgent);
}

