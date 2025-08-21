
- [ ]  SSE formát opravený ("data: JSON\n\n")
- [ ]  Media type opravený ("text/event-stream")
- [ ]  Štandardný `/mcp` endpoint
- [ ]  `Mcp-Session-Id` header handling


# 🚀 **TRANSPORT COMPLIANCE - Podrobný popis problémov**

## 1. **SSE formát opravený ("data: JSON\n\n")**

### **Súčasný problém:**

- Server-Sent Events (SSE) v súčasnom kóde nepoužívajú správny formát
- Pravdepodobne posielajú len plain JSON bez SSE prefixov
- Chýba správne ukončenie správ s dvojitým newline
- Nesprávny formát môže spôsobiť že Claude Desktop nebude vedieť parsovať správy

### **Prečo je to problém:**

- **SSE štandard vyžaduje:** Každá správa musí začínať s `"data: "` a končiť s `"\n\n"`
- **Browser/Client parsing:** Klienti očakávajú špecifický formát, inak ignorujú správy
- **Connection issues:** Nesprávny formát môže spôsobiť prerušenie SSE streamu
- **Protocol compliance:** Porušuje RFC 6455 pre SSE komunikáciu

### **Čo treba opraviť:**

- Všetky `yield` statements v SSE funkciách musia formátovať správy ako `f"data: {json.dumps(message)}\n\n"`
- Nie len `yield json.dumps(message)`
- Kontrolovať heartbeat správy, error messages, všetky typy odpovedí
- Overiť že sa neposielajú partial messages alebo corrupt data

### **Kde hľadať:**

- Súbor: `mcp_wrapper.py`
- Funkcie: `streamable_mcp_transport_get`, `global_streamable_endpoint`
- Všetky `async def` funkcie ktoré generujú SSE streams
- Hľadať `yield` statements a `StreamingResponse`

---

## 2. **Media type opravený ("text/event-stream")**

### **Súčasný problém:**

- SSE endpointy pravdepodobne používajú nesprávny Content-Type header
- Možno majú `"application/json"` namiesto `"text/event-stream"`
- Bez správneho media type klienti nerozpoznajú že ide o SSE stream
- Môže spôsobiť že sa connection interpretuje ako obyčajný HTTP response

### **Prečo je to problém:**

- **Client recognition:** Browsery a HTTP klienti potrebujú správny Content-Type na aktiváciu SSE režimu
- **Connection handling:** Nesprávny media type = connection sa ukončí po prvej správe
- **Streaming behavior:** Klient nebude čakať na continuous stream ale očakáva single response
- **Claude Desktop integration:** Claude Desktop môže očakávať špecifický media type pre SSE transport

### **Čo treba opraviť:**

- V `StreamingResponse` objektoch zmeniť `media_type` parameter
- Z `"application/json"` alebo iný typ na `"text/event-stream"`
- Kontrolovať všetky SSE endpointy, nielen jeden
- Overiť že sa nepoužíva `"text/plain"` alebo iný nesprávny typ

### **Kde hľadať:**

- Súbor: `mcp_wrapper.py`
- Všetky `StreamingResponse(...)` volania
- Parameter `media_type=...`
- Headers v SSE response funkcích

---

## 3. **Štandardný `/mcp` endpoint**

### **Súčasný problém:**

- Momentálne máte len legacy endpointy ako `/servers/{name}/streamable`
- Chýba hlavný `/mcp` endpoint ktorý je podľa MCP protocol specification
- Claude Desktop v novších verziách môže očakávať štandardný endpoint
- Bez štandardného endpointu nie ste compliant s MCP 2025-03-26 specification

### **Prečo je to problém:**

- **Protocol compliance:** MCP spec 2025-03-26 vyžaduje štandardný endpoint structure
- **Future compatibility:** Nové verzie Claude Desktop môžu prestať podporovať custom endpointy
- **Interoperability:** Iné MCP klienti nebudú vedieť komunikovať s vaším serverom
- **Discovery mechanism:** Bez štandardného endpointu je ťažšie auto-discovery

### **Čo treba implementovať:**

- Nový endpoint na route `/mcp` ktorý podporuje GET aj POST
- **GET `/mcp`:** SSE stream pre real-time communication
- **POST `/mcp`:** JSON-RPC komunikácia pre request/response
- Endpoint musí implementovať MCP protocol methods (initialize, tools/list, tools/call)
- Session management pre rozlíšenie medzi klientmi

### **Kde implementovať:**

- Súbor: `mcp_wrapper.py`
- Pridať pred existujúce custom endpointy
- Implementovať routing pre GET aj POST na rovnakú URL
- Integrovať s existujúcim process_manager pre proxy functionality

---

## 4. **`Mcp-Session-Id` header handling**

### **Súčasný problém:**

- Server pravdepodobne nepoužíva session management
- Chýba generovanie a validácia session ID headers
- Multiple klienti môžu interferovať jeden s druhým
- Nie je možné rozlíšiť requesty od rôznych Claude Desktop instancií

### **Prečo je to problém:**

- **Session isolation:** Bez session ID sa requesty od rôznych klientov môžu pomiešať
- **State management:** Server nevie ktorý klient poslal ktorý request
- **Protocol requirement:** MCP specification môže vyžadovať session tracking
- **Debugging nightmare:** Bez session ID je ťažké debugovať problémy s multiple clients

### **Čo treba implementovať:**

- **Session creation:** Pri initialize request vygenerovať unique session ID (UUID)
- **Header injection:** Vrátiť `Mcp-Session-Id` header v initialize response
- **Session validation:** Pri všetkých následných requestoch kontrolovať session ID
- **Session storage:** Udržiavať mapping session_id -> session_data
- **Session cleanup:** Automaticky vyčistiť expired sessions

### **Kde implementovať:**

- **Session storage:** Globálna dictionary alebo databáza pre session management
- **Initialize handler:** Generovanie session ID pri prvom requeste
- **Request validation:** Kontrola session ID v header pred spracovaním
- **Response headers:** Pridávanie session ID do response headers

---

## 🎯 **Technické detaily implementácie:**

### **Pre SSE streams:**

- Každý klient dostane unique session ID
- SSE stream musí byť asociovaný s session
- Pri disconnect treba session vyčistiť

### **Pre JSON-RPC:**

- Session ID sa pošle v HTTP header
- Server musí validovať session pred spracovaním
- Error response ak session neexistuje alebo expiroval

### **Session lifecycle:**

1. **Initialize:** Klient pošle initialize request → Server vytvorí session
2. **Communication:** Všetky requesty obsahujú session ID header
3. **Validation:** Server kontroluje session ID pred každým requestom
4. **Cleanup:** Session sa vymaže pri disconnect alebo timeout

---

## ⚠️ **Kritické body:**

### **Backward compatibility:**

- Zachovať existujúce `/servers/{name}/streamable` endpointy
- Označiť ich ako deprecated ale funkčné
- Nový `/mcp` endpoint má prioritu

### **Error handling:**

- Proper error responses pre invalid sessions
- Graceful handling connection drops
- Timeout mechanizmus pre inactive sessions

### **Performance:**

- Session storage musí byť thread-safe
- Efektívne cleanup expired sessions
- Minimálny overhead pre session lookup

## 📋 **Priorita implementácie:**

1. **SSE formát** - Najkritickejší pre súčasnú funkcionalitu
2. **Media type** - Bezprostredne potrebný pre SSE streams
3. **Štandardný endpoint** - Compliance s MCP specification
4. **Session handling** - Advanced feature, ale potrebný pre multiple clients
