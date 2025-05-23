import { Project, ProjectFile, FileType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { X, Play, Square } from 'lucide-react';
import {
  FileText,
  FileCode,
  File,
  FileImage,
  FileAudio
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabsProps {
  project: Project;
  onFileSelect: (fileId: string) => void;
  onCloseTab?: (fileId: string) => void;
  isRunning?: boolean;
  onStart?: () => void;
  onStop?: () => void;
}

const FileIcon = ({ type }: { type: FileType }) => {
  switch (type) {
    case 'js':
      return <FileCode className="w-3.5 h-3.5 mr-1.5 text-amber-500" />;
    case 'html':
      return <FileCode className="w-3.5 h-3.5 mr-1.5 text-blue-500" />;
    case 'css':
      return <File className="w-3.5 h-3.5 mr-1.5 text-purple-500" />;
    case 'jpg':
    case 'png':
    case 'gif':
      return <FileImage className="w-3.5 h-3.5 mr-1.5 text-green-500" />;
    case 'mp3':
    case 'wav':
      return <FileAudio className="w-3.5 h-3.5 mr-1.5 text-orange-500" />;
    default:
      return <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-500" />;
  }
};

const Tabs = ({ project, onFileSelect, onCloseTab, isRunning = false, onStart, onStop }: TabsProps) => {
  const activeFileId = project.activeFile;

  // Get only the files that are in the openTabs array
  const openFiles = project.files.filter(file =>
    project.openTabs.includes(file.id)
  );

  return (
    <div className="flex flex-col">
      {/* Control buttons */}
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/20 border-b">
        {onStart && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStart}
            disabled={isRunning}
            className="h-7 px-2"
            title="Start execution"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Start
          </Button>
        )}

        {onStop && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            disabled={!isRunning}
            className="h-7 px-2"
            title="Stop execution"
          >
            <Square className="h-3.5 w-3.5 mr-1" />
            Stop
          </Button>
        )}

        {isRunning && (
          <div className="flex items-center ml-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
            <span className="text-xs text-muted-foreground">Running</span>
          </div>
        )}
      </div>

      {/* File tabs */}
      <div className="flex items-center overflow-x-auto bg-muted/40 border-b">
        {openFiles.map((file) => (
          <div
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            className={cn(
              "flex items-center px-3 py-2 text-xs cursor-pointer max-w-[180px] min-w-[120px] whitespace-nowrap border-r",
              activeFileId === file.id
                ? "bg-background border-b-2 border-b-primary"
                : "border-b-transparent hover:bg-background/60"
            )}
          >
            <div className="flex items-center overflow-hidden flex-1">
              <FileIcon type={file.type} />
              <span className="truncate">{file.name}</span>
            </div>

            {onCloseTab && (
              <button
                className="ml-2 opacity-50 hover:opacity-100 p-0.5 rounded-sm hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
                title="Close tab"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs; 