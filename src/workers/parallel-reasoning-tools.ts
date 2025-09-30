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
import { getAllAgentPersonas } from './agent-personas.js';

const DURABLE_OBJECT_ID_REGEX = /^[0-9a-f]{64}$/i;
const SESSION_DELIMITER = '::';

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
  synthesis_strategy: z.enum(['consensus', 'weighted', 'dialectic', 'best_of_n', 'ensemble']).optional().default('consensus')
});

export const ParallelComputeStatusSchema = z.object({
  session_id: z.string().describe('Session ID')
});

export const AgentDebateSchema = z.object({
  session_id: z.string().describe('Session ID'),
  topic: z.string().describe('Debate topic or question'),
  agent_ids: z.array(z.string()).describe('Agent IDs to participate in debate')
});

// Tool Names
export enum ParallelReasoningToolName {
  PARALLEL_REASONING_INIT = 'parallel_reasoning_init',
  AGENT_REASONING_STEP = 'agent_reasoning_step',
  CROSS_AGENT_COMMUNICATION = 'cross_agent_communication',
  SYNTHESIZE_PARALLEL_REASONING = 'synthesize_parallel_reasoning',
  PARALLEL_COMPUTE_STATUS = 'parallel_compute_status',
  AGENT_DEBATE = 'agent_debate',
  LIST_AGENT_PERSONAS = 'list_agent_personas'
}

/**
 * Tool Handlers
 */

export function handleParallelReasoningInit(
  args: z.infer<typeof ParallelReasoningInitSchema>,
  sessionStore: Map<string, ParallelReasoningSession>,
  getTransportSessionId?: () => string | null | undefined
): any {
  const transportSessionId = getTransportSessionId?.() ?? null;
  const baseSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionId = transportSessionId && DURABLE_OBJECT_ID_REGEX.test(transportSessionId)
    ? `${transportSessionId}${SESSION_DELIMITER}${baseSessionId}`
    : baseSessionId;

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

**Session ID**: ${sessionId}
**Task**: ${args.task}
**Agents**: ${session.agent_count}
**Strategy**: ${session.coordination_strategy}

📋 **Next Steps**:
1. For each agent below, adopt their persona and analyze the task
2. Use agent_reasoning_step to submit each agent's analysis
3. Agents can communicate using cross_agent_communication
4. When all agents complete, use synthesize_parallel_reasoning

🤖 **Agent Prompts**:
${agentPrompts.map((a, i) => `
**${i + 1}. ${a.role}** (${a.agent_id})
${a.prompt}
`).join('\n')}

⚡ Start reasoning in parallel now!
    `.trim()
  };

  if (transportSessionId) {
    responseData.transport_session_id = transportSessionId;
    responseData.instructions += `

🛰️ **Session Routing**:
- Use the provided session_id for tool arguments
- The MCP client should reuse the \`mcp-session-id\` header value (${transportSessionId}) for all subsequent requests`;
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
    throw new Error(
      `Session not found: ${args.session_id}\n` +
      `Available sessions: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'none'}\n` +
      `Tip: Make sure you're using the session_id returned by parallel_reasoning_init`
    );
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
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        agent_id: args.agent_id,
        agent_status: agent.status,
        agent_progress: agent.progress,
        overall_progress: status.overall_progress,
        session_status: status.status,
        message: `${agent.role} reasoning updated. Progress: ${agent.progress}%. Overall: ${status.overall_progress}%`,
        next_step: agent.status === 'completed' 
          ? 'Agent completed. Continue with other agents or synthesize if all done.'
          : agent.status === 'waiting'
          ? `Agent waiting for: ${agent.dependencies.join(', ')}`
          : 'Continue reasoning or communicate with other agents.'
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
    throw new Error(
      `Session not found: ${args.session_id}\n` +
      `Available sessions: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'none'}\n` +
      `Tip: Make sure you're using the session_id returned by parallel_reasoning_init`
    );
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
    throw new Error(
      `Session not found: ${args.session_id}\n` +
      `Available sessions: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'none'}\n` +
      `Tip: Make sure you're using the session_id returned by parallel_reasoning_init`
    );
  }
  
  const updatedSession = synthesizeSession(session, args.synthesis_strategy);
  sessionStore.set(args.session_id, updatedSession);
  
  const synthesis = updatedSession.synthesis!;
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        session_id: args.session_id,
        synthesis_complete: true,
        strategy_used: synthesis.strategy_used,
        confidence: synthesis.confidence,
        consensus_level: synthesis.consensus_level,
        final_answer: synthesis.final_answer,
        agent_contributions: synthesis.agent_contributions,
        conflicts_resolved: synthesis.conflicts_resolved,
        summary: `
🎉 **Synthesis Complete!**

**Strategy**: ${synthesis.strategy_used}
**Confidence**: ${(synthesis.confidence * 100).toFixed(1)}%
**Consensus Level**: ${(synthesis.consensus_level * 100).toFixed(1)}%

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
  if (!session) {
    const availableSessions = Array.from(sessionStore.keys());
    throw new Error(
      `Session not found: ${args.session_id}\n` +
      `Available sessions: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'none'}\n` +
      `Tip: Make sure you're using the session_id returned by parallel_reasoning_init`
    );
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
    throw new Error(
      `Session not found: ${args.session_id}\n` +
      `Available sessions: ${availableSessions.length > 0 ? availableSessions.join(', ') : 'none'}\n` +
      `Tip: Make sure you're using the session_id returned by parallel_reasoning_init`
    );
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

