
## 1. Štruktúra adresárov

```
servers/
├── {server_name}/
│   ├── {server_name}_endpoints.json    # POVINNÝ - definície API endpointov
│   ├── {server_name}_security.json     # POVINNÝ - bezpečnostné nastavenia
│   ├── {server_name}_headers.json      # NEPOVINNÝ - globálne HTTP hlavičky
│   └── {server_name}_config.json       # AUTOMATICKY - transport a režim
``` 

## 2. `{server_name}_endpoints.json` - Schéma API endpointov

### Základná štruktúra:


```json
{
  "endpoint_name": {
    "method": "HTTP_METHOD",
    "url": "FULL_URL_WITH_PLACEHOLDERS",
    "description": "Human readable description",
    "query_params": {
      "param": "value_or_placeholder"
    },
    "path_params": {
      "param": "default_value"
    },
    "headers": {
      "Header-Name": "value"
    },
    "body_template": "JSON_STRING_WITH_PLACEHOLDERS",
    "timeout": 30
  }
}
```


###  Detailný popis polí:

| Pole            | Typ    | Povinné | Popis                                          | Príklad                                           |
| --------------- | ------ | ------- | ---------------------------------------------- | ------------------------------------------------- |
| `method`        | string | ✅       | HTTP metóda                                    | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`           |
| `url`           | string | ✅       | Plná URL s možným path placeholderami          | `"https://api.example.com/users/{user_id}"`       |
| `description`   | string | ❌       | Ľudsky čitateľný popis endpointu               | `"Search for subtitles by title"`                 |
| `query_params`  | object | ❌       | Query parametre (?param=value) Default hodnoty | {"q": "{search_term}", "limit": "10"}             |
| `path_params`   | object | ❌       | Pre path parametre                             | `{"user_id": "123", "version": "v1"}`             |
| `headers`       | object | ❌       | HTTP hlavičky špecifické pre endpoint          | `{"Content-Type": "application/json"}`            |
| `body_template` | string | ❌       | JSON template pre POST/PUT/PATCH               | `"{\"query\": \"{search}\", \"limit\": {count}}"` |
| `timeout`       | number | ❌       | Timeout v sekundách (default: 30)              | `15, 60`                                          |


## 3. Systém placeholderov

### 3.1 Path Placeholders (v URL)
### **Formát:** `{placeholder_name}` **Použitie:** Nahrádzajú časti URL

### Príklad:

```json
{
  "get_user": {
    "url": "https://api.example.com/users/{user_id}/posts/{post_id}",
    "path_params": {
      "user_id": "default_user",
      "post_id": "1"
    }
  }
}
```

Ako to funguje:

 - URL : `https://api.example.com/users/{user_id}/posts/{post_id}`
- Volanie: `params = {"user_id": "john", "post_id": "42"}`
- Výsledok:  `https://api.example.com/users/john/posts/42`

### 3.2 Query Placeholders (v query_params)

####  Formát:** `{placeholder_name}` **Použitie:** Dynamické query parametre

### OpenSubtitles príklad:

```json
{
  "search_subtitles": {
    "url": "https://api.opensubtitles.com/api/v1/subtitles",
    "query_params": {
      "query": "{query}",        // Placeholder - bude nahradený
      "languages": "{languages}", // Placeholder - bude nahradený  
      "page": "{page}"           // Placeholder - bude nahradený
    }
  }
}
```

### Volanie:  

pythonparams = {
    "query": "Avatar",
    "languages": "en,sk", 
    "page": "1"
}

### Výsledná URL:

`https://api.opensubtitles.com/api/v1/subtitles?query=Avatar&languages=en,sk&page=1`

## 3.3 Statické vs Dynamické hodnoty 

#### CoinGecko príklad - mix statických a dynamických:

```json
{
  "get_price": {
    "url": "https://api.coingecko.com/api/v3/simple/price",
    "query_params": {
      "ids": "bitcoin,ethereum,solana",           // STATICKÁ hodnota - vždy rovnaká
      "vs_currencies": "usd,eur",                 // STATICKÁ hodnota
      "include_market_cap": "true",               // STATICKÁ hodnota
      "include_24hr_vol": "true",                 // STATICKÁ hodnota
      "include_24hr_change": "true",              // STATICKÁ hodnota
      "include_last_updated_at": "true"           // STATICKÁ hodnota
    }
  }
}
```

#### Ak chceš dynamické:

```json{
  "get_custom_price": {
    "url": "https://api.coingecko.com/api/v3/simple/price", 
    "query_params": {
      "ids": "{coin_ids}",                        // DYNAMICKÁ - placeholder
      "vs_currencies": "{currencies}",            // DYNAMICKÁ - placeholder
      "include_market_cap": "{include_market_cap}" // DYNAMICKÁ - placeholder
    }
  }
}
```

## 3.4 Body Template Placeholders 

### OpenSubtitles príklad:

```json
{
  "download_subtitle": {
    "method": "POST",
    "url": "https://api.opensubtitles.com/api/v1/download",
    "body_template": "{\"file_id\": {file_id}}"  // {file_id} bude nahradený
  }
}
```


Volanie:
pythondata = {"file_id": "12345"}
Výsledné JSON body:
json{"file_id": 12345}

4. {server_name}_security.json - Bezpečnostná schéma
4.1 Provider Type: none
Pre API bez autentifikácie (CoinGecko):
json{
  "provider_type": "none"
}
4.2 Provider Type: custom_headers
Pre API s hlavičkami (OpenSubtitles):
json{
  "provider_type": "custom_headers",
  "config": {
    "headers": {
      "Api-Key": "${OPENSUBTITITLES_API_KEY}",
      "User-Agent": "MCP-OpenSubtitles/1.0",
      "Content-Type": "application/json"
    },
    "test_url": "https://api.opensubtitles.com/api/v1/infos/languages"
  }
}
Environment Variables v security
Formát: ${ENV_VARIABLE_NAME}
Použitie: Načítanie citlivých údajov z .env súboru
Príklad:
json{
  "headers": {
    "Authorization": "Bearer ${API_TOKEN}",
    "X-API-Key": "${SECRET_KEY}",
    "User-Agent": "MCP-Client/1.0"
  }
}
V .env súbore:
API_TOKEN=abc123xyz789
SECRET_KEY=super_secret_key

5. {server_name}_headers.json - Globálne hlavičky
Nepovinný súbor pre HTTP hlavičky platné pre všetky endpointy:
json{
  "User-Agent": "MCP-MyServer/1.0",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9"
}
Hierarchia hlavičiek:

Security headers (z _security.json)
Server headers (z _headers.json)
Endpoint headers (z endpoints.json)


6. Kompletné príklady
6.1 Weather API server
weather_endpoints.json:
json{
  "get_current_weather": {
    "method": "GET",
    "url": "https://api.openweathermap.org/data/2.5/weather",
    "description": "Get current weather for a city",
    "query_params": {
      "q": "{city}",           // Dynamický - mesto
      "units": "metric",       // Statický - vždy metrické jednotky
      "appid": "{api_key}"     // Dynamický - API kľúč
    },
    "timeout": 15
  },
  "get_forecast": {
    "method": "GET",
    "url": "https://api.openweathermap.org/data/2.5/forecast",
    "description": "Get 5-day weather forecast",
    "query_params": {
      "q": "{city}",
      "cnt": "{count}",        // Dynamický - počet záznamov
      "units": "metric",
      "appid": "{api_key}"
    }
  },
  "get_weather_by_coords": {
    "method": "GET", 
    "url": "https://api.openweathermap.org/data/2.5/weather",
    "description": "Get weather by coordinates",
    "query_params": {
      "lat": "{latitude}",     // Dynamický - zemepisná šírka
      "lon": "{longitude}",    // Dynamický - zemepisná dĺžka
      "units": "metric",
      "appid": "{api_key}"
    }
  }
}
weather_security.json:
json{
  "provider_type": "custom_headers",
  "config": {
    "headers": {
      "User-Agent": "MCP-Weather/1.0"
    }
  }
}
6.2 GitHub API server
github_endpoints.json:
json{
  "get_user": {
    "method": "GET",
    "url": "https://api.github.com/users/{username}",
    "description": "Get user information",
    "path_params": {
      "username": "octocat"     // Default username
    }
  },
  "get_repos": {
    "method": "GET", 
    "url": "https://api.github.com/users/{username}/repos",
    "description": "Get user repositories",
    "path_params": {
      "username": "octocat"
    },
    "query_params": {
      "type": "all",           // Statický - typ repozitárov
      "sort": "updated",       // Statický - triedenie  
      "per_page": "{limit}"    // Dynamický - počet výsledkov
    }
  },
  "create_issue": {
    "method": "POST",
    "url": "https://api.github.com/repos/{owner}/{repo}/issues",
    "description": "Create new issue",
    "path_params": {
      "owner": "github",
      "repo": "docs"
    },
    "body_template": "{\"title\": \"{title}\", \"body\": \"{description}\", \"labels\": [{labels}]}"
  }
}
github_security.json:
json{
  "provider_type": "custom_headers",
  "config": {
    "headers": {
      "Authorization": "Bearer ${GITHUB_TOKEN}",
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "MCP-GitHub/1.0"
    },
    "test_url": "https://api.github.com/user"
  }
}

7. Použitie v MCP nástrojoch
Každý endpoint sa automaticky stane MCP nástrojom s názvom: {server_name}__{endpoint_name}
Príklady nástrojov:

weather__get_current_weather
opensubtitles__search_subtitles
coingecko__get_price
github__get_user

Volanie nástroja:
python# Pre weather__get_current_weather
{
    "params": {
        "city": "Bratislava",
        "api_key": "your_api_key"
    }
}

# Pre github__create_issue  
{
    "params": {
        "owner": "microsoft",
        "repo": "vscode"
    },
    "data": {
        "title": "Bug report",
        "description": "Found a bug...",
        "labels": "\"bug\", \"high-priority\""
    }
}

8. Najčastejšie chyby a riešenia
❌ Chyba: Placeholder v URL nie je nahradený
json{
  "get_user": {
    "url": "https://api.example.com/users/{user_id}"
    // CHÝBA path_params alebo placeholder nebude nahradený
  }
}
✅ Správne riešenie:
json{
  "get_user": {
    "url": "https://api.example.com/users/{user_id}",
    "path_params": {
      "user_id": "default_user"  // Default hodnota
    }
  }
}
❌ Chyba: Nesprávny JSON v body_template
json{
  "body_template": "{'key': '{value}'}"  // Nesprávne - jednoduché úvodzovky
}
✅ Správne riešenie:
json{
  "body_template": "{\"key\": \"{value}\"}"  // Správne - escapované úvodzovky
}
```