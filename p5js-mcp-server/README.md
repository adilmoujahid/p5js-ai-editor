# p5.js MCP Server

A simple Model Context Protocol (MCP) server that acts as a WebSocket server for the p5.js AI Editor webapp. This allows sending p5.js code directly from Claude Desktop to the webapp for immediate execution.

## Features

### 🛠️ **MCP Tool**

| Tool | Description | Usage |
|------|-------------|-------|
| `send_p5js_code` | Send p5.js code to connected webapp for execution | Send code from Claude Desktop to webapp |

### 🔌 **WebSocket Server**

The server acts as a WebSocket server (similar to `test_websocket_server.py`) that:
- **Accepts connections** from the p5.js AI Editor webapp
- **Receives MCP commands** from Claude Desktop 
- **Forwards p5.js code** to connected webapp clients
- **Provides real-time feedback** on connection status

## Architecture

```
Claude Desktop → MCP Server → WebSocket → p5.js AI Editor Webapp
```

1. **Claude Desktop** calls MCP tools
2. **MCP Server** acts as WebSocket server on localhost:3001-3004
3. **Webapp** connects to the WebSocket server
4. **Code is sent** from Claude Desktop through MCP to the webapp

## Installation

### Prerequisites
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager

### Setup

1. **Navigate to the MCP server directory**:
   ```bash
   cd p5js-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   uv sync
   ```

## Usage

### Running the MCP Server

```bash
# Start the MCP server (includes WebSocket server)
uv run python server.py
```

The server will:
- ✅ Start a WebSocket server on ports 3001-3004 (auto-detection)
- ✅ Wait for webapp connections
- ✅ Provide MCP tools to Claude Desktop
- ✅ Forward commands between Claude Desktop and webapp

### Connecting the Webapp

1. **Start the p5.js AI Editor webapp** (on localhost:3000)
2. **Connect the webapp** to `ws://localhost:3001` (or the port shown in server output)
3. **The server will show**: `✅ Webapp connected: [client-id]`

### Using from Claude Desktop

Once both the MCP server and webapp are running and connected:

```
Send this p5.js code to the webapp:

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}
```

Claude Desktop will use the `send_p5js_code` tool to send the code to your webapp instantly!

### Integration with Claude Desktop

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "p5js-ai-editor": {
      "command": "uv",
      "args": ["run", "python", "/path/to/p5js-mcp-server/server.py"],
      "cwd": "/path/to/p5js-mcp-server"
    }
  }
}
```

### WebSocket Test Server

For testing and debugging WebSocket connections between this MCP server and the p5.js AI Editor web app, use the Python test server:

```bash
# Run the Python WebSocket test server
uv run python test_websocket_server.py
```

**Purpose:** This test server simulates WebSocket communication with the p5.js AI Editor web app, allowing you to:
- **Test WebSocket connectivity** between the MCP server and web app
- **Debug connection issues** in a controlled environment  
- **Send test commands** to verify the web app responds correctly
- **Simulate real MCP interactions** without running the full MCP server

**Key Features:**
- **Interactive CLI interface** with 15+ test commands
- **Code injection testing** (6 predefined p5.js examples + custom code)
- **Execution controls** (start/stop/toggle sketch execution)
- **Console manipulation** (clear messages, add test messages, resize console)
- **File operations** (create, delete, select files in the web app)
- **Layout controls** (toggle sidebar, update project name)
- **Connection monitoring** (real-time client connection tracking)
- **Reliable aiohttp-based server** (stable Socket.IO implementation)

**Test Commands:**
- `1-6`: Send predefined p5.js code samples to connected web app
- `custom`: Enter and send custom p5.js code
- `start/stop/toggle`: Test execution control commands
- `clearconsole/consolemsg`: Test console management
- `selectfile/createfile/deletefile`: Test file operations
- `sidebar/projectname`: Test UI layout controls
- `status`: Show WebSocket connection status
- `exit`: Quit test server

**Connection:** The server automatically tries ports 3001-3004 and configures CORS for `localhost:3000` (where the web app runs). When the web app connects, you'll see real-time connection status and can send test commands to verify the WebSocket integration works correctly.

## API Reference

### MCP Tool

#### `send_p5js_code(code: str)`
Send p5.js code to the connected webapp for immediate execution.

**Parameters:**
- `code` (str): The p5.js code to send to the webapp

**Returns:** 
- Success message with code preview if webapp is connected
- Error message if no webapp is connected

**Example:**
```python
# This tool is called automatically by Claude Desktop
# when you ask it to send code to the webapp
```

## Development

### Server Architecture

The server combines:
- **FastMCP** for MCP protocol handling
- **python-socketio** for WebSocket communication  
- **aiohttp** for reliable async web server
- **Automatic port detection** for conflict resolution

### Adding Features

To add more MCP tools, follow this pattern:

```python
@mcp.tool()
async def new_tool(param: str) -> str:
    """
    Description of what the tool does.
    
    Args:
        param: Description of parameter
        
    Returns:
        Description of return value
    """
    # Tool implementation
    if connected_clients:
        await sio.emit('newEvent', {'data': param})
        return "✅ Success message"
    else:
        return "❌ No webapp connected"
```

### Debugging

1. **Check server logs** - All output goes to stderr
2. **Use test server** - `python test_websocket_server.py` for isolated testing
3. **Verify connections** - Server shows connection status
4. **Test ports** - Server auto-tries 3001-3004

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test with both MCP and WebSocket functionality
4. Submit a pull request

## License

This project follows the same MIT license as the main p5.js AI Editor project.
