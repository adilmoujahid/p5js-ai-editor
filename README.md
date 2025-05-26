# p5.js AI Editor

A modern, web-based IDE for creating and editing p5.js sketches with AI assistance and Model Context Protocol (MCP) integration for Claude Desktop.

## Features

### 🎨 **Full-Featured p5.js Editor**
- Live preview with instant code execution
- File management (create, delete, rename files and folders)
- Tabbed interface for multiple files
- Start/Stop execution controls with visual indicators
- Auto-save functionality

### 🔍 **Development Tools**
- Real-time console with error display and console.log output
- Color-coded log messages (errors, warnings, info)
- Resizable panels with optimal workflow layout
- Auto-scroll console with clear functionality

### 📁 **Project Management**
- Multi-project support with dashboard view
- Project cards with preview, metadata, and actions
- Duplicate and delete projects
- Auto-save to localStorage with project isolation
- Dynamic routing (`/` for dashboard, `/project/[id]` for editing)

### 🤖 **Claude Desktop Integration (MCP)**
- **TypeScript MCP Server**: Control your editor directly from Claude Desktop
- **13 AI Tools**: Code updates, execution control, file management, UI control
- **Natural Language Commands**: "Update the code to create a bouncing ball"
- **Real-time WebSocket Bridge**: Instant communication between Claude and your editor
- **Project State Sharing**: Claude can see and modify your current project

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Claude Desktop app

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd p5js-ai-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - The dashboard will show your projects or allow you to create a new one

## Claude Desktop Integration Setup

### 1. Build the MCP Server

```bash
cd p5js-mcp-server-ts
npm install
npm run build
```

### 2. Configure Claude Desktop

1. **Generate configuration**:
   ```bash
   cd p5js-mcp-server-ts
   node setup-claude.cjs
   ```

2. **Copy the configuration output**

3. **Add to Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings (Claude menu → Settings)
   - Click Developer tab
   - Click "Edit Config"
   - Paste the configuration
   - Save and restart Claude Desktop

### 3. Complete Workflow

**Start all components in this order:**

1. **Start the webapp**:
   ```bash
   npm run dev  # Runs on http://localhost:3000
   ```

2. **Start the WebSocket bridge**:
   ```bash
   node websocket-bridge-server.js  # Runs on port 3001
   ```

3. **Open your project**:
   - Go to http://localhost:3000
   - Open or create a project
   - Click "Enable MCP" button

4. **Use Claude Desktop**:
   - Open Claude Desktop
   - Look for the hammer icon (🔨) in the chat input
   - Try commands like:
     - "Update the code to create a bouncing ball animation"
     - "Clear the console and start execution"
     - "Create a new file called 'utils.js'"

## MCP Tools Available in Claude Desktop

### 🛠️ **Code Management**
- `update_code`: Update p5.js code in the editor
- `select_file`: Switch to a specific file
- `create_file`: Create new files
- `delete_file`: Delete files

### ▶️ **Execution Control**
- `start_execution`: Start code execution
- `stop_execution`: Stop code execution  
- `toggle_execution`: Toggle execution state

### 📱 **Console Management**
- `clear_console`: Clear console messages
- `add_console_message`: Add custom messages to console

### 🎛️ **Layout Control**
- `toggle_sidebar`: Show/hide file explorer
- `update_project_name`: Change project name

### 🧭 **Navigation & System**
- `go_to_dashboard`: Navigate back to dashboard
- `check_connection`: Check WebSocket connection status

### 💬 **Example Commands for Claude**

```
"Update the code to create a colorful particle system"
"Clear the console and start execution"
"Create a new file called 'particles.js' with a basic particle class"
"Toggle the sidebar and check the connection status"
"Stop execution and update the project name to 'My Art Project'"
```

## Architecture

```
Claude Desktop ↔ MCP Server (TypeScript) ↔ WebSocket Bridge ↔ p5.js Editor
```

- **Claude Desktop**: Connects to MCP Server via stdio transport
- **MCP Server**: Translates natural language into WebSocket commands
- **WebSocket Bridge**: Forwards commands between MCP server and webapp
- **p5.js Editor**: Receives commands and updates UI/code in real-time

## WebSocket Testing (Development)

For testing without Claude Desktop, use the interactive test server:

```bash
node test-websocket-server.js
```

### Test Commands
| Command | Description |
|---------|-------------|
| `1-6` | Send predefined p5.js code samples |
| `start/stop/toggle` | Control execution |
| `clearconsole` | Clear console messages |
| `sidebar` | Toggle file explorer |
| `status` | Show connection status |

## Project Structure

```
p5js-ai-editor/
├── app/                          # Next.js app directory
│   ├── project/[id]/            # Dynamic project routes
│   └── page.tsx                 # Dashboard page
├── components/
│   ├── dashboard-ui/            # Dashboard components
│   ├── editor-ui/               # Editor components
│   │   └── WebSocketListener.tsx # MCP WebSocket client
│   └── ui/                      # Shared UI components
├── p5js-mcp-server-ts/          # TypeScript MCP Server
│   ├── src/index.ts             # Main MCP server
│   ├── dist/                    # Compiled output
│   └── setup-claude.cjs         # Claude Desktop setup script
├── websocket-bridge-server.js   # WebSocket bridge server
├── test-websocket-server.js     # Development test server
└── README.md
```

## Development

### Architecture

- **Frontend**: Next.js 14 with App Router
- **UI Framework**: Shadcn UI + TailwindCSS
- **State Management**: React useState with localStorage persistence
- **WebSocket**: Socket.IO client/server
- **MCP Integration**: TypeScript SDK with stdio transport
- **Code Editor**: HTML textarea (ready for Monaco/CodeMirror integration)
- **Preview**: Iframe with p5.js CDN injection

### Key Components

- **ProjectDashboard**: Main landing page with project overview
- **ProjectManager**: Core editor with file management and layout
- **WebSocketListener**: Handles MCP server connections and code updates
- **Console**: Real-time log display with message categorization
- **Preview**: Sandboxed p5.js execution environment

## API Reference

### WebSocket Events

#### MCP Server → WebSocket Bridge → Webapp

- **Code Updates**:
  - `codeUpdate`: Update editor code
    ```javascript
    { code: string }
    ```

- **Execution Control**:
  - `startExecution`, `stopExecution`, `toggleExecution`

- **Console Control**:
  - `clearConsole`
  - `addConsoleMessage`: Add console message
    ```javascript
    { type: 'info'|'warn'|'error', message: string, timestamp: number }
    ```

- **File Control**:
  - `selectFile`: Switch to file (`"sketch.js"`)
  - `createFile`: Create new file (`{ name: string, content: string }`)
  - `deleteFile`: Delete file (`"filename.js"`)

- **Layout Control**:
  - `toggleSidebar`, `updateProjectName`, `backToDashboard`

### localStorage Schema

```typescript
interface Project {
  id: string;
  name: string;
  files: { [filename: string]: string };
  openTabs: string[];
  activeTab: string;
  createdAt: string;
  lastModified: string;
}
```

## Troubleshooting

### MCP Server Not Showing in Claude
- Check Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log`
- Verify configuration file syntax
- Ensure absolute paths are correct
- Try running server manually: `npm start` in `p5js-mcp-server-ts/`

### WebSocket Connection Issues
- Start components in correct order (webapp → bridge → enable MCP)
- Check that bridge server is running on port 3001
- Verify "Enable MCP" button is clicked in webapp
- Use `check_connection` tool in Claude Desktop

### Commands Not Working
- Ensure all three components are running (webapp, bridge, MCP enabled)
- Check bridge server logs for `[MCP→WebApp]` forwarding messages
- Verify Claude Desktop shows hammer icon (🔨)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Test with Claude Desktop integration
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [p5.js](https://p5js.org/) - Creative coding library  
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Socket.IO](https://socket.io/) - WebSocket implementation
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI integration standard
- [Claude Desktop](https://claude.ai/) - AI assistant platform
