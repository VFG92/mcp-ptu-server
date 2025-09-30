// Minimal Cloudflare Durable Object type declarations for local TypeScript builds
// These definitions provide only the members used within this workspace.

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list<T = unknown>(options?: { prefix?: string }): Promise<Map<string, T>>;
}

interface DurableObjectState {
  readonly id: DurableObjectId;
  readonly storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(closure: () => Promise<T>): Promise<T>;
}

interface DurableObjectNamespace {
  idFromString(id: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
  stub(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectStub {
  readonly id: DurableObjectId;
  fetch(request: Request): Promise<Response>;
}

declare module 'cloudflare:workers' {
  abstract class DurableObject {
    protected constructor(state: DurableObjectState, env: unknown);
    fetch(request: Request): Promise<Response> | Response;
  }

  export { DurableObject };
}
