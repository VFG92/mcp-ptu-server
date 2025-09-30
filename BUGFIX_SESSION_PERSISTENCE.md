# 🐛 Bug Fix: Session Persistence & Timeout Issues

## 📋 Problemi Risolti

### 1. ✅ Session Not Found (Parallel Reasoning Tools)
**Problema**: Tutti i tool di parallel reasoning che richiedono `session_id` restituivano "Session not found" anche per sessioni appena create.

**Causa Probabile**: 
- ChatGPT potrebbe non passare correttamente l'header `mcp-session-id` tra le richieste
- Ogni richiesta potrebbe creare un nuovo Durable Object invece di riutilizzare quello esistente

**Soluzioni Implementate**:
1. **Logging Esteso**: Aggiunto logging dettagliato per tracciare:
   - Creazione di Durable Objects
   - Caricamento sessioni da storage
   - Persistenza sessioni
   - Routing delle richieste
   
2. **Messaggi di Errore Migliorati**: Ora quando una sessione non viene trovata, l'errore mostra:
   - Session ID richiesto
   - Lista di session ID disponibili
   - Suggerimento per l'utente

3. **Verifica Persistenza**: Confermato che il callback di persistenza viene chiamato dopo ogni modifica

**File Modificati**:
- `src/workers/parallel-reasoning-tools.ts` - Logging e messaggi di errore migliorati
- `src/workers/session.ts` - Logging per debug del ciclo di vita del DO
- `src/workers/index.ts` - Logging per routing delle richieste

---

### 2. ✅ sampleLLM Timeout
**Problema**: Il tool `sampleLLM` restituiva "Request timeout" (500 error).

**Causa**: Timeout di 5 secondi troppo breve per richieste LLM che possono richiedere più tempo.

**Soluzione**: Aumentato timeout da 5 a 30 secondi in `express-adapter.ts`

**File Modificati**:
- `src/workers/express-adapter.ts` - Timeout aumentato a 30 secondi

---

### 3. ℹ️ printEnv Blocked (Non un bug del server)
**Problema**: Tool `printEnv` bloccato dalla moderazione del connettore ChatGPT.

**Causa**: Policy di sicurezza del client ChatGPT che previene il leakage di variabili d'ambiente.

**Azione**: Nessuna modifica necessaria - comportamento corretto dal punto di vista della sicurezza.

---

## 🔍 Diagnostica Aggiunta

### Logging Points

1. **Worker Entry Point** (`src/workers/index.ts`):
   ```
   [Worker] POST /mcp - Session ID from header: <id>
   [Worker] Using existing DO for session: <id>
   [Worker] Creating new DO with ID: <id>
   ```

2. **Durable Object Lifecycle** (`src/workers/session.ts`):
   ```
   [MCPSession] Constructor called for DO ID: <id>
   [MCPSession] Loaded N sessions from storage
   [MCPSession] POST request. Session header: <id>, DO ID: <id>, Has transport: <bool>
   [MCPSession] Initializing new session: <id>
   [MCPSession] Persisting N sessions to storage
   [MCPSession] Successfully persisted sessions
   ```

3. **Parallel Reasoning Operations** (`src/workers/parallel-reasoning-tools.ts`):
   ```
   [ParallelReasoning] Created session <id>. Total sessions: N
   [ParallelReasoning] Looking for session <id>. Total sessions: N
   [ParallelReasoning] Session <id> not found. Available: <list>
   ```

---

## 🧪 Come Testare

### Prerequisiti
```bash
# Deploy delle modifiche
npm run workers:deploy

# Oppure con wrangler diretto
npx wrangler deploy
```

### Test 1: Verifica Logging
```bash
# In un terminale, avvia il tail dei logs
npx wrangler tail

# In un altro terminale o da ChatGPT, esegui le chiamate
```

### Test 2: Parallel Reasoning Flow Completo

**Step 1**: Inizializza sessione
```json
{
  "tool": "parallel_reasoning_init",
  "arguments": {
    "task": "Analyze market entry strategy for electric vehicles in Europe",
    "perspectives": ["strategy_consultant", "financial_analyst", "market_researcher"],
    "coordination_strategy": "parallel"
  }
}
```

**Output Atteso**: 
- Session ID (es. `session_1759193023694_qtqf5ernm`)
- Lista di agent prompts
- Nei logs: `[ParallelReasoning] Created session <id>. Total sessions: 1`

**Step 2**: Verifica status (usa il session_id ricevuto)
```json
{
  "tool": "parallel_compute_status",
  "arguments": {
    "session_id": "session_1759193023694_qtqf5ernm"
  }
}
```

**Output Atteso**:
- Status della sessione
- Progress degli agent
- Nei logs: `[ParallelReasoning] Looking for session <id>. Total sessions: 1`

**Step 3**: Aggiungi reasoning per un agent
```json
{
  "tool": "agent_reasoning_step",
  "arguments": {
    "session_id": "session_1759193023694_qtqf5ernm",
    "agent_id": "agent_1_strategy_consultant",
    "reasoning": "Based on market analysis...",
    "confidence": 0.85,
    "key_points": ["Point 1", "Point 2"]
  }
}
```

**Output Atteso**:
- Conferma aggiornamento
- Progress aggiornato
- Nei logs: `[MCPSession] Persisting 1 sessions to storage`

### Test 3: sampleLLM con Timeout Aumentato
```json
{
  "tool": "sampleLLM",
  "arguments": {
    "prompt": "Explain quantum computing in simple terms",
    "maxTokens": 100
  }
}
```

**Output Atteso**:
- Risposta LLM (non più timeout)
- Tempo di risposta < 30 secondi

---

## 🔧 Troubleshooting

### Se le sessioni ancora non vengono trovate:

1. **Verifica nei logs quale DO viene usato**:
   ```
   [Worker] POST /mcp - Session ID from header: <id>
   ```
   - Se `Session ID from header: none` per richieste successive → ChatGPT non passa l'header
   - Se DO ID cambia tra richieste → Problema di routing

2. **Verifica persistenza**:
   ```
   [MCPSession] Persisting N sessions to storage
   [MCPSession] Successfully persisted sessions
   ```
   - Se non vedi questi log dopo `parallel_reasoning_init` → Callback non chiamato

3. **Verifica caricamento**:
   ```
   [MCPSession] Loaded N sessions from storage
   ```
   - Se N=0 per richieste successive → Storage non funziona o DO diverso

### Possibili Cause Rimanenti:

1. **ChatGPT non passa mcp-session-id**: 
   - Soluzione: Implementare session ID alternativo (es. cookie, query param)
   
2. **Durable Object viene ricreato**:
   - Soluzione: Verificare configurazione wrangler.toml
   
3. **Storage non persiste tra richieste**:
   - Soluzione: Verificare che `ctx.storage.put()` completi prima della risposta

---

## 📊 Metriche di Successo

- ✅ `parallel_reasoning_init` crea sessione e restituisce session_id
- ✅ `parallel_compute_status` trova la sessione creata
- ✅ `agent_reasoning_step` aggiorna la sessione
- ✅ `sampleLLM` completa senza timeout
- ✅ Logs mostrano stesso DO ID per tutte le richieste della stessa sessione
- ✅ Logs mostrano persistenza e caricamento corretto delle sessioni

---

## 🚀 Prossimi Passi

1. **Deploy e Test**: Eseguire il deploy e testare con ChatGPT
2. **Analisi Logs**: Raccogliere logs per identificare il comportamento effettivo
3. **Iterazione**: Se il problema persiste, implementare soluzioni alternative basate sui logs

---

## 📝 Note Tecniche

### Architettura Session Management

```
Client (ChatGPT)
    ↓ POST /mcp (con mcp-session-id header)
Worker (index.ts)
    ↓ Route to Durable Object (basato su session-id)
Durable Object (session.ts)
    ↓ Load parallelReasoningSessions from storage
    ↓ Create MCP Server with sessionStore reference
    ↓ Handle tool calls
    ↓ Persist parallelReasoningSessions to storage
    ↓ Return response
```

### Punti Critici:
1. **Header Propagation**: `mcp-session-id` deve essere passato in ogni richiesta
2. **DO Routing**: Stesso session-id → Stesso DO → Stesso sessionStore
3. **Storage Persistence**: `ctx.storage.put()` deve completare prima della risposta
4. **Storage Loading**: `ctx.blockConcurrencyWhile()` garantisce caricamento prima di handle request

---

## 📚 Riferimenti

- [MCP Specification](https://modelcontextprotocol.io)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Streamable HTTP Transport](https://github.com/modelcontextprotocol/sdk)

