
- [ ]  CORS fixed (no "*" wildcards)
- [ ]  Input length validation
- [ ]  Environment variables example
- [ ]  Global exception handling

# 🔒 **BEZPEČNOSŤ - Podrobný popis problémov**

## 1. **CORS Fixed (no "*" wildcards)**

### **Súčasný problém:**

- V `mcp_wrapper.py` máte nastavené CORS s wildcard `"*"` ktorý povoľuje prístup z akéhokoľvek webu
- Toto je bezpečnostné riziko lebo umožňuje cross-origin requesty z malicious websites
- Konkrétne máte: `allow_origins=["https://claude.ai", "https://*.claude.ai", "*"]`
- A tiež: `allow_headers=["*"]` ktorý povoľuje všetky HTTP headers

### **Prečo je to problém:**

- Akýkoľvek website môže volať vaše API endpointy
- Možnosť CSRF (Cross-Site Request Forgery) útokov
- Možnosť úniku dát cez third-party weby
- Porušuje "principle of least privilege"

### **Čo treba opraviť:**

- Odstrániť `"*"` z `allow_origins`
- Nahradiť `allow_headers=["*"]` špecifickými headers ktoré skutočne potrebujete
- Ponechať len legitímne Claude domény
- Pridať len potrebné headers ako `"Content-Type"`, `"Authorization"`, `"Mcp-Session-Id"`

### **Kde hľadať:**

- Súbor: `mcp_wrapper.py`
- Hľadajte `CORSMiddleware` alebo `add_middleware`
- Pravdepodobne okolo riadku 1200 (podľa checklistu)

---

## 2. **Input Length Validation**

### **Súčasný problém:**

- API endpointy akceptujú akúkoľvek veľkosť vstupných dát
- Žiadne limity na dĺžku stringov, JSON objektov, alebo request bodies
- Možnosť DoS útokov cez veľké payloady
- Memory exhaustion pri veľkých requestoch

### **Prečo je to problém:**

- **DoS útok:** Útočník môže poslať obrovský JSON (napr. 1GB) a crashnúť server
- **Memory leak:** Veľké stringy sa načítajú do RAM-ky a môžu vyčerpať pamäť
- **Performance degradation:** Spracovanie veľkých dát spomaľuje server pre ostatných
- **Buffer overflow risks:** V závislosti na knižniciach môže dôjsť k preťečeniu

### **Čo treba opraviť:**

- Pridať kontrolu dĺžky stringov v `handle_call_tool` funkcii
- Nastaviť rozumný limit (napr. 10KB na parameter)
- Kontrolovať pred spracovaním argumentov
- Vrátiť chybovú správu ak je input príliš dlhý

### **Kde implementovať:**

- Súbor: `concurrent_mcp_server.py`
- Funkcia: `handle_call_tool`
- Na začiatok funkcie pred spracovaním argumentov
- Kontrolovať `arguments` dictionary pre string hodnoty

---

## 3. **Environment Variables Example**

### **Súčasný problém:**

- Žiadny `.env.example` súbor pre používateľov
- API kľúče a konfigurácia sú hardcoded alebo nedokumentované
- Používatelia nevedia ako nastaviť environment variables
- Riziko že sa produkčné API kľúče dostanú do Git repozitára

### **Prečo je to problém:**

- **Security by obscurity:** Bez dokumentácie si ľudia nevšimnú že potrebujú konfigurovať security
- **Hardcoded secrets:** Ľudia môžu dať API kľúče priamo do kódu
- **Git leaks:** API kľúče môžu skončiť vo verejnom repozitári
- **Deployment issues:** Problém pri nasadzovaní na rôzne prostredia

### **Čo treba vytvoriť:**

- Súbor `.env.example` s ukážkovými hodnotami
- Dokumentovať všetky potrebné environment variables
- Ukázať formát pre rôzne typy kľúčov (OpenSubtitles, atď.)
- Pridať komentáre čo každá premenná robí

### **Kde vytvoriť:**

- Root directory projektu
- Názov súboru: `.env.example`
- Obsahovať všetky ENV vars ktoré kód používa
- Placeholder hodnoty, nie skutočné kľúče

---

## 4. **Global Exception Handling**

### **Súčasný problém:**

- Neočakávané chyby môžu crashnúť celý server
- Žiadny centrálny error handler pre unhandled exceptions
- Stack traces sa môžu ukazovať používateľom (information disclosure)
- Chyby nie sú konzistentne logované

### **Prečo je to problém:**

- **Server crashes:** Jedna neošetrená chyba môže zhodiť celý MCP wrapper
- **Information disclosure:** Stack traces môžu obsahovať citlivé informácie
- **Poor user experience:** Používatelia dostanú cryptic error messages
- **Debugging nightmare:** Bez centrálneho logovania je ťažké debugovať problémy

### **Čo treba implementovať:**

- FastAPI global exception handler pre všetky neočakávané chyby
- Konzistentné error response formáty
- Proper logging všetkých chýb do logov
- User-friendly error messages (bez stack traces)

### **Kde implementovať:**

- Súbor: `mcp_wrapper.py`
- Pridať `@app.exception_handler(Exception)` decorator
- Implementovať funkciu čo catches všetky unhandled exceptions
- Vrátiť safe JSON response s generic error message

### **Dodatočne treba skontrolovať:**

- Všetky async funkcie by mali mať try/except bloky
- Funkcia `_check_server_running` potrebuje lepšie error handling
- HTTP exceptions vs generic exceptions
- Rozlíšiť medzi 4xx (client error) vs 5xx (server error) responses


## ⚠️ **Dodatočné bezpečnostné úvahy:**

- **Rate limiting:** Zvážiť pridanie rate limitingu na API endpointy
- **Authentication:** Ak plánujete verejný deployment, pridať autentifikáciu
- **HTTPS only:** V produkcii používať len HTTPS
- **Request size limits:** FastAPI by malo mať nastavený max request size