import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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
    <div className="fixed bottom-4 right-4 text-xs">
      {connected ? (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-500">Connected to MCP server</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-500">
            {error ? error : "Disconnected from MCP server"}
          </span>
        </div>
      )}
    </div>
  );
};

export default WebSocketListener; 