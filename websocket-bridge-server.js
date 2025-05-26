const { Server } = require('socket.io');

// Try port 3001 first, then try alternatives
const tryPorts = [3001, 3002, 3003, 3004];
let currentPort = null;
let io = null;

// Store connected clients
const clients = new Set();

// Function to try starting server on different ports
function startServer() {
  function tryPort(portIndex = 0) {
    if (portIndex >= tryPorts.length) {
      console.error('❌ Could not start server on any available port');
      process.exit(1);
    }

    const port = tryPorts[portIndex];

    try {
      // Create Socket.IO server
      io = new Server(port, {
        cors: {
          origin: "http://localhost:3000", // Next.js dev server
          methods: ["GET", "POST"]
        }
      });

      currentPort = port;
      console.log(`🚀 WebSocket Bridge Server running on port ${port}`);
      if (port !== 3001) {
        console.log(`⚠️  Note: Using port ${port} instead of 3001 (port conflict resolved)`);
        console.log(`💡 Update your MCP server WebSocket connection to: ws://localhost:${port}`);
      }
      console.log('📝 Ready to bridge MCP commands to p5.js AI Editor...\n');

      // Set up the server event handlers
      setupServerHandlers();

    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} is in use, trying next port...`);
        tryPort(portIndex + 1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    }
  }

  tryPort();
}

// Set up server event handlers
function setupServerHandlers() {
  // Handle client connections
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    clients.add(socket);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      clients.delete(socket);
    });

    // Listen for heartbeat pings
    socket.on('ping', (data) => {
      console.log(`💓 Heartbeat from ${socket.id}`);
      socket.emit('pong', data);
    });

    // ===== MCP COMMAND FORWARDING =====
    // These events come from the MCP server and need to be forwarded to the webapp

    // Code update from MCP server
    socket.on('codeUpdate', (data) => {
      console.log('📝 [MCP→WebApp] Code update received, forwarding to webapp clients...');
      console.log(`   Code preview: ${data.code ? data.code.substring(0, 100) + '...' : 'No code'}`);

      // Forward to all OTHER clients (not the sender)
      socket.broadcast.emit('codeUpdate', data);
      console.log(`   ✅ Forwarded to ${clients.size - 1} webapp client(s)`);
    });

    // Execution control commands
    socket.on('startExecution', () => {
      console.log('▶️ [MCP→WebApp] Start execution command, forwarding...');
      socket.broadcast.emit('startExecution');
    });

    socket.on('stopExecution', () => {
      console.log('⏹️ [MCP→WebApp] Stop execution command, forwarding...');
      socket.broadcast.emit('stopExecution');
    });

    socket.on('toggleExecution', () => {
      console.log('🔄 [MCP→WebApp] Toggle execution command, forwarding...');
      socket.broadcast.emit('toggleExecution');
    });

    // Console control commands
    socket.on('clearConsole', () => {
      console.log('🧹 [MCP→WebApp] Clear console command, forwarding...');
      socket.broadcast.emit('clearConsole');
    });

    socket.on('addConsoleMessage', (data) => {
      console.log('📱 [MCP→WebApp] Add console message command, forwarding...');
      socket.broadcast.emit('addConsoleMessage', data);
    });

    socket.on('setConsoleHeight', (height) => {
      console.log(`📏 [MCP→WebApp] Set console height (${height}px), forwarding...`);
      socket.broadcast.emit('setConsoleHeight', height);
    });

    // File management commands
    socket.on('selectFile', (fileId) => {
      console.log(`📂 [MCP→WebApp] Select file (${fileId}), forwarding...`);
      socket.broadcast.emit('selectFile', fileId);
    });

    socket.on('closeTab', (fileId) => {
      console.log(`❌ [MCP→WebApp] Close tab (${fileId}), forwarding...`);
      socket.broadcast.emit('closeTab', fileId);
    });

    socket.on('createFile', (fileData) => {
      console.log(`📄 [MCP→WebApp] Create file (${fileData.name}), forwarding...`);
      socket.broadcast.emit('createFile', fileData);
    });

    socket.on('deleteFile', (fileId) => {
      console.log(`🗑️ [MCP→WebApp] Delete file (${fileId}), forwarding...`);
      socket.broadcast.emit('deleteFile', fileId);
    });

    // Layout control commands
    socket.on('toggleSidebar', () => {
      console.log('📋 [MCP→WebApp] Toggle sidebar, forwarding...');
      socket.broadcast.emit('toggleSidebar');
    });

    socket.on('updateProjectName', (name) => {
      console.log(`📝 [MCP→WebApp] Update project name (${name}), forwarding...`);
      socket.broadcast.emit('updateProjectName', name);
    });

    // Navigation commands
    socket.on('backToDashboard', () => {
      console.log('🏠 [MCP→WebApp] Navigate to dashboard, forwarding...');
      socket.broadcast.emit('backToDashboard');
    });

    // ===== WEBAPP RESPONSES =====
    // These events come from the webapp and can be logged or forwarded to MCP server

    socket.on('projectState', (data) => {
      console.log('📥 [WebApp→MCP] Received project state:', data.projectName, `(${data.files?.length || 0} files)`);
      // Could forward this to MCP server if needed
    });

    socket.on('getProjectState', () => {
      console.log('📝 [WebApp→MCP] Client requesting project state...');
    });

    // Catch-all for any other events
    socket.onAny((eventName, ...args) => {
      if (!['ping', 'pong'].includes(eventName)) {
        console.log(`📨 [Unknown] Received event: ${eventName}`, args.length > 0 ? `(${args.length} args)` : '');
      }
    });
  });

  // Handle server errors
  io.engine.on('connection_error', (err) => {
    console.log('🔌 Connection error:', err.req, err.code, err.message, err.context);
  });
}

// Show status
function showStatus() {
  console.log(`\n📊 Bridge Server Status:`);
  console.log(`   Connected clients: ${clients.size}`);
  console.log(`   Server port: ${currentPort}`);
  console.log(`   CORS origin: http://localhost:3000`);
  console.log(`   Mode: MCP Command Bridge`);
  console.log(`   Function: Forwards MCP commands to webapp\n`);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bridge server...');
  if (io) {
    io.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bridge server...');
  if (io) {
    io.close();
  }
  process.exit(0);
});

// Start the server
startServer();

// Show initial status
setTimeout(() => {
  showStatus();
  console.log('💡 Instructions:');
  console.log('   1. Start your p5.js editor at http://localhost:3000');
  console.log('   2. Enable MCP in the editor');
  console.log('   3. Use Claude Desktop with MCP tools');
  console.log('   4. Commands will be automatically bridged!\n');
}, 1000); 