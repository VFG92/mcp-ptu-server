/**
 * Parallel Reasoning Engine Core
 *
 * ⚠️ LEGACY SYSTEM - BEING REPLACED BY CAPABILITY-DRIVEN ARCHITECTURE
 *
 * This persona-based system is being phased out in favor of the new
 * capability-driven architecture. For new integrations, use:
 * - CapabilityOrchestrator for task execution
 * - CapabilityGraph for capability management
 * - See capability-tools.ts for MCP integration
 *
 * This module remains for backward compatibility and will be deprecated
 * in a future release.
 *
 * Manages multi-agent parallel reasoning sessions with state tracking,
 * cross-agent communication, and real-time progress monitoring
 */

import { getAgentPersona, generateAgentPrompt, type AgentPersona, getAllAgentPersonas, findSimilarPersonas } from './agent-personas.js';
import { synthesizeResults, type AgentResult, type SynthesisResult } from './synthesis-strategies.js';
import { ErrorFactory } from './error-handling.js';

export interface AgentState {
  agent_id: string;
  persona_id: string;
  role: string;
  status: 'initializing' | 'reasoning' | 'waiting' | 'communicating' | 'completed' | 'error';
  progress: number; // 0-100
  reasoning_history: Array<{
    step: number;
    reasoning: string;
    confidence: number;
    timestamp: number;
  }>;
  key_points: string[];
  concerns: string[];
  recommendations: string[];
  confidence: number;
  dependencies: string[]; // Other agent IDs this agent is waiting for
  created_at: number;
  updated_at: number;
}

export interface CrossAgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  message_type: 'question' | 'response' | 'challenge' | 'support' | 'info';
  timestamp: number;
  read: boolean;
}

export interface ParallelReasoningSession {
  session_id: string;
  task: string;
  agent_count: number;
  perspectives: string[]; // persona IDs
  agents: Record<string, AgentState>;
  messages: CrossAgentMessage[];
  synthesis: SynthesisResult | null;
  coordination_strategy: 'parallel' | 'sequential' | 'debate' | 'collaborative';
  status: 'initializing' | 'reasoning' | 'synthesizing' | 'completed' | 'error';
  overall_progress: number; // 0-100
  created_at: number;
  updated_at: number;
  estimated_completion?: number;
}

/**
 * Initialize a new parallel reasoning session
 */
export function initializeSession(
  sessionId: string,
  task: string,
  perspectives: string[],
  coordinationStrategy: 'parallel' | 'sequential' | 'debate' | 'collaborative' = 'parallel'
): ParallelReasoningSession {
  const now = Date.now();
  
  // Create agent states
  const agents: Record<string, AgentState> = {};
  perspectives.forEach((personaId, index) => {
    const persona = getAgentPersona(personaId);
    if (!persona) {
      // Get all available personas for suggestions
      const allPersonas = getAllAgentPersonas();
      const availableIds = allPersonas.map(p => p.id);

      // Use fuzzy matching to find similar personas
      const suggestions = findSimilarPersonas(personaId, 3);

      throw ErrorFactory.personaNotFound(personaId, availableIds, suggestions);
    }

    const agentId = `agent_${index + 1}_${personaId}`;
    agents[agentId] = {
      agent_id: agentId,
      persona_id: personaId,
      role: persona.role,
      status: 'initializing',
      progress: 0,
      reasoning_history: [],
      key_points: [],
      concerns: [],
      recommendations: [],
      confidence: 0,
      dependencies: [],
      created_at: now,
      updated_at: now
    };
  });
  
  return {
    session_id: sessionId,
    task,
    agent_count: perspectives.length,
    perspectives,
    agents,
    messages: [],
    synthesis: null,
    coordination_strategy: coordinationStrategy,
    status: 'initializing',
    overall_progress: 0,
    created_at: now,
    updated_at: now
  };
}

/**
 * Update agent reasoning step
 */
export function updateAgentReasoning(
  session: ParallelReasoningSession,
  agentId: string,
  reasoning: string,
  confidence: number,
  keyPoints?: string[],
  concerns?: string[],
  recommendations?: string[],
  dependencies?: string[]
): ParallelReasoningSession {
  const agent = session.agents[agentId];
  if (!agent) {
    const availableAgents = Object.keys(session.agents);
    throw ErrorFactory.agentNotFound(agentId, session.session_id, availableAgents);
  }
  
  const now = Date.now();
  
  // Add to reasoning history
  agent.reasoning_history.push({
    step: agent.reasoning_history.length + 1,
    reasoning,
    confidence,
    timestamp: now
  });
  
  // Update agent state
  agent.confidence = confidence;
  if (keyPoints) agent.key_points.push(...keyPoints);
  if (concerns) agent.concerns.push(...concerns);
  if (recommendations) agent.recommendations.push(...recommendations);
  if (dependencies) agent.dependencies = dependencies;

  // DEPENDENCY RESOLUTION: Check if dependencies are actually satisfied
  // Remove dependencies on agents that are already completed
  if (dependencies && dependencies.length > 0) {
    const unresolvedDeps = dependencies.filter(depId => {
      const depAgent = session.agents[depId];
      return depAgent && depAgent.status !== 'completed';
    });

    agent.dependencies = unresolvedDeps;

    // If all dependencies resolved, agent can proceed
    if (unresolvedDeps.length === 0) {
      console.log(`[ParallelReasoning] Agent ${agentId} dependencies resolved, transitioning from waiting to reasoning`);
    }
  }

  // Update status and progress based on RESOLVED dependencies
  const hasUnresolvedDeps = agent.dependencies.length > 0;

  if (hasUnresolvedDeps) {
    agent.status = 'waiting';
    agent.progress = Math.min(agent.progress + 10, 80); // Cap at 80% if waiting
  } else if (confidence >= 0.9) {
    agent.status = 'completed';
    agent.progress = 100;
  } else {
    agent.status = 'reasoning';
    agent.progress = Math.min(agent.progress + 20, 90);
  }

  agent.updated_at = now;

  // Update overall session progress (now confidence-weighted)
  session.overall_progress = calculateOverallProgress(session);
  session.updated_at = now;
  
  // Check if all agents completed
  if (allAgentsCompleted(session)) {
    session.status = 'synthesizing';
  }
  
  return session;
}

/**
 * Add cross-agent communication
 */
export function addCrossAgentMessage(
  session: ParallelReasoningSession,
  fromAgent: string,
  toAgent: string,
  message: string,
  messageType: 'question' | 'response' | 'challenge' | 'support' | 'info' = 'info'
): ParallelReasoningSession {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const crossMessage: CrossAgentMessage = {
    id: messageId,
    from_agent: fromAgent,
    to_agent: toAgent,
    message,
    message_type: messageType,
    timestamp: Date.now(),
    read: false
  };
  
  session.messages.push(crossMessage);
  
  // Update agent statuses
  if (session.agents[fromAgent]) {
    session.agents[fromAgent].status = 'communicating';
  }
  if (session.agents[toAgent]) {
    session.agents[toAgent].status = 'communicating';
  }
  
  session.updated_at = Date.now();
  
  return session;
}

/**
 * Mark message as read
 */
export function markMessageRead(session: ParallelReasoningSession, messageId: string): ParallelReasoningSession {
  const message = session.messages.find(m => m.id === messageId);
  if (message) {
    message.read = true;
  }
  return session;
}

/**
 * Get unread messages for an agent
 */
export function getUnreadMessages(session: ParallelReasoningSession, agentId: string): CrossAgentMessage[] {
  return session.messages.filter(m => m.to_agent === agentId && !m.read);
}

/**
 * Synthesize all agent results
 */
export function synthesizeSession(
  session: ParallelReasoningSession,
  strategy: 'consensus' | 'weighted' | 'dialectic' | 'best_of_n' | 'ensemble' = 'consensus'
): ParallelReasoningSession {
  // Convert agent states to AgentResult format
  const results: AgentResult[] = Object.values(session.agents).map(agent => ({
    agent_id: agent.agent_id,
    role: agent.role,
    reasoning: agent.reasoning_history.map(h => h.reasoning).join('\n\n'),
    confidence: agent.confidence,
    key_points: agent.key_points,
    concerns: agent.concerns,
    recommendations: agent.recommendations
  }));
  
  // Synthesize results
  const synthesis = synthesizeResults(results, strategy);
  
  session.synthesis = synthesis;
  session.status = 'completed';
  session.overall_progress = 100;
  session.updated_at = Date.now();
  
  return session;
}

/**
 * Calculate overall session progress
 *
 * Uses confidence-weighted average to prevent low-confidence agents
 * from inflating overall progress. Agents with higher confidence
 * contribute more to the overall metric.
 */
function calculateOverallProgress(session: ParallelReasoningSession): number {
  const agents = Object.values(session.agents);

  if (agents.length === 0) return 0;

  // Weight each agent's progress by their confidence
  // Agents with 0 confidence get minimum weight of 0.1 to avoid division by zero
  let weightedSum = 0;
  let totalWeight = 0;

  for (const agent of agents) {
    const weight = Math.max(agent.confidence, 0.1); // Minimum weight 0.1
    weightedSum += agent.progress * weight;
    totalWeight += weight;
  }

  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return Math.round(weightedAvg);
}

/**
 * Check if all agents have completed
 */
function allAgentsCompleted(session: ParallelReasoningSession): boolean {
  return Object.values(session.agents).every(a => a.status === 'completed');
}

/**
 * Get session status summary
 */
export function getSessionStatus(session: ParallelReasoningSession): {
  session_id: string;
  status: string;
  overall_progress: number;
  agents: Array<{
    id: string;
    role: string;
    status: string;
    progress: number;
  }>;
  messages_count: number;
  unread_messages: number;
  estimated_completion?: string;
} {
  const agents = Object.values(session.agents).map(a => ({
    id: a.agent_id,
    role: a.role,
    status: a.status,
    progress: a.progress
  }));
  
  const unreadCount = session.messages.filter(m => !m.read).length;
  
  // Estimate completion time based on progress
  let estimatedCompletion: string | undefined;
  if (session.overall_progress > 0 && session.overall_progress < 100) {
    const elapsed = Date.now() - session.created_at;
    const estimatedTotal = (elapsed / session.overall_progress) * 100;
    const remaining = estimatedTotal - elapsed;
    estimatedCompletion = `${Math.round(remaining / 1000)}s`;
  }
  
  return {
    session_id: session.session_id,
    status: session.status,
    overall_progress: session.overall_progress,
    agents,
    messages_count: session.messages.length,
    unread_messages: unreadCount,
    estimated_completion: estimatedCompletion
  };
}

/**
 * Get agent prompts for ChatGPT to execute
 */
export function getAgentPrompts(session: ParallelReasoningSession): Array<{
  agent_id: string;
  role: string;
  prompt: string;
}> {
  return Object.values(session.agents).map(agent => ({
    agent_id: agent.agent_id,
    role: agent.role,
    prompt: generateAgentPrompt(agent.persona_id, session.task)
  }));
}

/**
 * Initiate agent debate
 */
export function initiateDebate(
  session: ParallelReasoningSession,
  topic: string,
  agentIds: string[]
): ParallelReasoningSession {
  // Mark agents as in debate mode
  agentIds.forEach(agentId => {
    if (session.agents[agentId]) {
      session.agents[agentId].status = 'communicating';
    }
  });
  
  // Add debate initialization message
  const debateMsg: CrossAgentMessage = {
    id: `debate_${Date.now()}`,
    from_agent: 'system',
    to_agent: agentIds.join(','),
    message: `Debate topic: ${topic}. Agents ${agentIds.join(', ')} please present your arguments.`,
    message_type: 'question',
    timestamp: Date.now(),
    read: false
  };
  
  session.messages.push(debateMsg);
  session.updated_at = Date.now();
  
  return session;
}

