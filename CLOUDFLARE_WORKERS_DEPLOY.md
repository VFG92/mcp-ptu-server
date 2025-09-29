# Cloudflare Workers Deployment Guide

This guide explains how to deploy the MCP Streamable HTTP Server to Cloudflare Workers with Durable Objects.

## Architecture

The server uses:
- **Hono** for HTTP routing (Workers-compatible Express alternative)
- **Durable Objects** for per-session state management
- **Streamable HTTP + SSE** for MCP protocol transport
- **Heartbeats** (every 30s) to keep SSE connections alive

## Prerequisites

1. **Cloudflare account** (free tier works)
2. **Node.js 18+** and npm
3. **Wrangler CLI** (installed via `npm install`)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally with Wrangler

```bash
npm run workers:dev
```

This starts a local development server at `http://localhost:8787` with:
- Hot reload on code changes
- Local Durable Objects simulation
- Full Workers runtime environment

### 3. Test the server

```bash
# Health check
curl http://localhost:8787/health

# Server info
curl http://localhost:8787/

# MCP initialization (POST)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# SSE stream (GET) - replace SESSION_ID with the one from init response
curl -N http://localhost:8787/mcp \
  -H "mcp-session-id: SESSION_ID"
```

## Production Deployment

### 1. Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser window for authentication.

### 2. Deploy to workers.dev

```bash
npm run workers:deploy
```

This deploys your Worker to `https://mcp-server.<your-subdomain>.workers.dev`.

### 3. Get your public URL

After deployment, Wrangler outputs your public URL:

```
Published mcp-server (X.XX sec)
  https://mcp-server.<your-subdomain>.workers.dev
```

### 4. Test the production deployment

```bash
# Replace with your actual workers.dev URL
export MCP_URL="https://mcp-server.<your-subdomain>.workers.dev"

# Health check
curl $MCP_URL/health

# MCP initialization
curl -X POST $MCP_URL/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

## ChatGPT Integration

### 1. Copy your workers.dev URL

Example: `https://mcp-server.your-subdomain.workers.dev`

### 2. Add to ChatGPT Connectors

1. Go to ChatGPT Settings → Connectors
2. Click "Add Connector"
3. Paste your workers.dev URL
4. Save

### 3. Test in ChatGPT

Ask ChatGPT to:
- List available tools
- Call the `echo` tool
- Run a `long_running_operation` (to test progress notifications)

## Monitoring and Logs

### View real-time logs

```bash
npm run workers:tail
```

This streams logs from your deployed Worker in real-time.

### View logs in dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Click on your `mcp-server` Worker
4. View logs, metrics, and analytics

## Limits (Free Plan)

- **100,000 requests/day** across all Workers
- **10ms CPU time** per request (I/O doesn't count)
- **6 simultaneous connections** per request (SSE counts as 1)
- **3 MB compressed** bundle size
- **Durable Objects**: Included on free plan with limits

## Troubleshooting

### "Module not found" errors

Make sure all imports use `.js` extensions:
```typescript
import { createServer } from './everything-workers.js';
```

### "CPU time limit exceeded"

The free plan has a 10ms CPU limit. Our orchestrator model should stay well under this because:
- Most time is spent waiting for external APIs (doesn't count)
- SSE streaming is I/O (doesn't count)
- Only coordination logic uses CPU

### "Too many subrequests"

Free plan allows 50 subrequests/request. For fan-out to >50 agents:
- Batch requests
- Use multiple invocations
- Upgrade to Paid plan (1,000 subrequests)

### SSE connection drops

Make sure heartbeats are working (every 30s). Check logs:
```bash
npm run workers:tail
```

## Upgrading to Paid Plan

If you exceed free tier limits:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages → Plans
3. Upgrade to Workers Paid ($5/month)

**Paid plan benefits**:
- Unlimited requests
- No CPU time limit (for standard Workers)
- 1,000 subrequests/request
- More Durable Objects capacity

## Custom Domain (Optional)

To use a custom domain instead of workers.dev:

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "mcp.yourdomain.com", custom_domain = true }
   ]
   ```
3. Deploy: `npm run workers:deploy`

## Next Steps

- Monitor usage in Cloudflare Dashboard
- Set up alerts for errors/limits
- Test with real ChatGPT workloads
- Scale to Paid plan if needed

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [MCP Protocol Docs](https://modelcontextprotocol.io/)

