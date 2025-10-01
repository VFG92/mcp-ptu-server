# Test Scripts

This directory contains test scripts for the MCP PTU Server.

## Parallel Reasoning Tests

### `test-parallel-reasoning-simple.sh`

**Purpose**: Smoke test for parallel reasoning session persistence fix (v5.0.1)

**What it tests**:
- MCP session initialization and session ID capture
- Parallel reasoning session creation
- Plan submission with diversity axes validation
- Plan status listing
- Session persistence across multiple tool calls

**Usage**:
```bash
cd /workspaces/mcp-ptu-server
./scripts/test-parallel-reasoning-simple.sh
```

**Expected output**:
```
✅ ALL TESTS PASSED

Summary:
- Session persistence: WORKING
- Diversity axes validation: WORKING
- Plan status listing: WORKING
```

**Prerequisites**:
- Server must be running: `npm run workers:dev`
- Server must be accessible at `http://localhost:8787`

### `test-parallel-reasoning-fix.sh`

**Purpose**: Alternative test script with more detailed output

**Usage**:
```bash
cd /workspaces/mcp-ptu-server
./scripts/test-parallel-reasoning-fix.sh
```

## Running Tests

### Start the development server

```bash
npm run workers:dev
```

### Run all tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Parallel reasoning smoke test
./scripts/test-parallel-reasoning-simple.sh
```

## Notes

- All test scripts require the development server to be running
- Test scripts use `curl` to make HTTP requests to the MCP server
- Session IDs are automatically generated and captured from response headers
- Tests verify that the same Durable Object session is used across multiple requests

