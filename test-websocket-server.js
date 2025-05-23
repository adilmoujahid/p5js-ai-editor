const { Server } = require('socket.io');
const readline = require('readline');

// Create Socket.IO server
const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000", // Next.js dev server
    methods: ["GET", "POST"]
  }
});

console.log('🚀 Test WebSocket Server running on port 3001');
console.log('📝 Waiting for connections from p5.js AI Editor...\n');

// Store connected clients
const clients = new Set();

// Handle client connections
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  clients.add(socket);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    clients.delete(socket);
  });

  // Listen for any messages from client (optional)
  socket.onAny((eventName, ...args) => {
    console.log(`📨 Received event: ${eventName}`, args);
  });

  // Listen for project state from client (for future MCP features)
  socket.on('projectState', (data) => {
    console.log('📥 Received project state:', data.projectName, `(${data.files.length} files)`);
  });

  // Request current project state
  socket.on('getProjectState', () => {
    console.log('📝 Client requesting project state...');
  });
});

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Sample code snippets for testing
const sampleCodes = {
  '1': `function setup() {
  createCanvas(800, 600);
  background(220);
}

function draw() {
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}`,

  '2': `function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
}

function draw() {
  background(frameCount % 360, 80, 90);
  
  for (let i = 0; i < 10; i++) {
    fill(i * 36, 100, 100);
    rect(i * 40, height/2, 30, 100);
  }
}`,

  '3': `function setup() {
  createCanvas(600, 400);
}

function draw() {
  background(0);
  stroke(255);
  
  for (let i = 0; i < width; i += 20) {
    line(i, 0, i + sin(frameCount * 0.01 + i * 0.1) * 100, height);
  }
}`,

  '4': `// Interactive particle system
let particles = [];

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-2, 2),
      vy: random(-2, 2)
    });
  }
}

function draw() {
  background(0, 20);
  
  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    
    fill(255);
    circle(p.x, p.y, 5);
  }
}`,

  '5': `// Generative art example
function setup() {
  createCanvas(800, 800);
  background(0);
  noLoop();
}

function draw() {
  for (let i = 0; i < 1000; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(2, 20);
    
    fill(random(255), random(255), random(255), 150);
    noStroke();
    ellipse(x, y, size, size);
  }
}`,

  '6': `// 3D rotating cube
function setup() {
  createCanvas(600, 600, WEBGL);
}

function draw() {
  background(50);
  
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  
  fill(255, 100, 100);
  box(200);
}`
};

function showMenu() {
  console.log('\n🎮 Test Commands:');
  console.log('📝 Code Commands:');
  console.log('  1-6: Send predefined code samples');
  console.log('  custom: Enter custom code');
  console.log('');
  console.log('▶️ Execution Commands:');
  console.log('  start: Start code execution');
  console.log('  stop: Stop code execution');
  console.log('  toggle: Toggle execution state');
  console.log('');
  console.log('📱 Console Commands:');
  console.log('  clearconsole: Clear console messages');
  console.log('  consolemsg: Add test console message');
  console.log('  consoleheight: Set console height (200px)');
  console.log('');
  console.log('📂 File Commands:');
  console.log('  selectfile: Select sketch.js file');
  console.log('  closetab: Close current tab');
  console.log('  createfile: Create new test file');
  console.log('  deletefile: Delete test file');
  console.log('');
  console.log('🎛️ Layout Commands:');
  console.log('  sidebar: Toggle sidebar');
  console.log('  projectname: Update project name');
  console.log('');
  console.log('🧭 Navigation Commands:');
  console.log('  dashboard: Go to dashboard');
  console.log('');
  console.log('ℹ️ System Commands:');
  console.log('  status: Show connection status');
  console.log('  clear: Clear terminal console');
  console.log('  exit: Quit server');
  console.log('\nEnter command: ');
}

function sendCodeUpdate(code) {
  if (clients.size === 0) {
    console.log('⚠️  No clients connected. Start the p5.js editor and enable MCP first.');
    return;
  }

  console.log(`📤 Sending code update to ${clients.size} client(s)...`);
  io.emit('codeUpdate', { code });
  console.log('✅ Code update sent!\n');
}

function sendUICommand(event, data = null, description = '') {
  if (clients.size === 0) {
    console.log('⚠️  No clients connected. Start the p5.js editor and enable MCP first.');
    return;
  }

  console.log(`📤 Sending ${description} to ${clients.size} client(s)...`);
  if (data) {
    io.emit(event, data);
  } else {
    io.emit(event);
  }
  console.log(`✅ ${description} sent!\n`);
}

function showStatus() {
  console.log(`\n📊 Server Status:`);
  console.log(`   Connected clients: ${clients.size}`);
  console.log(`   Server port: 3001`);
  console.log(`   CORS origin: http://localhost:3000`);
  console.log(`   Available samples: 1-6`);
  console.log(`   UI Control Commands: 15+ available\n`);
}

// Handle user input
function handleInput(input) {
  const command = input.trim();

  switch (command) {
    // Code sample commands
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      sendCodeUpdate(sampleCodes[command]);
      break;

    case 'custom':
      console.log('\n📝 Enter your custom p5.js code (type "END" on a new line to finish):');
      let customCode = '';

      const customInput = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      customInput.on('line', (line) => {
        if (line.trim() === 'END') {
          customInput.close();
          sendCodeUpdate(customCode);
          showMenu();
        } else {
          customCode += line + '\n';
        }
      });
      return; // Don't show menu immediately

    // Execution control commands
    case 'start':
      sendUICommand('startExecution', null, 'start execution command');
      break;

    case 'stop':
      sendUICommand('stopExecution', null, 'stop execution command');
      break;

    case 'toggle':
      sendUICommand('toggleExecution', null, 'toggle execution command');
      break;

    // Console control commands
    case 'clearconsole':
      sendUICommand('clearConsole', null, 'clear console command');
      break;

    case 'consolemsg':
      sendUICommand('addConsoleMessage', {
        type: 'info',
        message: 'Test message from WebSocket server',
        timestamp: Date.now()
      }, 'add console message command');
      break;

    case 'consoleheight':
      sendUICommand('setConsoleHeight', 200, 'set console height command');
      break;

    // File/tab control commands
    case 'selectfile':
      sendUICommand('selectFile', 'sketch.js', 'select file command');
      break;

    case 'closetab':
      sendUICommand('closeTab', 'sketch.js', 'close tab command');
      break;

    case 'createfile':
      sendUICommand('createFile', {
        name: 'test.js',
        content: '// New file created via WebSocket\nconsole.log("Hello from WebSocket!");'
      }, 'create file command');
      break;

    case 'deletefile':
      sendUICommand('deleteFile', 'test.js', 'delete file command');
      break;

    // Layout control commands
    case 'sidebar':
      sendUICommand('toggleSidebar', null, 'toggle sidebar command');
      break;

    case 'projectname':
      sendUICommand('updateProjectName', 'WebSocket Project', 'update project name command');
      break;

    // Navigation commands
    case 'dashboard':
      sendUICommand('backToDashboard', null, 'navigate to dashboard command');
      break;

    // System commands
    case 'status':
      showStatus();
      break;

    case 'clear':
      console.clear();
      console.log('🚀 Test WebSocket Server running on port 3001\n');
      break;

    case 'exit':
      console.log('👋 Shutting down server...');
      process.exit(0);

    default:
      console.log('❌ Unknown command. Type a valid command or see the menu above.');
  }

  showMenu();
}

// Start interactive mode
showMenu();
rl.on('line', handleInput);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  rl.close();
  process.exit(0);
});
