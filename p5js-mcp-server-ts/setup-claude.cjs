#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 p5.js MCP Server - Claude Desktop Setup\n');

// Get the absolute path to the compiled server
const serverPath = path.resolve(__dirname, 'dist', 'index.js');
const projectPath = path.resolve(__dirname);

console.log('📍 Server location:', serverPath);
console.log('📁 Project directory:', projectPath);

// Check if the server is built
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server not built! Please run: npm run build');
  process.exit(1);
}

// Generate Claude Desktop configuration
const config = {
  mcpServers: {
    "p5js-editor": {
      command: "node",
      args: [serverPath],
      env: {}
    }
  }
};

// Alternative configuration using npm start
const configNpm = {
  mcpServers: {
    "p5js-editor": {
      command: "npm",
      args: ["start"],
      cwd: projectPath,
      env: {}
    }
  }
};

console.log('\n📋 Claude Desktop Configuration:');
console.log('=====================================');
console.log(JSON.stringify(config, null, 2));

console.log('\n📋 Alternative Configuration (using npm):');
console.log('==========================================');
console.log(JSON.stringify(configNpm, null, 2));

// Save configuration to file
const configPath = path.join(__dirname, 'claude-desktop-config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`\n💾 Configuration saved to: ${configPath}`);

// Determine Claude Desktop config location
let claudeConfigPath;
if (os.platform() === 'darwin') {
  claudeConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
} else if (os.platform() === 'win32') {
  claudeConfigPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
} else {
  claudeConfigPath = 'Unknown platform - check Claude Desktop documentation';
}

console.log('\n🔧 Setup Instructions:');
console.log('======================');
console.log('1. Copy the configuration above');
console.log('2. Open Claude Desktop settings (Claude menu → Settings)');
console.log('3. Go to Developer tab');
console.log('4. Click "Edit Config"');
console.log('5. Paste the configuration');
console.log('6. Save and restart Claude Desktop');
console.log(`\nClaude config location: ${claudeConfigPath}`);

console.log('\n🚀 Testing:');
console.log('===========');
console.log('1. Start your p5.js editor: npm run dev (in main project)');
console.log('2. Enable MCP in the editor');
console.log('3. Open Claude Desktop');
console.log('4. Look for the hammer icon (🔨) in the chat input');
console.log('5. Try: "Check the connection status"');

console.log('\n✅ Setup complete! The MCP server is ready to use.');

// Test if we can run the server
console.log('\n🧪 Quick test...');
const { spawn } = require('child_process');

const testServer = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let testPassed = false;

testServer.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('p5.js MCP Server is running')) {
    testPassed = true;
    console.log('✅ Server test passed!');
    testServer.kill('SIGTERM');
  }
});

testServer.on('error', (error) => {
  console.error('❌ Server test failed:', error.message);
});

setTimeout(() => {
  if (!testPassed) {
    console.error('❌ Server test timed out');
    testServer.kill('SIGTERM');
  }
}, 5000); 