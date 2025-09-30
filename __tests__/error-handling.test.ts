import { describe, it, expect } from '@jest/globals';

import { ParallelReasoningError, ErrorType, ErrorFactory } from '../src/workers/error-handling.js';

describe('parallel reasoning error handling', () => {
  it('marks retriable errors correctly', () => {
    const retriable = new ParallelReasoningError('Storage timeout', ErrorType.STORAGE_ERROR);
    expect(retriable.retriable).toBe(true);
    const structured = retriable.toStructured();
    expect(structured.http_code).toBe(500);
    const toolResponse = retriable.toToolResponse();
    expect(toolResponse.isError).toBe(true);

    const notFound = new ParallelReasoningError('Session missing', ErrorType.SESSION_NOT_FOUND);
    expect(notFound.retriable).toBe(false);
  });

  it('provides factory helpers for each error scenario', () => {
    const sessionError = ErrorFactory.sessionNotFound('missing', ['known']);
    expect(sessionError.details?.available_sessions_count).toBe(1);

    const agentError = ErrorFactory.agentNotFound('agent_1', 'session1', ['agent_2']);
    expect(agentError.details?.agent_id).toBe('agent_1');

    const personaError = ErrorFactory.personaNotFound('unknown', ['strategy_consultant'], ['strategy_consultant']);
    expect(personaError.details?.available_personas).toContain('strategy_consultant');

    const agentsNotReady = ErrorFactory.agentsNotCompleted(
      [{ agent_id: 'agent_1', role: 'Strategy Advisor', status: 'reasoning', progress: 60 }],
      1,
      2
    );
    expect(agentsNotReady.retriable).toBe(true);

    const invalidInput = ErrorFactory.invalidInput('Bad args', { field: 'task' });
    expect(invalidInput.errorType).toBe(ErrorType.INVALID_INPUT);

    const internal = ErrorFactory.internalError('Unexpected', new Error('stack'));
    expect(internal.errorType).toBe(ErrorType.INTERNAL_ERROR);
  });
});
