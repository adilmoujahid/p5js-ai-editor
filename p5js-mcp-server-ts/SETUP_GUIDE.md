# Quick Setup Guide

## 🚀 Get Started in 3 Steps

### 1. Build the Server
```bash
cd p5js-mcp-server-ts
npm run build
```

### 2. Configure Claude Desktop
```bash
node setup-claude.cjs
```
Copy the configuration output and paste it into Claude Desktop settings.

### 3. Test the Integration
1. Start your p5.js editor: `npm run dev` (in main project)
2. Enable MCP in the editor
3. Open Claude Desktop
4. Try: "Check the connection status"

## 🛠️ Available Tools

- **update_code**: Update p5.js code in the editor
- **start_execution/stop_execution/toggle_execution**: Control code execution
- **clear_console/add_console_message**: Manage console
- **select_file/create_file/delete_file**: File management
- **toggle_sidebar**: Show/hide file explorer
- **update_project_name**: Change project name
- **go_to_dashboard**: Navigate to dashboard
- **check_connection**: Check WebSocket status

## 💬 Example Commands for Claude

```
"Update the code to create a bouncing ball animation"
"Clear the console and start execution"
"Create a new file called 'utils.js' with helper functions"
"Toggle the sidebar and check the connection status"
```

## 🔧 Troubleshooting

- **Server not showing in Claude**: Check logs at `~/Library/Logs/Claude/mcp*.log`
- **WebSocket connection failed**: Make sure p5.js editor is running and MCP is enabled
- **Command not found**: Verify Node.js is installed and paths are correct

## 📁 Architecture

```
Claude Desktop ↔ MCP Server (TypeScript) ↔ WebSocket ↔ p5.js Editor
```

The MCP server acts as a bridge between Claude Desktop and your p5.js editor, translating natural language commands into WebSocket messages that control your editor. 