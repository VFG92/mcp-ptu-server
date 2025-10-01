# MCP PTU Server - Troubleshooting Guide

## Common HTTP Errors and Solutions

### 400 Bad Request: "Server not initialized"

**Causa**: Stai tentando di chiamare un tool MCP senza prima inizializzare il server.

**Soluzione**: Prima di chiamare qualsiasi tool, devi sempre:

1. Inviare una richiesta `initialize` al server
2. Attendere la risposta di successo
3. Solo dopo puoi chiamare i tools

**Esempio corretto**:

```bash
# Step 1: Initialize
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: my-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "my-client",
        "version": "1.0.0"
      }
    }
  }'

# Step 2: Call tool (dopo l'inizializzazione)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: my-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "init_parallel_reasoning",
      "arguments": {
        "session_id": "my-session-id",
        "task_description": "My task",
        "required_diversity_axes": ["data_sources", "analytical_models"],
        "min_plans": 3
      }
    }
  }'
```

---

### 406 Not Acceptable: "Client must accept both application/json and text/event-stream"

**Causa**: L'header `Accept` della richiesta non include entrambi i content types richiesti dal server MCP.

**Soluzione**: Assicurati che l'header `Accept` includa sia `application/json` che `text/event-stream`:

```bash
# ❌ SBAGLIATO
-H "Accept: application/json"

# ✅ CORRETTO
-H "Accept: application/json, text/event-stream"
```

**Perché?** Il protocollo MCP usa Server-Sent Events (SSE) per le risposte, quindi il client deve dichiarare di accettare entrambi i formati.

---

### 400 Bad Request: Errore generico di validazione

**Causa**: I parametri inviati al tool non rispettano lo schema Zod definito.

**Diagnostica**: Controlla i log del server per vedere il messaggio di errore dettagliato:

```bash
npm run workers:dev
# Oppure in produzione:
wrangler tail
```

**Soluzioni comuni**:

1. **`required_diversity_axes` deve avere almeno 2 elementi**:
   ```json
   {
     "required_diversity_axes": ["data_sources", "analytical_models"]
   }
   ```

2. **`min_plans` deve essere tra 3 e 32**:
   ```json
   {
     "min_plans": 3
   }
   ```

3. **Gli assi di diversità devono essere validi**:
   Valori permessi:
   - `data_sources`
   - `analytical_models`
   - `time_horizons`
   - `quality_metrics`
   - `risk_perspectives`
   - `stakeholder_views`

---

## Workflow Corretto per Parallel Reasoning

### 1. Inizializzazione MCP

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "my-client",
      "version": "1.0.0"
    }
  }
}
```

**Headers richiesti**:
- `Content-Type: application/json`
- `Accept: application/json, text/event-stream`
- `mcp-session-id: <your-session-id>`

---

### 2. Inizializzazione Parallel Reasoning

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "init_parallel_reasoning",
    "arguments": {
      "session_id": "my-session-id",
      "task_description": "Your task description",
      "required_diversity_axes": ["data_sources", "analytical_models"],
      "min_plans": 3
    }
  }
}
```

**Note importanti**:
- `session_id` negli arguments può essere diverso da `mcp-session-id` nell'header
- Il server usa `session_id` negli arguments per il routing al Durable Object corretto
- `mcp-session-id` nell'header è usato come fallback se `session_id` non è presente negli arguments

---

### 3. Sottomissione dei Piani

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "submit_reasoning_plan",
    "arguments": {
      "session_id": "my-session-id",
      "plan": {
        "plan_id": "plan_1",
        "description": "Plan description",
        "diversity_axes": ["data_sources", "analytical_models", "time_horizons"],
        "capability_chain": [
          "capability_1",
          "capability_2",
          "capability_3",
          "capability_4",
          "capability_5",
          "capability_6",
          "capability_7",
          "capability_8"
        ],
        "rationale": "Why this plan is different",
        "expected_outputs": ["Output 1", "Output 2"]
      }
    }
  }
}
```

**Requisiti del piano**:
- `capability_chain` deve avere tra 8 e 32 elementi
- `diversity_axes` deve includere tutti i `required_diversity_axes` della sessione
- `diversity_axes` deve avere almeno 2 assi diversi dagli altri piani già sottomessi

---

## Debugging con i Log

### Avvio del server in modalità sviluppo

```bash
npm run workers:dev
```

I log mostreranno:
- Routing delle richieste ai Durable Objects
- Validazione degli schemi Zod
- Creazione e persistenza delle sessioni
- Errori dettagliati con stack trace

### Esempio di log di successo

```
[Worker] POST /mcp - Session ID from header: my-session-id
[Worker] Found session_id candidate from body.params.arguments.session_id: my-session-id
[Worker] Using session_id from body (priority over header): my-session-id
[CallTool] Tool called: init_parallel_reasoning
[CallTool] Validation successful. Validated args: {...}
[handleInitParallelReasoning] Using manager: durable-object
[ParallelReasoningSessionManager] Session created. New sessions count: 1
[wrangler:info] POST /mcp 200 OK (57ms)
```

### Esempio di log di errore

```
[CallTool] Validation error: ZodError: [
  {
    "code": "too_small",
    "minimum": 2,
    "type": "array",
    "inclusive": true,
    "exact": false,
    "message": "Array must contain at least 2 element(s)",
    "path": ["required_diversity_axes"]
  }
]
```

---

## Test End-to-End

Usa lo script Python fornito per testare l'intero workflow:

```bash
# Avvia il server
npm run workers:dev

# In un altro terminale, esegui il test
python3 test_mcp_client.py http://localhost:8787/mcp
```

Lo script esegue:
1. ✅ Inizializzazione MCP
2. ✅ Inizializzazione Parallel Reasoning
3. ✅ Sottomissione di 3 piani con diversità
4. ✅ Esecuzione di una capability
5. ✅ Cross-plan contamination
6. ✅ Peer review
7. ✅ Mediation decision
8. ✅ Finalizzazione

---

## Checklist per Risolvere Errori 400/406

- [ ] Ho incluso l'header `Accept: application/json, text/event-stream`?
- [ ] Ho inizializzato il server MCP prima di chiamare i tools?
- [ ] Ho incluso `mcp-session-id` nell'header?
- [ ] I parametri rispettano gli schemi Zod (min/max, required fields)?
- [ ] Gli assi di diversità sono validi e in numero sufficiente?
- [ ] La `capability_chain` ha tra 8 e 32 elementi?
- [ ] Ho controllato i log del server per errori dettagliati?

---

## Risorse Aggiuntive

- **Schema completo dei tools**: Vedi `src/workers/parallel-reasoning-tools-v5.ts`
- **Esempi di test**: Vedi `test_mcp_client.py` e `__tests__/parallel-reasoning-v5.test.ts`
- **Documentazione MCP**: https://modelcontextprotocol.io
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

---

## Contatto e Supporto

Se il problema persiste dopo aver seguito questa guida:

1. Raccogli i log completi del server
2. Salva la richiesta HTTP esatta che causa l'errore
3. Verifica la versione del server: `package.json` → `version: 5.2.0`
4. Apri un issue su GitHub con i dettagli

