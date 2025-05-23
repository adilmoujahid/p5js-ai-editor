# p5.js AI Editor

A modern, web-based IDE for creating and editing p5.js sketches with AI assistance and WebSocket integration for Model Context Protocol (MCP) servers.

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

### 🔌 **WebSocket Integration**
- Socket.IO client for MCP server connections
- Visual connection status indicator
- Auto-reconnection with retry logic
- Real-time code synchronization
- **Remote UI control**: Control editor interface via WebSocket commands
- Project state sharing capability

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd p5js-ai-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open the application**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - The dashboard will show your projects or allow you to create a new one

## WebSocket Testing

The editor includes a built-in WebSocket client that connects to MCP servers. For testing and development, use the included test server:

### Setting Up the Test Server

1. **Install Socket.IO dependency**
   ```bash
   npm install socket.io
   ```

2. **Run the test server**
   ```bash
   node test-websocket-server.js
   ```
   The server will start on port 3001 and display connection status.

3. **Connect from the editor**
   - Open a project in the editor (http://localhost:3000/project/[id])
   - Click the "Enable MCP" button to start WebSocket connection
   - Look for the green connection indicator

### Test Server Features

The test server provides an interactive command interface with **20+ commands** for testing both code updates and UI controls:

#### 📝 **Code Commands**
| Command | Description |
|---------|-------------|
| `1-6` | Send predefined p5.js code samples |
| `custom` | Enter your own custom code (type `END` to finish) |

#### ▶️ **Execution Commands**
| Command | Description |
|---------|-------------|
| `start` | Start code execution |
| `stop` | Stop code execution |
| `toggle` | Toggle execution state |

#### 📱 **Console Commands**
| Command | Description |
|---------|-------------|
| `clearconsole` | Clear console messages |
| `consolemsg` | Add test console message |
| `consoleheight` | Set console height to 200px |

#### 📂 **File Commands**
| Command | Description |
|---------|-------------|
| `selectfile` | Select sketch.js file |
| `closetab` | Close current tab |
| `createfile` | Create new test file |
| `deletefile` | Delete test file |

#### 🎛️ **Layout Commands**
| Command | Description |
|---------|-------------|
| `sidebar` | Toggle file explorer sidebar |
| `projectname` | Update project name |

#### 🧭 **Navigation Commands**
| Command | Description |
|---------|-------------|
| `dashboard` | Navigate back to dashboard |

#### ℹ️ **System Commands**
| Command | Description |
|---------|-------------|
| `status` | Show connection status and client count |
| `clear` | Clear the terminal console |
| `exit` | Shutdown the server |

### Sample Code Snippets

The test server includes 6 ready-to-use p5.js examples:

1. **Basic Drawing**: Mouse-following red circle
2. **HSB Animation**: Colorful animated bars with HSB color mode
3. **Wave Pattern**: Animated sine wave lines
4. **Particle System**: Interactive bouncing particles
5. **Generative Art**: Random colorful circles
6. **3D Graphics**: Rotating cube with WebGL

### WebSocket UI Controls

The editor supports **remote control of the user interface** through WebSocket events. This enables AI systems or external tools to:

- **Control code execution** (start/stop/toggle)
- **Manage console output** (clear, add messages, resize)
- **Navigate files and tabs** (select, close, create, delete)
- **Adjust layout** (toggle sidebar, resize panels)
- **Control project state** (rename, navigate)

| UI Element | WebSocket Event | Description | Status |
|------------|-----------------|-------------|---------|
| **📝 Code Editor** | `codeUpdate` | Update active file content | ✅ **Active** |
| **▶️ Start/Stop Buttons** | `startExecution`, `stopExecution`, `toggleExecution` | Control code execution | ✅ **Active** |
| **📱 Console Messages** | `clearConsole`, `addConsoleMessage` | Manage console output | ✅ **Active** |
| **📏 Console Height** | `setConsoleHeight` | Resize console panel | ✅ **Active** |
| **📂 Active File/Tab** | `selectFile`, `closeTab` | Switch between files | ✅ **Active** |
| **🗂️ File Creation/Deletion** | `createFile`, `deleteFile` | Manage project files | ✅ **Active** |
| **📋 Sidebar Toggle** | `toggleSidebar` | Show/hide file explorer | ✅ **Active** |
| **🎨 Project Name** | `updateProjectName` | Change project title | ✅ **Active** |
| **🧭 Navigation** | `backToDashboard` | Route navigation | ✅ **Active** |
| **🔗 Connection Status** | Built-in | Visual connection indicator | ✅ **Auto** |

### Testing Workflow

1. Start both the Next.js dev server and test WebSocket server
2. Open a project and enable MCP connection
3. Use test server commands to send code updates and control UI
4. Watch the editor receive and respond to commands in real-time
5. Verify console output and connection status

**Example Testing Session:**
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start WebSocket test server
node test-websocket-server.js

# In test server, try these commands:
> 1              # Load sample code
> start           # Start execution
> clearconsole    # Clear console
> sidebar         # Toggle file explorer
> projectname     # Rename project
> dashboard       # Go to dashboard
```

## Project Structure

```
p5js-ai-editor/
├── app/                          # Next.js app directory
│   ├── project/[id]/            # Dynamic project routes
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Dashboard page
├── components/
│   ├── dashboard-ui/            # Dashboard-specific components
│   │   ├── ProjectCard.tsx      # Project preview cards
│   │   └── ProjectDashboard.tsx # Main dashboard layout
│   ├── editor-ui/               # Editor-specific components
│   │   ├── Console.tsx          # Console panel with logs
│   │   ├── FileExplorer.tsx     # File tree navigation
│   │   ├── Preview.tsx          # p5.js sketch preview
│   │   ├── ProjectManager.tsx   # Main editor layout
│   │   ├── Tabs.tsx             # File tabs with controls
│   │   └── WebSocketListener.tsx # MCP WebSocket client
│   └── ui/                      # Shared UI components (Shadcn)
├── lib/                         # Utility functions
├── test-websocket-server.js     # WebSocket test server
└── README.md                    # This documentation
```

## Development

### Architecture

- **Frontend**: Next.js 14 with App Router
- **UI Framework**: Shadcn UI + TailwindCSS
- **State Management**: React useState with localStorage persistence
- **WebSocket**: Socket.IO client/server
- **Code Editor**: HTML textarea (ready for Monaco/CodeMirror integration)
- **Preview**: Iframe with p5.js CDN injection

### Key Components

- **ProjectDashboard**: Main landing page with project overview
- **ProjectManager**: Core editor with file management and layout
- **WebSocketListener**: Handles MCP server connections and code updates
- **Console**: Real-time log display with message categorization
- **Preview**: Sandboxed p5.js execution environment

### Storage System

Projects are stored in localStorage with two levels:
- `'current_project'`: Auto-save for active editing session
- `'p5_projects'`: Persistent collection of saved projects

## API Reference

### WebSocket Events

#### Client → Server
- `projectState`: Send current project data
- `getProjectState`: Request project state from server

#### Server → Client (Code Updates)
- `codeUpdate`: Receive new code from MCP server
  ```javascript
  {
    code: string  // Complete p5.js sketch code
  }
  ```

#### Server → Client (UI Controls)
- **Execution Control**:
  - `startExecution`: Start code execution
  - `stopExecution`: Stop code execution  
  - `toggleExecution`: Toggle execution state

- **Console Control**:
  - `clearConsole`: Clear console messages
  - `addConsoleMessage`: Add console message
    ```javascript
    {
      type: 'info' | 'warn' | 'error',
      message: string,
      timestamp: number
    }
    ```
  - `setConsoleHeight`: Set console panel height
    ```javascript
    200  // Height in pixels
    ```

- **File Control**:
  - `selectFile`: Select/switch to file
    ```javascript
    "sketch.js"  // File ID to select
    ```
  - `closeTab`: Close file tab
    ```javascript
    "sketch.js"  // File ID to close
    ```
  - `createFile`: Create new file
    ```javascript
    {
      name: "newfile.js",
      content: "// File content"
    }
    ```
  - `deleteFile`: Delete file
    ```javascript
    "filename.js"  // File ID to delete
    ```

- **Layout Control**:
  - `toggleSidebar`: Toggle file explorer sidebar
  - `updateProjectName`: Update project name
    ```javascript
    "New Project Name"  // New project title
    ```

- **Navigation Control**:
  - `backToDashboard`: Navigate to project dashboard

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the established patterns
4. Test with the WebSocket test server
5. Submit a pull request

## Future Enhancements

- **AI Integration**: Connect to language models for code generation
- **Advanced Editor**: Monaco Editor with syntax highlighting and autocomplete
- **Export Options**: Download projects as ZIP files
- **Collaboration**: Real-time collaborative editing
- **Version Control**: Basic git-like project versioning
- **Asset Management**: Upload and manage images/sounds
- **Template Library**: Pre-built p5.js project templates

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [p5.js](https://p5js.org/) - Creative coding library  
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Socket.IO](https://socket.io/) - WebSocket implementation
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
