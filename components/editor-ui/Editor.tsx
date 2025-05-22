import { useRef, useEffect } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { ProjectFile, FileType } from '@/lib/types';

interface EditorProps {
  file: ProjectFile;
  onChange: (value: string) => void;
  height?: string;
  className?: string;
}

// Map file types to Monaco language
const getLanguage = (type: FileType): string => {
  switch (type) {
    case 'js':
      return 'javascript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    default:
      return 'plaintext';
  }
};

const Editor = ({
  file,
  onChange,
  height = '100%',
  className
}: EditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Add p5.js intellisense (would require p5.d.ts to be loaded)
    // This is a placeholder for future enhancement
  };

  return (
    <div className={cn("w-full h-full overflow-hidden", className)}>
      <MonacoEditor
        height={height}
        language={getLanguage(file.type)}
        value={file.content}
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

export default Editor; 