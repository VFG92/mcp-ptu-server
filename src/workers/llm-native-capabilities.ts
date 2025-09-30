/**
 * LLM Native Capabilities Integration
 *
 * BIDIRECTIONAL AGENT ↔ LLM COMMUNICATION
 *
 * This system enables capabilities (agents) to request the LLM to use its native tools
 * to enhance their analysis. The LLM executes the tool and returns enriched results.
 *
 * FLOW:
 * 1. Capability identifies need (e.g., "I need Monte Carlo simulation with 10K iterations")
 * 2. Capability creates NativeCapabilityRequest with instructions for LLM
 * 3. Request stored in ExecutionContext for LLM to process
 * 4. LLM sees request, executes native tool (Python/web search/etc.)
 * 5. LLM returns result via NativeCapabilityResponse
 * 6. Capability receives result and completes analysis
 *
 * EXAMPLE USE CASE:
 * - Capability: monte_carlo_finance needs real statistical simulation
 * - Requests: Python execution with numpy for 10,000 Monte Carlo iterations
 * - LLM: Executes Python code, returns {mean: 1.23, std: 0.45, percentiles: [...]}
 * - Capability: Uses results to generate financial forecast with confidence intervals
 *
 * INTEGRATION:
 * - ChatGPT: Native Python, web search, data analysis tools
 * - Claude: Tool use blocks with computer_use, bash, etc.
 * - Custom: Implement NativeCapabilityExecutor interface
 */

import type { CapabilityNode, CapabilityResult, ExecutionContext } from './capability-graph.js';
import { EvidenceType } from './capability-graph.js';

/**
 * Native capability types supported by frontier LLMs
 */
export enum NativeCapabilityType {
  PYTHON_EXECUTION = 'python_execution',
  WEB_SEARCH = 'web_search',
  WEB_BROWSE = 'web_browse',
  IMAGE_GENERATION = 'image_generation',
  CODE_INTERPRETER = 'code_interpreter',
  FILE_ANALYSIS = 'file_analysis',
  DATA_ANALYSIS = 'data_analysis'
}

/**
 * Request for native capability execution
 */
export interface NativeCapabilityRequest {
  type: NativeCapabilityType;
  payload: any;
  timeout_ms?: number;
  retry_policy?: {
    max_retries: number;
    backoff_ms: number;
  };
}

/**
 * Response from native capability execution
 */
export interface NativeCapabilityResponse {
  success: boolean;
  result?: any;
  error?: string;
  execution_time_ms: number;
  tokens_used?: number;
  metadata?: Record<string, any>;
}

/**
 * Python Execution Request
 */
export interface PythonExecutionRequest {
  code: string;
  inputs?: Record<string, any>;
  packages?: string[];  // Required packages (e.g., ['numpy', 'pandas'])
  timeout_ms?: number;
}

/**
 * Web Search Request
 */
export interface WebSearchRequest {
  query: string;
  num_results?: number;
  date_range?: {
    start?: string;  // ISO date
    end?: string;    // ISO date
  };
  domains?: string[];  // Restrict to specific domains
  language?: string;
}

/**
 * Web Browse Request
 */
export interface WebBrowseRequest {
  url: string;
  extract_type?: 'text' | 'structured' | 'tables' | 'images';
  selectors?: string[];  // CSS selectors for targeted extraction
}

/**
 * Native Capability Executor
 * 
 * Abstract interface for executing native capabilities. Implementations can target
 * different LLM providers (OpenAI, Anthropic, etc.) or execution environments.
 */
export interface NativeCapabilityExecutor {
  /**
   * Execute a native capability
   */
  execute(request: NativeCapabilityRequest): Promise<NativeCapabilityResponse>;
  
  /**
   * Check if a capability type is supported
   */
  supports(type: NativeCapabilityType): boolean;
  
  /**
   * Get cost estimate for a capability execution
   */
  estimateCost(request: NativeCapabilityRequest): {
    expected_tokens: number;
    expected_cost_usd: number;
  };
}

/**
 * Mock Native Capability Executor (for development/testing)
 * 
 * Returns simulated responses without actually calling external services.
 * Replace with real implementation when integrating with frontier LLMs.
 */
export class MockNativeCapabilityExecutor implements NativeCapabilityExecutor {
  async execute(request: NativeCapabilityRequest): Promise<NativeCapabilityResponse> {
    const startTime = Date.now();
    
    switch (request.type) {
      case NativeCapabilityType.PYTHON_EXECUTION:
        return this.executePython(request.payload as PythonExecutionRequest, startTime);
      
      case NativeCapabilityType.WEB_SEARCH:
        return this.executeWebSearch(request.payload as WebSearchRequest, startTime);
      
      case NativeCapabilityType.WEB_BROWSE:
        return this.executeWebBrowse(request.payload as WebBrowseRequest, startTime);
      
      case NativeCapabilityType.DATA_ANALYSIS:
        return this.executeDataAnalysis(request.payload, startTime);
      
      default:
        return {
          success: false,
          error: `Unsupported capability type: ${request.type}`,
          execution_time_ms: Date.now() - startTime
        };
    }
  }
  
  supports(type: NativeCapabilityType): boolean {
    return [
      NativeCapabilityType.PYTHON_EXECUTION,
      NativeCapabilityType.WEB_SEARCH,
      NativeCapabilityType.WEB_BROWSE,
      NativeCapabilityType.DATA_ANALYSIS
    ].includes(type);
  }
  
  estimateCost(request: NativeCapabilityRequest): { expected_tokens: number; expected_cost_usd: number } {
    // Mock cost estimation
    const baseCosts: Record<NativeCapabilityType, number> = {
      [NativeCapabilityType.PYTHON_EXECUTION]: 500,
      [NativeCapabilityType.WEB_SEARCH]: 300,
      [NativeCapabilityType.WEB_BROWSE]: 800,
      [NativeCapabilityType.IMAGE_GENERATION]: 1000,
      [NativeCapabilityType.CODE_INTERPRETER]: 600,
      [NativeCapabilityType.FILE_ANALYSIS]: 700,
      [NativeCapabilityType.DATA_ANALYSIS]: 900
    };
    
    const tokens = baseCosts[request.type] || 500;
    return {
      expected_tokens: tokens,
      expected_cost_usd: tokens * 0.00003  // ~$0.03 per 1K tokens
    };
  }
  
  private async executePython(req: PythonExecutionRequest, startTime: number): Promise<NativeCapabilityResponse> {
    // Mock Python execution
    return {
      success: true,
      result: {
        output: "Mock Python execution result",
        stdout: "Execution completed successfully",
        variables: { result: 42 }
      },
      execution_time_ms: Date.now() - startTime,
      tokens_used: 450,
      metadata: { packages_used: req.packages || [] }
    };
  }
  
  private async executeWebSearch(req: WebSearchRequest, startTime: number): Promise<NativeCapabilityResponse> {
    // Mock web search
    return {
      success: true,
      result: {
        results: [
          {
            title: "Mock Search Result 1",
            url: "https://example.com/result1",
            snippet: "This is a mock search result snippet...",
            date: "2024-01-15"
          },
          {
            title: "Mock Search Result 2",
            url: "https://example.com/result2",
            snippet: "Another mock search result...",
            date: "2024-01-10"
          }
        ],
        total_results: 2,
        query: req.query
      },
      execution_time_ms: Date.now() - startTime,
      tokens_used: 280
    };
  }
  
  private async executeWebBrowse(req: WebBrowseRequest, startTime: number): Promise<NativeCapabilityResponse> {
    // Mock web browsing
    return {
      success: true,
      result: {
        url: req.url,
        title: "Mock Page Title",
        content: "Mock page content extracted from the URL...",
        metadata: {
          author: "Mock Author",
          published_date: "2024-01-01",
          word_count: 1500
        }
      },
      execution_time_ms: Date.now() - startTime,
      tokens_used: 750
    };
  }
  
  private async executeDataAnalysis(payload: any, startTime: number): Promise<NativeCapabilityResponse> {
    // Mock data analysis
    return {
      success: true,
      result: {
        summary_statistics: {
          mean: 42.5,
          median: 40,
          std_dev: 12.3,
          count: 1000
        },
        insights: [
          "Data shows normal distribution",
          "No significant outliers detected",
          "Strong correlation between variables X and Y (r=0.85)"
        ],
        visualizations: ["histogram.png", "scatter_plot.png"]
      },
      execution_time_ms: Date.now() - startTime,
      tokens_used: 850
    };
  }
}

/**
 * Native Capability Manager
 * 
 * Manages native capability executors and provides a unified interface
 * for capabilities to invoke native tools.
 */
export class NativeCapabilityManager {
  private executor: NativeCapabilityExecutor;
  private forwardToClient = false;

  constructor(executor?: NativeCapabilityExecutor) {
    this.executor = executor || new MockNativeCapabilityExecutor();
  }

  /**
   * Check if a native capability type is available
   */
  isAvailable(type: NativeCapabilityType): boolean {
    return this.executor.supports(type);
  }

  /**
   * Invoke a native capability (unified interface for capabilities)
   */
  async invoke(
    type: NativeCapabilityType,
    params: any,
    context: ExecutionContext
  ): Promise<NativeCapabilityResponse> {
    return this.execute({
      type,
      payload: params
    });
  }

  /**
   * Execute a native capability
   */
  async execute(request: NativeCapabilityRequest): Promise<NativeCapabilityResponse> {
    if (!this.executor.supports(request.type)) {
      return {
        success: false,
        error: `Native capability ${request.type} not supported by current executor`,
        execution_time_ms: 0
      };
    }

    return this.executor.execute(request);
  }

  /**
   * Execute Python code
   */
  async executePython(code: string, inputs?: Record<string, any>, packages?: string[]): Promise<NativeCapabilityResponse> {
    return this.execute({
      type: NativeCapabilityType.PYTHON_EXECUTION,
      payload: { code, inputs, packages } as PythonExecutionRequest
    });
  }
  
  /**
   * Perform web search
   */
  async webSearch(query: string, numResults?: number): Promise<NativeCapabilityResponse> {
    return this.execute({
      type: NativeCapabilityType.WEB_SEARCH,
      payload: { query, num_results: numResults } as WebSearchRequest
    });
  }
  
  /**
   * Browse and extract content from URL
   */
  async webBrowse(url: string, extractType?: 'text' | 'structured' | 'tables'): Promise<NativeCapabilityResponse> {
    return this.execute({
      type: NativeCapabilityType.WEB_BROWSE,
      payload: { url, extract_type: extractType } as WebBrowseRequest
    });
  }
  
  /**
   * Analyze data
   */
  async analyzeData(data: any, analysisType?: string): Promise<NativeCapabilityResponse> {
    return this.execute({
      type: NativeCapabilityType.DATA_ANALYSIS,
      payload: { data, analysis_type: analysisType }
    });
  }
  
  /**
   * Set custom executor
   */
  setExecutor(executor: NativeCapabilityExecutor): void {
    this.executor = executor;
  }

  enableForwarding(): void {
    this.forwardToClient = true;
  }

  disableForwarding(): void {
    this.forwardToClient = false;
  }

  isForwardingEnabled(): boolean {
    return this.forwardToClient;
  }
}

function looksLikeStructuredPythonResult(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const recognizedKeys = new Set([
    'revenue',
    'ebitda',
    'risk_metrics',
    'simulation_parameters',
    'probabilistic_outcomes',
    'summary_statistics',
    'insights',
    'visualizations'
  ]);

  return Object.keys(value).some(key => recognizedKeys.has(key));
}

function tryParseJsonFromText(text: unknown): any | null {
  if (typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const parseCandidate = (candidate: string): any | null => {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };

  const direct = parseCandidate(trimmed);
  if (direct) {
    return direct;
  }

  const firstBrace = Math.min(
    ...['{', '[']
      .map(symbol => {
        const idx = trimmed.indexOf(symbol);
        return idx === -1 ? Number.POSITIVE_INFINITY : idx;
      })
  );
  const lastBrace = Math.max(
    trimmed.lastIndexOf('}'),
    trimmed.lastIndexOf(']')
  );

  if (Number.isFinite(firstBrace) && lastBrace >= firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    const parsed = parseCandidate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

/**
 * Attempt to normalize Python execution results into structured data.
 * Handles direct dict returns, stdout JSON strings, and nested result wrappers.
 */
export function parseNativePythonResult(payload: any): any | null {
  const visited = new Set<any>();

  const normalize = (value: any): any | null => {
    if (!value || typeof value === 'number' || typeof value === 'boolean') {
      return null;
    }

    if (typeof value === 'string') {
      return tryParseJsonFromText(value);
    }

    if (typeof value === 'object') {
      if (visited.has(value)) {
        return null;
      }

      visited.add(value);

      if (looksLikeStructuredPythonResult(value)) {
        return value;
      }

      const stdoutParsed = tryParseJsonFromText((value as Record<string, unknown>).stdout);
      if (stdoutParsed) {
        return stdoutParsed;
      }

      const outputParsed = tryParseJsonFromText((value as Record<string, unknown>).output);
      if (outputParsed) {
        return outputParsed;
      }

      const textParsed = tryParseJsonFromText((value as Record<string, unknown>).text);
      if (textParsed) {
        return textParsed;
      }

      if ('result' in (value as Record<string, unknown>)) {
        return normalize((value as Record<string, unknown>).result);
      }
    }

    return null;
  };

  return normalize(payload);
}

export interface NativeEnhancementOutcome {
  capabilityType: NativeCapabilityType;
  evidenceType: EvidenceType;
  result: any;
  tokens_used?: number;
  message: string;
}

export interface NativeEnhancementAttempt {
  capabilityType: NativeCapabilityType;
  request: NativeCapabilityRequest;
  message: string;
  status: 'success' | 'failed' | 'unavailable' | 'forwarded';
  response?: NativeCapabilityResponse;
  error?: string;
}

export interface NativeEnhancementResult {
  outcome: NativeEnhancementOutcome | null;
  attempts: NativeEnhancementAttempt[];
}

const SEARCH_FOCUSED_CATEGORIES = new Set<CapabilityNode['category']>([
  'market',
  'strategic',
  'commercial',
  'risk'
]);

/**
 * Run default native enhancement workflow for a capability result.
 * Prefers web search for market-like capabilities, otherwise uses data analysis.
 */
export async function runNativeEnhancement(
  capability: CapabilityNode,
  capabilityResult: CapabilityResult,
  context: ExecutionContext
): Promise<NativeEnhancementResult> {
  const manager = getNativeCapabilities(context);
  const attempts: NativeEnhancementAttempt[] = [];

  if (!manager) {
    return { outcome: null, attempts };
  }

  const forwardingEnabled = manager.isForwardingEnabled();
  const entityNames = context.whiteboard.get('__entity_names__') || {};
  const industryContext = context.whiteboard.get('__industry_context__');
  const baseQueryParts = [capability.name, industryContext?.vertical]
    .concat(Object.values(entityNames || {}).slice(0, 3))
    .filter(Boolean)
    .map((part: unknown) => String(part));
  const searchQuery = baseQueryParts.join(' ');

  const recordAttempt = (attempt: NativeEnhancementAttempt): NativeEnhancementAttempt => {
    attempts.push(attempt);
    return attempt;
  };

  const buildOutcome = (
    attempt: NativeEnhancementAttempt,
    response: NativeCapabilityResponse,
    message: string,
    evidenceType: EvidenceType,
    result: any
  ): NativeEnhancementOutcome => ({
    capabilityType: attempt.capabilityType,
    evidenceType,
    result,
    tokens_used: response.tokens_used,
    message
  });

  const tryWebSearch = async (): Promise<NativeEnhancementOutcome | null | 'forwarded'> => {
    if (!searchQuery || !SEARCH_FOCUSED_CATEGORIES.has(capability.category)) {
      return null;
    }

    const request: NativeCapabilityRequest = {
      type: NativeCapabilityType.WEB_SEARCH,
      payload: { query: searchQuery, num_results: 5 }
    };

    if (!manager.isAvailable(NativeCapabilityType.WEB_SEARCH)) {
      recordAttempt({
        capabilityType: NativeCapabilityType.WEB_SEARCH,
        request,
        message: `Real-time market intelligence requested via web search for "${searchQuery}"`,
        status: 'unavailable'
      });
      return null;
    }

    if (forwardingEnabled) {
      recordAttempt({
        capabilityType: NativeCapabilityType.WEB_SEARCH,
        request,
        message: `Forward web search to client for "${searchQuery}"`,
        status: 'forwarded'
      });
      return 'forwarded';
    }

    try {
      const response = await manager.execute(request);
      if (response.success && response.result) {
        recordAttempt({
          capabilityType: NativeCapabilityType.WEB_SEARCH,
          request,
          message: `Real-time market intelligence retrieved via LLM web search for "${searchQuery}"`,
          status: 'success',
          response
        });
        return buildOutcome(
          attempts[attempts.length - 1],
          response,
          `Real-time market intelligence retrieved via LLM web search for "${searchQuery}"`,
          EvidenceType.RETRIEVAL,
          response.result
        );
      }

      recordAttempt({
        capabilityType: NativeCapabilityType.WEB_SEARCH,
        request,
        message: `Real-time market intelligence requested via web search for "${searchQuery}"`,
        status: 'failed',
        response,
        error: response.error
      });
    } catch (error) {
      recordAttempt({
        capabilityType: NativeCapabilityType.WEB_SEARCH,
        request,
        message: `Real-time market intelligence requested via web search for "${searchQuery}"`,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return null;
  };

  const tryDataAnalysis = async (): Promise<NativeEnhancementOutcome | null | 'forwarded'> => {
    const request: NativeCapabilityRequest = {
      type: NativeCapabilityType.DATA_ANALYSIS,
      payload: {
        capability_id: capability.id,
        capability_name: capability.name,
        category: capability.category,
        output_snapshot: capabilityResult.output
      }
    };

    if (!manager.isAvailable(NativeCapabilityType.DATA_ANALYSIS)) {
      recordAttempt({
        capabilityType: NativeCapabilityType.DATA_ANALYSIS,
        request,
        message: 'Capability output review requested via LLM data analysis',
        status: 'unavailable'
      });
      return null;
    }

    if (forwardingEnabled) {
      recordAttempt({
        capabilityType: NativeCapabilityType.DATA_ANALYSIS,
        request,
        message: 'Forward capability output review to client data analysis tool',
        status: 'forwarded'
      });
      return 'forwarded';
    }

    try {
      const response = await manager.execute(request);
      if (response.success && response.result) {
        recordAttempt({
          capabilityType: NativeCapabilityType.DATA_ANALYSIS,
          request,
          message: 'Capability output reviewed via LLM native data analysis',
          status: 'success',
          response
        });
        return buildOutcome(
          attempts[attempts.length - 1],
          response,
          'Capability output reviewed via LLM native data analysis',
          EvidenceType.CALCULATION,
          response.result
        );
      }

      recordAttempt({
        capabilityType: NativeCapabilityType.DATA_ANALYSIS,
        request,
        message: 'Capability output review requested via LLM data analysis',
        status: 'failed',
        response,
        error: response.error
      });
    } catch (error) {
      recordAttempt({
        capabilityType: NativeCapabilityType.DATA_ANALYSIS,
        request,
        message: 'Capability output review requested via LLM data analysis',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return null;
  };

  const tryPythonValidation = async (): Promise<NativeEnhancementOutcome | null | 'forwarded'> => {
    if (capability.category !== 'financial' && capability.category !== 'operational') {
      return null;
    }

    const serialized = JSON.stringify(capabilityResult.output)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");

    const pythonCode = `
import json
from statistics import mean

data = json.loads('${serialized}')

def collect_numbers(obj, path=""):
    values = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            next_path = f"{path}.{key}" if path else key
            values.extend(collect_numbers(value, next_path))
    elif isinstance(obj, list):
        for idx, value in enumerate(obj):
            next_path = f"{path}[{idx}]"
            values.extend(collect_numbers(value, next_path))
    elif isinstance(obj, (int, float)):
        values.append({"path": path, "value": obj})
    return values

numeric_fields = collect_numbers(data)
summary = {
    "numeric_fields": len(numeric_fields),
    "sample": numeric_fields[:10],
    "mean_values": {
        field["path"]: field["value"]
        for field in numeric_fields[:5]
    }
}

print(json.dumps(summary))
`;

    const request: NativeCapabilityRequest = {
      type: NativeCapabilityType.PYTHON_EXECUTION,
      payload: { code: pythonCode }
    };

    if (!manager.isAvailable(NativeCapabilityType.PYTHON_EXECUTION)) {
      recordAttempt({
        capabilityType: NativeCapabilityType.PYTHON_EXECUTION,
        request,
        message: 'Capability output sanity check requested via LLM native Python',
        status: 'unavailable'
      });
      return null;
    }

    if (forwardingEnabled) {
      recordAttempt({
        capabilityType: NativeCapabilityType.PYTHON_EXECUTION,
        request,
        message: 'Forward capability output sanity check to client Python tool',
        status: 'forwarded'
      });
      return 'forwarded';
    }

    try {
      const response = await manager.execute(request);
      if (response.success && response.result) {
        const parsed = parseNativePythonResult(response.result);
        if (parsed) {
          recordAttempt({
            capabilityType: NativeCapabilityType.PYTHON_EXECUTION,
            request,
            message: 'Capability output sanity-checked via LLM native Python execution',
            status: 'success',
            response
          });
          return buildOutcome(
            attempts[attempts.length - 1],
            response,
            'Capability output sanity-checked via LLM native Python execution',
            EvidenceType.SIMULATION,
            parsed
          );
        }
      }

      recordAttempt({
        capabilityType: NativeCapabilityType.PYTHON_EXECUTION,
        request,
        message: 'Capability output sanity check requested via LLM native Python',
        status: 'failed',
        response,
        error: response.error
      });
    } catch (error) {
      recordAttempt({
        capabilityType: NativeCapabilityType.PYTHON_EXECUTION,
        request,
        message: 'Capability output sanity check requested via LLM native Python',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return null;
  };

  for (const strategy of [tryWebSearch, tryDataAnalysis, tryPythonValidation]) {
    const result = await strategy();
    if (result === 'forwarded') {
      return { outcome: null, attempts };
    }
    if (result) {
      return { outcome: result, attempts };
    }
  }

  return { outcome: null, attempts };
}

/**
 * Global native capability manager instance
 */
export const globalNativeCapabilityManager = new NativeCapabilityManager();

/**
 * Helper function to add native capability manager to execution context
 */
export function attachNativeCapabilities(context: ExecutionContext): void {
  context.whiteboard.set('__native_capabilities__', globalNativeCapabilityManager);
}

/**
 * Helper function to get native capability manager from execution context
 */
export function getNativeCapabilities(context: ExecutionContext): NativeCapabilityManager | null {
  return context.whiteboard.get('__native_capabilities__') || null;
}

export function enableNativeRequestForwarding(): void {
  globalNativeCapabilityManager.enableForwarding();
}

export function disableNativeRequestForwarding(): void {
  globalNativeCapabilityManager.disableForwarding();
}

export function isNativeRequestForwardingEnabled(): boolean {
  return globalNativeCapabilityManager.isForwardingEnabled();
}
