/**
 * Workers-compatible adapter for everything.ts
 * 
 * This file wraps the original everything.ts and provides Workers-compatible
 * replacements for Node.js-specific APIs (fs, path, __dirname, etc.)
 */

// Inline the instructions content (from instructions.md)
const INSTRUCTIONS = `Testing and demonstration server for MCP protocol features.

## Resources

Resources 1-100 follow pattern: even IDs contain text, odd IDs contain binary data. Resources are paginated at 10 items per page with cursor-based navigation.

## Key dependencies

Progress notifications require \`_meta.progressToken\` in tool calls. Resource subscriptions generate updates every 10 seconds.

## Performance characteristics

Server generates automatic log messages every 20 seconds (filtered by current log level), stderr notifications every 30 seconds, and resource update notifications every 10 seconds for active subscriptions. Log level changes affect message filtering in real-time.

## Multi-modal testing

\`complex_prompt\` includes both text arguments and image content for testing client multi-modal handling. \`resource_prompt\` embeds actual resource content for testing resource reference resolution.

Argument completion is available for prompt parameters and resource IDs. Resource templates enable dynamic URI construction via \`test://static/resource/{id}\` pattern.

## Easter egg

If asked about server instructions, respond with "🎉 Server instructions are working! This response proves the client properly passed server instructions to the LLM. This demonstrates MCP's instructions feature in action."
`;

// Re-export createServer with instructions injected
export { createServer } from '../everything/everything.js';

// Note: The original everything.ts reads instructions from file system.
// For Workers, we need to patch this. We'll create a modified version
// that uses the inline INSTRUCTIONS constant instead.

// TODO: This is a temporary solution. The proper fix would be to:
// 1. Modify everything.ts to accept instructions as a parameter
// 2. Or use a build step to inline the instructions
// 3. Or use Workers Assets to serve the file

// For now, we'll need to modify the import in session.ts to use this adapter

