import { describe, it, expect } from '@jest/globals';

import { ExpressRequestAdapter, ExpressResponseAdapter } from '../src/workers/express-adapter.js';

async function streamToString(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!stream) return '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

async function nodeStreamToString(stream: AsyncIterable<Buffer> | null): Promise<string> {
  if (!stream) return '';
  let result = '';
  for await (const chunk of stream as any) {
    result += chunk.toString();
  }
  return result;
}

describe('express adapter bridge', () => {
  it('parses request metadata and body', async () => {
    const request = new Request('https://example.com/api/analyze?foo=bar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Custom': '123' },
      body: JSON.stringify({ message: 'hello' })
    });

    const adapter = new ExpressRequestAdapter(request);
    await adapter.parseBody();

    expect(adapter.method).toBe('POST');
    expect(adapter.url).toBe('/api/analyze?foo=bar');
    expect(adapter.query.foo).toBe('bar');
    expect(adapter.header('x-custom')).toBe('123');
    expect(adapter.body).toEqual({ message: 'hello' });

    const readable = adapter.createReadableStream();
    const streamed = await nodeStreamToString(readable as any);
    expect(streamed).toContain('hello');
  });

  it('buffers response data and converts to Response', async () => {
    const res = new ExpressResponseAdapter();
    res.status(201).setHeader('Content-Type', 'application/json');
    res.write('{"partial": true');
    res.end(', "done": true}');

    const response = await res.toResponse();
    expect(response.status).toBe(201);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.text();
    expect(body).toBe('{"partial": true, "done": true}');
  });

  it('streams server-sent events when content-type is event-stream', async () => {
    const res = new ExpressResponseAdapter();
    res.setHeader('Content-Type', 'text/event-stream');
    res.write('data: ready\n\n');
    res.end('data: done\n\n');

    const response = await res.toResponse();
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    const body = await streamToString(response.body);
    expect(body).toContain('data: ready');
    expect(body).toContain('data: done');
  });
});
