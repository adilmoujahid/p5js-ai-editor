#!/usr/bin/env python3
"""
Python WebSocket Server for p5.js AI Editor Testing
A debugging tool to test WebSocket connections and send commands to the p5.js editor.
"""

import asyncio
import socketio
import signal
import sys
import threading
from aiohttp import web
from typing import Set, Dict, Any, Optional

# Create Socket.IO server instance
sio = socketio.AsyncServer(
    cors_allowed_origins="http://localhost:3000",
    logger=False,
    engineio_logger=False
)

# Create aiohttp web application
app = web.Application()
sio.attach(app)

# Global state
connected_clients: Set[str] = set()
current_port: Optional[int] = None
server_task: Optional[asyncio.Task] = None
runner: Optional[web.AppRunner] = None

# Sample code snippets for testing
SAMPLE_CODES = {
    '1': '''function setup() {
  createCanvas(800, 600);
  background(220);
}

function draw() {
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}''',

    '2': '''function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
}

function draw() {
  background(frameCount % 360, 80, 90);
  
  for (let i = 0; i < 10; i++) {
    fill(i * 36, 100, 100);
    rect(i * 40, height/2, 30, 100);
  }
}''',

    '3': '''function setup() {
  createCanvas(600, 400);
}

function draw() {
  background(0);
  stroke(255);
  
  for (let i = 0; i < width; i += 20) {
    line(i, 0, i + sin(frameCount * 0.01 + i * 0.1) * 100, height);
  }
}''',

    '4': '''// Interactive particle system
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
}''',

    '5': '''// Generative art example
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
}''',

    '6': '''// 3D rotating cube
function setup() {
  createCanvas(600, 600, WEBGL);
}

function draw() {
  background(50);
  
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  
  fill(255, 100, 100);
  box(200);
}'''
}

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle client connections"""
    print(f"✅ Client connected: {sid}")
    connected_clients.add(sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnections"""
    print(f"❌ Client disconnected: {sid}")
    connected_clients.discard(sid)

@sio.event
async def projectState(sid, data):
    """Handle project state from client"""
    print(f'📥 Received project state: {data.get("projectName", "Unknown")} ({len(data.get("files", []))} files)')

@sio.event
async def getProjectState(sid):
    """Handle request for project state"""
    print('📝 Client requesting project state...')

def show_menu():
    """Display the interactive menu"""
    print('\n🎮 Test Commands:')
    print('📝 Code Commands:')
    print('  1-6: Send predefined code samples')
    print('  custom: Enter custom code')
    print('')
    print('▶️ Execution Commands:')
    print('  start: Start code execution')
    print('  stop: Stop code execution')
    print('  toggle: Toggle execution state')
    print('')
    print('📱 Console Commands:')
    print('  clearconsole: Clear console messages')
    print('  consolemsg: Add test console message')
    print('  consoleheight: Set console height (200px)')
    print('')
    print('📂 File Commands:')
    print('  selectfile: Select sketch.js file')
    print('  closetab: Close current tab')
    print('  createfile: Create new test file')
    print('  deletefile: Delete test file')
    print('')
    print('🎛️ Layout Commands:')
    print('  sidebar: Toggle sidebar')
    print('  projectname: Update project name')
    print('')
    print('🧭 Navigation Commands:')
    print('  dashboard: Go to dashboard')
    print('')
    print('ℹ️ System Commands:')
    print('  status: Show connection status')
    print('  clear: Clear terminal console')
    print('  exit: Quit server')
    print('\nEnter command: ', end='', flush=True)

async def send_code_update(code: str):
    """Send code update to all connected clients"""
    if not connected_clients:
        print('⚠️  No clients connected. Start the p5.js editor and enable MCP first.')
        return

    print(f'📤 Sending code update to {len(connected_clients)} client(s)...')
    await sio.emit('codeUpdate', {'code': code})
    print('✅ Code update sent!\n')

async def send_ui_command(event: str, data: Any = None, description: str = ''):
    """Send UI command to all connected clients"""
    if not connected_clients:
        print('⚠️  No clients connected. Start the p5.js editor and enable MCP first.')
        return

    print(f'📤 Sending {description} to {len(connected_clients)} client(s)...')
    if data is not None:
        await sio.emit(event, data)
    else:
        await sio.emit(event)
    print(f'✅ {description} sent!\n')

def show_status():
    """Show current server status"""
    print(f'\n📊 Server Status:')
    print(f'   Connected clients: {len(connected_clients)}')
    print(f'   Server port: {current_port}')
    print(f'   CORS origin: http://localhost:3000')
    print(f'   Available samples: 1-6')
    print(f'   UI Control Commands: 15+ available\n')

async def handle_input(command: str):
    """Handle user input commands"""
    command = command.strip()

    # Code sample commands
    if command in SAMPLE_CODES:
        await send_code_update(SAMPLE_CODES[command])
    
    elif command == 'custom':
        print('\n📝 Enter your custom p5.js code (type "END" on a new line to finish):')
        custom_code = ''
        while True:
            try:
                line = input()
                if line.strip() == 'END':
                    break
                custom_code += line + '\n'
            except EOFError:
                break
        await send_code_update(custom_code)
    
    # Execution control commands
    elif command == 'start':
        await send_ui_command('startExecution', description='start execution command')
    
    elif command == 'stop':
        await send_ui_command('stopExecution', description='stop execution command')
    
    elif command == 'toggle':
        await send_ui_command('toggleExecution', description='toggle execution command')
    
    # Console control commands
    elif command == 'clearconsole':
        await send_ui_command('clearConsole', description='clear console command')
    
    elif command == 'consolemsg':
        await send_ui_command('addConsoleMessage', {
            'type': 'info',
            'message': 'Test message from Python WebSocket server',
            'timestamp': asyncio.get_event_loop().time() * 1000
        }, 'add console message command')
    
    elif command == 'consoleheight':
        await send_ui_command('setConsoleHeight', 200, 'set console height command')
    
    # File/tab control commands
    elif command == 'selectfile':
        await send_ui_command('selectFile', 'sketch.js', 'select file command')
    
    elif command == 'closetab':
        await send_ui_command('closeTab', 'sketch.js', 'close tab command')
    
    elif command == 'createfile':
        await send_ui_command('createFile', {
            'name': 'test.js',
            'content': '// New file created via Python WebSocket\nconsole.log("Hello from Python WebSocket!");'
        }, 'create file command')
    
    elif command == 'deletefile':
        await send_ui_command('deleteFile', 'test.js', 'delete file command')
    
    # Layout control commands
    elif command == 'sidebar':
        await send_ui_command('toggleSidebar', description='toggle sidebar command')
    
    elif command == 'projectname':
        await send_ui_command('updateProjectName', 'Python WebSocket Project', 'update project name command')
    
    # Navigation commands
    elif command == 'dashboard':
        await send_ui_command('backToDashboard', description='navigate to dashboard command')
    
    # System commands
    elif command == 'status':
        show_status()
    
    elif command == 'clear':
        import os
        os.system('clear' if os.name == 'posix' else 'cls')
        print(f'🚀 Python Test WebSocket Server running on port {current_port}\n')
    
    elif command == 'exit':
        print('👋 Shutting down server...')
        await cleanup_server()
        sys.exit(0)
    
    else:
        print('❌ Unknown command. Type a valid command or see the menu above.')

async def input_handler():
    """Handle user input in a separate thread"""
    loop = asyncio.get_event_loop()
    
    def input_thread():
        while True:
            try:
                command = input()
                asyncio.run_coroutine_threadsafe(handle_input(command), loop)
                if command.strip() not in ['custom', 'exit']:  # Don't show menu during custom code input or exit
                    show_menu()
            except EOFError:
                break
            except KeyboardInterrupt:
                break
    
    # Start input handling in a separate thread
    threading.Thread(target=input_thread, daemon=True).start()

async def cleanup_server():
    """Clean up server resources"""
    global runner
    if runner:
        await runner.cleanup()

async def start_server():
    """Start the Socket.IO server on available ports"""
    global current_port, server_task, runner
    
    try_ports = [3001, 3002, 3003, 3004]
    
    for port in try_ports:
        try:
            # Create and setup runner
            runner = web.AppRunner(app)
            await runner.setup()
            
            # Create site
            site = web.TCPSite(runner, 'localhost', port)
            await site.start()
            
            current_port = port
            print(f'🚀 Python Test WebSocket Server running on port {port}')
            if port != 3001:
                print(f'⚠️  Note: Using port {port} instead of 3001 (port conflict resolved)')
                print(f'💡 Update your webapp WebSocket connection to: ws://localhost:{port}')
            print('📝 Waiting for connections from p5.js AI Editor...\n')
            
            # Start input handler
            await input_handler()
            
            # Keep the server running
            while True:
                await asyncio.sleep(1)
            
        except OSError as e:
            if e.errno == 48:  # Address already in use
                print(f'⚠️  Port {port} is in use, trying next port...')
                if runner:
                    await runner.cleanup()
                continue
            else:
                raise
        except Exception as e:
            print(f'❌ Server error: {e}')
            if runner:
                await runner.cleanup()
            continue
    
    print('❌ Could not start server on any available port')
    sys.exit(1)

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n👋 Shutting down server...')
    loop = asyncio.get_event_loop()
    if loop.is_running():
        loop.create_task(cleanup_server())
    sys.exit(0)

async def main():
    """Main entry point"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Show initial menu
        show_menu()
        
        # Start the server
        await start_server()
        
    except KeyboardInterrupt:
        print('\n👋 Shutting down server...')
        await cleanup_server()
    except Exception as e:
        print(f'❌ Unexpected error: {e}')
        await cleanup_server()
    finally:
        sys.exit(0)

if __name__ == '__main__':
    asyncio.run(main()) 