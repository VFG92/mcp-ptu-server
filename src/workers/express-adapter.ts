/**
 * Express-to-Workers Adapter
 * 
 * This adapter converts Cloudflare Workers Request/Response objects
 * to Express-like req/res objects that are compatible with
 * StreamableHTTPServerTransport from the MCP SDK.
 * 
 * The MCP SDK expects Node.js IncomingMessage and ServerResponse objects,
 * but Cloudflare Workers use standard Web API Request/Response.
 */

import { Readable } from 'node:stream';

/**
 * Adapter that makes a Workers Request look like an Express Request (IncomingMessage)
 */
export class ExpressRequestAdapter {
  public method: string;
  public url: string;
  public headers: Record<string, string | string[]>;
  public body: any;
  public query: Record<string, string>;
  private _request: Request;
  private _bodyParsed: boolean = false;
  private _bodyText: string = '';
  private _readable: Readable | null = null;

  constructor(request: Request) {
    this._request = request;
    const urlObj = new URL(request.url);

    this.method = request.method;
    this.url = urlObj.pathname + urlObj.search;

    // Convert Headers to plain object
    this.headers = {};
    request.headers.forEach((value, key) => {
      this.headers[key.toLowerCase()] = value;
    });

    // Parse query parameters
    this.query = {};
    urlObj.searchParams.forEach((value, key) => {
      this.query[key] = value;
    });
  }

  /**
   * Parse the request body (called before passing to transport)
   * The transport might read the body itself, so we need to make it available as a stream
   */
  async parseBody(): Promise<void> {
    if (this._bodyParsed) return;

    if (this.method === 'GET' || this.method === 'DELETE') {
      this.body = {};
      this._bodyText = '';
      this._bodyParsed = true;
      return;
    }

    try {
      this._bodyText = await this._request.text();
      if (this._bodyText) {
        // Don't parse yet - let the transport do it
        // But make it available if accessed
        try {
          this.body = JSON.parse(this._bodyText);
        } catch {
          this.body = this._bodyText;
        }
      } else {
        this.body = {};
      }
    } catch (error) {
      console.error('Error reading request body:', error);
      this.body = {};
      this._bodyText = '';
    }

    this._bodyParsed = true;
  }

  /**
   * Get a specific header value
   */
  header(name: string): string | undefined {
    const value = this.headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * Create a readable stream from the request body (if needed by SDK)
   */
  createReadableStream(): Readable {
    const readable = new Readable();
    readable.push(this._bodyText);
    readable.push(null);
    return readable;
  }

  /**
   * Event emitter stub (required by IncomingMessage interface)
   */
  on(event: string, handler: (...args: any[]) => void): this {
    // For SSE, we might need to handle 'close' events
    if (event === 'close') {
      // Store the handler if needed
    }
    return this;
  }

  once(event: string, handler: (...args: any[]) => void): this {
    return this;
  }

  removeListener(event: string, handler: (...args: any[]) => void): this {
    return this;
  }
}

/**
 * Adapter that makes a Workers Response builder look like an Express Response (ServerResponse)
 * 
 * This is more complex because we need to:
 * 1. Capture all writes/headers during the request handling
 * 2. Support SSE streaming
 * 3. Convert to a Workers Response at the end
 */
export class ExpressResponseAdapter {
  public statusCode: number = 200;
  public headersSent: boolean = false;
  
  private _headers: Record<string, string> = {};
  private _chunks: string[] = [];
  private _isSSE: boolean = false;
  private _sseController: ReadableStreamDefaultController | null = null;
  private _sseStream: ReadableStream | null = null;
  private _finished: boolean = false;
  private _finishPromise: Promise<void>;
  private _finishResolve!: () => void;

  constructor() {
    // Create a promise that resolves when the response is finished
    this._finishPromise = new Promise((resolve) => {
      this._finishResolve = resolve;
    });
  }

  /**
   * Set HTTP status code
   */
  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  /**
   * Set a response header
   */
  setHeader(name: string, value: string | number | string[]): this {
    if (this.headersSent) {
      console.warn(`Cannot set header ${name} after headers sent`);
      return this;
    }
    
    this._headers[name] = String(value);
    
    // Detect SSE by Content-Type header
    if (name.toLowerCase() === 'content-type' && String(value).includes('text/event-stream')) {
      this._isSSE = true;
      this._initSSEStream();
    }
    
    return this;
  }

  /**
   * Get a response header
   */
  getHeader(name: string): string | undefined {
    return this._headers[name];
  }

  /**
   * Remove a response header
   */
  removeHeader(name: string): this {
    delete this._headers[name];
    return this;
  }

  /**
   * Write response headers
   */
  writeHead(statusCode: number, headers?: Record<string, string>): this {
    this.statusCode = statusCode;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        this.setHeader(key, value);
      });
    }
    this.headersSent = true;
    return this;
  }

  /**
   * Flush headers (Node.js ServerResponse compatibility)
   * In Cloudflare Workers, headers are sent automatically with the first write
   * This is a no-op stub for MCP SDK compatibility
   */
  flushHeaders(): this {
    this.headersSent = true;
    return this;
  }

  /**
   * Write data to the response
   * For SSE, this writes to the stream
   * For regular responses, this buffers the data
   */
  write(chunk: string | Buffer, encoding?: BufferEncoding | (() => void), callback?: () => void): boolean {
    if (this._finished) {
      console.warn('Cannot write after response finished');
      return false;
    }

    const data = typeof chunk === 'string' ? chunk : chunk.toString(encoding as BufferEncoding);
    
    if (this._isSSE && this._sseController) {
      // For SSE, write directly to the stream
      try {
        this._sseController.enqueue(new TextEncoder().encode(data));
      } catch (error) {
        console.error('Error writing to SSE stream:', error);
      }
    } else {
      // For regular responses, buffer the data
      this._chunks.push(data);
    }

    // Call callback if provided
    if (typeof encoding === 'function') {
      encoding();
    } else if (callback) {
      callback();
    }

    return true;
  }

  /**
   * End the response
   */
  end(data?: string | Buffer, encoding?: BufferEncoding | (() => void), callback?: () => void): this {
    if (this._finished) {
      return this;
    }

    // Write final data if provided
    if (data) {
      const finalData = typeof data === 'string' ? data : data.toString(encoding as BufferEncoding);
      if (this._isSSE && this._sseController) {
        this._sseController.enqueue(new TextEncoder().encode(finalData));
      } else {
        this._chunks.push(finalData);
      }
    }

    // Close SSE stream if applicable
    if (this._isSSE && this._sseController) {
      try {
        this._sseController.close();
      } catch (error) {
        console.error('Error closing SSE stream:', error);
      }
    }

    this._finished = true;
    this.headersSent = true;

    // Call callback if provided
    if (typeof encoding === 'function') {
      encoding();
    } else if (callback) {
      callback();
    }

    // Resolve the finish promise
    this._finishResolve();

    return this;
  }

  /**
   * Send JSON response
   */
  json(data: any): this {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
    return this;
  }

  /**
   * Initialize SSE stream
   */
  private _initSSEStream(): void {
    if (this._sseStream) return;

    this._sseStream = new ReadableStream({
      start: (controller) => {
        this._sseController = controller;
      },
      cancel: () => {
        console.log('SSE stream cancelled by client');
        this._finished = true;
        this._finishResolve();
      }
    });
  }

  /**
   * Convert to Workers Response
   * This should be called after the transport has finished handling the request
   */
  async toResponse(): Promise<Response> {
    // For SSE streams, return immediately without waiting
    if (this._isSSE && this._sseStream) {
      const headers = new Headers(this._headers);
      return new Response(this._sseStream, {
        status: this.statusCode,
        headers,
      });
    }

    // For regular responses, wait for finish with a timeout
    if (!this._finished) {
      const timeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('Response timeout - returning buffered content');
          resolve();
        }, 30000); // 30 second timeout (increased for LLM sampling)
      });

      await Promise.race([this._finishPromise, timeout]);
    }

    // Return regular response with buffered body
    const headers = new Headers(this._headers);
    const body = this._chunks.join('');
    return new Response(body, {
      status: this.statusCode,
      headers,
    });
  }

  /**
   * Event emitter stub (required by ServerResponse interface)
   */
  on(event: string, handler: (...args: any[]) => void): this {
    if (event === 'finish') {
      this._finishPromise.then(handler);
    }
    return this;
  }

  once(event: string, handler: (...args: any[]) => void): this {
    if (event === 'finish') {
      this._finishPromise.then(handler);
    }
    return this;
  }

  removeListener(event: string, handler: (...args: any[]) => void): this {
    return this;
  }
}

