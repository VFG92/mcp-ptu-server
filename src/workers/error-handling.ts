/**
 * Structured Error Handling for MCP Parallel Reasoning Server
 * 
 * Provides machine-readable errors with semantic HTTP codes and retry guidance.
 */

/**
 * Error types for parallel reasoning operations
 */
export enum ErrorType {
  // Client errors (4xx)
  SESSION_NOT_FOUND = 'session_not_found',
  AGENT_NOT_FOUND = 'agent_not_found',
  PERSONA_NOT_FOUND = 'persona_not_found',
  INVALID_INPUT = 'invalid_input',
  
  // Precondition errors (409, 412)
  PRECONDITION_NOT_MET = 'precondition_not_met',
  AGENTS_NOT_COMPLETED = 'agents_not_completed',
  SYNTHESIS_NOT_READY = 'synthesis_not_ready',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'internal_error',
  STORAGE_ERROR = 'storage_error',
}

/**
 * HTTP status codes for different error types
 */
export const ERROR_HTTP_CODES: Record<ErrorType, number> = {
  [ErrorType.SESSION_NOT_FOUND]: 404,
  [ErrorType.AGENT_NOT_FOUND]: 404,
  [ErrorType.PERSONA_NOT_FOUND]: 404,
  [ErrorType.INVALID_INPUT]: 400,
  [ErrorType.PRECONDITION_NOT_MET]: 412,
  [ErrorType.AGENTS_NOT_COMPLETED]: 409,
  [ErrorType.SYNTHESIS_NOT_READY]: 409,
  [ErrorType.INTERNAL_ERROR]: 500,
  [ErrorType.STORAGE_ERROR]: 500,
};

/**
 * Structured error response
 */
export interface StructuredError {
  error: string;
  error_type: ErrorType;
  http_code: number;
  retriable: boolean;
  details?: Record<string, any>;
  suggestions?: string[];
  timestamp: number;
}

/**
 * Custom error class for parallel reasoning operations
 */
export class ParallelReasoningError extends Error {
  public readonly errorType: ErrorType;
  public readonly httpCode: number;
  public readonly retriable: boolean;
  public readonly details?: Record<string, any>;
  public readonly suggestions?: string[];
  public readonly timestamp: number;

  constructor(
    message: string,
    errorType: ErrorType,
    details?: Record<string, any>,
    suggestions?: string[]
  ) {
    super(message);
    this.name = 'ParallelReasoningError';
    this.errorType = errorType;
    this.httpCode = ERROR_HTTP_CODES[errorType];
    this.retriable = this.isRetriable(errorType);
    this.details = details;
    this.suggestions = suggestions;
    this.timestamp = Date.now();
  }

  /**
   * Determine if an error type is retriable
   */
  private isRetriable(errorType: ErrorType): boolean {
    switch (errorType) {
      // Retriable errors (temporary conditions)
      case ErrorType.AGENTS_NOT_COMPLETED:
      case ErrorType.SYNTHESIS_NOT_READY:
      case ErrorType.STORAGE_ERROR:
        return true;
      
      // Non-retriable errors (permanent conditions)
      case ErrorType.SESSION_NOT_FOUND:
      case ErrorType.AGENT_NOT_FOUND:
      case ErrorType.PERSONA_NOT_FOUND:
      case ErrorType.INVALID_INPUT:
      case ErrorType.PRECONDITION_NOT_MET:
      case ErrorType.INTERNAL_ERROR:
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Convert to structured error response
   */
  toStructured(): StructuredError {
    return {
      error: this.message,
      error_type: this.errorType,
      http_code: this.httpCode,
      retriable: this.retriable,
      details: this.details,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
    };
  }

  /**
   * Convert to MCP tool response format
   */
  toToolResponse(): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(this.toStructured(), null, 2)
      }],
      isError: true
    };
  }
}

/**
 * Factory functions for common errors
 */
export class ErrorFactory {
  /**
   * Session not found error
   */
  static sessionNotFound(
    sessionId: string,
    availableSessions: string[]
  ): ParallelReasoningError {
    return new ParallelReasoningError(
      `Session not found: ${sessionId}`,
      ErrorType.SESSION_NOT_FOUND,
      {
        session_id: sessionId,
        available_sessions: availableSessions,
        available_sessions_count: availableSessions.length,
      },
      [
        'Make sure you are using the session_id returned by parallel_reasoning_init',
        'Check if the session has expired or been cleaned up',
        'Verify you are using the correct Durable Object instance',
      ]
    );
  }

  /**
   * Agent not found error
   */
  static agentNotFound(
    agentId: string,
    sessionId: string,
    availableAgents: string[]
  ): ParallelReasoningError {
    return new ParallelReasoningError(
      `Agent not found: ${agentId}`,
      ErrorType.AGENT_NOT_FOUND,
      {
        agent_id: agentId,
        session_id: sessionId,
        available_agents: availableAgents,
      },
      [
        'Check the agent_id returned by parallel_reasoning_init',
        'Verify the agent was created in this session',
      ]
    );
  }

  /**
   * Persona not found error
   */
  static personaNotFound(
    personaId: string,
    availablePersonas: string[],
    suggestions?: string[]
  ): ParallelReasoningError {
    return new ParallelReasoningError(
      `Unknown persona: ${personaId}`,
      ErrorType.PERSONA_NOT_FOUND,
      {
        persona_id: personaId,
        available_personas: availablePersonas,
        did_you_mean: suggestions,
      },
      [
        'Use list_agent_personas to see all available personas',
        suggestions && suggestions.length > 0
          ? `Did you mean: ${suggestions.join(', ')}?`
          : 'Check the persona_id spelling',
      ].filter(Boolean) as string[]
    );
  }

  /**
   * Agents not completed error (synthesis precondition)
   */
  static agentsNotCompleted(
    incompleteAgents: Array<{
      agent_id: string;
      role: string;
      status: string;
      progress: number;
      waiting_for?: string[];
    }>,
    completedCount: number,
    totalCount: number
  ): ParallelReasoningError {
    return new ParallelReasoningError(
      `Synthesis blocked: ${incompleteAgents.length} agent(s) not completed`,
      ErrorType.AGENTS_NOT_COMPLETED,
      {
        incomplete_agents: incompleteAgents,
        completed_count: completedCount,
        total_count: totalCount,
        completion_percentage: Math.round((completedCount / totalCount) * 100),
      },
      [
        'Wait for all agents to complete their reasoning steps',
        'Call synthesize_parallel_reasoning with require_all_completed=false for partial synthesis',
        'Use parallel_compute_status to monitor progress',
      ]
    );
  }

  /**
   * Invalid input error
   */
  static invalidInput(
    message: string,
    details?: Record<string, any>
  ): ParallelReasoningError {
    return new ParallelReasoningError(
      message,
      ErrorType.INVALID_INPUT,
      details,
      ['Check the input parameters', 'Refer to the tool schema for valid inputs']
    );
  }

  /**
   * Internal error
   */
  static internalError(
    message: string,
    originalError?: Error
  ): ParallelReasoningError {
    return new ParallelReasoningError(
      message,
      ErrorType.INTERNAL_ERROR,
      {
        original_error: originalError?.message,
        stack: originalError?.stack,
      },
      ['This is a server error. Please try again later.', 'Contact support if the issue persists.']
    );
  }
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          if (error instanceof ParallelReasoningError) {
            throw error;
          }
          throw ErrorFactory.internalError(
            `${context}: ${error.message}`,
            error
          );
        });
      }
      
      return result;
    } catch (error) {
      if (error instanceof ParallelReasoningError) {
        throw error;
      }
      throw ErrorFactory.internalError(
        `${context}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }) as T;
}

