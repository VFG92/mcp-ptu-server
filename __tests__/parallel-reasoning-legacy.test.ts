import { describe, it, expect } from '@jest/globals';

import {
  handleParallelReasoningInit,
  handleAgentReasoningStep,
  handleCrossAgentCommunication,
  handleSynthesizeParallelReasoning,
  handleParallelComputeStatus,
  handleAgentDebate,
  handleListAgentPersonas,
  handleValidateSessionSpec
} from '../src/workers/parallel-reasoning-tools.js';
import { ParallelReasoningError } from '../src/workers/error-handling.js';
import type { ParallelReasoningSession } from '../src/workers/parallel-reasoning-engine.js';

function parseContent(response: any) {
  const text: string = response.content[0].text;
  const jsonStart = text.indexOf('{');
  return {
    raw: text,
    data: jsonStart >= 0 ? JSON.parse(text.slice(jsonStart)) : null,
  };
}

describe('legacy parallel reasoning tools integration', () => {
  it('runs a mini session through init, messaging, synthesis, and validation', () => {
    const sessionStore = new Map<string, ParallelReasoningSession>();
    const durableObjectId = 'a'.repeat(64);

    const initResponse = handleParallelReasoningInit(
      {
        task: 'Assess cloud migration strategy for fintech startup',
        perspectives: ['strategy_consultant', 'financial_analyst'],
        coordination_strategy: 'collaborative'
      },
      sessionStore,
      () => durableObjectId
    );

    const initParsed = parseContent(initResponse);
    const sessionIdMatch = initParsed.raw.match(/SESSION_ID: ([^\n]+)/);
    expect(sessionIdMatch).not.toBeNull();
    const sessionId = sessionIdMatch![1].trim();
    expect(sessionStore.has(sessionId)).toBe(true);

    const agents = initParsed.data?.agents ?? [];
    expect(agents).toHaveLength(2);
    const [agentOne, agentTwo] = agents.map((agent: any) => agent.agent_id);

    const missingStatus = parseContent(handleParallelComputeStatus({ session_id: 'missing_session' }, sessionStore));
    expect(missingStatus.data?.status).toBe('not_found');

    let missingSessionError: ParallelReasoningError | null = null;
    try {
      handleAgentReasoningStep({
        session_id: 'missing_session',
        agent_id: 'agent_1_strategy_consultant',
        reasoning: 'Should never persist',
        confidence: 0.5
      }, sessionStore);
    } catch (error) {
      missingSessionError = error as ParallelReasoningError;
    }
    expect(missingSessionError).toBeInstanceOf(ParallelReasoningError);
    expect(missingSessionError?.toStructured().http_code).toBe(404);
    expect(missingSessionError?.toToolResponse().isError).toBe(true);

    let missingAgentError: ParallelReasoningError | null = null;
    try {
      handleAgentReasoningStep({
        session_id: sessionId,
        agent_id: 'agent_unknown',
        reasoning: 'Invalid agent update',
        confidence: 0.4
      }, sessionStore);
    } catch (error) {
      missingAgentError = error as ParallelReasoningError;
    }
    expect(missingAgentError).toBeInstanceOf(ParallelReasoningError);
    expect(missingAgentError?.toStructured().http_code).toBe(404);

    const firstStep = parseContent(handleAgentReasoningStep({
      session_id: sessionId,
      agent_id: agentOne,
      reasoning: 'Outlined strategic options and key KPIs to track.',
      confidence: 0.65,
      key_points: ['Hybrid migration recommended'],
      concerns: ['Dependency on third-party APIs'],
      recommendations: ['Pilot migration with core services first']
    }, sessionStore));
    expect(firstStep.data?.agent_status).toBe('reasoning');

    const waitingStep = parseContent(handleAgentReasoningStep({
      session_id: sessionId,
      agent_id: agentTwo,
      reasoning: 'Financial model indicates ROI within 18 months.',
      confidence: 0.55,
      dependencies: [agentOne]
    }, sessionStore));
    expect(waitingStep.data?.agent_status).toBe('waiting');
    expect(waitingStep.data?.unresolved_dependencies).toEqual([agentOne]);

    const messageResponse = parseContent(handleCrossAgentCommunication({
      session_id: sessionId,
      from_agent: agentOne,
      to_agent: agentTwo,
      message: 'Please validate CapEx assumptions.',
      message_type: 'question'
    }, sessionStore));
    expect(messageResponse.data?.message_sent).toBe(true);

    let partialError: ParallelReasoningError | null = null;
    try {
      handleSynthesizeParallelReasoning({
        session_id: sessionId,
        synthesis_strategy: 'consensus',
        require_all_completed: true
      }, sessionStore);
    } catch (error) {
      partialError = error as ParallelReasoningError;
    }
    expect(partialError).toBeInstanceOf(ParallelReasoningError);
    expect(partialError?.retriable).toBe(true);
    expect(partialError?.toStructured().error_type).toBe('agents_not_completed');

    const partialResponse = parseContent(handleSynthesizeParallelReasoning({
      session_id: sessionId,
      synthesis_strategy: 'weighted',
      require_all_completed: false
    }, sessionStore));
    expect(partialResponse.data?.partial_synthesis).toBe(true);

    const completeFirst = parseContent(handleAgentReasoningStep({
      session_id: sessionId,
      agent_id: agentOne,
      reasoning: 'Finalized recommendation with phased implementation.',
      confidence: 0.95
    }, sessionStore));
    expect(completeFirst.data?.agent_status).toBe('completed');

    const completeSecond = parseContent(handleAgentReasoningStep({
      session_id: sessionId,
      agent_id: agentTwo,
      reasoning: 'Updated model confirms positive cash flow impact.',
      confidence: 0.9,
      dependencies: []
    }, sessionStore));
    expect(completeSecond.data?.agent_status).toBe('completed');

    const finalSynthesis = parseContent(handleSynthesizeParallelReasoning({
      session_id: sessionId,
      synthesis_strategy: 'consensus',
      require_all_completed: true
    }, sessionStore));
    expect(finalSynthesis.data?.synthesis_complete).toBe(true);
    expect(finalSynthesis.data?.partial_synthesis).toBe(false);

    const debateResponse = parseContent(handleAgentDebate({
      session_id: sessionId,
      topic: 'Should we accelerate migration timeline?',
      agent_ids: [agentOne, agentTwo]
    }, sessionStore));
    expect(debateResponse.data?.debate_initiated).toBe(true);

    const statusResponse = parseContent(handleParallelComputeStatus({ session_id: sessionId }, sessionStore));
    expect(statusResponse.data?.status).toBeDefined();
    expect(statusResponse.data?.agents).toHaveLength(2);

    const personaList = parseContent(handleListAgentPersonas());
    expect(personaList.data?.total_personas).toBeGreaterThan(0);

    const validation = parseContent(handleValidateSessionSpec({
      task: 'Validate personas for new session',
      perspectives: ['strategy_consultant', 'unknown_persona']
    }));
    expect(validation.data?.results).toHaveLength(2);
    const invalid = validation.data?.results.find((r: any) => r.status === 'invalid');
    expect(invalid?.persona_id).toBe('unknown_persona');
    if (invalid?.did_you_mean) {
      expect(invalid.did_you_mean.length).toBeGreaterThan(0);
    }
  });
});
