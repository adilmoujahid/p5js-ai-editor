'use client';

import { useState, useEffect } from 'react';
import CodeEditor from '@/components/editor-ui/CodeEditor';
import CodePreview from '@/components/editor-ui/CodePreview';
import SketchManager from '@/components/editor-ui/SketchManager';
import WebSocketListener from '@/components/editor-ui/WebSocketListener';
import { DEFAULT_P5_TEMPLATE } from '@/lib/template';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [code, setCode] = useState(DEFAULT_P5_TEMPLATE);
  const [enableWsListener, setEnableWsListener] = useState(false);

  // Handle code changes from the editor
  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  // Handle code updates from WebSocket
  const handleCodeUpdate = (newCode: string) => {
    setCode(newCode);
  };

  return (
    <main className="container mx-auto py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">p5.js AI Editor</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEnableWsListener(!enableWsListener)}
          >
            {enableWsListener ? 'Disable MCP Connection' : 'Enable MCP Connection'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Code Editor</h2>
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-medium">Live Preview</h2>
          <CodePreview code={code} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">Sketch Manager</h2>
        <SketchManager
          currentCode={code}
          onLoadSketch={handleCodeChange}
        />
      </div>

      {enableWsListener && (
        <WebSocketListener onCodeUpdate={handleCodeUpdate} />
      )}
    </main>
  );
}
