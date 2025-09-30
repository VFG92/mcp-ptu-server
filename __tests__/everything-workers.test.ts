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

    const { server, cleanup } = createServer(
      sessionStore,
      persist,
      () => 'a'.repeat(64)
    );

    expect(MockServer.instances.length).toBe(1);
    const instance = MockServer.instances[0];
    expect(instance).toBeDefined();

    // Ensure list tools handler is registered and returns capability tools
    const listToolsHandler = requestHandlers.find(handler => handler.schema.method === 'list_tools');
    expect(listToolsHandler).toBeDefined();
    const toolsResponse = await listToolsHandler!.handler({ params: {} });
    expect(Array.isArray(toolsResponse.tools)).toBe(true);
    expect(toolsResponse.tools.some((tool: any) => tool.name === 'analyze_with_capabilities')).toBe(true);

    // Invoke call_tool handler to exercise branching logic
    const callToolHandler = requestHandlers.find(handler => handler.schema.method === 'call_tool');
    expect(callToolHandler).toBeDefined();
    const callResponse = await callToolHandler!.handler({
      params: {
        name: 'parallel_reasoning_init',
        arguments: {
          task: 'Quick market scan',
          perspectives: ['strategy_consultant']
        }
      }
    });
    expect(callResponse.content).toBeDefined();
    expect(sessionStore.size).toBe(1);
    expect(persist).toHaveBeenCalled();

    const text = callResponse.content[0].text as string;
    const sessionIdMatch = text.match(/SESSION_ID: ([^\n]+)/);
    expect(sessionIdMatch).not.toBeNull();
    const sessionId = sessionIdMatch![1];
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const agentIds: string[] = payload.agents.map((agent: any) => agent.agent_id);

    await callToolHandler!.handler({
      params: {
        name: 'agent_reasoning_step',
        arguments: {
          session_id: sessionId,
          agent_id: agentIds[0],
          reasoning: 'Outlined strategic options',
          confidence: 0.65
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'cross_agent_communication',
        arguments: {
          session_id: sessionId,
          from_agent: agentIds[0],
          to_agent: agentIds[0],
          message: 'Sync on priorities',
          message_type: 'info'
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'synthesize_parallel_reasoning',
        arguments: {
          session_id: sessionId,
          synthesis_strategy: 'consensus',
          require_all_completed: false
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'parallel_compute_status',
        arguments: { session_id: sessionId }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'agent_debate',
        arguments: {
          session_id: sessionId,
          topic: 'Should we accelerate migration?',
          agent_ids: agentIds.slice(0, 1)
        }
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'list_agent_personas',
        arguments: {}
      }
    });

    await callToolHandler!.handler({
      params: {
        name: 'validate_session_spec',
        arguments: {
          task: 'Validate personas',
          perspectives: ['strategy_consultant', 'unknown_persona']
        }
      }
    });

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
