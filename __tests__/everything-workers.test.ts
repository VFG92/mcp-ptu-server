import { describe, it, expect, beforeAll, jest } from '@jest/globals';

const requestHandlers: Array<{ schema: any; handler: (req: any) => any }> = [];
const notificationHandlers: Array<{ schema: any; handler: (params: any) => any }> = [];
const logs: Array<{ message: any; sessionId?: string }> = [];

class MockServer {
  static instances: MockServer[] = [];

  public config: any;
  public metadata: any;
  public notifications: any[] = [];
  public requestHandlers = requestHandlers;
  public notificationHandlers = notificationHandlers;
  public logs = logs;
  public oninitialized: (() => Promise<void>) | null = null;

  constructor(metadata: any, config: any) {
    this.metadata = metadata;
    this.config = config;
    MockServer.instances.push(this);
  }

  setRequestHandler(schema: any, handler: any) {
    requestHandlers.push({ schema, handler });
  }

  setNotificationHandler(schema: any, handler: any) {
    notificationHandlers.push({ schema, handler });
  }

  async listRoots() {
    return [];
  }

  async sendLoggingMessage(message: any, sessionId?: string) {
    logs.push({ message, sessionId });
  }

  getClientCapabilities() {
    return { tools: {} };
  }

  notification(payload: any) {
    this.notifications.push(payload);
  }
}

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: MockServer
}));

const schema = (method: string) => ({ method, parse: (input: any) => input });

jest.unstable_mockModule('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: schema('call_tool'),
  ClientCapabilities: class {},
  CompleteRequestSchema: schema('complete'),
  GetPromptRequestSchema: schema('get_prompt'),
  ListPromptsRequestSchema: schema('list_prompts'),
  ListResourcesRequestSchema: schema('list_resources'),
  ListResourceTemplatesRequestSchema: schema('list_resource_templates'),
  ListToolsRequestSchema: schema('list_tools'),
  LoggingLevel: {},
  ReadResourceRequestSchema: schema('read_resource'),
  Resource: class {},
  RootsListChangedNotificationSchema: schema('roots_changed'),
  SubscribeRequestSchema: schema('subscribe'),
  Tool: class {},
  ToolSchema: { shape: { inputSchema: {} } },
  UnsubscribeRequestSchema: schema('unsubscribe'),
  type: { Root: class {} }
}));

let createServer: any;

beforeAll(async () => {
  ({ createServer } = await import('../src/workers/everything-workers.js'));
});

describe('everything workers server', () => {
  it('registers MCP handlers and exposes capability tools', async () => {
    MockServer.instances.length = 0;
    requestHandlers.length = 0;
    notificationHandlers.length = 0;
    logs.length = 0;

    const sessionStore = new Map();
    const persist = jest.fn(async () => undefined);

    // Import ParallelReasoningSessionManager for testing
    const { ParallelReasoningSessionManager } = await import('../src/workers/parallel-reasoning-mcp.js');
    const parallelReasoningV5Manager = new ParallelReasoningSessionManager();

    const { server, cleanup } = createServer(
      sessionStore,                    // parallelReasoningSessions
      persist,                         // persistCallback
      () => 'a'.repeat(64),           // getTransportSessionId
      undefined,                       // capabilityWhiteboard
      undefined,                       // capabilityLedger
      undefined,                       // capabilityPersistCallback
      parallelReasoningV5Manager,     // parallelReasoningV5Manager
      undefined                        // parallelReasoningV5PersistCallback
    );

    expect(MockServer.instances.length).toBe(1);
    const instance = MockServer.instances[0];
    expect(instance).toBeDefined();

    // Ensure list tools handler is registered and returns parallel reasoning tools only (v5.1.0)
    const listToolsHandler = requestHandlers.find(handler => handler.schema.method === 'list_tools');
    expect(listToolsHandler).toBeDefined();
    const toolsResponse = await listToolsHandler!.handler({ params: {} });
    expect(Array.isArray(toolsResponse.tools)).toBe(true);

    // v5.1.0: Only parallel reasoning tools exposed (multi-path only)
    expect(toolsResponse.tools.some((tool: any) => tool.name === 'init_parallel_reasoning')).toBe(true);
    expect(toolsResponse.tools.some((tool: any) => tool.name === 'submit_reasoning_plan')).toBe(true);
    expect(toolsResponse.tools.some((tool: any) => tool.name === 'execute_plan_step')).toBe(true);

    // v5.1.0: Single-path tools no longer exposed
    expect(toolsResponse.tools.some((tool: any) => tool.name === 'analyze_with_capabilities')).toBe(false);
    expect(toolsResponse.tools.some((tool: any) => tool.name === 'list_capabilities')).toBe(false);

    // Invoke call_tool handler to exercise branching logic
    const callToolHandler = requestHandlers.find(handler => handler.schema.method === 'call_tool');
    expect(callToolHandler).toBeDefined();
    const sessionId = 'parallel_reasoning_v5_test_session';

    const initResponse = await callToolHandler!.handler({
      params: {
        name: 'init_parallel_reasoning',
        arguments: {
          session_id: sessionId,
          task_description: 'Quick market scan',
          required_diversity_axes: ['data_sources', 'analytical_models'],
          min_plans: 3
        }
      }
    });
    expect(initResponse.content).toBeDefined();
    expect(initResponse.content[0].text).toContain('Session Initialized Successfully');

    const planResponse = await callToolHandler!.handler({
      params: {
        name: 'submit_reasoning_plan',
        arguments: {
          session_id: sessionId,
          plan: {
            plan_id: 'plan_A',
            description: 'Baseline plan',
            diversity_axes: ['data_sources', 'analytical_models'],
            capability_chain: ['market_scan', 'tam_sam_som_build', 'competitor_analysis', 'customer_segmentation', 'brand_equity_valuation', 'gtm_strategy', 'digital_roi_attribution', 'customer_journey_mapping'],
            rationale: 'Provide baseline analysis',
            expected_outputs: ['market_map']
          }
        }
      }
    });
    expect(planResponse.content?.[0]?.text).toContain('Plan Accepted');

    const statusResponse = await callToolHandler!.handler({
      params: {
        name: 'list_plan_status',
        arguments: {
          session_id: sessionId
        }
      }
    });
    expect(statusResponse.content?.[0]?.text).toContain('Session Status');

    await callToolHandler!.handler({
      params: {
        name: 'analyze_with_capabilities',
        arguments: {
          session_id: 'capability-session',
          task: 'Assess market entry options',
          tournament_mode: false,
          peer_review_mode: false,
          adapter_id: 'strategy'
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'get_capability_status',
        arguments: {
          session_id: 'capability-session'
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'export_session',
        arguments: {
          session_id: 'capability-session'
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'list_capabilities',
        arguments: {
          category: 'market'
        }
      }
    });

    await cleanup();
  }, 30000);
});
