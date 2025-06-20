import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  height?: string;
  className?: string;
}

const CodeEditor = ({
  code,
  onChange,
  height = '70vh',
  className
}: CodeEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Add p5.js intellisense (would require p5.d.ts to be loaded)
    // This is a placeholder for future enhancement
  };

  return (
    <div className={cn("w-full h-full overflow-hidden", className)}>
      <Editor
        height={height}
        defaultLanguage="javascript"
        value={code}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          tabSize: 2,
          automaticLayout: true,
          wordWrap: 'on',
          padding: { top: 16 },
          lineNumbers: 'on',
          roundedSelection: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
        }}
        theme="vs-dark"
      />
    </div>
  );
};

export default CodeEditor; 