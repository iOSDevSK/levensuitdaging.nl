
# MCP JSON Server

MPC JSON server umoznuje vytvárat a managovat MCP servery prostrednictvom json suborov a mcp manager. Pre sietovu komunikaciu pouziva MCP Proxy Server, ktory sam konfiguruje.

## Vlastnosti

- Servery sa vytvaraju prostrednictvom JSON suborov, pricom MCP json server je navrhnuty univerzalne tak, aby si uzivatel mohol vytvorit akykolvek MCP server ktory pouziva API bez potreby programovania.
- Servery mozne ich pouzit v Claude Desktop prostrednictvom stdio pripojenia (návod pre Claude Desktop je uvedený nižšie)
- Servery podporuju SSE a je mozne ich pouzit priamoaj v online appke  Claude.ai. Pre SSE komunikaciu je potrebne mat nainstalovany mpc-proxy od TBXark https://github.com/TBXark/mcp-proxy.git
- Kazdy server ma svoju PATH s endpointmi, na zaklade ktorej vieme server rozlisit
- Na komunukaciu sa pouziva iba 1 port
- Serverov je mozne bezat niekolko naraz, komunikacia by mala byt konkurentna aby sa servery navzajom neblokovali
- Sprava serverov je mozna na dialku prostrednictvom API
- Planovanie rozsirenie aj iny fukncionalit okrem tools
- Planovane pridanie bezpecnostych funckii pre rozne attacks s ohladom na pouzitie KONG

## Inštalácia

Najskor odporucam nainstalova MPC Proxy Server.

Kompletný návod na inštaláciu MCP Proxy Server je tu: https://github.com/TBXark/mcp-proxy

Pre rýchlu inštaláciu MCP Proxy Server uvádzam návod:

Ak máte nainstalovaný jazy go.  Tento ktok preskočte, ak ho nemate nainstalovay, tak napr. pre Mac OS go nainstalujete prostrednictvom homebrew: 

```
brew install go
```


Potom nainštalujte MPC Proxy Server

```
go install github.com/TBXark/mcp-proxy@latest
```


Ak nemate nainstalovaný virtualny environment, odporcame nainstalova napr. miniconda, a vo virtul env. pouzit python verzia 3.12.4.

Napríklad:

```
conda create -n mcp-json python=3.12.4
```

Potom vo vasom pracovnom priecinky zadajte:

```
git clone https://
cd mcp-json
```

Vytvorte súbor .env alebo skopítuje env.example do .env. Potom editujte .env a nastavte premenné

```
NGROK_URL="https://your-ngrok-domain.ngrok-free.app"
SERVERS_DIR=./servers
PORT=8999
PROXY_PORT=9000
YOUR_API_KEY="your_api_key_for_api_server"
```


Vysvetlenie k nastaveniu premennách v .env: 

NGROK_URL = tu nastavíte url pod ktorou budete vas server bezat, pre demonstraciu a rychlo odskusanie pouzivame ngrok tunneling pre localhost s domenou bez toho aby sme museli kupovat domeny a bezat nas server u poskytovatela. 
Ak budete server bezat pod svojou domenou nastavte si svoju domenu.

SERVES_DIR=./servers = toto ponechajte bez zmeny. je to adresar v ktorom su ulozene priecinky a infomacie v json suboroch o vasom servery

Pre demostraciu sme pripravili vzory json suborov pre COINGECKO a OPENSUBTITLES. Server opensubtitles ma v sebe aj hlavicky pre bezpecne prihlasenie sa k ich api cez api kluc.

PORT = port pod ktorym bude lokalne bezat mcp_wrapper pre spravu servervo

PROXY_PORT = je to port na ktory sa bude smerovat komunikacia stdio von cez SSE pripojenie

YOUR_API_KEY = nazov vasho klucu ktory pouzijete v subore nazovserveru_security.json 

Aktivujte vas virtual environment, napriklad pre miniconda pouzijete prikaz:

```
conda activate your_virt_env_name
```

V adresáry mpc-json potom spustite manazéra pre pridanie serverov:

```
python mcp_manager.py add coingecko concurrent_mcp_server.py --description "Coingecko Server" --transport sse --mode public --auto-start
```

Vysvetlenie:

pyton mcp_manager.py 

add <názov priečinku serveru zhodný s názvom serveru> concurrent_mcp_server.py

--description "popis o aký server ide" 
--transport sse (ide o zvolenie vonkajsej komunikacie - bude sse alebo streamable)

Poznamka: necha SSE, Streamable este nie je otestovane

--mode public (mod pristupu endpointov, moznost volby public (pre verejne endpointy), unrestricted vsetky endpointy, admin (iba endpointy pre admina)

--autostart automaticky start serveru (aj v pripade ak by prislo k restartu)

Over pridanie serveru cez 

```
python mcp_manager.py list
```

Poznámka: mcp_wrapper.py pre pridavanie / odoberanie serverov nie je nutne spustat.

Priklad výstupu:

⚠️  API unavailable, using database with process detection...

INFO:mcp_database:Database initialized: ./data/mcp_servers.db

📋 MCP Servers (Database + Process Detection):

Name                 Status     PID      Transport    Mode         Auto Start Description                   

-----------------------------------------------------------------------
coingecko            stopped    N/A      sse          public         Yes        Coingecko Server              
opensubtitles      stopped    N/A      sse           public         Yes        Opensubtitles Server          

Potom spusti startup.sh

```
./startup.sh
```

Automaticky sa nakonfiguruju a spustia servery a mcp-proxy

Ak si zadal vlastnú NGROK_URL pre pridanie serveru do Claude.ai ju možes použiť, ale pouzi ju prostrednictívm PROXY_PORTU ktorý si nastavil v .env súbore. 

Napríklad: http://your_own_url.com:9000

Alebo použi reverse proxy cez nginx ci apache. 

Pre SSE pripojenie v Claude.ai je potom výsledná url nasledovna: 

https://your_own_url:9000/servername_you_want_to_choose/sse

Napríklad máš registrovanu url mymcpservers.com potom výsledná url pre Claude.ai pre opensubtitles mcp server bude: 

http://mymcpservers:9000/opensubtitles/sse


Ak nemaš vlastnú url a server použi ngrok a nastav si v ňom doménu.

![[CleanShot 2025-06-14 at 13.13.32.png]]

v .env nastav názov domény ktorý máš v ngrok.
Nainštaluj ngrok.

A spusti tunelling nasledovne:

```sh
ngrok http --url=tvoja_ngrok_domena 9000
```


Napríklad pre ngrok domenu: pro-kingfish-constantly.ngrok-free.app bude príkaz:

ngrok http --url=pro-kingfish-constantly.ngrok-free.app 9000

Pričom počt nakonci je náš proxy port z .env súboru.

Potom v Claude. AI nastavíš url nasledovne:

https://your_ngrok_domain/servername_you_want_to_choose/sse

Napríklad pre domenu ngrok pro-kingfish-constantly.ngrok-free.app a server opensubtitles to bude:

https://pro-kingfish-constantly.ngrok-free.app/opensubtitles/sse

![[CleanShot 2025-06-14 at 13.17.26 1.png]]

