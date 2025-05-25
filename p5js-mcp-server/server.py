#!/usr/bin/env python3
"""
MCP Server for p5.js AI Editor
This implements pattern #2 from the MCP documentation:
- MCP server runs for Claude Desktop (stdio)
- Socket.IO server (aiohttp) acts as a bridge to the webapp

FIXED VERSION: Uses single asyncio event loop with background tasks instead of threading
"""

import asyncio
import logging
from typing import Set, Dict, Any, Optional
import socketio
from aiohttp import web
from mcp.server.fastmcp import FastMCP
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add file logging for debugging MCP tool calls
debug_log_file = os.path.join(os.path.dirname(__file__), 'mcp_debug.log')
file_handler = logging.FileHandler(debug_log_file)
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Also create a simple debug function that writes to both console and file
def debug_log(message):
    print(f"🔧 {message}")
    logger.info(f"🔧 {message}")
    # Also write to a simple debug file
    with open(debug_log_file.replace('.log', '_simple.log'), 'a') as f:
        import datetime
        f.write(f"{datetime.datetime.now()}: {message}\n")
        f.flush()

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

# Global state for connections - single thread, single event loop
connected_clients: Set[str] = set()
bridge_server_running = False
runner: Optional[web.AppRunner] = None

# Add debugging wrapper for connected_clients modifications
def add_client(sid: str):
    """Add client with debugging"""
    connected_clients.add(sid)
    debug_log(f"🔧 [CLIENT_TRACKING] Added {sid}, total: {len(connected_clients)}")

def remove_client(sid: str, reason: str = "unknown"):
    """Remove client with debugging"""
    if sid in connected_clients:
        connected_clients.discard(sid)
        debug_log(f"🔧 [CLIENT_TRACKING] Removed {sid} (reason: {reason}), total: {len(connected_clients)}")
    else:
        debug_log(f"🔧 [CLIENT_TRACKING] Attempted to remove {sid} but not in set (reason: {reason})")

def clear_all_clients(reason: str = "unknown"):
    """Clear all clients with debugging"""
    count = len(connected_clients)
    connected_clients.clear()
    debug_log(f"🔧 [CLIENT_TRACKING] CLEARED ALL {count} clients (reason: {reason})")

# Add heartbeat tracking
client_last_seen: Dict[str, float] = {}
HEARTBEAT_TIMEOUT = 30  # seconds

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
    try:
        # Extract client info from environ
        origin = environ.get('HTTP_ORIGIN', 'unknown')
        user_agent = environ.get('HTTP_USER_AGENT', 'unknown')
        remote_addr = environ.get('REMOTE_ADDR', 'unknown')
        
        # Add to connected clients set and track last seen
        add_client(sid)
        client_last_seen[sid] = asyncio.get_event_loop().time()
        debug_log(f"🔧 [CONNECT] Added client {sid} to connected_clients set")
        debug_log(f"🔧 [CONNECT] connected_clients now contains: {list(connected_clients)}")
            
        logger.info(f"✅ Webapp client connected:")
        logger.info(f"   Session ID: {sid}")
        logger.info(f"   Origin: {origin}")
        logger.info(f"   Remote Address: {remote_addr}")
        logger.info(f"   User Agent: {user_agent[:100]}...")  # Truncate long user agents
        logger.info(f"   Total Clients: {len(connected_clients)}")
        
        # Send welcome message to client
        await sio.emit('welcome', {
            'message': 'Connected to p5.js MCP Bridge Server',
            'server_time': asyncio.get_event_loop().time(),
            'session_id': sid
        }, room=sid)
        
        debug_log(f"🔧 [CONNECT] Welcome message sent to {sid}")
        
    except Exception as e:
        logger.error(f"❌ Error handling client connection: {e}")
        debug_log(f"🔧 [CONNECT] ERROR: {e}")

@sio.event
async def disconnect(sid):
    """Handle client disconnections"""
    try:
        debug_log(f"🔧 [DISCONNECT] Client {sid} disconnecting...")
        debug_log(f"🔧 [DISCONNECT] connected_clients before removal: {list(connected_clients)}")
        
        remove_client(sid, "disconnect_event")
        client_last_seen.pop(sid, None)
        
        debug_log(f"🔧 [DISCONNECT] connected_clients after removal: {list(connected_clients)}")
        logger.info(f"❌ Webapp client disconnected: {sid} (Remaining: {len(connected_clients)})")
        
        # Log final state
        if len(connected_clients) == 0:
            logger.info("📝 No clients remaining - bridge server ready for new connections")
            debug_log(f"🔧 [DISCONNECT] No clients remaining")
            
    except Exception as e:
        logger.error(f"❌ Error handling client disconnection: {e}")
        debug_log(f"🔧 [DISCONNECT] ERROR: {e}")

@sio.event
async def projectState(sid, data):
    """Handle project state from webapp"""
    try:
        project_name = data.get("projectName", "Unknown") if data else "Unknown"
        file_count = len(data.get("files", [])) if data else 0
        logger.info(f'📥 Received project state from {sid}: {project_name} ({file_count} files)')
    except Exception as e:
        logger.error(f"❌ Error handling project state from {sid}: {e}")

@sio.event
async def getProjectState(sid):
    """Handle request for project state"""
    try:
        logger.info(f'📝 Client {sid} requesting project state...')
    except Exception as e:
        logger.error(f"❌ Error handling project state request from {sid}: {e}")

@sio.event
async def ping(sid, data=None):
    """Handle ping from webapp clients"""
    try:
        # Update last seen time for heartbeat
        client_last_seen[sid] = asyncio.get_event_loop().time()
        
        logger.info(f'🏓 Received ping from {sid}')
        await sio.emit('pong', {
            'server_time': asyncio.get_event_loop().time(),
            'message': 'pong from MCP bridge server'
        }, room=sid)
        
        debug_log(f"🔧 [PING] Updated last seen for {sid}")
    except Exception as e:
        logger.error(f"❌ Error handling ping from {sid}: {e}")

@sio.event
async def clientError(sid, error_data):
    """Handle errors reported by webapp clients"""
    try:
        logger.error(f"🚨 Client {sid} reported error: {error_data}")
    except Exception as e:
        logger.error(f"❌ Error handling client error from {sid}: {e}")

async def cleanup_stale_connections():
    """Remove clients that haven't been seen recently"""
    current_time = asyncio.get_event_loop().time()
    stale_clients = []
    
    debug_log(f"🔧 [CLEANUP] Starting cleanup check at {current_time}")
    debug_log(f"🔧 [CLEANUP] Current connected_clients: {list(connected_clients)}")
    debug_log(f"🔧 [CLEANUP] Current client_last_seen: {dict(client_last_seen)}")
    
    for client_id in list(connected_clients):
        last_seen = client_last_seen.get(client_id, current_time)
        time_since_seen = current_time - last_seen
        debug_log(f"🔧 [CLEANUP] Client {client_id}: last_seen={last_seen}, time_since={time_since_seen:.2f}s, timeout={HEARTBEAT_TIMEOUT}s")
        
        if time_since_seen > HEARTBEAT_TIMEOUT:
            debug_log(f"🔧 [CLEANUP] Client {client_id} is stale (>{HEARTBEAT_TIMEOUT}s)")
            stale_clients.append(client_id)
        else:
            debug_log(f"🔧 [CLEANUP] Client {client_id} is active (<{HEARTBEAT_TIMEOUT}s)")
    
    for client_id in stale_clients:
        debug_log(f"🔧 [CLEANUP] Removing stale client {client_id}")
        remove_client(client_id, "stale_connection")
        client_last_seen.pop(client_id, None)
    
    if stale_clients:
        debug_log(f"🔧 [CLEANUP] Removed {len(stale_clients)} stale clients")
        debug_log(f"🔧 [CLEANUP] Active clients: {list(connected_clients)}")
    else:
        debug_log(f"🔧 [CLEANUP] No stale clients found, {len(connected_clients)} clients remain active")

async def get_real_connected_count():
    """Get actual connected client count by checking Socket.IO manager"""
    try:
        # Clean up stale connections first
        await cleanup_stale_connections()
        
        # TEMPORARILY DISABLE Socket.IO sync logic due to state corruption bug
        # TODO: Investigate Socket.IO manager state access issues
        debug_log(f"🔧 [SYNC] Skipping Socket.IO sync - using manual tracking only")
        debug_log(f"🔧 [SYNC] Manual tracking shows: {list(connected_clients)}")
        
        # Also check Socket.IO manager for actual connections (DEBUG ONLY - don't modify state)
        if hasattr(sio, 'manager') and hasattr(sio.manager, 'eio'):
            eio_sockets = getattr(sio.manager.eio, 'sockets', {})
            debug_log(f"🔧 [SYNC] Raw eio_sockets: {eio_sockets}")
            debug_log(f"🔧 [SYNC] eio_sockets keys: {list(eio_sockets.keys())}")
            
            actual_sockets = [sid for sid in eio_sockets.keys() if sid is not None]
            debug_log(f"🔧 [SYNC] Filtered actual_sockets: {actual_sockets}")
            debug_log(f"🔧 [SYNC] Current connected_clients before sync: {list(connected_clients)}")
            
            # DISABLED: Don't modify connected_clients based on Socket.IO state
            # The Socket.IO manager seems to have state issues that clear our tracking
            debug_log(f"🔧 [SYNC] Socket.IO sync DISABLED - keeping manual tracking")
            
        else:
            debug_log(f"🔧 [SYNC] Socket.IO manager or eio not available")
        
        return len(connected_clients)
    except Exception as e:
        logger.error(f"❌ Error getting real connected count: {e}")
        debug_log(f"🔧 [SYNC] ERROR: {e}")
        return len(connected_clients)

def get_connected_count():
    """Get connected client count - now thread-safe since we're single-threaded"""
    try:
        # For synchronous calls, just return current count
        # The async version will be called by MCP tools
        return len(connected_clients)
    except Exception as e:
        logger.error(f"❌ Error getting connected count: {e}")
        return 0

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
    debug_log(f"🔧 [MCP TOOL] send_code_to_editor called with {len(code)} characters")
    logger.info(f"🔧 [MCP TOOL] send_code_to_editor called with {len(code)} characters")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        logger.info(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        await send_to_webapp('codeUpdate', {'code': code})
        result = f"✅ Successfully sent code to p5.js editor ({len(code)} characters)"
        debug_log(f"🔧 [MCP TOOL] {result}")
        logger.info(f"🔧 [MCP TOOL] {result}")
        return result
    except ConnectionError as e:
        error_msg = f"❌ Connection error: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg
    except Exception as e:
        error_msg = f"❌ Failed to send code: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def start_code_execution() -> str:
    """Start executing the code in the p5.js editor"""
    debug_log(f"🔧 [MCP TOOL] start_code_execution called")
    logger.info(f"🔧 [MCP TOOL] start_code_execution called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        await send_to_webapp('startExecution')
        result = "✅ Code execution started"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
    except Exception as e:
        error_msg = f"❌ Failed to start execution: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def stop_code_execution() -> str:
    """Stop executing the code in the p5.js editor"""
    debug_log(f"🔧 [MCP TOOL] stop_code_execution called")
    logger.info(f"🔧 [MCP TOOL] stop_code_execution called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        await send_to_webapp('stopExecution')
        result = "✅ Code execution stopped"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
    except Exception as e:
        error_msg = f"❌ Failed to stop execution: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def clear_console() -> str:
    """Clear the console in the p5.js editor"""
    debug_log(f"🔧 [MCP TOOL] clear_console called")
    logger.info(f"🔧 [MCP TOOL] clear_console called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        await send_to_webapp('clearConsole')
        result = "✅ Console cleared"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
    except Exception as e:
        error_msg = f"❌ Failed to clear console: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def toggle_sidebar() -> str:
    """Toggle the sidebar in the p5.js editor"""
    debug_log(f"🔧 [MCP TOOL] toggle_sidebar called")
    logger.info(f"🔧 [MCP TOOL] toggle_sidebar called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        await send_to_webapp('toggleSidebar')
        result = "✅ Sidebar toggled"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
    except Exception as e:
        error_msg = f"❌ Failed to toggle sidebar: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def update_project_name(name: str) -> str:
    """Update the project name in the p5.js editor"""
    debug_log(f"🔧 [MCP TOOL] update_project_name called with name: {name}")
    logger.info(f"🔧 [MCP TOOL] update_project_name called with name: {name}")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        await send_to_webapp('updateProjectName', name)
        result = f"✅ Project name updated to '{name}'"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
    except Exception as e:
        error_msg = f"❌ Failed to update project name: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def send_sample_code(sample_name: str) -> str:
    """
    Send a predefined sample code to the editor
    
    Args:
        sample_name: Name of the sample ('basic_drawing', 'animated_background', 'interactive_particles', 'rotating_cube', 'generative_art')
    """
    debug_log(f"🔧 [MCP TOOL] send_sample_code called with sample: {sample_name}")
    logger.info(f"🔧 [MCP TOOL] send_sample_code called with sample: {sample_name}")
    
    if sample_name not in SAMPLE_CODES:
        available = ', '.join(SAMPLE_CODES.keys())
        error_msg = f"❌ Unknown sample. Available samples: {available}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg
    
    code = SAMPLE_CODES[sample_name]
    result = await send_code_to_editor(code)
    final_result = f"📝 Sent '{sample_name}' sample. {result}"
    debug_log(f"🔧 [MCP TOOL] {final_result}")
    return final_result

@mcp.tool()
async def get_connection_status() -> str:
    """Get the current connection status and server information"""
    debug_log(f"🔧 [MCP TOOL] get_connection_status called")
    logger.info(f"🔧 [MCP TOOL] get_connection_status called")
    
    # Use the robust connection count
    client_count = await get_real_connected_count()
    debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
    debug_log(f"🔧 [MCP TOOL] Connected client IDs: {list(connected_clients)}")
    logger.info(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
    logger.info(f"🔧 [MCP TOOL] Connected client IDs: {list(connected_clients)}")
    
    if client_count > 0:
        result = f"✅ Socket.IO bridge server running with {client_count} connected webapp client(s). Ready to send commands!"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
    else:
        result = "❌ Socket.IO bridge server running but no webapp clients connected. Make sure the webapp is running and MCP is enabled."
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result

@mcp.tool()
async def debug_connection_details() -> str:
    """Get detailed debugging information about the connection state"""
    debug_log(f"🔧 [MCP TOOL] debug_connection_details called")
    logger.info(f"🔧 [MCP TOOL] debug_connection_details called")
    
    client_count = get_connected_count()
    
    debug_info = []
    debug_info.append("🔍 Debug Info:")
    debug_info.append(f"   Bridge Server Running: {bridge_server_running}")
    debug_info.append(f"   Connected Clients Count: {client_count}")
    
    if connected_clients:
        debug_info.append(f"   Client IDs: {list(connected_clients)}")
    else:
        debug_info.append(f"   Client IDs: None")
    
    result = "\n".join(debug_info)
    debug_log(f"🔧 [MCP TOOL] {result}")
    logger.info(f"🔧 [MCP TOOL] {result}")
    return result

@mcp.tool()
async def test_webapp_ping() -> str:
    """Test sending a simple ping to the webapp to verify connection"""
    debug_log(f"🔧 [MCP TOOL] test_webapp_ping called")
    logger.info(f"🔧 [MCP TOOL] test_webapp_ping called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        if client_count == 0:
            result = "❌ No webapp clients connected to ping"
            debug_log(f"🔧 [MCP TOOL] {result}")
            return result
        
        # Send a test event
        await sio.emit('ping', {'message': 'MCP server test ping', 'timestamp': asyncio.get_event_loop().time()})
        logger.info(f'📤 Sent ping to {client_count} client(s)')
        
        result = f"✅ Ping sent to {client_count} webapp client(s). Check webapp console for ping message."
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Failed to ping webapp: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def force_connection_refresh() -> str:
    """Force refresh the connection state and try to reconnect"""
    debug_log(f"🔧 [MCP TOOL] force_connection_refresh called")
    logger.info(f"🔧 [MCP TOOL] force_connection_refresh called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients before refresh: {client_count}")
        
        # Log current state
        logger.info(f"🔄 Force refresh - Current clients: {client_count}")
        
        # Emit a status request to all clients to wake them up
        if client_count > 0:
            await sio.emit('getProjectState')
            logger.info("📤 Sent getProjectState to wake up clients")
            debug_log("🔧 [MCP TOOL] Sent getProjectState to wake up clients")
        
        # Wait a moment and check again
        await asyncio.sleep(1)
        new_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Connected clients after refresh: {new_count}")
        
        result = f"🔄 Connection refresh complete. Clients before: {client_count}, after: {new_count}"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Failed to refresh connection: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def check_server_health() -> str:
    """Check the overall health of the bridge server"""
    debug_log(f"🔧 [MCP TOOL] check_server_health called")
    logger.info(f"🔧 [MCP TOOL] check_server_health called")
    
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
    
    result = "\n".join(health_info)
    debug_log(f"🔧 [MCP TOOL] {result}")
    logger.info(f"🔧 [MCP TOOL] {result}")
    return result

@mcp.tool()
async def send_debug_message() -> str:
    """Send a debug message to the webapp console"""
    debug_log(f"🔧 [MCP TOOL] send_debug_message called")
    logger.info(f"🔧 [MCP TOOL] send_debug_message called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        
        debug_data = {
            'type': 'info',
            'message': f'🐛 Debug message from MCP server at {asyncio.get_event_loop().time()}',
            'timestamp': asyncio.get_event_loop().time() * 1000
        }
        
        await send_to_webapp('addConsoleMessage', debug_data)
        result = "✅ Debug message sent to webapp console"
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Failed to send debug message: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def get_socketio_internal_state() -> str:
    """Get internal state directly from Socket.IO server"""
    debug_log(f"🔧 [MCP TOOL] get_socketio_internal_state called")
    logger.info(f"🔧 [MCP TOOL] get_socketio_internal_state called")
    
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
        
        result = "\n".join(state_info)
        debug_log(f"🔧 [MCP TOOL] {result}")
        logger.info(f"🔧 [MCP TOOL] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Error getting Socket.IO state: {e}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def test_connection_with_code() -> str:
    """Test the connection by sending a simple test code to verify it works end-to-end"""
    debug_log(f"🔧 [MCP TOOL] test_connection_with_code called")
    logger.info(f"🔧 [MCP TOOL] test_connection_with_code called")
    
    try:
        # First check connection status
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        debug_log(f"🔧 [MCP TOOL] Connected client IDs: {list(connected_clients)}")
        
        if client_count == 0:
            result = "❌ No webapp clients connected. Cannot test connection."
            debug_log(f"🔧 [MCP TOOL] {result}")
            return result
        
        # Send a simple test code
        test_code = '''function setup() {
  createCanvas(400, 400);
  background(100, 200, 100);
}

function draw() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("MCP Connection Test!", width/2, height/2);
}'''
        
        debug_log(f"🔧 [MCP TOOL] Sending test code to {client_count} clients...")
        await send_to_webapp('codeUpdate', {'code': test_code})
        
        # Also send a console message to confirm
        debug_log(f"🔧 [MCP TOOL] Sending console message to {client_count} clients...")
        await send_to_webapp('addConsoleMessage', {
            'type': 'info',
            'message': '🧪 MCP Connection Test - Code sent successfully!',
            'timestamp': asyncio.get_event_loop().time() * 1000
        })
        
        result = f"✅ Connection test successful! Sent test code to {client_count} webapp client(s). Check your editor for the test code and console message."
        debug_log(f"🔧 [MCP TOOL] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Connection test failed: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def force_connection_sync() -> str:
    """Force synchronization of connection state and provide detailed status"""
    debug_log(f"🔧 [MCP TOOL] force_connection_sync called")
    logger.info(f"🔧 [MCP TOOL] force_connection_sync called")
    
    try:
        client_count = get_connected_count()
        debug_log(f"🔧 [MCP TOOL] Current connected clients: {client_count}")
        debug_log(f"🔧 [MCP TOOL] Connected client IDs: {list(connected_clients)}")
        
        # Force a ping to all tracked clients
        active_clients = 0
        if connected_clients:
            debug_log(f"🔧 [MCP TOOL] Pinging {len(connected_clients)} clients...")
            for client_id in list(connected_clients):
                try:
                    await sio.emit('ping', {'test': True, 'timestamp': asyncio.get_event_loop().time()}, room=client_id)
                    active_clients += 1
                    debug_log(f"🔧 [MCP TOOL] Successfully pinged client {client_id}")
                except Exception as e:
                    debug_log(f"🔧 [MCP TOOL] Failed to ping client {client_id}: {e}")
                    logger.warning(f"Failed to ping client {client_id}: {e}")
        
        status_info = []
        status_info.append("🔄 Connection State Synchronization:")
        status_info.append(f"   Connected clients: {client_count}")
        status_info.append(f"   Active ping responses: {active_clients} clients")
        
        if connected_clients:
            status_info.append(f"   Client IDs: {list(connected_clients)}")
        
        if client_count > 0:
            status_info.append(f"✅ {client_count} connected clients detected")
        else:
            status_info.append("❌ No clients detected")
        
        result = "\n".join(status_info)
        debug_log(f"🔧 [MCP TOOL] {result}")
        logger.info(f"🔧 [MCP TOOL] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Failed to sync connection state: {str(e)}"
        debug_log(f"🔧 [MCP TOOL] {error_msg}")
        logger.error(f"🔧 [MCP TOOL] {error_msg}")
        return error_msg

@mcp.tool()
async def debug_connection_counts() -> str:
    """Debug tool to compare different connection counting methods"""
    debug_log(f"🔧 [DEBUG] debug_connection_counts called")
    
    try:
        # Method 1: Simple count
        simple_count = len(connected_clients)
        debug_log(f"🔧 [DEBUG] Simple count: {simple_count}")
        debug_log(f"🔧 [DEBUG] connected_clients set: {list(connected_clients)}")
        
        # Method 2: Synchronous function
        sync_count = get_connected_count()
        debug_log(f"🔧 [DEBUG] Sync count: {sync_count}")
        
        # Method 3: Robust async function
        async_count = await get_real_connected_count()
        debug_log(f"🔧 [DEBUG] Async count: {async_count}")
        debug_log(f"🔧 [DEBUG] connected_clients after async: {list(connected_clients)}")
        
        # Method 4: Check Socket.IO manager directly
        socketio_count = 0
        if hasattr(sio, 'manager') and hasattr(sio.manager, 'eio'):
            eio_sockets = getattr(sio.manager.eio, 'sockets', {})
            actual_sockets = [sid for sid in eio_sockets.keys() if sid is not None]
            socketio_count = len(actual_sockets)
            debug_log(f"🔧 [DEBUG] Socket.IO manager sockets: {actual_sockets}")
        
        result = f"""🔍 Connection Count Debug:
   Simple count: {simple_count}
   Sync function: {sync_count}
   Async function: {async_count}
   Socket.IO manager: {socketio_count}
   Connected clients: {list(connected_clients)}"""
        
        debug_log(f"🔧 [DEBUG] {result}")
        return result
        
    except Exception as e:
        error_msg = f"❌ Debug connection counts failed: {str(e)}"
        debug_log(f"🔧 [DEBUG] ERROR: {error_msg}")
        return error_msg

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

# FIXED: Use background task instead of threading
async def run_mcp_server():
    """Run the MCP server as a background task"""
    try:
        logger.info("📡 Starting MCP server for Claude Desktop...")
        # This will block until MCP server stops
        await asyncio.get_event_loop().run_in_executor(None, mcp.run)
    except Exception as e:
        logger.error(f"❌ MCP server error: {e}")

# Main execution
async def main():
    """Main async function that coordinates everything"""
    logger.info("🚀 Starting p5.js MCP Server with Socket.IO Bridge...")
    
    # Start the bridge server
    success = await start_bridge_server()
    if not success:
        logger.error("❌ Failed to start bridge server")
        return
    
    logger.info("🌉 Socket.IO bridge server is running")
    logger.info("💡 Make sure to enable MCP in your webapp to connect to the bridge server")
    logger.info("🔗 Bridge server running on http://localhost:3001")
    
    # Start MCP server as a background task
    mcp_task = asyncio.create_task(run_mcp_server())
    
    try:
        # Wait for MCP server to complete
        await mcp_task
    except KeyboardInterrupt:
        logger.info("🛑 Received interrupt signal")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
    finally:
        await cleanup()
        
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Shutting down...")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
