# Deployment Guide: MCP PTU Server with Capability System

## Overview

This guide covers deploying the MCP PTU Server with the new capability-driven architecture to Cloudflare Workers.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- Git repository access

## Environment Configuration

### 1. Environment Variables

Create a `.env` file (not committed to git):

```bash
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# MCP Configuration
MCP_SERVER_NAME=mcp-ptu-server
MCP_SERVER_VERSION=2.0.0

# Capability System
CAPABILITY_SYSTEM_ENABLED=true
LEGACY_PERSONA_SYSTEM_ENABLED=true  # Set to false to disable legacy system

# Budget Defaults
DEFAULT_MAX_TOKENS_IN=10000
DEFAULT_MAX_TOKENS_OUT=10000
DEFAULT_MAX_CPU_MS=10000
DEFAULT_MAX_SUBREQUESTS=50

# Monitoring
ENABLE_LOGGING=true
LOG_LEVEL=info  # debug, info, warn, error
```

### 2. Wrangler Configuration

The `wrangler.toml` is already configured. Key settings:

```toml
name = "mcp-ptu-server"
main = "src/workers/cloudflare-worker.ts"
compatibility_date = "2024-01-01"

[durable_objects]
bindings = [
  { name = "MCP_SESSION", class_name = "MCPSession" }
]

[[migrations]]
tag = "v1"
new_classes = ["MCPSession"]
```

## Deployment Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

### Step 3: Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm test -- __tests__/integration.test.ts

# Performance tests
npm test -- __tests__/performance.test.ts

# Coverage report
npm run test:coverage
```

### Step 4: Type Check

```bash
npx tsc --noEmit
```

### Step 5: Deploy to Cloudflare Workers

```bash
# Login to Cloudflare
wrangler login

# Deploy to production
wrangler deploy

# Or deploy to staging
wrangler deploy --env staging
```

### Step 6: Verify Deployment

```bash
# Test the deployment
curl https://mcp-ptu-server.your-subdomain.workers.dev/health

# Expected response:
# {"status": "ok", "version": "2.0.0", "capability_system": "enabled"}
```

## Cloudflare Workers Constraints

### Free Tier Limits
- **CPU Time**: 10ms per request
- **Memory**: 128 MB
- **Requests**: 100,000/day
- **Durable Objects**: 1 GB storage

### Paid Tier Limits
- **CPU Time**: 50ms per request (standard), 30s (unbound)
- **Memory**: 128 MB
- **Requests**: Unlimited
- **Durable Objects**: Unlimited storage

### Optimization Tips

1. **Use Wave-Based Execution**: The budget scheduler automatically prioritizes cheap capabilities first
2. **Enable Progressive Disclosure**: Start with Wave 1 (cheap) capabilities, expand to Wave 2/3 if needed
3. **Set Appropriate Budgets**: Don't over-allocate tokens/CPU
4. **Use Adapters**: Focus analysis with specific adapters instead of comprehensive mode

## Monitoring & Observability

### 1. Cloudflare Dashboard

Monitor in real-time:
- Request rate
- Error rate
- CPU time usage
- Durable Object operations

### 2. Logging

All capability executions are logged:

```typescript
console.log(`[CapabilityOrchestrator] Executing capability: ${capabilityId}`);
console.log(`[BudgetScheduler] Wave 1 execution: ${wave1Caps.length} capabilities`);
console.log(`[EvidenceLedger] Added evidence for artifact: ${artifactId}`);
```

### 3. Custom Metrics

Track key metrics:
- Capability execution time
- Token usage per session
- Confidence scores
- Evidence quality
- Budget exhaustion rate

### 4. Alerts

Set up alerts for:
- High error rate (>5%)
- CPU time approaching limits
- Budget exhaustion
- Low confidence scores (<0.7)

## Rollback Procedure

If issues occur after deployment:

```bash
# Rollback to previous version
wrangler rollback

# Or deploy a specific version
wrangler deploy --version v1.9.0
```

## Scaling Considerations

### Horizontal Scaling
- Cloudflare Workers automatically scale
- No configuration needed
- Pay per request

### Durable Objects
- One DO instance per session
- Automatically distributed globally
- Persistent state across requests

### Performance Optimization
1. **Capability Caching**: Cache capability results in whiteboard
2. **Evidence Deduplication**: Avoid redundant evidence entries
3. **Lazy Loading**: Load capabilities on-demand
4. **Batch Operations**: Group capability executions in waves

## Security

### 1. API Authentication

Add authentication to MCP endpoints:

```typescript
// In cloudflare-worker.ts
const authToken = request.headers.get('Authorization');
if (!authToken || !validateToken(authToken)) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 2. Rate Limiting

Implement rate limiting:

```typescript
// Use Cloudflare Rate Limiting
// Configure in wrangler.toml or dashboard
```

### 3. Input Validation

All inputs are validated with Zod schemas:
- Tool arguments
- Budget constraints
- Policy settings

### 4. PII Filtering

Enable PII filtering in policy:

```typescript
const policy = {
  pii_filter_enabled: true,
  financial_data_filter_enabled: true
};
```

## Troubleshooting

### Issue: CPU Time Exceeded

**Solution**: Reduce budget or use cheaper capabilities
```typescript
budget: {
  max_cpu_ms: 5000  // Reduce from 10000
}
```

### Issue: Memory Exceeded

**Solution**: Limit concurrent capability executions
```typescript
budget: {
  max_subrequests: 20  // Reduce from 50
}
```

### Issue: Durable Object Not Found

**Solution**: Check session ID and DO binding
```bash
wrangler tail  # View live logs
```

### Issue: Type Errors

**Solution**: Run type check and fix errors
```bash
npx tsc --noEmit
```

## Health Checks

### Endpoint: `/health`

```bash
curl https://your-worker.workers.dev/health
```

Response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "capability_system": "enabled",
  "capabilities_registered": 85,
  "uptime_ms": 123456
}
```

### Endpoint: `/metrics`

```bash
curl https://your-worker.workers.dev/metrics
```

Response:
```json
{
  "requests_total": 1234,
  "requests_success": 1200,
  "requests_error": 34,
  "avg_cpu_time_ms": 45,
  "avg_tokens_per_request": 2500
}
```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npx tsc --noEmit
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Support

For deployment issues:
1. Check [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
2. Review logs: `wrangler tail`
3. Check [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md)
4. Open an issue on GitHub

## Next Steps

After deployment:
1. ✅ Monitor performance metrics
2. ✅ Set up alerts
3. ✅ Configure rate limiting
4. ✅ Enable authentication
5. ✅ Review logs regularly
6. ✅ Plan for Phase 4: Documentation

