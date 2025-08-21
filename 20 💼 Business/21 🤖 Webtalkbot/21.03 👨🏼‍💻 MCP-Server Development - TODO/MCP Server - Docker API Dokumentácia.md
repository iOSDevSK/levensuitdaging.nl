
Kompletná dokumentácia pre volanie MCP (Model Context Protocol) servera z iného Docker kontajnera.

## 📋 Obsah

- [Prehľad architektúry](#prehľad-architektúry)
- [Dostupné servery](#dostupné-servery)
- [Naming Convention](#naming-convention)
- [OpenSubtitles API](#opensubtitles-api)
- [CoinGecko API](#coingecko-api)
- [Docker Integration](#docker-integration)
- [Troubleshooting](#troubleshooting)
- [Príklady kódu](#príklady-kódu)

---

## 🏗️ Prehľad architektúry

### Komponenty

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   MCP Manager   │    │   MCP Servers   │
│   (Docker)      │────│   Port 8999     │────│   (Subprocesses)│
│                 │    │   (FastAPI)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Komunikácia
- **Externý prístup**: `http://mcp-server:8999`
- **Manager**: FastAPI wrapper na porte 8999
- **Sub-servery**: Interné procesy s vlastnými portami
- **Protokol**: JSON-RPC 2.0 cez HTTP

---

## 🖥️ Dostupné servery

| Server | Port | Popis | Konfiguračné súbory |
|--------|------|-------|-------------------|
| **opensubtitles** | 8005 | Vyhľadávanie a sťahovanie tituliek | `opensubtitles_endpoints.json` + `opensubtitles_headers.json` |
| **coingecko** | - | Crypto dáta a ceny | `coingecko_endpoints.json` + `coingecko_headers.json` |

---

## 🏷️ Naming Convention

### Formát názvov nástrojov
```
{server_name}__{endpoint_name}
```

### Príklady
- `opensubtitles_endpoints.json` → `opensubtitles__search_subtitles`
- `coingecko_endpoints.json` → `coingecko__get_price`

### Výhody
✅ **Žiadne kolízie názvov** medzi servermi  
✅ **Jasná príslušnosť** nástroja k serveru  
✅ **Škálovateľnosť** pre ďalšie servery

---

## 🎬 OpenSubtitles API

### Dostupné nástroje

| Nástroj | Popis | HTTP Metóda |
|---------|-------|-------------|
| `opensubtitles__search_subtitles` | Vyhľadávanie tituliek | GET |
| `opensubtitles__get_languages` | Zoznam podporovaných jazykov | GET |
| `opensubtitles__download_subtitle` | Stiahnutie tituliek | POST |

### 1. Vyhľadávanie slovenských tituliek pre "Avengers"

```bash
curl -X POST http://mcp-server:8999/servers/opensubtitles/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "opensubtitles__search_subtitles",
      "arguments": {
        "params": {
          "query": "Avengers",
          "languages": "sk",
          "page": "1"
        }
      }
    }
  }'
```

**Odpoveď:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": 200,
    "data": {
      "data": [
        {
          "id": "file_id_here",
          "attributes": {
            "feature_details": {
              "movie_name": "Avengers"
            },
            "language": "Slovak",
            "release": "BluRay.x264"
          }
        }
      ]
    }
  }
}
```

### 2. Získanie podporovaných jazykov

```bash
curl -X POST http://mcp-server:8999/servers/opensubtitles/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "opensubtitles__get_languages",
      "arguments": {}
    }
  }'
```

### 3. Stiahnutie konkrétnych tituliek

```bash
curl -X POST http://mcp-server:8999/servers/opensubtitles/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "opensubtitles__download_subtitle",
      "arguments": {
        "data": {
          "file_id": "YOUR_FILE_ID_FROM_SEARCH"
        }
      }
    }
  }'
```

---

## 💰 CoinGecko API

### Dostupné nástroje

| Nástroj | Popis | Parametre |
|---------|-------|-----------|
| `coingecko__ping` | Test API dostupnosti | žiadne |
| `coingecko__get_price` | Aktuálne ceny coinov | `ids`, `vs_currencies` |
| `coingecko__get_coin_details` | Detaily konkrétneho coinu | `id` |
| `coingecko__get_trending` | Trending coins | žiadne |
| `coingecko__get_global_data` | Globálne crypto štatistiky | žiadne |

### 1. Test dostupnosti API

```bash
curl -X POST http://mcp-server:8999/servers/coingecko/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "coingecko__ping",
      "arguments": {}
    }
  }'
```

### 2. Cena Bitcoinu v USD

```bash
curl -X POST http://mcp-server:8999/servers/coingecko/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "coingecko__get_price",
      "arguments": {
        "params": {
          "ids": "bitcoin",
          "vs_currencies": "usd"
        }
      }
    }
  }'
```

**Odpoveď:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": 200,
    "data": {
      "bitcoin": {
        "usd": 67543.21
      }
    }
  }
}
```

### 3. Ceny viacerých coinov s dodatočnými dátami

```bash
curl -X POST http://mcp-server:8999/servers/coingecko/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "coingecko__get_price",
      "arguments": {
        "params": {
          "ids": "bitcoin,ethereum,solana",
          "vs_currencies": "usd,eur",
          "include_market_cap": "true",
          "include_24hr_vol": "true",
          "include_24hr_change": "true"
        }
      }
    }
  }'
```

### 4. Trending coins

```bash
curl -X POST http://mcp-server:8999/servers/coingecko/request \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "coingecko__get_trending",
      "arguments": {}
    }
  }'
```

---

## 🔧 Všeobecné endpointy

### 1. Zoznam dostupných nástrojov

```bash
curl -X POST http://mcp-server:8999/servers/{SERVER_NAME}/request \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

**Príklad pre CoinGecko:**
```bash
curl -X POST http://mcp-server:8999/servers/coingecko/request \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### 2. Status servera

```bash
curl -X GET http://mcp-server:8999/servers/{SERVER_NAME}
```

**Príklady:**
```bash
# OpenSubtitles status
curl -X GET http://mcp-server:8999/servers/opensubtitles

# CoinGecko status  
curl -X GET http://mcp-server:8999/servers/coingecko
```

### 3. Zoznam všetkých serverov

```bash
curl -X GET http://mcp-server:8999/servers
```

### 4. Manager info

```bash
curl -X GET http://mcp-server:8999/
```

---

## 🐳 Docker Integration

### Použitie z iného kontajnera

#### Docker Run
```bash
docker run --rm -it \
  --network="container:mcp-server" \
  ubuntu:latest \
  curl -X POST http://localhost:8999/servers/coingecko/request \
    -H "Content-Type: application/json" \
    -d '{"method": "tools/call", "params": {"name": "coingecko__ping", "arguments": {}}}'
```

#### Docker Compose
```yaml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - "8999:8999"
    
  client:
    image: ubuntu:latest
    depends_on:
      - mcp-server
    command: >
      bash -c "
        apt update && apt install -y curl &&
        curl -X POST http://mcp-server:8999/servers/coingecko/request
          -H 'Content-Type: application/json'
          -d '{\"method\": \"tools/call\", \"params\": {\"name\": \"coingecko__ping\", \"arguments\": {}}}'
      "
```

#### Kopírovanie súborov do kontajnera
```bash
# Kopírovanie test skriptov
docker cp test_opensubtitles_docker.py your-container:/tmp/
docker cp test_opensubtitles_curl.sh your-container:/tmp/

# Spustenie testov
docker exec your-container python3 /tmp/test_opensubtitles_docker.py
docker exec your-container bash /tmp/test_opensubtitles_curl.sh
```

---

## 🐛 Troubleshooting

### Časté problémy

#### 1. Connection refused
```
curl: (7) Failed to connect to mcp-server port 8999: Connection refused
```

**Riešenie:**
```bash
# Skontrolujte či MCP Manager beží
curl -X GET http://mcp-server:8999/

# Skontrolujte Docker network
docker network ls
docker inspect bridge
```

#### 2. Neznámy nástroj
```json
{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"❌ Neznámy nástroj: get_price"}],"isError":false}}
```

**Riešenie:** Použite správny názov s prefix-om:
- ❌ `get_price` 
- ✅ `coingecko__get_price`

#### 3. Server not found
```json
{"detail": "Server not found"}
```

**Riešenie:**
```bash
# Skontrolujte dostupné servery
curl -X GET http://mcp-server:8999/servers

# Skontrolujte status konkrétneho servera
curl -X GET http://mcp-server:8999/servers/opensubtitles
```

#### 4. Request timeout
**Riešenie:**
```bash
# Zvýšte timeout
curl --max-time 60 -X POST http://mcp-server:8999/servers/opensubtitles/request ...

# Skontrolujte logy servera
curl -X GET http://mcp-server:8999/servers/opensubtitles/logs
```

### Diagnostic príkazy

```bash
# 1. Test základného pripojenia
curl -X GET http://mcp-server:8999/

# 2. Zoznam serverov
curl -X GET http://mcp-server:8999/servers | jq .

# 3. Status konkrétneho servera
curl -X GET http://mcp-server:8999/servers/opensubtitles | jq .

# 4. Dostupné nástroje
curl -X POST http://mcp-server:8999/servers/coingecko/request \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}' | jq .

# 5. Health check
curl -X GET http://mcp-server:8999/health | jq .
```

---

## 💻 Príklady kódu

### Python

```python
import requests
import json

class MCPClient:
    def __init__(self, host="mcp-server", port=8999):
        self.base_url = f"http://{host}:{port}"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def call_tool(self, server_name, tool_name, arguments=None):
        """Volanie MCP nástroja"""
        url = f"{self.base_url}/servers/{server_name}/request"
        
        payload = {
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments or {}
            }
        }
        
        response = self.session.post(url, json=payload)
        return response.json()
    
    def get_btc_price(self):
        """Získanie ceny Bitcoinu"""
        return self.call_tool(
            "coingecko", 
            "coingecko__get_price",
            {"params": {"ids": "bitcoin", "vs_currencies": "usd"}}
        )
    
    def search_subtitles(self, movie, language="sk"):
        """Vyhľadanie tituliek"""
        return self.call_tool(
            "opensubtitles",
            "opensubtitles__search_subtitles", 
            {"params": {"query": movie, "languages": language, "page": "1"}}
        )

# Použitie
client = MCPClient()
btc_price = client.get_btc_price()
subtitles = client.search_subtitles("Avengers")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

class MCPClient {
    constructor(host = 'mcp-server', port = 8999) {
        this.baseURL = `http://${host}:${port}`;
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {'Content-Type': 'application/json'}
        });
    }
    
    async callTool(serverName, toolName, arguments = {}) {
        const response = await this.client.post(`/servers/${serverName}/request`, {
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: arguments
            }
        });
        return response.data;
    }
    
    async getBTCPrice() {
        return this.callTool('coingecko', 'coingecko__get_price', {
            params: {ids: 'bitcoin', vs_currencies: 'usd'}
        });
    }
    
    async searchSubtitles(movie, language = 'sk') {
        return this.callTool('opensubtitles', 'opensubtitles__search_subtitles', {
            params: {query: movie, languages: language, page: '1'}
        });
    }
}

// Použitie
const client = new MCPClient();
client.getBTCPrice().then(console.log);
client.searchSubtitles('Avengers').then(console.log);
```

### Bash Script

```bash
#!/bin/bash

MCP_HOST="mcp-server"
MCP_PORT="8999"
BASE_URL="http://${MCP_HOST}:${MCP_PORT}"

# Funkcia pre volanie MCP nástroja
call_mcp_tool() {
    local server_name="$1"
    local tool_name="$2"
    local arguments="$3"
    
    curl -s -X POST "${BASE_URL}/servers/${server_name}/request" \
        -H "Content-Type: application/json" \
        -d "{
            \"method\": \"tools/call\",
            \"params\": {
                \"name\": \"${tool_name}\",
                \"arguments\": ${arguments}
            }
        }"
}

# Získanie ceny BTC
get_btc_price() {
    call_mcp_tool "coingecko" "coingecko__get_price" \
        '{"params": {"ids": "bitcoin", "vs_currencies": "usd"}}'
}

# Vyhľadanie tituliek
search_subtitles() {
    local movie="$1"
    local language="${2:-sk}"
    
    call_mcp_tool "opensubtitles" "opensubtitles__search_subtitles" \
        "{\"params\": {\"query\": \"${movie}\", \"languages\": \"${language}\", \"page\": \"1\"}}"
}

# Použitie
echo "Bitcoin price:"
get_btc_price | jq '.result.data'

echo "Avengers subtitles:"
search_subtitles "Avengers" | jq '.result.data'
```

---

## 📊 Kompletný zoznam CoinGecko nástrojov

| Nástroj | Popis | Parametre |
|---------|-------|-----------|
| `coingecko__ping` | Test API | - |
| `coingecko__get_price` | Ceny coinov | `ids`, `vs_currencies`, `include_*` |
| `coingecko__get_token_price` | Ceny tokenov | `contract_addresses`, `vs_currencies` |
| `coingecko__get_supported_currencies` | Podporované meny | - |
| `coingecko__get_coins_list` | Zoznam coinov | `include_platform` |
| `coingecko__get_coins_markets` | Market dáta | `vs_currency`, `order`, `per_page` |
| `coingecko__get_coin_details` | Detail coinu | `id`, `localization`, `market_data` |
| `coingecko__get_coin_tickers` | Tickers coinu | `id`, `exchange_ids` |
| `coingecko__get_coin_history` | Historické dáta | `id`, `date` |
| `coingecko__get_coin_market_chart` | Chart dáta | `id`, `vs_currency`, `days` |
| `coingecko__get_coin_market_chart_range` | Chart v rozsahu | `id`, `vs_currency`, `from`, `to` |
| `coingecko__get_coin_ohlc` | OHLC dáta | `id`, `vs_currency`, `days` |
| `coingecko__get_trending` | Trending coins | - |
| `coingecko__get_global_data` | Globálne dáta | - |
| `coingecko__get_global_defi` | DeFi dáta | - |
| `coingecko__search` | Vyhľadávanie | `query` |
| `coingecko__get_exchanges` | Zoznam búrz | `per_page`, `page` |
| `coingecko__get_exchange_details` | Detail burzy | `id` |
| `coingecko__get_categories` | Kategórie | `order` |
| `coingecko__get_categories_list` | Zoznam kategórií | - |
| `coingecko__get_exchange_rates` | Výmenné kurzy | - |
| `coingecko__get_asset_platforms` | Asset platformy | `filter` |
| `coingecko__get_companies_holdings` | Holdings firiem | `coin_id` |

---

## 📝 Poznámky

### Bezpečnosť
- API kľúče sú uložené v `*_headers.json` súboroch
- OpenSubtitles používa API kľúč: `cLaF6JmqTi10Rge1CQ9wo79WDPKSO7lD`
- CoinGecko je verejné API bez autentifikácie

### Limity
- OpenSubtitles: závislé od API limitov
- CoinGecko: rate limiting podľa verejného API
- Manager: max 50 súbežných requestov

### Monitoring
- Logy dostupné cez `/servers/{name}/logs`
- Health check na `/health`
- Štatistiky na `/servers/{name}/stats`

---

## 📞 Kontakt a podpora

Pre problémy s MCP serverom:
1. Skontrolujte logy servera
2. Overte network connectivity  
3. Validujte JSON syntax
4. Použite diagnostic príkazy

**Verzia dokumentácie:** 1.0  
**Posledná aktualizácia:** December 2024





## Súhrn situácie

__Dosiahnutý pokrok:__ ✅ Úspešne som implementoval asyncio riešenie namiesto threading ✅ Server sa teraz spúšťa správne (PID sa prideľuje) ✅ Priama MCP komunikácia funguje perfektne (debug_communication.py ukázal 30 tools)

__Zostávajúci problém:__ ❌ Wrapper stále dostává timeout pri komunikácii s MCP serverom ❌ Server je označený ako `"initialized": false`

__Diagnostika ukázala:__

- Priama komunikácia: ✅ Funguje (initialize + tools/list + 30 tools)
- Wrapper komunikácia: ❌ Timeout po 30 sekundách

## Plán na dokončenie

Identifikoval som, že problém nie je v asyncio implementácii samotnej, ale pravdepodobne v:

1. __Inicializačnej sekvencii__ - server sa neinicializuje správne cez wrapper
2. __Message processing__ - správy sa možno nečítajú/spracovávajú správne v async prostredí
3. __Lock handling__ - možné deadlock situácie s async locks

__Ďalšie kroky:__

1. Analyzovať logy wrapper servera
2. Porovnať inicializačnú sekvenciu medzi debug_communication.py a wrapper
3. Opraviť async message processing
4. Otestovať finálne riešenie

Chcete, aby som pokračoval v riešení tohto problému? Ak áno, __toggle to__

__Act Mode (⌘⇧A)__ a ja dokončím opravu MCP komunikačnej vrstvy.
