import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { XCircle, AlertCircle, Info } from 'lucide-react';

export type LogMessage = {
  id: string;
  type: 'error' | 'warning' | 'log' | 'info';
  content: string;
  timestamp: number;
};

interface ConsoleProps {
  messages: LogMessage[];
  onClear: () => void;
  className?: string;
}

const Console = ({ messages, onClear, className }: ConsoleProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full bg-card/10", className)}>
      <div className="flex justify-between items-center p-2 border-b bg-muted/40">
        <h3 className="text-sm font-medium">Console</h3>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-auto text-sm font-mono p-1">
        {messages.length === 0 ? (
          <div className="text-muted-foreground italic p-2 text-xs">No console output</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "px-2 py-1 border-b border-muted flex items-start gap-2",
                msg.type === 'error' && "text-red-500 bg-red-500/5",
                msg.type === 'warning' && "text-amber-500 bg-amber-500/5",
                msg.type === 'info' && "text-blue-500 bg-blue-500/5",
              )}
            >
              {msg.type === 'error' && <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {msg.type === 'warning' && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {msg.type === 'info' && <Info className="w-4 h-4 mt-0.5 shrink-0" />}
              <pre className="whitespace-pre-wrap break-words">
                {msg.content}
              </pre>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Console; 