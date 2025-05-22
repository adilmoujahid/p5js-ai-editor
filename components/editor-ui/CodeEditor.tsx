import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  height?: string;
}

const CodeEditor = ({ code, onChange, height = '70vh' }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Add p5.js intellisense (would require p5.d.ts to be loaded)
    // This is a placeholder for future enhancement
  };

  return (
    <div className="w-full h-full border border-border rounded-md overflow-hidden">
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
        }}
        theme="vs-dark"
      />
    </div>
  );
};

export default CodeEditor; 