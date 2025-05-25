#!/usr/bin/env node

// Simple test script to verify the MCP server can start
// This simulates what Claude Desktop would do

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing p5.js MCP Server...\n');

// Start the MCP server
const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasStarted = false;
let hasConnected = false;

// Handle server output
server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('Server:', output.trim());

  if (output.includes('Starting p5.js MCP Server')) {
    hasStarted = true;
  }

  if (output.includes('p5.js MCP Server is running')) {
    hasConnected = true;
    console.log('\n✅ Server started successfully!');
    console.log('🔌 Attempting to connect to WebSocket...');

    // Give it a moment to try WebSocket connection
    setTimeout(() => {
      console.log('\n📋 Test Summary:');
      console.log(`   ✅ Server startup: ${hasStarted ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   ✅ MCP connection: ${hasConnected ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   ⚠️  WebSocket: Will connect when p5.js editor is running`);
      console.log('\n💡 To test with Claude Desktop:');
      console.log('   1. Start your p5.js editor at http://localhost:3000');
      console.log('   2. Enable MCP in the editor');
      console.log('   3. Configure Claude Desktop with this server');
      console.log('\n👋 Stopping test server...');

      server.kill('SIGTERM');
    }, 3000);
  }
});

server.stdout.on('data', (data) => {
  console.log('Server stdout:', data.toString().trim());
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🏁 Server exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Stopping test...');
  server.kill('SIGTERM');
});

// Send a simple initialize message to test MCP protocol
setTimeout(() => {
  if (hasConnected) {
    console.log('\n📡 Sending test MCP message...');
    const initMessage = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };

    server.stdin.write(JSON.stringify(initMessage) + '\n');
  }
}, 1000); 