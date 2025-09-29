# 🚀 Deploy MCP Server su Railway

Guida completa per deployare il server MCP Streamable HTTP su Railway.app e collegarlo a ChatGPT.

---

## 📋 Prerequisiti

- Account GitHub (gratuito)
- Account Railway.app (gratuito - 500h/mese)
- Account ChatGPT con accesso a Developer Mode

---

## 🎯 Obiettivo

Ottenere un **orchestratore multi-agente MCP** accessibile da ChatGPT via URL pubblico HTTPS:
- ✅ Parallel real-time compute
- ✅ Fan-out/fan-in di agenti
- ✅ Streamable HTTP con SSE
- ✅ 100% gratuito

---

## 📦 Fase 1: Preparazione Repository (GIÀ FATTO ✅)

Il progetto è già configurato con:
- ✅ `Dockerfile` - Build ottimizzato per Railway
- ✅ `railway.json` - Configurazione automatica
- ✅ `src/everything/streamableHttp.ts` - Server MCP con health check
- ✅ Endpoint `/health` per monitoring

---

## 🚂 Fase 2: Deploy su Railway (5 minuti)

### Step 1: Accedi a Railway

1. Vai su **[railway.app](https://railway.app)**
2. Click su **"Login"** → **"Login with GitHub"**
3. Autorizza Railway ad accedere al tuo account GitHub

### Step 2: Crea nuovo progetto

1. Click su **"New Project"**
2. Seleziona **"Deploy from GitHub repo"**
3. Cerca e seleziona questo repository: `mcp-ptu-server`
4. Railway rileverà automaticamente il `Dockerfile`

### Step 3: Configura variabili d'ambiente (opzionale)

Nel dashboard Railway, vai su **Variables** e aggiungi (se necessario):

```
NODE_ENV=production
PORT=3000
```

> **Nota**: Railway imposta automaticamente `PORT`, quindi non è strettamente necessario.

### Step 4: Deploy automatico

1. Railway inizierà automaticamente il build
2. Attendi 2-3 minuti per il completamento
3. Una volta completato, vedrai **"Deployed"** con un ✅ verde

### Step 5: Ottieni URL pubblico

1. Nel dashboard del progetto, click su **"Settings"**
2. Scorri fino a **"Networking"**
3. Click su **"Generate Domain"**
4. Railway genererà un URL tipo: `https://mcp-ptu-server-production-xxxx.up.railway.app`

**🎉 Copia questo URL - ti servirà per ChatGPT!**

---

## 🧪 Fase 3: Verifica funzionamento (2 minuti)

### Test 1: Health Check

Apri il browser e vai a:
```
https://<tuo-url>.up.railway.app/health
```

Dovresti vedere:
```json
{
  "status": "ok",
  "timestamp": "2025-09-29T...",
  "activeSessions": 0
}
```

### Test 2: Server Info

Vai a:
```
https://<tuo-url>.up.railway.app/
```

Dovresti vedere:
```json
{
  "name": "MCP Streamable HTTP Server",
  "version": "0.6.2",
  "protocol": "Model Context Protocol",
  "transport": "Streamable HTTP with SSE",
  "endpoints": {
    "mcp": "POST /mcp",
    "stream": "GET /mcp/stream",
    "health": "GET /health"
  }
}
```

### Test 3: MCP Endpoint (con curl)

```bash
curl -X POST https://<tuo-url>.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

Dovresti ricevere una risposta JSON-RPC con le capabilities del server.

---

## 💬 Fase 4: Collegamento a ChatGPT (3 minuti)

### Step 1: Abilita Developer Mode

1. Apri **ChatGPT**
2. Click su **Settings** (icona ingranaggio)
3. Vai su **Connectors**
4. Abilita **"Developer mode"**

### Step 2: Aggiungi Remote MCP Server

1. In **Connectors**, click su **"Add remote MCP server"**
2. Compila i campi:
   - **Name**: `MCP Multi-Agent Orchestrator`
   - **URL**: `https://<tuo-url>.up.railway.app/mcp`
   - **Authentication**: Lascia vuoto (per ora)
3. Click su **"Add"**

### Step 3: Verifica discovery tools

1. Apri una **nuova conversazione** in ChatGPT
2. Attiva **Developer Mode** (icona in alto)
3. Dovresti vedere i tools del server MCP nella lista

### Step 4: Test funzionale

Prova un comando tipo:
```
Usa il tool "echo" per ripetere "Hello from Railway!"
```

ChatGPT dovrebbe invocare il tool MCP e mostrarti il risultato.

---

## 🎨 Fase 5: Orchestrazione Multi-Agente (avanzato)

Il server è già configurato per supportare orchestrazione. Per implementare fan-out/fan-in:

### Esempio: Tool "orchestrate"

Modifica `src/everything/everything.ts` per aggiungere un tool che:
1. Riceve una richiesta
2. La invia a 3 agenti in parallelo (es: OpenAI, Anthropic, Gemini)
3. Raccoglie le risposte
4. Applica logica di consensus
5. Restituisce il risultato unificato

```typescript
// Esempio pseudo-codice
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "orchestrate") {
    const task = request.params.arguments.task;
    
    // Fan-out
    const [resultA, resultB, resultC] = await Promise.all([
      callAgentA(task),
      callAgentB(task),
      callAgentC(task)
    ]);
    
    // Fan-in
    const consensus = selectBest([resultA, resultB, resultC]);
    
    return {
      content: [{ type: "text", text: JSON.stringify(consensus) }]
    };
  }
});
```

---

## 📊 Monitoring e Logs

### Visualizza logs in tempo reale

1. Nel dashboard Railway, click sul tuo progetto
2. Vai su **"Deployments"**
3. Click sull'ultimo deployment
4. Vedrai i logs in tempo reale

### Metriche utili

Railway mostra automaticamente:
- ✅ CPU usage
- ✅ Memory usage
- ✅ Network traffic
- ✅ Request count

---

## 🔧 Troubleshooting

### Problema: "Service Unavailable"

**Causa**: Il server non è ancora pronto o è crashato.

**Soluzione**:
1. Controlla i logs in Railway
2. Verifica che il health check risponda
3. Riavvia il deployment se necessario

### Problema: ChatGPT non vede i tools

**Causa**: URL MCP non corretto o server non risponde.

**Soluzione**:
1. Verifica che l'URL finisca con `/mcp`
2. Testa l'endpoint con curl (vedi Fase 3)
3. Controlla che il server sia "Deployed" in Railway

### Problema: "CPU limit exceeded"

**Causa**: Orchestrazione troppo pesante per il free tier.

**Soluzione**:
1. Ottimizza la logica di fan-out/fan-in
2. Usa agenti esterni (API) invece di compute locale
3. Considera upgrade a Railway Pro (5$/mese)

---

## 💰 Costi e Limiti

### Railway Free Tier

- ✅ **500 ore/mese** (~16h/giorno)
- ✅ **CPU illimitato** (durante esecuzione)
- ✅ **512 MB RAM**
- ✅ **1 GB storage**
- ✅ **100 GB bandwidth/mese**

**Sufficiente per**:
- ✅ Sviluppo e test
- ✅ Demo e proof-of-concept
- ✅ Uso personale intensivo

**NON sufficiente per**:
- ❌ Produzione 24/7
- ❌ High traffic (>1000 req/giorno)

---

## 🚀 Prossimi passi

1. ✅ **Deploy completato** - Hai un URL pubblico
2. ✅ **ChatGPT collegato** - Puoi invocare tools MCP
3. 🔄 **Implementa orchestrazione** - Aggiungi logica multi-agente
4. 🔄 **Aggiungi autenticazione** - Proteggi l'endpoint con API key
5. 🔄 **Monitoring avanzato** - Integra Sentry o Datadog

---

## 📚 Risorse

- [Railway Docs](https://docs.railway.app)
- [MCP Specification](https://modelcontextprotocol.io)
- [Streamable HTTP Transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [ChatGPT Connectors](https://platform.openai.com/docs/guides/developer-mode)

---

## ✅ Checklist finale

- [ ] Repository pushato su GitHub
- [ ] Progetto creato su Railway
- [ ] Deploy completato con successo
- [ ] URL pubblico generato
- [ ] Health check risponde (200 OK)
- [ ] Server info endpoint funziona
- [ ] MCP endpoint testato con curl
- [ ] ChatGPT Connector aggiunto
- [ ] Tools visibili in ChatGPT
- [ ] Test funzionale completato

**🎉 Congratulazioni! Il tuo orchestratore MCP è online!**

