/**
 * MCP Tools for Parallel Reasoning
 * 
 * Implements the 6 core tools for multi-agent parallel reasoning:
 * 1. parallel_reasoning_init
 * 2. agent_reasoning_step
 * 3. cross_agent_communication
 * 4. synthesize_parallel_reasoning
 * 5. parallel_compute_status
 * 6. agent_debate
 */

import { z } from 'zod';
import {
  initializeSession,
  updateAgentReasoning,
  addCrossAgentMessage,
  synthesizeSession,
  getSessionStatus,
  getAgentPrompts,
  initiateDebate,
  type ParallelReasoningSession
} from './parallel-reasoning-engine.js';
import { getAllAgentPersonas, getAgentPersona, findSimilarPersonas } from './agent-personas.js';
import { ErrorFactory, ParallelReasoningError } from './error-handling.js';

// Regex to validate Durable Object IDs (64 hex characters)
const DURABLE_OBJECT_ID_REGEX = /^[0-9a-f]{64}$/i;

// Tool Schemas
export const ParallelReasoningInitSchema = z.object({
  task: z.string().describe('The complex task to analyze with multiple perspectives'),
  perspectives: z.array(z.string()).describe('Array of agent persona IDs (e.g., ["strategy_consultant", "financial_analyst", "marketing_strategist"])'),
  agent_count: z.number().optional().describe('Number of agents (defaults to perspectives.length)'),
  coordination_strategy: z.enum(['parallel', 'sequential', 'debate', 'collaborative']).optional().default('parallel')
});

export const AgentReasoningStepSchema = z.object({
  session_id: z.string().describe('Session ID from parallel_reasoning_init'),
  agent_id: z.string().describe('Agent ID (e.g., "agent_1_strategy_consultant")'),
  reasoning: z.string().describe('The agent\'s reasoning and analysis'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1)'),
  key_points: z.array(z.string()).optional().describe('Key insights or findings'),
  concerns: z.array(z.string()).optional().describe('Concerns or risks identified'),
  recommendations: z.array(z.string()).optional().describe('Specific recommendations'),
  dependencies: z.array(z.string()).optional().describe('Other agent IDs this agent needs input from')
});

export const CrossAgentCommunicationSchema = z.object({
  session_id: z.string().describe('Session ID'),
  from_agent: z.string().describe('Sending agent ID'),
  to_agent: z.string().describe('Receiving agent ID'),
  message: z.string().describe('Message content'),
  message_type: z.enum(['question', 'response', 'challenge', 'support', 'info']).optional().default('info')
});

export const SynthesizeParallelReasoningSchema = z.object({
  session_id: z.string().describe('Session ID'),
  synthesis_strategy: z.enum(['consensus', 'weighted', 'dialectic', 'best_of_n', 'ensemble']).optional().default('consensus'),
  require_all_completed: z.boolean().optional().default(true).describe('If true (default), synthesis fails unless all agents are in "completed" status. Set to false for partial synthesis with incomplete agents.')
});

export const ParallelComputeStatusSchema = z.object({
  session_id: z.string().describe('Session ID')
});

export const AgentDebateSchema = z.object({
  session_id: z.string().describe('Session ID'),
  topic: z.string().describe('Debate topic or question'),
  agent_ids: z.array(z.string()).describe('Agent IDs to participate in debate')
});

export const ValidateSessionSpecSchema = z.object({
  task: z.string().describe('The task to validate'),
  perspectives: z.array(z.string()).describe('Array of agent persona IDs to validate')
});

// Tool Names
export enum ParallelReasoningToolName {
  PARALLEL_REASONING_INIT = 'parallel_reasoning_init',
  AGENT_REASONING_STEP = 'agent_reasoning_step',
  CROSS_AGENT_COMMUNICATION = 'cross_agent_communication',
  SYNTHESIZE_PARALLEL_REASONING = 'synthesize_parallel_reasoning',
  PARALLEL_COMPUTE_STATUS = 'parallel_compute_status',
  AGENT_DEBATE = 'agent_debate',
  LIST_AGENT_PERSONAS = 'list_agent_personas',
  VALIDATE_SESSION_SPEC = 'validate_session_spec'
}

/**
 * Tool Handlers
 */

export function handleParallelReasoningInit(
  args: z.infer<typeof ParallelReasoningInitSchema>,
  sessionStore: Map<string, ParallelReasoningSession>,
  getTransportSessionId?: () => string | null | undefined
): any {
  console.log(`[ParallelReasoning] VERSION: 2025-09-30-v3 - handleParallelReasoningInit called`);
  const transportSessionId = getTransportSessionId?.() ?? null;
  console.log(`[ParallelReasoning] getTransportSessionId returned: ${transportSessionId}`);

  // CRITICAL FIX: Use ONLY the DO ID as session_id
  // ChatGPT tool calls don't propagate mcp-session-id header, so composite IDs don't work
  // We must use the DO ID directly so all tool calls to the same session hit the same DO
  const sessionId = transportSessionId && DURABLE_OBJECT_ID_REGEX.test(transportSessionId)
    ? transportSessionId  // Use DO ID directly - this ensures persistence!
    : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Fallback for non-DO environments

  console.log(`[ParallelReasoning] Using session_id: ${sessionId} (from transportSessionId: ${!!transportSessionId})`);

  const session = initializeSession(
    sessionId,
    args.task,
    args.perspectives,
    args.coordination_strategy
  );

  // Store session
  sessionStore.set(sessionId, session);
  console.log(`[ParallelReasoning] Created session ${sessionId}. Total sessions: ${sessionStore.size}`);

  // Get agent prompts for ChatGPT to execute
  const agentPrompts = getAgentPrompts(session);
  
  // Return response with session_id prominently displayed
  const responseData: Record<string, unknown> = {
    session_id: sessionId,
    task: args.task,
    agent_count: session.agent_count,
    coordination_strategy: session.coordination_strategy,
    agents: agentPrompts,
    instructions: `
🎯 Parallel Reasoning Session Initialized!

**SESSION_ID**: ${sessionId}

**Task**: ${args.task}
**Agents**: ${session.agent_count}
**Strategy**: ${session.coordination_strategy}

⚠️  **CRITICAL**: Use this exact session_id (${sessionId}) in ALL subsequent tool calls:
- agent_reasoning_step
- parallel_compute_status
- cross_agent_communication
- synthesize_parallel_reasoning

📋 **Next Steps**:
1. For each agent below, adopt their persona and analyze the task
2. Use agent_reasoning_step to submit each agent's analysis (with session_id: "${sessionId}")
3. Agents can communicate using cross_agent_communication (with session_id: "${sessionId}")
4. When all agents complete, use synthesize_parallel_reasoning (with session_id: "${sessionId}")

🤖 **Agent Prompts**:
${agentPrompts.map((a, i) => `
**${i + 1}. ${a.role}** (${a.agent_id})
${a.prompt}
`).join('\n')}

⚡ Start reasoning in parallel now!
    `.trim()
  }

  return {
    content: [
      {
        type: 'text',
        text: `SESSION_ID: ${sessionId}\n\n` + JSON.stringify(responseData, null, 2)
      }
    ]
  };
}

export function handleAgentReasoningStep(
  args: z.infer<typeof AgentReasoningStepSchema>,
  sessionStore: Map<string, ParallelReasoningSession>
): any {
  console.log(`[ParallelReasoning] Looking for session ${args.session_id}. Total sessions: ${sessionStore.size}`);
  const session = sessionStore.get(args.session_id);
  if (!session) {
    const availableSessions = Array.from(sessionStore.keys());
    console.error(`[ParallelReasoning] Session ${args.session_id} not found. Available: ${availableSessions.join(', ')}`);
    throw ErrorFactory.sessionNotFound(args.session_id, availableSessions);
  }

  const updatedSession = updateAgentReasoning(
    session,
    args.agent_id,
    args.reasoning,
    args.confidence,
    args.key_points,
    args.concerns,
    args.recommendations,
    args.dependencies
  );
  
  sessionStore.set(args.session_id, updatedSession);
  
  const agent = updatedSession.agents[args.agent_id];
  const status = getSessionStatus(updatedSession);

  // Build detailed next_step message with dependency resolution info
  let nextStepMessage: string;
  if (agent.status === 'completed') {
    nextStepMessage = 'Agent completed. Continue with other agents or synthesize if all done.';
  } else if (agent.status === 'waiting') {
    if (agent.dependencies.length === 0) {
      nextStepMessage = 'Agent was waiting but all dependencies are now resolved. Agent can proceed.';
    } else {
      const depDetails = agent.dependencies.map(depId => {
        const depAgent = updatedSession.agents[depId];
        return depAgent ? `${depAgent.role} (${depAgent.status}, ${depAgent.progress}%)` : depId;
      }).join(', ');
      nextStepMessage = `Agent waiting for: ${depDetails}`;
    }
  } else {
    nextStepMessage = 'Continue reasoning or communicate with other agents.';
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        agent_id: args.agent_id,
        agent_status: agent.status,
        agent_progress: agent.progress,
        agent_confidence: agent.confidence,
        overall_progress: status.overall_progress,
        overall_progress_note: 'Confidence-weighted average across all agents',
        session_status: status.status,
        unresolved_dependencies: agent.dependencies.length > 0 ? agent.dependencies : undefined,
        message: `${agent.role} reasoning updated. Progress: ${agent.progress}%. Overall: ${status.overall_progress}%`,
        next_step: nextStepMessage
      }, null, 2)
    }]
  };
}

export function handleCrossAgentCommunication(
  args: z.infer<typeof CrossAgentCommunicationSchema>,
  sessionStore: Map<string, ParallelReasoningSession>
): any {
  const session = sessionStore.get(args.session_id);
  if (!session) {
    const availableSessions = Array.from(sessionStore.keys());
    throw ErrorFactory.sessionNotFound(args.session_id, availableSessions);
  }
  
  const updatedSession = addCrossAgentMessage(
    session,
    args.from_agent,
    args.to_agent,
    args.message,
    args.message_type
  );
  
  sessionStore.set(args.session_id, updatedSession);
  
  const fromAgent = updatedSession.agents[args.from_agent];
  const toAgent = updatedSession.agents[args.to_agent];
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message_sent: true,
        from: `${fromAgent.role} (${args.from_agent})`,
        to: `${toAgent.role} (${args.to_agent})`,
        type: args.message_type,
        total_messages: updatedSession.messages.length,
        note: `Message delivered. ${toAgent.role} can now respond or incorporate this feedback.`
      }, null, 2)
    }]
  };
}

export function handleSynthesizeParallelReasoning(
  args: z.infer<typeof SynthesizeParallelReasoningSchema>,
  sessionStore: Map<string, ParallelReasoningSession>
): any {
  const session = sessionStore.get(args.session_id);
  if (!session) {
    const availableSessions = Array.from(sessionStore.keys());
    throw ErrorFactory.sessionNotFound(args.session_id, availableSessions);
  }

  // GATING: Check if all agents are completed (if required)
  const agentStates = Object.values(session.agents);
  const incompleteAgents = agentStates.filter(a => a.status !== 'completed');

  if (args.require_all_completed && incompleteAgents.length > 0) {
    const incompleteDetails = incompleteAgents.map(a => ({
      agent_id: a.agent_id,
      role: a.role,
      status: a.status,
      progress: a.progress,
      waiting_for: a.dependencies.length > 0 ? a.dependencies : undefined
    }));

    const completedCount = agentStates.length - incompleteAgents.length;

    throw ErrorFactory.agentsNotCompleted(
      incompleteDetails,
      completedCount,
      agentStates.length
    );
  }

  const updatedSession = synthesizeSession(session, args.synthesis_strategy);
  sessionStore.set(args.session_id, updatedSession);

  const synthesis = updatedSession.synthesis!;

  // Determine if this is a partial synthesis
  const isPartialSynthesis = incompleteAgents.length > 0;
  const completedCount = agentStates.length - incompleteAgents.length;

  // Calculate confidence interval for partial synthesis
  const confidenceInterval = isPartialSynthesis ? {
    lower_bound: synthesis.confidence * 0.85, // Reduce confidence by 15% for partial
    upper_bound: synthesis.confidence,
    note: 'Confidence interval widened due to incomplete agents'
  } : undefined;

  // Build warnings for partial synthesis
  const warnings = isPartialSynthesis ? [
    `Synthesis performed with ${incompleteAgents.length} of ${agentStates.length} agents incomplete (${Math.round(completedCount/agentStates.length*100)}% coverage)`,
    'Results may be partial and less comprehensive',
    'Consider waiting for all agents to complete for full analysis',
    ...incompleteAgents.map(a =>
      `Agent ${a.role} (${a.agent_id}) is ${a.status} at ${a.progress}% progress`
    )
  ] : undefined;

  // Include incomplete agents info for transparency
  const incompleteAgentsInfo = isPartialSynthesis ? {
    http_status: 206, // Partial Content
    incomplete_agents_count: incompleteAgents.length,
    completed_agents_count: completedCount,
    coverage_percentage: Math.round((completedCount / agentStates.length) * 100),
    incomplete_agents: incompleteAgents.map(a => ({
      agent_id: a.agent_id,
      role: a.role,
      status: a.status,
      progress: a.progress,
      confidence: a.confidence,
      waiting_for: a.dependencies.length > 0 ? a.dependencies : undefined
    })),
    warnings,
    confidence_interval: confidenceInterval
  } : { http_status: 200 };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        session_id: args.session_id,
        synthesis_complete: true,
        partial_synthesis: isPartialSynthesis,
        strategy_used: synthesis.strategy_used,
        confidence: synthesis.confidence,
        consensus_level: synthesis.consensus_level,
        final_answer: synthesis.final_answer,
        agent_contributions: synthesis.agent_contributions,
        conflicts_resolved: synthesis.conflicts_resolved,
        require_all_completed: args.require_all_completed,
        ...incompleteAgentsInfo,
        summary: `
${isPartialSynthesis ? '⚠️ **Partial Synthesis Complete** (HTTP 206)' : '🎉 **Synthesis Complete** (HTTP 200)'}

**Strategy**: ${synthesis.strategy_used}
**Confidence**: ${(synthesis.confidence * 100).toFixed(1)}%${confidenceInterval ? ` (range: ${(confidenceInterval.lower_bound * 100).toFixed(1)}% - ${(confidenceInterval.upper_bound * 100).toFixed(1)}%)` : ''}
**Consensus Level**: ${(synthesis.consensus_level * 100).toFixed(1)}%
${isPartialSynthesis ? `**Coverage**: ${completedCount}/${agentStates.length} agents (${Math.round(completedCount/agentStates.length*100)}%)` : ''}

${isPartialSynthesis ? `
⚠️ **Warnings**:
${warnings!.map(w => `  • ${w}`).join('\n')}
` : ''}

**Final Recommendation**:
${synthesis.final_answer}

**Agent Contributions**:
${Object.entries(synthesis.agent_contributions).map(([id, contrib]) =>
  `- ${id}: Weight ${(contrib.weight * 100).toFixed(0)}%, Influence ${(contrib.influence * 100).toFixed(0)}%`
).join('\n')}

${synthesis.conflicts_resolved && synthesis.conflicts_resolved.length > 0 ? `
**Conflicts Resolved**: ${synthesis.conflicts_resolved.length}
${synthesis.conflicts_resolved.map(c => `- ${c.between.join(' vs ')}: ${c.resolution}`).join('\n')}
` : ''}
        `.trim()
      }, null, 2)
    }]
  };
}

export function handleParallelComputeStatus(
  args: z.infer<typeof ParallelComputeStatusSchema>,
  sessionStore: Map<string, ParallelReasoningSession>
): any {
  const session = sessionStore.get(args.session_id);

  // IMPORTANT: Never throw error for status check - always return status info
  // This allows clients to diagnose issues even when session is not found
  if (!session) {
    const availableSessions = Array.from(sessionStore.keys());
    console.warn(`[ParallelComputeStatus] Session ${args.session_id} not found. Available: ${availableSessions.join(', ')}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          session_id: args.session_id,
          status: 'not_found',
          error: true,
          error_type: 'session_not_found',
          message: `Session not found: ${args.session_id}`,
          available_sessions: availableSessions,
          available_sessions_count: availableSessions.length,
          troubleshooting: {
            tip: 'Make sure you are using the session_id returned by parallel_reasoning_init',
            possible_causes: [
              'Session was never created',
              'Session expired or was cleaned up',
              'Wrong Durable Object instance (routing issue)',
              'Session storage not persisted correctly'
            ]
          },
          visualization: `
❌ **Session Not Found**

Session ID: ${args.session_id}
Status: NOT FOUND

Available sessions: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'none'}

💡 **Troubleshooting**:
- Verify you're using the session_id from parallel_reasoning_init
- Check if the session expired or was cleaned up
- Ensure proper session routing to the correct Durable Object
          `.trim()
        }, null, 2)
      }]
    };
  }

  const status = getSessionStatus(session);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...status,
        visualization: `
🤔 **Parallel Reasoning Status**

Session: ${status.session_id}
Status: ${status.status.toUpperCase()}
Overall Progress: ${'█'.repeat(Math.floor(status.overall_progress / 5))}${'░'.repeat(20 - Math.floor(status.overall_progress / 5))} ${status.overall_progress}%

**Agents**:
${status.agents.map(a => `
  ${a.status === 'completed' ? '✓' : a.status === 'reasoning' ? '⚡' : a.status === 'waiting' ? '⏳' : '○'} ${a.role}
     Progress: ${'█'.repeat(Math.floor(a.progress / 10))}${'░'.repeat(10 - Math.floor(a.progress / 10))} ${a.progress}%
     Status: ${a.status}
`).join('')}

💬 Messages: ${status.messages_count} (${status.unread_messages} unread)
${status.estimated_completion ? `⏱️  Estimated completion: ${status.estimated_completion}` : ''}
        `.trim()
      }, null, 2)
    }]
  };
}

export function handleAgentDebate(
  args: z.infer<typeof AgentDebateSchema>,
  sessionStore: Map<string, ParallelReasoningSession>
): any {
  const session = sessionStore.get(args.session_id);
  if (!session) {
    const availableSessions = Array.from(sessionStore.keys());
    throw ErrorFactory.sessionNotFound(args.session_id, availableSessions);
  }
  
  const updatedSession = initiateDebate(session, args.topic, args.agent_ids);
  sessionStore.set(args.session_id, updatedSession);
  
  const debatingAgents = args.agent_ids.map(id => updatedSession.agents[id]);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        debate_initiated: true,
        topic: args.topic,
        participants: debatingAgents.map(a => ({ id: a.agent_id, role: a.role })),
        instructions: `
🎭 **Agent Debate Initiated**

**Topic**: ${args.topic}

**Participants**:
${debatingAgents.map((a, i) => `${i + 1}. ${a.role} (${a.agent_id})`).join('\n')}

**Debate Format**:
1. Each agent presents their position (use agent_reasoning_step)
2. Agents challenge each other (use cross_agent_communication with type='challenge')
3. Agents respond to challenges (use cross_agent_communication with type='response')
4. Continue for 2-3 rounds
5. Synthesize to find resolution

🎯 Begin debate now!
        `.trim()
      }, null, 2)
    }]
  };
}

export function handleListAgentPersonas(): any {
  const personas = getAllAgentPersonas();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total_personas: personas.length,
        categories: {
          strategy: ['strategy_consultant', 'management_consultant', 'change_manager'],
          finance: ['financial_analyst', 'cfo_advisor', 'ma_advisor', 'risk_manager'],
          marketing: ['marketing_strategist', 'digital_marketing', 'market_researcher'],
          operations: ['project_manager', 'operations_manager', 'data_analyst'],
          synthesis: ['synthesizer', 'judge']
        },
        personas: personas.map(p => ({
          id: p.id,
          role: p.role,
          focus: p.focus,
          expertise: p.expertise,
          thinking_style: p.thinking_style
        }))
      }, null, 2)
    }]
  };
}

export function handleValidateSessionSpec(
  args: z.infer<typeof ValidateSessionSpecSchema>
): any {
  const allPersonas = getAllAgentPersonas();
  const availableIds = allPersonas.map(p => p.id);

  const validationResults = args.perspectives.map(personaId => {
    const persona = getAgentPersona(personaId);

    if (persona) {
      return {
        persona_id: personaId,
        status: 'valid',
        resolved_to: personaId,
        persona: {
          id: persona.id,
          role: persona.role,
          focus: persona.focus
        }
      };
    } else {
      // Find suggestions
      const suggestions = findSimilarPersonas(personaId, 3);

      return {
        persona_id: personaId,
        status: 'invalid',
        error: `Unknown persona: ${personaId}`,
        did_you_mean: suggestions.length > 0 ? suggestions : undefined,
        suggestions: suggestions.length > 0
          ? suggestions.map(id => {
              const p = getAgentPersona(id);
              return p ? { id: p.id, role: p.role, focus: p.focus } : null;
            }).filter(Boolean)
          : undefined
      };
    }
  });

  const invalidCount = validationResults.filter(r => r.status === 'invalid').length;
  const validCount = validationResults.length - invalidCount;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        task: args.task,
        validation_status: invalidCount === 0 ? 'valid' : 'invalid',
        valid_count: validCount,
        invalid_count: invalidCount,
        total_count: validationResults.length,
        results: validationResults,
        summary: invalidCount === 0
          ? `✅ All ${validCount} personas are valid. Ready to initialize session.`
          : `❌ ${invalidCount} of ${validationResults.length} personas are invalid. Please correct before initializing.`,
        next_step: invalidCount === 0
          ? 'Call parallel_reasoning_init with these perspectives'
          : 'Fix invalid personas using the suggestions provided'
      }, null, 2)
    }]
  };
}

