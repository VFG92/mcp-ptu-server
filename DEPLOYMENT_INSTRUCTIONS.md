# 🚀 Istruzioni per il Deploy delle Correzioni

## 📦 Modifiche Implementate

### File Modificati:
1. ✅ `src/workers/express-adapter.ts` - Timeout aumentato da 5s a 30s
2. ✅ `src/workers/parallel-reasoning-tools.ts` - Logging e messaggi di errore migliorati
3. ✅ `src/workers/session.ts` - Logging per debug del ciclo di vita
4. ✅ `src/workers/index.ts` - Logging per routing delle richieste

### Problemi Risolti:
- ✅ **sampleLLM timeout**: Timeout aumentato a 30 secondi
- ✅ **Session not found**: Logging esteso per diagnostica
- ✅ **Error messages**: Messaggi più informativi con lista sessioni disponibili

---

## 🔧 Deploy su Cloudflare Workers

### Opzione 1: Deploy Diretto (Raccomandato)

```bash
# Assicurati di essere nella directory del progetto
cd /workspaces/mcp-ptu-server

# Deploy con wrangler
npx wrangler deploy

# Oppure usando npm script
npm run workers:deploy
```

### Opzione 2: Deploy con Autenticazione Esplicita

Se hai problemi di autenticazione:

```bash
# Login interattivo
npx wrangler login

# Poi deploy
npx wrangler deploy
```

### Opzione 3: Deploy con API Token

```bash
# Imposta le variabili d'ambiente
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Deploy
npx wrangler deploy
```

---

## 🧪 Verifica del Deploy

### 1. Verifica che il server sia online

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

### 2. Verifica Health Check

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

---

## 📊 Monitoraggio Logs in Real-Time

### Avvia il tail dei logs

```bash
# In un terminale separato
npx wrangler tail
```

Questo mostrerà tutti i logs in tempo reale, inclusi i nuovi log di debug:
- `[Worker]` - Routing delle richieste
- `[MCPSession]` - Ciclo di vita del Durable Object
- `[ParallelReasoning]` - Operazioni sulle sessioni

---

## 🧪 Test Post-Deploy

### Test 1: Tool Stateless (Dovrebbero funzionare tutti)

Da ChatGPT o con curl:

```bash
# Test echo
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {"message": "test"}
    }
  }'

# Test add
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "add",
      "arguments": {"a": 5, "b": 3}
    }
  }'
```

### Test 2: sampleLLM (Dovrebbe completare senza timeout)

```bash
curl -X POST https://mcp-server.vf-ghizzoni.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "sampleLLM",
      "arguments": {
        "prompt": "Say hello",
        "maxTokens": 50
      }
    }
  }'
```

**Nota**: Questo potrebbe ancora fallire se il client non supporta sampling, ma NON dovrebbe dare timeout.

### Test 3: Parallel Reasoning (Diagnostica)

#### Step 1: Inizializza sessione

Da ChatGPT:
```
Usa il tool parallel_reasoning_init con questi parametri:
- task: "Test session persistence"
- perspectives: ["strategy_consultant"]
- coordination_strategy: "parallel"
```

**Cosa cercare nei logs**:
```
[Worker] POST /mcp - Session ID from header: none
[Worker] Creating new DO with ID: <some-id>
[MCPSession] Constructor called for DO ID: <some-id>
[MCPSession] Loaded 0 sessions from storage
[MCPSession] POST request. Session header: null, DO ID: <some-id>, Has transport: false
[MCPSession] Initializing new session: <some-id>
[ParallelReasoning] Created session session_XXXXX. Total sessions: 1
[MCPSession] Persisting 1 sessions to storage
[MCPSession] Successfully persisted sessions
```

**Output atteso**: Session ID (es. `session_1759193023694_qtqf5ernm`)

#### Step 2: Verifica status (CRITICO)

Da ChatGPT:
```
Usa il tool parallel_compute_status con il session_id ricevuto
```

**Cosa cercare nei logs**:
```
[Worker] POST /mcp - Session ID from header: <mcp-session-id>
[Worker] Using existing DO for session: <mcp-session-id>
[MCPSession] POST request. Session header: <mcp-session-id>, DO ID: <same-id>, Has transport: true
[ParallelReasoning] Looking for session session_XXXXX. Total sessions: 1
```

**Scenari Possibili**:

✅ **SUCCESSO**: 
- Stesso DO ID in entrambe le richieste
- `Total sessions: 1` nella seconda richiesta
- Nessun errore "Session not found"

❌ **FALLIMENTO - ChatGPT non passa header**:
```
[Worker] POST /mcp - Session ID from header: none
[Worker] Creating new DO with ID: <different-id>
[MCPSession] Loaded 0 sessions from storage
[ParallelReasoning] Looking for session session_XXXXX. Total sessions: 0
ERROR: Session not found
```

❌ **FALLIMENTO - Storage non persiste**:
```
[Worker] POST /mcp - Session ID from header: <mcp-session-id>
[Worker] Using existing DO for session: <mcp-session-id>
[MCPSession] Loaded 0 sessions from storage  ← PROBLEMA QUI
[ParallelReasoning] Looking for session session_XXXXX. Total sessions: 0
ERROR: Session not found
```

---

## 🔍 Interpretazione dei Risultati

### Caso 1: Tutto Funziona ✅
- sampleLLM completa senza timeout
- parallel_compute_status trova la sessione
- Logs mostrano stesso DO ID per richieste successive

**Azione**: Nessuna, tutto risolto!

### Caso 2: sampleLLM OK, Session Not Found ❌
- sampleLLM completa
- parallel_compute_status fallisce
- Logs mostrano DO ID diversi o `Total sessions: 0`

**Causa**: ChatGPT non passa `mcp-session-id` header

**Soluzione**: Implementare meccanismo alternativo di session tracking (es. cookie, query param, o session ID nel body)

### Caso 3: Entrambi Falliscono ❌
- sampleLLM timeout
- parallel_compute_status fallisce

**Causa**: Deploy non riuscito o configurazione errata

**Azione**: Verificare output del deploy e configurazione wrangler.toml

---

## 🛠️ Troubleshooting

### Deploy Fallisce

```bash
# Verifica configurazione
npx wrangler whoami

# Verifica wrangler.toml
cat wrangler.toml

# Deploy con verbose logging
npx wrangler deploy --verbose
```

### Logs Non Visibili

```bash
# Verifica che il tail sia connesso
npx wrangler tail --format pretty

# Se non funziona, prova con account ID esplicito
npx wrangler tail --account-id=a6bc052b995103bc3ac7329151ccd785
```

### Server Non Risponde

```bash
# Verifica DNS
nslookup mcp-server.vf-ghizzoni.workers.dev

# Verifica connettività
curl -v https://mcp-server.vf-ghizzoni.workers.dev/health

# Verifica deployment status
npx wrangler deployments list
```

---

## 📝 Prossimi Passi Basati sui Risultati

### Se Session Persistence Funziona:
1. ✅ Rimuovere logging eccessivo (opzionale)
2. ✅ Documentare il comportamento corretto
3. ✅ Testare tutti i tool di parallel reasoning

### Se Session Persistence NON Funziona:
1. 🔧 Analizzare logs per identificare causa esatta
2. 🔧 Implementare soluzione alternativa:
   - Opzione A: Session ID nel body invece che nell'header
   - Opzione B: Cookie-based session tracking
   - Opzione C: Query parameter session tracking
3. 🔧 Iterare e ri-testare

---

## 📞 Supporto

Se hai bisogno di aiuto:
1. Raccogli i logs completi con `npx wrangler tail`
2. Verifica l'output del deploy
3. Condividi i risultati dei test

---

## ✅ Checklist Pre-Deploy

- [ ] Codice compilato senza errori
- [ ] Wrangler configurato correttamente
- [ ] Account Cloudflare accessibile
- [ ] Terminal pronto per `wrangler tail`

## ✅ Checklist Post-Deploy

- [ ] Server risponde su `/`
- [ ] Health check passa
- [ ] Logs visibili con `wrangler tail`
- [ ] Tool stateless funzionano (echo, add)
- [ ] sampleLLM completa (o fallisce per motivi diversi da timeout)
- [ ] parallel_reasoning_init crea sessione
- [ ] parallel_compute_status trova sessione (o logs mostrano causa del fallimento)

---

**Pronto per il deploy!** 🚀

Esegui: `npx wrangler deploy`

