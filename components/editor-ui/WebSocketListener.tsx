import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { LogMessage } from './Console';

interface WebSocketListenerProps {
  onCodeUpdate: (code: string) => void;
  onExecutionControl?: (action: 'start' | 'stop' | 'toggle') => void;
  onConsoleControl?: (action: 'clear' | 'message' | 'height', data?: any) => void;
  onFileControl?: (action: 'select' | 'close' | 'create' | 'delete', data?: any) => void;
  onLayoutControl?: (action: 'sidebar' | 'projectName', data?: any) => void;
  onNavigationControl?: (action: 'dashboard') => void;
  serverUrl?: string;
}

const WebSocketListener = ({
  onCodeUpdate,
  onExecutionControl,
  onConsoleControl,
  onFileControl,
  onLayoutControl,
  onNavigationControl,
  serverUrl = 'ws://localhost:3001'
}: WebSocketListenerProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(serverUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    setSocket(newSocket);

    // Handle connection events
    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('🔌 WebSocket connected to MCP server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 WebSocket disconnected from MCP server');
    });

    newSocket.on('connect_error', (err) => {
      setConnected(false);
      setError(`Connection error: ${err.message}`);
      console.error('🔌 WebSocket connection error:', err);
    });

    // Listen for code updates
    newSocket.on('codeUpdate', (data: { code: string }) => {
      console.log('📝 Received code update:', data.code.substring(0, 50) + '...');
      if (data && data.code) {
        onCodeUpdate(data.code);
      }
    });

    // Execution control events
    newSocket.on('startExecution', () => {
      console.log('▶️ Received start execution command');
      onExecutionControl?.('start');
    });

    newSocket.on('stopExecution', () => {
      console.log('⏹️ Received stop execution command');
      onExecutionControl?.('stop');
    });

    newSocket.on('toggleExecution', () => {
      console.log('🔄 Received toggle execution command');
      onExecutionControl?.('toggle');
    });

    // Console control events
    newSocket.on('clearConsole', () => {
      console.log('🧹 Received clear console command');
      onConsoleControl?.('clear');
    });

    newSocket.on('addConsoleMessage', (data: LogMessage) => {
      console.log('📱 Received add console message command:', data);
      onConsoleControl?.('message', data);
    });

    newSocket.on('setConsoleHeight', (height: number) => {
      console.log('📏 Received set console height command:', height);
      onConsoleControl?.('height', height);
    });

    // File control events
    newSocket.on('selectFile', (fileId: string) => {
      console.log('📂 Received select file command:', fileId);
      onFileControl?.('select', fileId);
    });

    newSocket.on('closeTab', (fileId: string) => {
      console.log('❌ Received close tab command:', fileId);
      onFileControl?.('close', fileId);
    });

    newSocket.on('createFile', (fileData: { name: string; content: string }) => {
      console.log('📄 Received create file command:', fileData);
      onFileControl?.('create', fileData);
    });

    newSocket.on('deleteFile', (fileId: string) => {
      console.log('🗑️ Received delete file command:', fileId);
      onFileControl?.('delete', fileId);
    });

    // Layout control events
    newSocket.on('toggleSidebar', () => {
      console.log('📋 Received toggle sidebar command');
      onLayoutControl?.('sidebar');
    });

    newSocket.on('updateProjectName', (name: string) => {
      console.log('🎨 Received update project name command:', name);
      onLayoutControl?.('projectName', name);
    });

    // Navigation control events
    newSocket.on('backToDashboard', () => {
      console.log('🧭 Received back to dashboard command');
      onNavigationControl?.('dashboard');
    });

    // Log all incoming events for debugging
    newSocket.onAny((eventName, ...args) => {
      console.log(`📨 WebSocket event: ${eventName}`, args);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, onCodeUpdate, onExecutionControl, onConsoleControl, onFileControl, onLayoutControl, onNavigationControl]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          "py-2 px-4 rounded-full shadow-md flex items-center gap-2 text-sm transition-all duration-200",
          connected
            ? "bg-green-500/10 text-green-600 border border-green-500/20"
            : "bg-red-500/10 text-red-600 border border-red-500/20"
        )}
      >
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            connected
              ? "bg-green-500 animate-pulse"
              : "bg-red-500"
          )}
        />
        <span>
          {connected
            ? "Connected to MCP server"
            : error ? error : "Disconnected from MCP server"
          }
        </span>
      </div>
    </div>
  );
};

export default WebSocketListener; 