
# 🎯 **MVP PRIORITY ANALYSIS - Čo musí byť hotové**



## MVP Phase priorities:**

### **Phase 1: Core Infrastructure (Days 1-2)**

- [x]  **Error handling wrapped**
- [ ]  **Health endpoint**
- [ ]  **Basic logging**

### **Phase 2: MCP + SSE (Days 2-3)** ← **SSE moved here**

4. **MCP initialize**
5. **SSE stream implementation** ← **NOW CRITICAL**
6. **Session management**

### **Phase 3: Documentation (Day 3)**

7. **README.md**
8. **`.env.example`**

### **Phase 4: Testing & Validation (Day 4)**

9. **Automated test with SSE**
10. **Claude Desktop integration test**

## **CRITICAL PATH - Bez týchto vecí MVP nefunguje**

### 1. **Error handling wrapped** ⚠️ **BLOKUJE VŠETKO**

**Prečo je critical:** Bez proper error handling sa server crashne pri prvom probléme a MVP je nepoužiteľný.

**Minimum viable implementation:**

- **Wrap all async operations** v try/catch blocks
- **Basic exception logging** s timestamp a error message
- **Graceful failure responses** namiesto server crashes
- **Process restart mechanism** pri critical failures

🚨 **KRITICKÉ PROBLÉMY**

## 🚨 **KRITICKÉ PROBLÉMY**

### 1. **Async Operations bez Error Handling**

**V `mcp_wrapper.py`:**

python

```python
async def _read_stdout_async(self):
    while self.running and self.process and self.process.poll() is None:
        try:
            # Len základný try/catch
            line = await loop.run_in_executor(None, self._safe_readline)
            # ❌ CHÝBA: Specific error handling pre rôzne typy chýb
```

**Problém:** Ak `_safe_readline()` zlyhá, celý stdout reader sa ukončí bez restartu.

### 2. **Security Manager bez Fallback**

**V `security_manager.py`:**

python

```python
async def get_security_context(self, server_name: str) -> SecurityContext:
    if not self._session:
        raise RuntimeError("SecurityManager nie je inicializovaný")
        # ❌ CHÝBA: Fallback na "none" provider
```

**Problém:** Server crashne ak security context zlyhá namiesto použitia fallback.

### 3. **Database Operations bez Retry Logic**

**V `mcp_database.py`:**

python

```python
def add_server(self, name: str, script_path: str, ...):
    with self._lock:
        try:
            with sqlite3.connect(self.db_path) as conn:
                # ❌ CHÝBA: Retry mechanism pre DB lock conflicts
```

**Problém:** SQLite lock conflicts môžu spôsobiť zlyhanie operácií bez retry.

### 4. **HTTP Requests bez Proper Timeout/Retry**

**V `concurrent_mcp_server.py`:**

python

```python
async with self.session.request(method, final_url, **kwargs) as response:
    # ❌ CHÝBA: Specific handling pre network errors
    # ❌ CHÝBA: Retry logic pre transient failures
```

## 🛠️ **MINIMUM VIABLE FIXES**

### **Fix 1: Robust Async Error Handling**

python

```python
# V mcp_wrapper.py
async def _read_stdout_async(self):
    consecutive_errors = 0
    max_errors = 5
    
    while self.running and self.process and self.process.poll() is None:
        try:
            line = await loop.run_in_executor(None, self._safe_readline)
            
            if line:
                consecutive_errors = 0  # Reset error counter
                await self._process_message_async(line)
            else:
                await asyncio.sleep(0.01)
                
        except asyncio.CancelledError:
            logger.info(f"Stdout reader cancelled for {self.name}")
            break
        except Exception as e:
            consecutive_errors += 1
            logger.error(f"Stdout reader error {self.name} ({consecutive_errors}/{max_errors}): {e}")
            
            if consecutive_errors >= max_errors:
                logger.critical(f"Too many consecutive errors in stdout reader for {self.name}, stopping")
                break
                
            # Exponential backoff
            await asyncio.sleep(min(2 ** consecutive_errors, 30))
```

### **Fix 2: Security Manager Fallback**

python

```python
# V security_manager.py
async def get_security_context(self, server_name: str) -> SecurityContext:
    try:
        if not self._session:
            logger.warning("SecurityManager nie je inicializovaný, používam none provider")
            return SecurityContext(headers={}, query_params={}, cookies={}, 
                                 auth_data={'provider': 'none', 'fallback': True})
        
        async with self._lock:
            # Existujúci kód...
            
    except Exception as e:
        logger.error(f"Security context failed for {server_name}: {e}")
        # Fallback na none provider
        return SecurityContext(headers={}, query_params={}, cookies={}, 
                             auth_data={'provider': 'none', 'error': str(e)})
```

### **Fix 3: Database Retry Logic**

python

```python
# V mcp_database.py
import time
import random

def _execute_with_retry(self, operation_name: str, operation_func, max_retries: int = 3):
    """Vykoná databázovú operáciu s retry logic"""
    for attempt in range(max_retries):
        try:
            return operation_func()
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                # Exponential backoff s jitter
                delay = (2 ** attempt) + random.uniform(0, 1)
                logger.warning(f"DB locked for {operation_name}, retry {attempt + 1}/{max_retries} in {delay:.2f}s")
                time.sleep(delay)
                continue
            else:
                logger.error(f"DB operation {operation_name} failed after {attempt + 1} attempts: {e}")
                raise
        except Exception as e:
            logger.error(f"DB operation {operation_name} failed: {e}")
            raise

def add_server(self, name: str, script_path: str, ...):
    def _add_operation():
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                # Existujúci kód...
                
    return self._execute_with_retry("add_server", _add_operation)
```

### **Fix 4: HTTP Request Error Handling**

python

```python
# V concurrent_mcp_server.py
async def call_endpoint(self, server_name: str, endpoint_name: str, ...):
    max_retries = 3
    base_delay = 1
    
    for attempt in range(max_retries):
        try:
            async with self.session.request(method, final_url, **kwargs) as response:
                # Existujúci kód...
                return result
                
        except asyncio.TimeoutError:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(f"Request timeout for {server_name}/{endpoint_name}, retry {attempt + 1}/{max_retries} in {delay}s")
                await asyncio.sleep(delay)
                continue
            else:
                return self._create_error_response("Request timeout after retries", final_url, method)
                
        except aiohttp.ClientConnectorError as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(f"Connection error for {server_name}/{endpoint_name}, retry {attempt + 1}/{max_retries}")
                await asyncio.sleep(delay)
                continue
            else:
                return self._create_error_response(f"Connection failed: {str(e)}", final_url, method)
                
        except Exception as e:
            # Pre ostatné chyby neopakujeme
            logger.error(f"Unexpected error for {server_name}/{endpoint_name}: {e}")
            return self._create_error_response(f"Unexpected error: {str(e)}", final_url, method)

def _create_error_response(self, error_msg: str, url: str, method: str) -> Dict[str, Any]:
    """Vytvorí štandardizovanú error response"""
    return {
        "error": error_msg,
        "url": url,
        "method": method,
        "response_time": 0,
        "timestamp": time.time()
    }
```

### **Fix 5: Process Restart Mechanism**

python

```python
# V mcp_wrapper.py
class ProcessManager:
    def __init__(self):
        self.processes: Dict[str, MCPProcess] = {}
        self.lock = threading.Lock()
        self.restart_attempts: Dict[str, int] = {}
        self.max_restart_attempts = 3
        
    async def monitor_and_restart_failed_processes(self):
        """Background task na monitoring a restart failed procesov"""
        while True:
            try:
                await asyncio.sleep(30)  # Check každých 30 sekúnd
                
                with self.lock:
                    for server_name, mcp_process in list(self.processes.items()):
                        if not mcp_process.is_running():
                            logger.warning(f"Process {server_name} is not running, attempting restart")
                            
                            restart_count = self.restart_attempts.get(server_name, 0)
                            if restart_count < self.max_restart_attempts:
                                try:
                                    success = await self.start_server(server_name)
                                    if success:
                                        self.restart_attempts[server_name] = 0
                                        logger.info(f"Successfully restarted {server_name}")
                                    else:
                                        self.restart_attempts[server_name] = restart_count + 1
                                        logger.error(f"Failed to restart {server_name} (attempt {restart_count + 1})")
                                except Exception as e:
                                    logger.error(f"Exception during restart of {server_name}: {e}")
                                    self.restart_attempts[server_name] = restart_count + 1
                            else:
                                logger.critical(f"Max restart attempts reached for {server_name}, giving up")
                                
            except Exception as e:
                logger.error(f"Error in process monitor: {e}")
```



---

### 2. **Health endpoint works** ⚠️ **BLOKUJE TESTING**

**Prečo je critical:** Bez health endpoint cannot verify že server běží a je ready.

**Minimum viable implementation:**

python

```python
@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Basic checks
        db_status = test_database_connection()
        server_count = count_running_servers()
        
        if db_status and server_count >= 0:
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "servers_running": server_count
            }, 200
        else:
            return {
                "status": "unhealthy", 
                "timestamp": datetime.utcnow().isoformat()
            }, 503
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500
```

---

### 3. **MCP initialize works** ⚠️ **BLOKUJE CLAUDE DESKTOP**

**Prečo je critical:** Claude Desktop cannot connect without proper initialize handshake.

**Minimum viable implementation:**

python

```python
async def handle_initialize(params, request_id):
    try:
        # Validate protocol version
        client_version = params.get("protocolVersion")
        if client_version != "2025-03-26":
            return create_error_response(-1, f"Unsupported protocol version: {client_version}", request_id)
        
        # Create session
        session_id = str(uuid.uuid4())
        sessions[session_id] = {
            "created": datetime.utcnow(),
            "client_info": params.get("clientInfo", {}),
            "capabilities": params.get("capabilities", {})
        }
        
        # Return initialize response
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": "2025-03-26",
                "capabilities": {
                    "tools": {},
                    "resources": {},
                    "prompts": {}
                },
                "serverInfo": {
                    "name": "mcp-wrapper",
                    "version": "1.0.0"
                }
            }
        }, {"Mcp-Session-Id": session_id}
    except Exception as e:
        logger.error(f"Initialize failed: {e}")
        return create_error_response(-32603, "Internal error", request_id)
```

---

### 4. **Basic session management** ⚠️ **BLOKUJE MULTI-REQUEST WORKFLOWS**

**Prečo je critical:** Bez sessions, každý request je isolated a complex workflows nefungujú.

**Minimum viable implementation:**

python

```python
# Global session store (MVP level)
sessions = {}
SESSION_TIMEOUT = 3600  # 1 hour

def validate_session(session_id):
    """Validate session exists and is not expired"""
    if not session_id or session_id not in sessions:
        return False
    
    session = sessions[session_id]
    if datetime.utcnow() - session["created"] > timedelta(seconds=SESSION_TIMEOUT):
        del sessions[session_id]
        return False
    
    # Update last activity
    session["last_activity"] = datetime.utcnow()
    return True

def cleanup_expired_sessions():
    """Clean up expired sessions"""
    now = datetime.utcnow()
    expired = [sid for sid, session in sessions.items() 
               if now - session.get("last_activity", session["created"]) > timedelta(seconds=SESSION_TIMEOUT)]
    for sid in expired:
        del sessions[sid]
```

---

### 5. **README.md created** ⚠️ **BLOKUJE USER ADOPTION**

**Prečo je critical:** Users nevedia ako setup a použiť MVP bez dokumentácie.

**Minimum viable README structure:**

markdown

````markdown
# MCP Wrapper Server

Quick setup guide for running multiple MCP servers through single wrapper.

## Prerequisites
- Python 3.8+
- SQLite

## Quick Start
1. Clone repository
2. Install dependencies: `pip install -r requirements.txt`
3. Copy environment: `cp .env.example .env`
4. Edit `.env` with your API keys
5. Run server: `python concurrent_mcp_server.py`

## Claude Desktop Setup
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mcp-wrapper": {
      "command": "python",
      "args": ["/absolute/path/to/concurrent_mcp_server.py"],
      "cwd": "/absolute/path/to/project"
    }
  }
}
````

## Troubleshooting

- Check server is running: `curl http://localhost:8999/health`
- View logs: `tail -f logs/server.log`
- Test connection: `python test_connection.py`

## Available Tools

- OpenSubtitles search
- CoinGecko crypto data
- [List other tools]

````

---

### 6. **`.env.example` created** ⚠️ **BLOKUJE CONFIGURATION**
**Prečo je critical:** Users nevedia which environment variables sú required.

**Minimum viable .env.example:**
```bash
# ===============================
# REQUIRED API KEYS
# ===============================

# OpenSubtitles API (required for subtitle search)
OPENSUBTITLES_API_KEY=your_opensubtitles_api_key_here
OPENSUBTITLES_USER_AGENT=MCPWrapper/1.0

# CoinGecko API (optional for crypto data)
COINGECKO_API_KEY=your_coingecko_api_key_here

# ===============================
# SERVER CONFIGURATION
# ===============================

# Server binding
MCP_HOST=localhost
MCP_PORT=8999

# Data directory
MCP_DATA_DIR=./data

# ===============================
# DEBUGGING
# ===============================

# Enable debug mode
DEBUG_MODE=false
LOG_LEVEL=INFO
````

---

### 7. **Basic automated test** ⚠️ **BLOKUJE VERIFICATION**

**Prečo je critical:** Cannot verify že MVP actually works without basic testing.

**Minimum viable test script:**

bash

```bash
#!/bin/bash
# test_mvp.sh

set -e  # Exit on any error

echo "🧪 Testing MVP functionality..."

# Configuration
TEST_HOST="localhost"
TEST_PORT="8999"
TEST_TIMEOUT=10

# Start server in background
echo "Starting server..."
python concurrent_mcp_server.py &
SERVER_PID=$!

# Wait for server startup
sleep 5

# Test 1: Health endpoint
echo "Testing health endpoint..."
curl -f -s http://$TEST_HOST:$TEST_PORT/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Health endpoint works"
else
    echo "❌ Health endpoint failed"
    kill $SERVER_PID
    exit 1
fi

# Test 2: MCP Initialize
echo "Testing MCP initialize..."
INIT_RESPONSE=$(curl -s -X POST http://$TEST_HOST:$TEST_PORT/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0"}
    }
  }')

if echo "$INIT_RESPONSE" | grep -q "2025-03-26"; then
    echo "✅ MCP initialize works"
else
    echo "❌ MCP initialize failed"
    echo "Response: $INIT_RESPONSE"
    kill $SERVER_PID
    exit 1
fi

# Test 3: Session management
echo "Testing session management..."
SESSION_ID=$(echo "$INIT_RESPONSE" | jq -r '.result.serverInfo.name' 2>/dev/null || echo "")
if [ -n "$SESSION_ID" ]; then
    echo "✅ Session management works"
else
    echo "❌ Session management failed"
fi

# Cleanup
kill $SERVER_PID
echo "🎉 MVP tests passed!"
```

---

## **IMPORTANT BUT NOT BLOCKING - Môže byť v MVP ale nie critical**

### 8. **Basic logging** 📝 **HELPFUL FOR DEBUGGING**

**Minimum viable:**

python

```python
import logging
from datetime import datetime

# Basic logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/server.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('mcp-wrapper')

# Add to key functions
logger.info("Server starting...")
logger.error(f"Failed to start server: {error}")
logger.info(f"MCP request: {method}")
```

### 9. **SSE stream basic functionality** 🔄 **NEEDED FOR REAL-TIME**

**Minimum viable:**

python

```python
from flask import Response
import json
import time

@app.route('/mcp', methods=['GET'])
def mcp_sse():
    def generate():
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
        
        # Keep connection alive with heartbeat
        while True:
            yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            time.sleep(30)  # Heartbeat every 30 seconds
    
    return Response(generate(), mimetype='text/event-stream')
```

### 10. **Basic usage examples** 📖 **HELPFUL FOR USERS**

**Minimum viable:** Add k README examples section:

markdown

````markdown
## Usage Examples

### Test Connection
```bash
curl http://localhost:8999/health
````

### Initialize MCP Session

bash

```bash
curl -X POST http://localhost:8999/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
```

### Search Subtitles

[Add example after implementing tool calls]

```

---

## **CAN WAIT - Post-MVP improvements**

### ❌ **Not needed for MVP:**
- Advanced server validation
- Comprehensive API documentation  
- Advanced error recovery mechanisms
- Performance optimization
- Complex session persistence
- Detailed monitoring dashboards
- Multi-environment configs
- Extensive integration tests

---

# 🚀 **MVP IMPLEMENTATION ROADMAP**

## **Phase 1: Core Stability (Days 1-2)**
1. **Error handling wrapped** - Wrap all critical functions
2. **Health endpoint** - Basic health check implementation
3. **Basic logging** - Simple file + console logging

## **Phase 2: MCP Protocol (Days 2-3)**  
4. **MCP initialize** - Proper handshake implementation
5. **Session management** - Basic session tracking
6. **SSE stream basic** - Simple SSE endpoint

## **Phase 3: Documentation & Testing (Days 3-4)**
7. **README.md** - Complete setup guide
8. **`.env.example`** - Configuration template  
9. **Basic test script** - Verification automation

## **Phase 4: Validation (Day 4)**
10. **Claude Desktop integration test** - End-to-end verification

---

# ⚠️ **CRITICAL SUCCESS FACTORS**

## **Must work perfectly:**
- Server starts without crashing
- Health endpoint returns 200 OK
- MCP initialize completes successfully
- Claude Desktop can connect
- Basic tool calls work (at least 1 tool)

## **Must be documented:**
- Clear setup instructions
- Working Claude Desktop configuration
- Basic troubleshooting steps

## **Must be testable:**
- Automated verification script
- Manual testing checklist
- Clear success/failure criteria

---

# 📋 **MVP ACCEPTANCE CRITERIA**

## ✅ **MVP is ready when:**
1. **Fresh install works:** New user can follow README a get it running
2. **Claude Desktop connects:** Successfully integrates s Claude Desktop
3. **At least one tool works:** Can execute at least one API call
4. **Basic error handling:** Server doesn't crash on common errors
5. **Health check passes:** Monitoring can verify server status
6. **Tests pass:** Automated test script validates functionality

## ❌ **MVP is NOT ready if:**
- Server crashes during normal operation
- Claude Desktop cannot connect
- Setup instructions are unclear alebo incomplete
- No way to verify if installation worked
- Critical functionality missing from documentation

---

**Total estimated effort: 3-4 days** pre experienced developer working on this full-time, assuming existing codebase has basic structure already implemented.
```

# 🎯 **ÁNO! SSE je CRITICAL pre Claude Desktop connection**

Máš absolútne pravdu - **SSE stream je BLOCKING requirement** pre MVP, nie optional feature.

## **Prečo SSE je critical:**

### **Claude Desktop communication pattern:**

Claude Desktop používa **bidirectional communication**:

1. **HTTP POST** pre MCP requests (initialize, tools/list, tools/call)
2. **SSE stream** pre real-time responses a server-initiated messages

Bez SSE, Claude Desktop:

- ❌ Cannot receive async responses
- ❌ Cannot handle long-running operations
- ❌ Loses connection after first request
- ❌ Cannot properly manage session state

---

## **UPDATED MVP CRITICAL PATH:**

### 1. **Error handling wrapped** ⚠️ **BLOKUJE VŠETKO**

### 2. **Health endpoint works** ⚠️ **BLOKUJE TESTING**

### 3. **MCP initialize works** ⚠️ **BLOKUJE CLAUDE DESKTOP**

### 4. **SSE stream works** ⚠️ **BLOKUJE CLAUDE DESKTOP** ← **MOVED TO CRITICAL**

### 5. **Basic session management** ⚠️ **BLOKUJE MULTI-REQUEST**

### 6. **README.md created** ⚠️ **BLOKUJE USER ADOPTION**

### 7. **`.env.example` created** ⚠️ **BLOKUJE CONFIGURATION**

### 8. **Basic automated test** ⚠️ **BLOKUJE VERIFICATION**

---

## **Minimum viable SSE implementation:**

python

```python
from flask import Response, request
import json
import time
import threading
import queue
from datetime import datetime

# Global SSE connections management
sse_connections = {}
sse_queues = {}

@app.route('/mcp', methods=['GET'])
def mcp_sse_endpoint():
    """SSE endpoint for Claude Desktop real-time communication"""
    
    # Get session ID from headers or create new one
    session_id = request.headers.get('Mcp-Session-Id')
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Create message queue for this connection
    message_queue = queue.Queue()
    sse_queues[session_id] = message_queue
    
    def generate_sse_stream():
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connection_established', 'session_id': session_id, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # Keep connection alive and send messages
            while True:
                try:
                    # Check for new messages (non-blocking with timeout)
                    message = message_queue.get(timeout=30)
                    yield f"data: {json.dumps(message)}\n\n"
                except queue.Empty:
                    # Send heartbeat if no messages
                    heartbeat = {
                        'type': 'heartbeat', 
                        'timestamp': datetime.utcnow().isoformat()
                    }
                    yield f"data: {json.dumps(heartbeat)}\n\n"
                    
        except GeneratorExit:
            # Client disconnected
            if session_id in sse_queues:
                del sse_queues[session_id]
            if session_id in sse_connections:
                del sse_connections[session_id]
        except Exception as e:
            logger.error(f"SSE stream error for session {session_id}: {e}")
            # Send error message and close
            error_msg = {
                'type': 'error',
                'message': 'SSE stream error',
                'timestamp': datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(error_msg)}\n\n"
    
    # Store connection reference
    sse_connections[session_id] = True
    
    response = Response(
        generate_sse_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'Mcp-Session-Id': session_id
        }
    )
    
    return response

def send_sse_message(session_id, message):
    """Send message to specific SSE connection"""
    if session_id in sse_queues:
        try:
            sse_queues[session_id].put_nowait(message)
            return True
        except queue.Full:
            logger.warning(f"SSE queue full for session {session_id}")
            return False
    return False

def broadcast_sse_message(message):
    """Send message to all connected SSE clients"""
    disconnected = []
    for session_id in list(sse_queues.keys()):
        if not send_sse_message(session_id, message):
            disconnected.append(session_id)
    
    # Cleanup disconnected sessions
    for session_id in disconnected:
        cleanup_sse_session(session_id)

def cleanup_sse_session(session_id):
    """Clean up SSE session resources"""
    if session_id in sse_queues:
        del sse_queues[session_id]
    if session_id in sse_connections:
        del sse_connections[session_id]
    if session_id in sessions:
        del sessions[session_id]
```

---

## **Integration s MCP protocol:**

python

```python
@app.route('/mcp', methods=['POST'])
async def mcp_post_endpoint():
    """Handle MCP protocol requests via POST"""
    try:
        data = request.get_json()
        session_id = request.headers.get('Mcp-Session-Id')
        
        # Process MCP request
        response = await process_mcp_request(data, session_id)
        
        # For async operations, send response via SSE instead of HTTP response
        if is_async_operation(data.get('method')):
            if session_id and send_sse_message(session_id, response):
                # Return acknowledgment
                return {"jsonrpc": "2.0", "id": data.get('id'), "result": {"status": "processing"}}
            else:
                # Fallback to direct response
                return jsonify(response)
        else:
            # Synchronous response
            return jsonify(response)
            
    except Exception as e:
        logger.error(f"MCP POST error: {e}")
        error_response = {
            "jsonrpc": "2.0",
            "error": {"code": -32603, "message": "Internal error"},
            "id": data.get('id') if 'data' in locals() else None
        }
        return jsonify(error_response), 500

def is_async_operation(method):
    """Determine if MCP method requires async processing"""
    async_methods = ['tools/call', 'resources/read']
    return method in async_methods
```

---

## **Updated test script s SSE testing:**

bash

```bash
#!/bin/bash
# test_mvp_with_sse.sh

echo "🧪 Testing MVP with SSE functionality..."

# Start server
python concurrent_mcp_server.py &
SERVER_PID=$!
sleep 5

# Test 1: Health endpoint
echo "Testing health endpoint..."
curl -f -s http://localhost:8999/health > /dev/null && echo "✅ Health OK" || exit 1

# Test 2: MCP Initialize  
echo "Testing MCP initialize..."
INIT_RESPONSE=$(curl -s -X POST http://localhost:8999/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0"}}}')

SESSION_ID=$(echo "$INIT_RESPONSE" | grep -o 'Mcp-Session-Id: [^"]*' | cut -d' ' -f2)
echo "$INIT_RESPONSE" | grep -q "2025-03-26" && echo "✅ MCP Initialize OK" || exit 1

# Test 3: SSE Connection
echo "Testing SSE stream..."
timeout 10 curl -N -H "Accept: text/event-stream" -H "Mcp-Session-Id: $SESSION_ID" \
  http://localhost:8999/mcp > sse_output.txt &
SSE_PID=$!

sleep 5
kill $SSE_PID 2>/dev/null

# Verify SSE format
if grep -q "^data: " sse_output.txt && grep -q "connection_established" sse_output.txt; then
    echo "✅ SSE Stream OK"
else
    echo "❌ SSE Stream failed"
    cat sse_output.txt
    exit 1
fi

# Test 4: Combined HTTP + SSE workflow
echo "Testing combined HTTP + SSE workflow..."
# Start SSE listener in background
curl -N -H "Accept: text/event-stream" -H "Mcp-Session-Id: $SESSION_ID" \
  http://localhost:8999/mcp > sse_combined.txt &
SSE_COMBINED_PID=$!

sleep 2

# Send tools/list request
curl -s -X POST http://localhost:8999/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' > /dev/null

sleep 2
kill $SSE_COMBINED_PID 2>/dev/null

echo "✅ Combined workflow OK"

# Cleanup
kill $SERVER_PID
rm -f sse_output.txt sse_combined.txt
echo "🎉 All MVP tests including SSE passed!"
```

