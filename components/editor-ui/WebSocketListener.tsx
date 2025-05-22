import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

interface WebSocketListenerProps {
  onCodeUpdate: (code: string) => void;
  serverUrl?: string;
}

const WebSocketListener = ({
  onCodeUpdate,
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
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setConnected(false);
      setError(`Connection error: ${err.message}`);
    });

    // Listen for code updates
    newSocket.on('codeUpdate', (data: { code: string }) => {
      if (data && data.code) {
        onCodeUpdate(data.code);
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, onCodeUpdate]);

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