# 🔍 Debug Guide: register_execution_results Error

## Problema Attuale

La richiesta `register_execution_results` viene inviata ma **non viene processata dal Durable Object**. 

Dai log precedenti:
1. ✅ Worker estrae session_id dal token correttamente
2. ✅ Worker trova il mapping nel registry
3. ✅ Worker route al DO corretto
4. ✅ DO viene ricreato e carica la sessione da storage
5. ✅ Transport viene auto-inizializzato
6. ❌ **MA la richiesta non arriva mai al metodo `handlePost` del DO**

## Fix Implementate

### 1. Logging Dettagliato nel metodo `fetch()` del DO

**File**: `src/workers/session.ts` (linee 85-106)

Aggiunto logging per tracciare OGNI richiesta che arriva al DO:

```typescript
async fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  
  // CRITICAL LOGGING: Log every request that arrives at the DO
  const sessionHeader = request.headers.get('mcp-session-id');
  console.log(`[MCPSession] fetch() called: ${method} ${pathname}, session header: ${sessionHeader}, DO ID: ${this.sessionId}`);

  // Handle POST requests (initialization and tool calls)
  if (method === 'POST') {
    console.log(`[MCPSession] Routing to handlePost for ${pathname}`);
    return this.handlePost(request);
  }
  // ...
}
```

### 2. Auto-inizializzazione Transport Anticipata

**File**: `src/workers/session.ts` (linee 235-277)

Quando viene rilevato un header mismatch (ChatGPT usa una nuova connessione), il transport viene auto-inizializzato **IMMEDIATAMENTE** prima di processare la richiesta.

### 3. Reset Sessione con `init_parallel_reasoning`

**File**: `src/workers/parallel-reasoning-mcp.ts` (linee 492-526)

`initSession` ora **sempre resetta** una sessione esistente per permettere a ChatGPT di iniziare un nuovo workflow.

## 📋 Istruzioni per il Deploy

### Passo 1: Deploy del Codice

Dal tuo ambiente locale con accesso a Cloudflare:

```bash
cd /path/to/mcp-ptu-server
npx wrangler deploy
```

### Passo 2: Monitorare i Log

Dopo il deploy, quando ChatGPT riprova `register_execution_results`, cerca questi log:

#### ✅ Log Attesi (SUCCESSO)

```
[Worker] Extracted session_id from execution_token: it-budget-2026-bdi-01
[Worker] ✅ Found mapping in registry: it-budget-2026-bdi-01 → 85e1758893ed9f2d...
[Worker] Routed to DO: 85e1758893ed9f2dcc228d5496dfa352f42455eb1a2538fa45a3587b5f0426b7

[MCPSession] fetch() called: POST /mcp, session header: 15011c63b76a4817..., DO ID: 85e1758893ed9f2d...  ← NUOVO LOG
[MCPSession] Routing to handlePost for /mcp  ← NUOVO LOG
[MCPSession] POST request. Session header: 15011c63b76a4817..., DO ID: 85e1758893ed9f2d...
[MCPSession] Header mismatch detected - auto-initializing transport BEFORE processing request
[MCPSession] Transport auto-initialized, transportInitialized: true
[MCPSession] Converting request to Express format
[MCPSession] Request body parsed, method: tools/call
[MCPSession] Request method: tools/call, transportInitialized: true, transport exists: true
[MCPSession] Calling transport.handleRequest for method: tools/call
[CallTool] Tool called: register_execution_results  ← QUESTO È IL LOG CRITICO!
[findSessionByExecutionToken] Searching for token: exec_it-budget-2026-bdi-01...
[findSessionByExecutionToken] Total sessions in manager: 1
[findSessionByExecutionToken] ✅ Found session: it-budget-2026-bdi-01
[Token Validation] Current time: ...
[Token Validation] Is expired? false
✅ Registration successful!
```

#### ❌ Log Problematici (ERRORE)

Se vedi questo pattern, significa che la richiesta NON arriva al DO:

```
[Worker] Extracted session_id from execution_token: it-budget-2026-bdi-01
[Worker] ✅ Found mapping in registry: it-budget-2026-bdi-01 → 85e1758893ed9f2d...
[Worker] Routed to DO: 85e1758893ed9f2dcc228d5496dfa352f42455eb1a2538fa45a3587b5f0426b7

[MCPSession] Constructor called for DO ID: 85e1758893ed9f2d...
[MCPSession] Loading 1 v5 sessions from DO storage
[MCPSession] Auto-initialized transport for session 85e1758893ed9f2d...

← MANCA IL LOG "[MCPSession] fetch() called" PER register_execution_results!
← MANCA IL LOG "[CallTool] Tool called: register_execution_results"!
```

### Passo 3: Analisi dei Log

#### Scenario A: La richiesta arriva al DO

Se vedi `[MCPSession] fetch() called` per `register_execution_results`, significa che la richiesta arriva al DO. Poi controlla:

1. **Se vedi `[MCPSession] Routing to handlePost`**: La richiesta viene instradata correttamente
2. **Se vedi `[CallTool] Tool called: register_execution_results`**: Il tool viene chiamato correttamente
3. **Se vedi errori dopo**: Il problema è nella logica del tool

#### Scenario B: La richiesta NON arriva al DO

Se **NON vedi** `[MCPSession] fetch() called` per `register_execution_results`, significa che:

1. La richiesta viene persa tra il worker e il DO
2. C'è un timeout o errore di rete
3. Il worker sta routando alla richiesta a un DO diverso

In questo caso, cerca nei log:
- Errori di timeout
- Errori di rete
- Log del worker che indicano routing a un DO diverso

## 🔧 Possibili Soluzioni Aggiuntive

### Se la richiesta non arriva al DO

Il problema potrebbe essere che **il worker sta inviando la richiesta ma il DO non la riceve** a causa di:

1. **Timeout del DO**: Il DO viene ricreato ma la richiesta arriva prima che sia pronto
2. **Race condition**: La richiesta arriva mentre il DO sta caricando lo stato da storage
3. **Problema di routing**: Il worker route a un DO diverso da quello che ha la sessione

### Soluzione: Retry Logic nel Worker

Potremmo aggiungere retry logic nel worker per riprovare la richiesta se il DO non risponde entro un timeout.

### Soluzione: Queue-based Approach

Potremmo usare una queue (Cloudflare Queue) per bufferizzare le richieste `register_execution_results` e processarle in modo asincrono.

## 📊 Metriche da Monitorare

Dopo il deploy, monitora:

1. **Latenza delle richieste**: Quanto tempo impiega `register_execution_results` a completare?
2. **Tasso di successo**: Quante richieste hanno successo vs quante falliscono?
3. **Ricreazioni DO**: Quante volte il DO viene ricreato durante una sessione?
4. **Timeout**: Ci sono timeout nelle richieste?

## 🎯 Prossimi Passi

1. **Deploy del codice** con il nuovo logging
2. **Riprova `register_execution_results`** con ChatGPT
3. **Analizza i log** seguendo questa guida
4. **Condividi i log** con me per ulteriore debugging

---

**Nota**: Questo logging aggiuntivo ci permetterà di capire ESATTAMENTE dove si perde la richiesta `register_execution_results` e implementare la fix corretta.

