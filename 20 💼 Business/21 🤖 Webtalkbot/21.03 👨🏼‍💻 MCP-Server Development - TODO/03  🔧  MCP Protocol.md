
- [ ]  Protocol version 2025-03-26
- [ ]  Discovery endpoint updated
- [ ]  Initialize flow implemented
- [ ]  Tools/call proxy working


# 🔧 **MCP PROTOCOL COMPLIANCE - Podrobný popis problémov**

## 1. **Protocol version 2025-03-26**

### **Súčasný problém:**

- Server pravdepodobne implementuje staršiu verziu MCP protokolu alebo žiadnu konkrétnu verziu
- Chýba deklarácia protocol version v responses a capabilities
- Claude Desktop v najnovších verziách môže očakávať konkrétnu verziu protokolu
- Bez správnej verzie môže dôjsť k compatibility issues alebo odmietnutiu connection

### **Prečo je to problém:**

- **Version negotiation:** Klienti potrebujú vedieť akú verziu protokolu server podporuje
- **Feature compatibility:** Rôzne verzie majú rôzne capabilities a API endpointy
- **Future-proofing:** Nové verzie Claude Desktop môžu vyžadovať minimum protocol version
- **Specification compliance:** MCP spec 2025-03-26 má konkrétne requirements na message formats

### **Čo treba aktualizovať:**

- **Initialize response:** Musí obsahovať `"protocolVersion": "2025-03-26"`
- **Server info:** Deklarovať supported protocol version v server metadata
- **Capabilities object:** Musí byť v formáte ako vyžaduje 2025-03-26 spec
- **Message formats:** Všetky JSON-RPC messages musia byť compliant s novou verziou

### **Kde aktualizovať:**

- Initialize response handler v `/mcp` endpointe
- Server discovery responses
- Capabilities declarations
- Všetky protocol-level komunikácie

---

## 2. **Discovery endpoint updated**

### **Súčasný problém:**

- Discovery endpoint `/.well-known/mcp` môže mať zastaralú štruktúru
- Chýbajú informácie vyžadované v MCP 2025-03-26 specification
- Nesprávny endpoint môže zabrániť Claude Desktop nájsť váš server
- Discovery response neodráža aktuálne capabilities vašeho servera

### **Prečo je to problém:**

- **Auto-discovery:** Claude Desktop používa discovery endpoint na automatické detekcie MCP serverov
- **Capability advertisement:** Klienti potrebujú vedieť čo server podporuje pred pripojením
- **Routing information:** Discovery musí obsahovať správne URLs pre hlavné endpointy
- **Service metadata:** Chýbajúce alebo nesprávne metadata môžu spôsobiť connection failures

### **Čo treba aktualizovať:**

- **Protocol version:** Musí ukazovať "2025-03-26"
- **Endpoint URLs:** Správne cesty k hlavnému `/mcp` endpointu
- **Transport types:** Deklarovať podporu pre "streamable-http" transport
- **Capabilities overview:** High-level informácie o tom čo server podporuje
- **Server list:** Ak spravujete multiple sub-servers, musia byť všetky listed

### **Kde aktualizovať:**

- Endpoint `/.well-known/mcp` response structure
- Metadata o serveroch a ich capabilities
- Transport method declarations
- URL routing informácie

---

## 3. **Initialize flow implemented**

### **Súčasný problém:**

- Chýba proper MCP initialization handshake
- Server pravdepodobne nepočíta s initialization protocol
- Bez proper initialize flow Claude Desktop nebude vedieť establišovať stable connections
- Session management nie je tied k initialization process

### **Prečo je to problém:**

- **Connection establishment:** MCP protocol vyžaduje initialization handshake pred akýmkoľvek work
- **Capability negotiation:** Initialize process je kde sa dohodne čo klient a server podporujú
- **Session setup:** Initialize vytvára session context pre všetku následujúcu komunikáciu
- **Error prevention:** Bez proper initialization môžu násť unexpected errors pri tool calls

### **Čo treba implementovať:**

- **Initialize request handling:** Spracovanie `"method": "initialize"` JSON-RPC calls
- **Capability negotiation:** Server musí porovnať client capabilities s vlastnými
- **Session creation:** Pri initialize vytvoriť session a vrátiť session ID
- **Response format:** Initialize response musí obsahovať server capabilities a protocol version
- **State management:** Server musí pamätať že klient je initialized pred prijímaním tool calls

### **Implementačné detaily:**

- Initialize musí byť prvý request ktorý klient pošle
- Server odmietne tool calls ak klient nie je initialized
- Initialize response obsahuje complete server capabilities
- Error handling pre malformed initialize requests

---

## 4. **Tools/call proxy working**

### **Súčasný problém:**

- Proxy mechanizmus medzi MCP wrapper a individual servermi nemusí byť MCP-compliant
- Tool discovery cez multiple servery môže byť broken alebo incomplete
- Tool execution proxy môže mať nesprávny message format
- Chýba proper error propagation z underlying serverov

### **Prečo je to problém:**

- **Tool visibility:** Claude Desktop musí vedieť všetky dostupné tools cez jeden endpoint
- **Execution routing:** Tool calls musia byť correctly routed na správny underlying server
- **Response format:** Tool responses musia byť v MCP-compliant formáte
- **Error handling:** Errors z underlying serverov musia byť properly wrapped a forwarded

### **Čo treba opraviť:**

#### **Tools/list functionality:**

- **Aggregation:** Zbierať tools zo všetkých running sub-serverov
- **Deduplication:** Handling ak multiple servery majú tools s rovnakým názvom
- **Format compliance:** Tool descriptions musia byť v MCP 2025-03-26 formáte
- **Dynamic updates:** Tools list sa môže meniť ako servery štartujú/stopujú

#### **Tools/call functionality:**

- **Server resolution:** Automaticky určiť ktorý server má daný tool
- **Request forwarding:** Proxy tool call request na správny server
- **Response wrapping:** Wrap server response do MCP-compliant format
- **Error propagation:** Forward errors z underlying serverov properly

#### **Proxy architecture:**

- **Connection pooling:** Efektívne connection management k sub-serverom
- **Load balancing:** Ak máte multiple instances rovnakého servera
- **Health checking:** Neposielať requesty na dead/unhealthy servery
- **Timeout handling:** Proper timeouts a cleanup pre hanging requests

### **Implementačné challenges:**

#### **Tool naming conflicts:**

- Čo ak 2 servery majú tool s rovnakým názvom?
- Namespace servery alebo reject duplicates?
- Priority system pre conflicting tools?

#### **Server discovery:**

- Ako automaticky detekovať nové tools keď server štartuje?
- Caching mechanizmus pre tool metadata?
- Real-time updates vs periodic refresh?

#### **Error scenarios:**

- Server crash during tool execution
- Network timeout pri communication s serverom
- Invalid tool parameters forwarding
- Partial failures v multi-server environment

---

## 🎯 **Architektúrne considerations:**

### **Protocol layer separation:**

```
Claude Desktop → MCP Protocol → Wrapper Logic → Individual Servers
```

### **Message flow:**

1. **Discovery:** Claude Desktop asks "what tools do you have?"
2. **Aggregation:** Wrapper queries all sub-servers for their tools
3. **Response:** Wrapper returns unified tools list
4. **Tool call:** Claude Desktop calls specific tool
5. **Routing:** Wrapper determines which server owns the tool
6. **Execution:** Wrapper forwards call to correct server
7. **Response:** Wrapper forwards server response back to Claude

### **State management:**

- **Session state:** Per-client session tracking
- **Server state:** Which servers are running and healthy
- **Tool state:** Current tool availability across all servers
- **Connection state:** Active connections to sub-servers

---

## ⚠️ **Kritické implementačné body:**

### **Backward compatibility:**

- Zachovať existujúce custom endpointy ako fallback
- Graceful degradation ak MCP protocol calls failujú
- Support pre legacy tool calling mechanisms

### **Performance optimization:**

- **Caching:** Tool metadata caching pre frequent requests
- **Connection reuse:** Persistent connections k sub-serverom
- **Async processing:** Non-blocking tool execution
- **Batch operations:** Group multiple tool calls ak je možné

### **Error resilience:**

- **Circuit breakers:** Stop calling failed servers temporarily
- **Retry logic:** Automatic retries pre transient failures
- **Fallback mechanisms:** Alternative servers pre same functionality
- **Graceful degradation:** Partial functionality ak niektoré servery failed

## 📋 **Priorita implementácie:**

1. **Initialize flow** - Fundamental requirement pre akúkoľvek MCP communication
2. **Protocol version** - Musí byť správne nastavené pre compatibility
3. **Tools/call proxy** - Core functionality ktorú klienti očakávajú
4. **Discovery endpoint** - Pomáha s auto-discovery ale nie kritické pre manual setup
