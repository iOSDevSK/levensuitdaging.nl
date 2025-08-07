
- [ ]  Automated test script
- [ ]  Health endpoint works
- [ ]  MCP initialize works
- [ ]  SSE stream works
- [ ]  Claude Desktop connects



# 🧪 **TESTOVANIE - Podrobný popis požiadaviek**

## 1. **Automated test script**

### **Súčasný problém:**

- Žiadne systematic testing pre overenie functionality
- Manual testing je time-consuming a error-prone
- Žiadne regression testing pre code changes
- CI/CD pipeline cannot validate deployments
- Quality assurance je ad-hoc a inconsistent

### **Prečo je to problém:**

- **Deployment risks:** Cannot confidently deploy without manual verification
- **Regression bugs:** Changes môžu break existing functionality unnoticed
- **Development velocity:** Manual testing slows down development cycle
- **Quality consistency:** Different developers test differently
- **Production issues:** Problems discovered only after deployment k users

### **Čo automated test script musí obsahovať:**

#### **Test framework architecture:**

bash

```bash
test_mvp.sh
├── Environment setup
├── Server lifecycle tests
├── Health check validation
├── MCP protocol tests
├── Transport layer tests
├── Integration tests
├── Performance benchmarks
├── Cleanup procedures
```

#### **Test categories:**

##### **Smoke tests (basic functionality):**

- **Server startup:** Server starts without errors
- **Port binding:** Server binds k correct port
- **Basic connectivity:** HTTP requests work
- **Configuration loading:** Environment variables loaded correctly
- **Dependency check:** All required services available

##### **Functional tests:**

- **Health endpoint:** Returns correct health status
- **MCP initialize:** Proper handshake workflow
- **Tool discovery:** Tools/list returns available tools
- **Tool execution:** Tools/call works for sample tools
- **Session management:** Session creation a validation
- **Error handling:** Proper error responses

##### **Integration tests:**

- **Multi-server management:** Multiple sub-servers running
- **API proxy functionality:** Requests routed correctly
- **Authentication flow:** Security providers working
- **Database operations:** Server persistence works
- **External API calls:** Real API integrations functional

#### **Test script structure:**

bash

```bash
#!/bin/bash

# Configuration
TEST_HOST="localhost"
TEST_PORT="8999"
TEST_TIMEOUT=30
TEST_LOG="test_results.log"

# Test utilities
setup_test_environment() {
    # Backup existing configs
    # Create test configurations
    # Start clean database
}

run_smoke_tests() {
    # Basic connectivity tests
}

run_functional_tests() {
    # Core functionality tests
}

run_integration_tests() {
    # End-to-end workflow tests
}

cleanup_test_environment() {
    # Stop test servers
    # Restore original configs
    # Clean test data
}

generate_test_report() {
    # Summarize results
    # Export metrics
    # Create HTML report
}
```

#### **Test execution features:**

- **Parallel execution:** Run independent tests simultaneously
- **Selective testing:** Run specific test categories
- **Retry mechanisms:** Retry flaky tests automatically
- **Timeout handling:** Prevent hanging tests
- **Result aggregation:** Collect a summarize all results

#### **Test data management:**

- **Test fixtures:** Predefined test data sets
- **Mock services:** Simulated external APIs
- **Database seeding:** Known state pre testing
- **Cleanup procedures:** Reset state after tests
- **Isolation:** Tests don't interfere s each other

### **Reporting a monitoring:**

- **Test results dashboard:** Visual test status
- **Performance metrics:** Response times, throughput
- **Coverage reports:** Which functionality is tested
- **Trend analysis:** Test success rates over time
- **Alert mechanisms:** Notify on test failures

---

## 2. **Health endpoint works**

### **Súčasný problém:**

- Health endpoint môže return misleading status
- Shallow health checks nedetekujú deeper problems
- Žiadne dependency health verification
- Health response format nie je standardized
- Load balancers a monitoring tools cannot rely on health endpoint

### **Prečo je to problém:**

- **False positives:** Server reports healthy ale critical functionality broken
- **Monitoring failures:** External monitoring cannot detect real problems
- **Load balancing issues:** Unhealthy servers receive traffic
- **Debugging difficulties:** Health endpoint doesn't provide diagnostic info
- **Service discovery:** Cannot reliably determine server readiness

### **Čo health endpoint testing musí overiť:**

#### **Basic connectivity tests:**

- **HTTP response:** Endpoint responds k HTTP GET request
- **Response time:** Response within acceptable latency (< 1 second)
- **Status code:** Returns 200 OK pre healthy state
- **Content type:** Returns appropriate content-type header
- **Response format:** JSON response s expected structure

#### **Deep health verification:**

bash

```bash
# Test basic connectivity
curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8999/health

# Test response format
HEALTH_RESPONSE=$(curl -s http://localhost:8999/health)
echo $HEALTH_RESPONSE | jq '.status' | grep -q "healthy"

# Test response time
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:8999/health)
# Verify response time < 1.0 seconds
```

#### **Comprehensive health checks:**

##### **System health components:**

- **Memory usage:** Available memory sufficient
- **Disk space:** Adequate storage available
- **CPU usage:** System not overloaded
- **Network connectivity:** External network reachable
- **Process health:** All required processes running

##### **Application health components:**

- **Database connectivity:** Can connect k SQLite database
- **Sub-server status:** All managed MCP servers healthy
- **External API availability:** Critical external services reachable
- **Configuration validity:** All required configs present a valid
- **Session store:** Session management system functional

##### **Dependency health verification:**

bash

```bash
# Test database connectivity
sqlite3 data/mcp_servers.db "SELECT 1" > /dev/null

# Test external API connectivity
curl -f -s https://api.opensubtitles.com/api/v1/ping > /dev/null

# Test sub-server health
for server in $(list_running_servers); do
    test_server_health $server
done
```

#### **Health endpoint response format:**

json

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-06-08T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {"status": "healthy", "response_time": 0.05},
    "external_apis": {"status": "healthy", "failed": []},
    "sub_servers": {"status": "healthy", "running": 3, "failed": 0},
    "system_resources": {"status": "healthy", "memory_usage": "45%"}
  },
  "metrics": {
    "requests_per_minute": 150,
    "average_response_time": 0.25,
    "error_rate": 0.01
  }
}
```

#### **Health status definitions:**

- **Healthy:** All systems operational, full functionality available
- **Degraded:** Partial functionality, some non-critical services down
- **Unhealthy:** Critical services failed, not ready pre traffic

---

## 3. **MCP initialize works**

### **Súčasný problém:**

- Initialize handshake môže fail silently
- Protocol version mismatch not properly handled
- Session creation during initialize not tested
- Capability negotiation not verified
- Initialize response format compliance not validated

### **Prečo je to problém:**

- **Connection failures:** Claude Desktop cannot establish MCP connection
- **Protocol incompatibility:** Version mismatches prevent communication
- **Session issues:** Subsequent requests fail due k bad initialization
- **Capability confusion:** Client a server disagree on supported features
- **Integration problems:** Third-party clients cannot connect

### **Čo MCP initialize testing musí overiť:**

#### **Protocol compliance testing:**

bash

```bash
# Test initialize request format
INIT_REQUEST='{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": {"name": "test-client", "version": "1.0"}
  }
}'

# Send initialize request
INIT_RESPONSE=$(curl -s -X POST http://localhost:8999/mcp \
  -H "Content-Type: application/json" \
  -d "$INIT_REQUEST")

# Validate response format
echo $INIT_RESPONSE | jq '.result.protocolVersion' | grep -q "2025-03-26"
echo $INIT_RESPONSE | jq '.result.serverInfo.name' | grep -q "mcp-wrapper"
```

#### **Session management verification:**

- **Session ID generation:** Initialize response contains Mcp-Session-Id header
- **Session validation:** Subsequent requests work s session ID
- **Session persistence:** Session remains valid across multiple requests
- **Session cleanup:** Sessions properly cleaned up when not needed
- **Concurrent sessions:** Multiple clients can initialize simultaneously

#### **Capability negotiation testing:**

bash

```bash
# Extract capabilities from initialize response
CAPABILITIES=$(echo $INIT_RESPONSE | jq '.result.capabilities')

# Verify expected capabilities present
echo $CAPABILITIES | jq '.tools' | grep -q "{}"
echo $CAPABILITIES | jq '.resources' | grep -q "{}"
echo $CAPABILITIES | jq '.prompts' | grep -q "{}"

# Test capability consistency with actual functionality
# If server advertises tools capability, tools/list should work
```

#### **Error handling testing:**

- **Invalid protocol version:** Server rejects unsupported versions
- **Malformed requests:** Proper error responses pre invalid JSON
- **Missing parameters:** Error handling pre incomplete initialize requests
- **Duplicate initialization:** Handling multiple initialize attempts
- **Resource exhaustion:** Behavior when max sessions reached

#### **Initialize workflow testing:**

bash

```bash
test_initialize_workflow() {
    # Step 1: Send initialize request
    local session_id=$(send_initialize_request)
    
    # Step 2: Verify session created
    verify_session_exists "$session_id"
    
    # Step 3: Test subsequent request works
    test_tools_list_with_session "$session_id"
    
    # Step 4: Test session cleanup
    disconnect_session "$session_id"
    verify_session_cleaned_up "$session_id"
}
```

---

## 4. **SSE stream works**

### **Súčasný problém:**

- SSE stream format môže byť incorrect
- Connection drops not properly handled
- Heartbeat mechanism not functioning
- Client disconnection detection failing
- Message ordering a delivery not guaranteed

### **Prečo je to problém:**

- **Real-time communication broken:** Claude Desktop loses real-time updates
- **Connection instability:** Frequent disconnects disrupt user experience
- **Message loss:** Critical messages may not reach client
- **Resource leaks:** Server holds connections k disconnected clients
- **Performance degradation:** Bad SSE implementation affects server performance

### **Čo SSE stream testing musí overiť:**

#### **SSE format compliance:**

bash

```bash
# Test SSE endpoint accessibility
curl -N -H "Accept: text/event-stream" http://localhost:8999/mcp &
CURL_PID=$!

# Capture SSE messages
timeout 10 curl -N -H "Accept: text/event-stream" http://localhost:8999/mcp > sse_output.txt

# Verify SSE format
grep -q "^data: " sse_output.txt
grep -q "\\n\\n" sse_output.txt  # Double newline after data

# Check for proper JSON in data field
sed -n 's/^data: //p' sse_output.txt | while read line; do
    echo "$line" | jq . > /dev/null || echo "Invalid JSON: $line"
done
```

#### **Connection lifecycle testing:**

- **Initial connection:** SSE connection establishes successfully
- **Message delivery:** Server can send messages k connected clients
- **Heartbeat mechanism:** Regular heartbeat messages prevent timeout
- **Graceful disconnection:** Proper cleanup when client disconnects
- **Connection limits:** Server handles maximum concurrent connections

#### **Message format verification:**

bash

```bash
# Test different message types
test_sse_message_types() {
    local sse_output="sse_test_output.txt"
    
    # Start SSE connection
    curl -N -H "Accept: text/event-stream" http://localhost:8999/mcp > $sse_output &
    local curl_pid=$!
    
    # Wait for messages
    sleep 5
    
    # Check for initialization message
    grep -q 'data: {"type":"init"' $sse_output
    
    # Check for heartbeat messages
    grep -q 'data: {"type":"heartbeat"' $sse_output
    
    # Cleanup
    kill $curl_pid
}
```

#### **Performance a stability testing:**

- **Multiple concurrent connections:** Server handles many SSE clients
- **Message throughput:** High-frequency messages don't overwhelm server
- **Memory usage:** SSE connections don't cause memory leaks
- **Error recovery:** Server recovers from SSE errors gracefully
- **Load testing:** Performance under realistic connection loads

#### **Client disconnection handling:**

bash

```bash
# Test client disconnection detection
test_client_disconnect_detection() {
    # Start SSE connection
    curl -N -H "Accept: text/event-stream" http://localhost:8999/mcp &
    local curl_pid=$!
    
    # Let connection establish
    sleep 2
    
    # Abruptly kill client
    kill -9 $curl_pid
    
    # Verify server detects disconnection within reasonable time
    sleep 10
    
    # Check server logs for disconnect detection
    grep -q "client disconnect" logs/server.log
}
```

---

## 5. **Claude Desktop connects**

### **Súčasný problém:**

- Claude Desktop integration nie je testovaná
- Configuration format môže byť incorrect
- Path resolution issues v Claude Desktop config
- Permission problems s script execution
- Environment variable passing not working

### **Prečo je to problém:**

- **Primary use case broken:** Main integration point doesn't work
- **User frustration:** Setup process fails for end users
- **Support overhead:** Common configuration issues generate support requests
- **Production readiness:** Cannot confidently recommend k users
- **End-to-end functionality:** Full workflow remains untested

### **Čo Claude Desktop connection testing musí overiť:**

#### **Configuration validation:**

bash

```bash
# Test Claude Desktop configuration format
test_claude_desktop_config() {
    local config_file="$HOME/.claude/claude_desktop_config.json"
    
    # Verify config file exists
    [ -f "$config_file" ] || echo "WARNING: Claude Desktop config not found"
    
    # Validate JSON format
    jq . "$config_file" > /dev/null || echo "ERROR: Invalid JSON in config"
    
    # Check MCP server configuration
    jq '.mcpServers["mcp-wrapper"]' "$config_file" > /dev/null || echo "ERROR: MCP wrapper not configured"
    
    # Verify paths are absolute
    local script_path=$(jq -r '.mcpServers["mcp-wrapper"].command' "$config_file")
    [[ "$script_path" = /* ]] || echo "WARNING: Relative path in config may cause issues"
}
```

#### **Script execution testing:**

bash

```bash
# Test script execution s Claude Desktop environment
test_script_execution() {
    local script_path="/absolute/path/to/concurrent_mcp_server.py"
    local working_dir="/absolute/path/to/project"
    
    # Test script is executable
    [ -x "$script_path" ] || echo "ERROR: Script not executable"
    
    # Test script starts in correct directory
    cd "$working_dir"
    python "$script_path" --test-mode &
    local script_pid=$!
    
    # Give script time to initialize
    sleep 5
    
    # Test script responds to basic requests
    echo '{"jsonrpc":"2.0","method":"ping","id":1}' | nc localhost 8999
    
    # Cleanup
    kill $script_pid
}
```

#### **Environment variable testing:**

bash

```bash
# Test environment variable passing
test_environment_variables() {
    # Verify .env file exists a is readable
    [ -f ".env" ] || echo "WARNING: .env file not found"
    
    # Test critical environment variables
    [ -n "$OPENSUBTITLES_API_KEY" ] || echo "WARNING: OPENSUBTITLES_API_KEY not set"
    
    # Test environment loading in script
    python -c "
import os
from dotenv import load_dotenv
load_dotenv()
assert os.getenv('OPENSUBTITLES_API_KEY'), 'API key not loaded'
print('Environment variables loaded successfully')
"
}
```

#### **End-to-end integration testing:**

bash

```bash
# Comprehensive Claude Desktop integration test
test_claude_desktop_integration() {
    echo "Testing Claude Desktop integration..."
    
    # Step 1: Validate configuration
    test_claude_desktop_config
    
    # Step 2: Test script execution
    test_script_execution
    
    # Step 3: Test environment variables
    test_environment_variables
    
    # Step 4: Test MCP protocol communication
    test_mcp_protocol_integration
    
    # Step 5: Test tool availability
    test_tool_discovery_integration
    
    echo "Claude Desktop integration test completed"
}

test_mcp_protocol_integration() {
    # Start server in Claude Desktop mode
    python concurrent_mcp_server.py &
    local server_pid=$!
    
    # Wait for startup
    sleep 3
    
    # Test stdio communication (how Claude Desktop actually communicates)
    echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"claude-desktop","version":"1.0"}},"id":1}' | \
    python -c "
import sys
import json
import subprocess

# Simulate Claude Desktop communication
process = subprocess.Popen(['python', 'concurrent_mcp_server.py'], 
                          stdin=subprocess.PIPE, 
                          stdout=subprocess.PIPE, 
                          stderr=subprocess.PIPE,
                          text=True)

# Send initialize
init_request = sys.stdin.read()
stdout, stderr = process.communicate(init_request)

# Validate response
response = json.loads(stdout)
assert response['result']['protocolVersion'] == '2025-03-26'
print('MCP protocol integration successful')
"
    
    # Cleanup
    kill $server_pid 2>/dev/null
}
```

#### **Real-world workflow testing:**

bash

```bash
# Test actual user workflow
test_user_workflow() {
    echo "Testing complete user workflow..."
    
    # 1. User downloads project
    # 2. User follows README setup instructions
    # 3. User configures .env
    # 4. User updates Claude Desktop config
    # 5. User restarts Claude Desktop
    # 6. User tests tool availability in Claude
    
    # Simulate each step a validate
    simulate_user_setup
    validate_claude_desktop_restart
    test_tool_availability_in_claude
}

simulate_user_setup() {
    # Create temporary directory pre simulation
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Copy project files
    cp -r "$ORIGINAL_PROJECT_DIR"/* .
    
    # Follow setup instructions exactly as written in README
    pip install -r requirements.txt
    cp .env.example .env
    
    # Simulate user editing .env
    sed -i 's/your_opensubtitles_api_key_here/test_api_key/' .env
    
    # Test that setup works
    python mcp_wrapper.py --validate-setup
    
    # Cleanup
    cd - && rm -rf "$temp_dir"
}
```

#### **Common failure scenarios testing:**

- **Path issues:** Relative vs absolute paths v configuration
- **Permission problems:** Script execution permissions
- **Environment loading:** Missing alebo incorrect environment variables
- **Port conflicts:** Port already in use by another service
- **Python environment:** Wrong Python version alebo missing dependencies

---

## 🎯 **Test execution strategy:**

### **Test automation levels:**

```
1. Unit tests (individual functions)
2. Integration tests (component interactions)  
3. System tests (full system functionality)
4. User acceptance tests (real-world scenarios)
```

### **Continuous testing:**

- **Pre-commit hooks:** Run smoke tests before commits
- **CI/CD pipeline:** Full test suite on pull requests
- **Nightly builds:** Comprehensive testing including performance
- **Release validation:** Complete test suite before releases

### **Test environments:**

- **Development:** Fast feedback pre developer machines
- **Staging:** Production-like environment pre integration testing
- **Production:** Monitoring a health checks v live environment

## 📋 **Test execution priorities:**

1. **Health endpoint** - Basic infrastructure validation
2. **MCP initialize** - Core protocol functionality
3. **Automated test script** - Foundation pre other tests
4. **SSE stream** - Real-time communication validation
5. **Claude Desktop connection** - End-to-end user experience

## ⚠️ **Testing best practices:**

- **Deterministic tests:** Tests produce same results every time
- **Fast execution:** Test suite completes v reasonable time
- **Clear failures:** Test failures provide actionable information
- **Independent tests:** Tests don't depend on each other
- **Realistic scenarios:** Tests reflect actual usage patterns