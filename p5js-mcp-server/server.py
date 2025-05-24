#!/usr/bin/env python3
"""
MCP Server for p5.js AI Editor
This implements pattern #2 from the MCP documentation:
- MCP server runs for Claude Desktop (stdio)
- Socket.IO server (aiohttp) acts as a bridge to the webapp
"""

import asyncio
import threading
import logging
from typing import Set, Dict, Any, Optional
import socketio
from aiohttp import web
from mcp.server.fastmcp import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MCP server for Claude Desktop
mcp = FastMCP(name="p5js-controller")

# Socket.IO server for webapp connections
sio = socketio.AsyncServer(
    cors_allowed_origins="http://localhost:3000",
    logger=False,
    engineio_logger=False
)

# Create aiohttp web application
app = web.Application()
sio.attach(app)

# Global state for connections - shared across threads
connected_clients: Set[str] = set()
bridge_server_running = False
runner: Optional[web.AppRunner] = None
connection_lock = threading.Lock()

# Sample p5.js code snippets
SAMPLE_CODES = {
    'basic_drawing': '''function setup() {
  createCanvas(800, 600);
  background(220);
}

function draw() {
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}''',

    'animated_background': '''function setup() {
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

    'interactive_particles': '''let particles = [];

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

    'rotating_cube': '''function setup() {
  createCanvas(600, 600, WEBGL);
}

function draw() {
  background(50);
  
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  
  fill(255, 100, 100);
  box(200);
}''',

    'generative_art': '''function setup() {
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
}'''
}

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle client connections from webapp"""
    with connection_lock:
        connected_clients.add(sid)
    logger.info(f"✅ Webapp client connected: {sid} (Total: {len(connected_clients)})")

@sio.event
async def disconnect(sid):
    """Handle client disconnections"""
    with connection_lock:
        connected_clients.discard(sid)
    logger.info(f"❌ Webapp client disconnected: {sid} (Remaining: {len(connected_clients)})")

@sio.event
async def projectState(sid, data):
    """Handle project state from webapp"""
    logger.info(f'📥 Received project state from {sid}: {data.get("projectName", "Unknown")} ({len(data.get("files", []))} files)')

@sio.event
async def getProjectState(sid):
    """Handle request for project state"""
    logger.info(f'📝 Client {sid} requesting project state...')

def get_connected_count():
    """Thread-safe way to get connected client count"""
    try:
        # Query the Socket.IO server directly instead of relying on global variable
        if sio and hasattr(sio, 'manager'):
            # Get the actual connected clients from Socket.IO manager
            manager = sio.manager
            if hasattr(manager, 'eio') and hasattr(manager.eio, 'sockets'):
                return len(manager.eio.sockets)
            elif hasattr(manager, 'rooms'):
                # Count unique session IDs across all rooms
                all_sids = set()
                for room_sids in manager.rooms.values():
                    all_sids.update(room_sids)
                return len(all_sids)
        
        # Fallback to our global variable with lock
        with connection_lock:
            return len(connected_clients)
    except Exception as e:
        logger.error(f"Error getting connected count: {e}")
        # Fallback to our global variable with lock
        with connection_lock:
            return len(connected_clients)

async def send_to_webapp(event: str, data: Any = None):
    """Send Socket.IO event to all connected webapp clients"""
    client_count = get_connected_count()
    if client_count == 0:
        raise ConnectionError("No webapp clients connected. Make sure the webapp is running and MCP is enabled.")
    
    # Send to all connected clients
    if data is not None:
        await sio.emit(event, data)
    else:
        await sio.emit(event)
    
    logger.info(f'📤 Sent {event} to {client_count} webapp client(s)')

# MCP Tools (called by Claude Desktop)
@mcp.tool()
async def send_code_to_editor(code: str) -> str:
    """
    Send p5.js code to the web editor for execution
    
    Args:
        code: The p5.js code to send to the editor
    
    Returns:
        Status message indicating success or failure
    """
    try:
        await send_to_webapp('codeUpdate', {'code': code})
        return f"✅ Successfully sent code to p5.js editor ({len(code)} characters)"
    except ConnectionError as e:
        error_msg = f"❌ Connection error: {str(e)}"
        logger.error(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"❌ Failed to send code: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def start_code_execution() -> str:
    """Start executing the code in the p5.js editor"""
    try:
        await send_to_webapp('startExecution')
        return "✅ Code execution started"
    except Exception as e:
        error_msg = f"❌ Failed to start execution: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def stop_code_execution() -> str:
    """Stop executing the code in the p5.js editor"""
    try:
        await send_to_webapp('stopExecution')
        return "✅ Code execution stopped"
    except Exception as e:
        error_msg = f"❌ Failed to stop execution: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def clear_console() -> str:
    """Clear the console in the p5.js editor"""
    try:
        await send_to_webapp('clearConsole')
        return "✅ Console cleared"
    except Exception as e:
        error_msg = f"❌ Failed to clear console: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def toggle_sidebar() -> str:
    """Toggle the sidebar in the p5.js editor"""
    try:
        await send_to_webapp('toggleSidebar')
        return "✅ Sidebar toggled"
    except Exception as e:
        error_msg = f"❌ Failed to toggle sidebar: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def update_project_name(name: str) -> str:
    """Update the project name in the p5.js editor"""
    try:
        await send_to_webapp('updateProjectName', name)
        return f"✅ Project name updated to '{name}'"
    except Exception as e:
        error_msg = f"❌ Failed to update project name: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def send_sample_code(sample_name: str) -> str:
    """
    Send a predefined sample code to the editor
    
    Args:
        sample_name: Name of the sample ('basic_drawing', 'animated_background', 'interactive_particles', 'rotating_cube', 'generative_art')
    """
    if sample_name not in SAMPLE_CODES:
        available = ', '.join(SAMPLE_CODES.keys())
        return f"❌ Unknown sample. Available samples: {available}"
    
    code = SAMPLE_CODES[sample_name]
    result = await send_code_to_editor(code)
    return f"📝 Sent '{sample_name}' sample. {result}"

@mcp.tool()
async def get_connection_status() -> str:
    """Get the current connection status and server information"""
    client_count = get_connected_count()
    if client_count > 0:
        return f"✅ Socket.IO bridge server running with {client_count} connected webapp client(s). Ready to send commands!"
    else:
        return "❌ Socket.IO bridge server running but no webapp clients connected. Make sure the webapp is running and MCP is enabled."

@mcp.tool()
async def debug_connection_details() -> str:
    """Get detailed debugging information about the connection state"""
    client_count = get_connected_count()
    
    debug_info = []
    debug_info.append(f"🔍 Debug Info:")
    debug_info.append(f"   Bridge Server Running: {bridge_server_running}")
    debug_info.append(f"   Connected Clients Count: {client_count}")
    
    with connection_lock:
        if connected_clients:
            debug_info.append(f"   Client IDs: {list(connected_clients)}")
        else:
            debug_info.append(f"   Client IDs: None")
    
    # Check if Socket.IO server is accessible
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:3001/status') as response:
                if response.status == 200:
                    data = await response.json()
                    debug_info.append(f"   HTTP Status Check: ✅ {data}")
                else:
                    debug_info.append(f"   HTTP Status Check: ❌ Status {response.status}")
    except Exception as e:
        debug_info.append(f"   HTTP Status Check: ❌ Error: {e}")
    
    return "\n".join(debug_info)

@mcp.tool()
async def test_webapp_ping() -> str:
    """Test sending a simple ping to the webapp to verify connection"""
    try:
        client_count = get_connected_count()
        if client_count == 0:
            return "❌ No webapp clients connected to ping"
        
        # Send a test event
        await sio.emit('ping', {'message': 'MCP server test ping', 'timestamp': asyncio.get_event_loop().time()})
        logger.info(f'📤 Sent ping to {client_count} client(s)')
        
        return f"✅ Ping sent to {client_count} webapp client(s). Check webapp console for ping message."
        
    except Exception as e:
        error_msg = f"❌ Failed to ping webapp: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def force_connection_refresh() -> str:
    """Force refresh the connection state and try to reconnect"""
    try:
        client_count = get_connected_count()
        
        # Log current state
        logger.info(f"🔄 Force refresh - Current clients: {client_count}")
        
        # Emit a status request to all clients to wake them up
        if client_count > 0:
            await sio.emit('getProjectState')
            logger.info("📤 Sent getProjectState to wake up clients")
        
        # Wait a moment and check again
        await asyncio.sleep(1)
        new_count = get_connected_count()
        
        return f"🔄 Connection refresh complete. Clients before: {client_count}, after: {new_count}"
        
    except Exception as e:
        error_msg = f"❌ Failed to refresh connection: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def check_server_health() -> str:
    """Check the overall health of the bridge server"""
    health_info = []
    
    health_info.append("🏥 Server Health Check:")
    health_info.append(f"   Bridge Server Running: {'✅' if bridge_server_running else '❌'}")
    
    # Check if aiohttp runner is healthy
    if runner:
        health_info.append(f"   HTTP Runner: ✅ Active")
    else:
        health_info.append(f"   HTTP Runner: ❌ Not available")
    
    # Check Socket.IO server
    try:
        # Get Socket.IO manager info
        manager = sio.manager
        health_info.append(f"   Socket.IO Manager: ✅ Active")
        health_info.append(f"   Socket.IO Rooms: {len(manager.rooms)}")
    except Exception as e:
        health_info.append(f"   Socket.IO Manager: ❌ Error: {e}")
    
    # Check port binding
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 3001))
        sock.close()
        if result == 0:
            health_info.append(f"   Port 3001: ✅ Listening")
        else:
            health_info.append(f"   Port 3001: ❌ Not responding")
    except Exception as e:
        health_info.append(f"   Port 3001: ❌ Error: {e}")
    
    return "\n".join(health_info)

@mcp.tool()
async def send_debug_message() -> str:
    """Send a debug message to the webapp console"""
    try:
        debug_data = {
            'type': 'info',
            'message': f'🐛 Debug message from MCP server at {asyncio.get_event_loop().time()}',
            'timestamp': asyncio.get_event_loop().time() * 1000
        }
        
        await send_to_webapp('addConsoleMessage', debug_data)
        return "✅ Debug message sent to webapp console"
        
    except Exception as e:
        error_msg = f"❌ Failed to send debug message: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def get_socketio_internal_state() -> str:
    """Get internal state directly from Socket.IO server"""
    try:
        state_info = []
        state_info.append("🔍 Socket.IO Internal State:")
        
        if sio and hasattr(sio, 'manager'):
            manager = sio.manager
            state_info.append(f"   Manager exists: ✅")
            
            if hasattr(manager, 'eio'):
                eio = manager.eio
                state_info.append(f"   Engine.IO exists: ✅")
                
                if hasattr(eio, 'sockets'):
                    socket_count = len(eio.sockets)
                    state_info.append(f"   Engine.IO sockets: {socket_count}")
                    if socket_count > 0:
                        state_info.append(f"   Socket IDs: {list(eio.sockets.keys())}")
                
            if hasattr(manager, 'rooms'):
                room_count = len(manager.rooms)
                state_info.append(f"   Socket.IO rooms: {room_count}")
                if room_count > 0:
                    for room, sids in manager.rooms.items():
                        state_info.append(f"     Room '{room}': {list(sids)}")
            
            # Get unique session IDs
            all_sids = set()
            if hasattr(manager, 'rooms'):
                for room_sids in manager.rooms.values():
                    all_sids.update(room_sids)
            state_info.append(f"   Total unique sessions: {len(all_sids)}")
            
        else:
            state_info.append("   Manager: ❌ Not found")
        
        return "\n".join(state_info)
        
    except Exception as e:
        return f"❌ Error getting Socket.IO state: {e}"

# Health check endpoint
async def status_handler(request):
    """Health check endpoint"""
    client_count = get_connected_count()
    return web.json_response({
        "status": "running",
        "connected_clients": client_count,
        "message": "Socket.IO bridge server for p5.js MCP"
    })

# Add routes
app.router.add_get("/status", status_handler)

async def start_bridge_server():
    """Start the Socket.IO bridge server"""
    global bridge_server_running, runner
    
    if bridge_server_running:
        return True
    
    try_ports = [3001, 3002, 3003, 3004]
    
    for port in try_ports:
        try:
            # Create and setup runner
            runner = web.AppRunner(app)
            await runner.setup()
            
            # Create site
            site = web.TCPSite(runner, 'localhost', port)
            await site.start()
            
            bridge_server_running = True
            logger.info(f'🌉 Socket.IO bridge server running on port {port}')
            if port != 3001:
                logger.info(f'⚠️  Note: Using port {port} instead of 3001 (port conflict resolved)')
            
            return True
            
        except OSError as e:
            if e.errno == 48:  # Address already in use
                logger.warning(f'⚠️  Port {port} is in use, trying next port...')
                if runner:
                    await runner.cleanup()
                    runner = None
                continue
            else:
                raise
        except Exception as e:
            logger.error(f'❌ Server error on port {port}: {e}')
            if runner:
                await runner.cleanup()
                runner = None
            continue
    
    logger.error('❌ Could not start bridge server on any available port')
    return False

async def cleanup():
    """Cleanup resources when shutting down"""
    global runner, bridge_server_running
    if runner:
        await runner.cleanup()
        bridge_server_running = False
        logger.info("🔌 Socket.IO bridge server stopped")

# Main execution
if __name__ == "__main__":
    import atexit
    
    # Register cleanup on exit
    atexit.register(lambda: asyncio.run(cleanup()) if bridge_server_running else None)
    
    # Start the bridge server in a separate thread
    def start_bridge_thread():
        """Start the bridge server in a separate thread"""
        async def run_bridge():
            logger.info("🚀 Starting p5.js MCP Server with Socket.IO Bridge...")
            success = await start_bridge_server()
            
            if not success:
                logger.error("❌ Failed to start bridge server")
                return
            
            logger.info("🌉 Socket.IO bridge server is running")
            logger.info("💡 Make sure to enable MCP in your webapp to connect to the bridge server")
            logger.info("🔗 Bridge server running on http://localhost:3001")
            
            # Keep the bridge server running
            try:
                while True:
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Bridge server error: {e}")
                await cleanup()
        
        # Run the bridge server in its own event loop
        asyncio.run(run_bridge())
    
    # Start bridge server in a daemon thread
    bridge_thread = threading.Thread(target=start_bridge_thread, daemon=True)
    bridge_thread.start()
    
    # Give the bridge server a moment to start
    import time
    time.sleep(2)
    
    logger.info("📡 Starting MCP server for Claude Desktop...")
    
    # Start the MCP server for Claude Desktop (this blocks)
    mcp.run()
