# 🔧 ChatGPT Connection Troubleshooting

## ⚠️ Problema: ChatGPT non riesce a connettersi al server MCP

---

## ✅ Step 1: Deploy delle Modifiche CORS

Le modifiche CORS sono state committate ma **NON ancora deployate** in production.

### Deploy Manuale

```bash
# Opzione A: Con API Token
export CLOUDFLARE_API_TOKEN="your-token-here"
export CLOUDFLARE_ACCOUNT_ID="a6bc052b995103bc3ac7329151ccd785"
npm run workers:deploy

# Opzione B: Con wrangler login
npx wrangler login
npm run workers:deploy
```

### Verifica Deploy

```bash
# Test CORS headers
curl -v -X OPTIONS https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Origin: https://chatgpt.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>&1 | grep -i "access-control"

# Dovresti vedere:
# < access-control-allow-origin: *
# < access-control-allow-methods: GET, POST, DELETE, OPTIONS, PUT, PATCH
# < access-control-allow-headers: Content-Type, Accept, Authorization, ...
```

---

## ✅ Step 2: Configurazione ChatGPT

### Formato Corretto

Prova **entrambe** queste configurazioni:

**Opzione A - URL con /mcp**:
```json
{
  "mcpServers": {
    "parallel-reasoning": {
      "url": "https://mcp-server.vf-ghizzoni.workers.dev/mcp",
      "transport": "streamable-http"
    }
  }
}
```

**Opzione B - URL base**:
```json
{
  "mcpServers": {
    "parallel-reasoning": {
      "url": "https://mcp-server.vf-ghizzoni.workers.dev",
      "transport": "streamable-http"
    }
  }
}
```

**Opzione C - Con endpoint esplicito**:
```json
{
  "mcpServers": {
    "parallel-reasoning": {
      "url": "https://mcp-server.vf-ghizzoni.workers.dev",
      "endpoint": "/mcp",
      "transport": "streamable-http"
    }
  }
}
```

---

## ✅ Step 3: Verifica Server Funzionante

### Test 1: Server Online

```bash
curl https://mcp-server.vf-ghizzoni.workers.dev/
```

**Output atteso**:
```json
{
  "name": "MCP Streamable HTTP Server (Cloudflare Workers)",
  "version": "0.7.0",
  "protocol": "Model Context Protocol",
  "transport": "Streamable HTTP with SSE",
  "runtime": "Cloudflare Workers + Durable Objects",
  "endpoints": {
    "mcp": "POST /mcp",
    "stream": "GET /mcp",
    "health": "GET /health"
  },
  "documentation": "https://modelcontextprotocol.io"
}
```

### Test 2: Health Check

```bash
curl https://mcp-server.vf-ghizzoni.workers.dev/health
```

**Output atteso**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T...",
  "runtime": "Cloudflare Workers"
}
```

### Test 3: MCP Initialize

```bash
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test",
        "version": "1.0"
      }
    }
  }'
```

**Output atteso**: SSE stream con `event: message` e `data: {...}`

---

## ✅ Step 4: Possibili Errori e Soluzioni

### Errore: "Connection refused" o "Network error"

**Causa**: Server non raggiungibile o CORS bloccato

**Soluzione**:
1. Verifica che il server sia online (Test 1)
2. Verifica che le modifiche CORS siano deployate
3. Controlla i CORS headers (comando sopra)

### Errore: "Invalid protocol version"

**Causa**: ChatGPT usa una versione MCP diversa

**Soluzione**:
- Il server supporta MCP 2024-11-05
- ChatGPT potrebbe richiedere una versione diversa
- Controlla la documentazione ChatGPT per la versione richiesta

### Errore: "Server not found" o "404"

**Causa**: URL errato nella configurazione

**Soluzione**:
- Usa esattamente: `https://mcp-server.vf-ghizzoni.workers.dev/mcp`
- Oppure: `https://mcp-server.vf-ghizzoni.workers.dev` (senza /mcp)
- Verifica che non ci siano spazi o caratteri extra

### Errore: "Timeout" o "No response"

**Causa**: Server lento o problema di rete

**Soluzione**:
1. Testa con curl (Test 3)
2. Verifica Cloudflare Workers dashboard per errori
3. Controlla i logs: https://dash.cloudflare.com → Workers → mcp-server → Logs

---

## ✅ Step 5: Verifica Cloudflare Workers

### Dashboard Cloudflare

1. Vai a: https://dash.cloudflare.com
2. Workers & Pages → mcp-server
3. Controlla:
   - ✅ Status: Active
   - ✅ Last deployed: Data recente
   - ✅ Requests: Dovrebbero aumentare quando testi

### Logs in Real-Time

```bash
npx wrangler tail --env=""
```

Poi prova a connetterti da ChatGPT e guarda i logs.

---

## ✅ Step 6: Alternative se ChatGPT non Funziona

### Opzione A: Usa Claude Desktop

Claude Desktop supporta MCP nativamente:

1. Installa Claude Desktop
2. Configura in `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "parallel-reasoning": {
      "command": "node",
      "args": ["-e", "require('http').request('https://mcp-server.vf-ghizzoni.workers.dev/mcp', {method: 'POST'})"]
    }
  }
}
```

### Opzione B: Usa MCP Inspector

```bash
npx @modelcontextprotocol/inspector https://mcp-server.vf-ghizzoni.workers.dev/mcp
```

### Opzione C: Test con curl

Puoi testare manualmente tutti i tool con curl:

```bash
# 1. Initialize
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# 2. List tools
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 3. Call tool
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_agent_personas","arguments":{}}}'
```

---

## ✅ Step 7: Informazioni per il Supporto

Se il problema persiste, raccogli queste informazioni:

### Informazioni Server

```bash
# Server info
curl https://mcp-server.vf-ghizzoni.workers.dev/

# CORS headers
curl -v -X OPTIONS https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Origin: https://chatgpt.com" 2>&1 | grep -i "access-control"

# MCP initialize
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

### Informazioni ChatGPT

- Versione ChatGPT (Plus, Pro, etc.)
- Browser usato
- Messaggio di errore esatto
- Screenshot della configurazione MCP

### Cloudflare Workers Logs

```bash
npx wrangler tail --env=""
```

Copia i logs quando provi a connetterti.

---

## 📋 Checklist Completa

Prima di contattare il supporto, verifica:

- [ ] Ho deployato le modifiche CORS (`npm run workers:deploy`)
- [ ] Il server risponde a `curl https://mcp-server.vf-ghizzoni.workers.dev/`
- [ ] Il server risponde a `curl https://mcp-server.vf-ghizzoni.workers.dev/health`
- [ ] Il server risponde a MCP initialize (Test 3)
- [ ] I CORS headers sono corretti (comando sopra)
- [ ] Ho provato entrambi i formati URL (con e senza /mcp)
- [ ] Ho controllato i logs di Cloudflare Workers
- [ ] Ho provato con curl e funziona
- [ ] Ho verificato che ChatGPT Developer Mode supporti MCP

---

## 🎯 Prossimi Passi

1. **Deploy le modifiche CORS** (Step 1)
2. **Verifica che il server funzioni** (Step 3)
3. **Prova la configurazione ChatGPT** (Step 2)
4. **Se non funziona, usa alternative** (Step 6)

---

## 📞 Supporto

- **GitHub Issues**: https://github.com/VFG92/mcp-ptu-server/issues
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **MCP Protocol Docs**: https://modelcontextprotocol.io/

---

**Nota**: Le modifiche CORS sono state committate ma **richiedono deploy** per essere attive in production!

```bash
npm run workers:deploy
```

