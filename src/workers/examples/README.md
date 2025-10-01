# Code Examples

This directory contains example code demonstrating how to use various features of the MCP PTU Server.

## Files

### `capability-integration-example.ts`

**Purpose**: Demonstrates how to integrate and use the capability system

**What it shows**:
- How to create a capability orchestrator
- How to execute capabilities
- How to handle evidence and artifacts
- How to use the tournament kernel
- How to export session data

**Usage**: This is reference code, not meant to be executed directly. Use it as a guide when building your own integrations.

## Additional Examples

More examples can be found in:

### `/examples` (root directory)
- `parallel-reasoning-v5-example.ts` - Complete parallel reasoning workflow
- `peer-review-example.ts` - Peer review system usage

### `/__tests__` (test directory)
All test files serve as working examples:
- `capability-tools.test.ts` - Capability system usage
- `parallel-reasoning-v5.test.ts` - Parallel reasoning workflows
- `peer-review.test.ts` - Peer review system
- `session-persistence.test.ts` - Session management
- `integration.test.ts` - End-to-end workflows

## Running Examples

To run the examples in the root `/examples` directory:

```bash
# Install dependencies
npm install

# Run with ts-node
npx ts-node examples/parallel-reasoning-v5-example.ts
```

## Documentation

For complete documentation, see:
- [README.md](../../../README.md) - User documentation
- [AGENT.md](../../../AGENT.md) - Technical documentation

