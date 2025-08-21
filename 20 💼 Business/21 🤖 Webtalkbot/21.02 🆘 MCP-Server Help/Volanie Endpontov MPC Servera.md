
## Pridanie MCP Servera

```bash
python3 mcp_manager.py add opensubtitles concurrent_mcp_server.py --description "OpenSubtitles REST MCP server" --auto-start

python mcp_manager.py add opensubtitles concurrent_mcp_server.py --description "Opensubtitles Server" --auto-start --transport sse

python mcp_manager.py add coingecko concurrent_mcp_server.py --description "Coingecko Server" --auto-start --transport sse

python mcp_manager.py add opensubtitles concurrent_mcp_server.py --description "Opensubtitles Server" --transport sse --mode public --auto-start


python mcp_manager.py add coingecko concurrent_mcp_server.py --description "Coingecko Server" --transport sse --mode public --auto-start

python generate_config.py --url https://abc123.ngrok-free.app



```

go install github.com/TBXark/mcp-proxy@latest

python mcp_manager.py start opensubtitles


## Kontrola dostupných nástrojov

````curl
curl -X GET http://mcp-server:8999/servers/opensubtitles
````


## Ako volať endpointy

```
{server_name}__{endpoint_name_z_config_súboru}
```

