# p5.js MCP Server (TypeScript)

A Model Context Protocol (MCP) server that allows Claude Desktop to control your p5.js AI Editor through WebSocket communication.

## Architecture

```
Claude Desktop ↔ MCP Server (TypeScript) ↔ WebSocket ↔ p5.js Editor (Next.js)
```

- **Claude Desktop**: Connects to MCP Server via stdio transport
- **MCP Server**: Translates MCP tool calls into WebSocket messages
- **WebSocket**: Real-time communication with the p5.js editor
- **p5.js Editor**: Your Next.js webapp that receives commands and sends project state

## Features

### 🛠️ Available Tools

1. **Code Management**
   - `update_code`: Update the p5.js code in the editor
   - `select_file`: Switch to a specific file
   - `create_file`: Create new files
   - `delete_file`: Delete files

2. **Execution Control**
   - `start_execution`: Start code execution
   - `stop_execution`: Stop code execution  
   - `toggle_execution`: Toggle execution state

3. **Console Management**
   - `clear_console`: Clear console messages
   - `add_console_message`: Add custom messages to console

4. **Layout Control**
   - `toggle_sidebar`: Show/hide file explorer
   - `update_project_name`: Change project name

5. **Navigation**
   - `go_to_dashboard`: Navigate back to dashboard

6. **System**
   - `check_connection`: Check WebSocket connection status

### 📚 Resources

- `project-state`: Current connection status and available tools

### 💬 Prompts

- `generate-p5js-code`: Generate p5.js code with specific requirements
- `debug-p5js-code`: Debug existing p5.js code

## Setup Instructions

### 1. Install Dependencies

```bash
cd p5js-mcp-server-ts
npm install
```

### 2. Build the Server

```bash
npm run build
```

### 3. Test the Server (Optional)

```bash
npm run dev
```

### 4. Configure Claude Desktop

1. Open Claude Desktop settings (Claude menu → Settings)
2. Go to Developer tab
3. Click "Edit Config"
4. Add the MCP server configuration:

**macOS/Linux:**
```json
{
  "mcpServers": {
    "p5js-editor": {
      "command": "node",
      "args": ["/absolute/path/to/p5js-mcp-server-ts/dist/index.js"],
      "env": {}
    }
  }
}
```

**Alternative using npm start:**
```json
{
  "mcpServers": {
    "p5js-editor": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/absolute/path/to/p5js-mcp-server-ts",
      "env": {}
    }
  }
}
```

**Replace `/absolute/path/to/p5js-mcp-server-ts` with your actual path.**

### 5. Restart Claude Desktop

Close and reopen Claude Desktop for the configuration to take effect.

## Usage

### Prerequisites

1. **Start your p5.js editor**: Make sure your Next.js app is running at `http://localhost:3000`
2. **Enable MCP in editor**: Click the "Enable MCP" button in your p5.js editor
3. **WebSocket server**: Ensure the WebSocket server is running on port 3001

### Example Commands for Claude

Once configured, you can use these commands in Claude Desktop:

```
"Update the code to create a bouncing ball animation"

"Clear the console and start execution"

"Create a new file called 'utils.js' with helper functions"

"Toggle the sidebar and update the project name to 'My Art Project'"

"Check the connection status"
```

### Using Prompts

You can also use the built-in prompts:

```
"Use the generate-p5js-code prompt to create an interactive particle system"

"Use the debug-p5js-code prompt to fix this code: [paste your code]"
```

## Development

### Project Structure

```
p5js-mcp-server-ts/
├── src/
│   └── index.ts          # Main MCP server
├── dist/                 # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with auto-reload
- `npm start`: Run the compiled server
- `npm test`: Run tests (placeholder)

### Configuration

The server connects to your p5.js editor WebSocket at `http://localhost:3001` by default. You can modify this in `src/index.ts`:

```typescript
const EDITOR_WEBSOCKET_URL = "http://localhost:3001";
```

## Troubleshooting

### MCP Server Not Showing in Claude

1. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

2. Verify the configuration file syntax
3. Ensure the file paths are absolute and correct
4. Try running the server manually: `npm start`

### WebSocket Connection Issues

1. Ensure your p5.js editor is running at `http://localhost:3000`
2. Check that MCP is enabled in the editor
3. Verify the WebSocket server is accessible at port 3001
4. Use the `check_connection` tool to see connection status

### Common Issues

- **"Command not found"**: Make sure Node.js is installed and the path is correct
- **"Permission denied"**: Ensure the script has execute permissions
- **"Module not found"**: Run `npm install` to install dependencies
- **"Connection refused"**: Start your p5.js editor and enable MCP

## WebSocket Events

The MCP server sends these events to your p5.js editor:

- `codeUpdate`: Update code content
- `startExecution`, `stopExecution`, `toggleExecution`: Control execution
- `clearConsole`, `addConsoleMessage`: Console management
- `selectFile`, `createFile`, `deleteFile`: File operations
- `toggleSidebar`, `updateProjectName`: Layout control
- `backToDashboard`: Navigation

Make sure your WebSocketListener component handles these events.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Claude Desktop
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 