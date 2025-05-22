import { Project, ProjectFile, FileType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import {
  FileText,
  FileCode,
  File,
  FileImage,
  FileAudio
} from 'lucide-react';

interface TabsProps {
  project: Project;
  onFileSelect: (fileId: string) => void;
  onCloseTab?: (fileId: string) => void;
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

const Tabs = ({ project, onFileSelect, onCloseTab }: TabsProps) => {
  const activeFileId = project.activeFile;

  return (
    <div className="flex items-center overflow-x-auto bg-muted/40 border-b">
      {project.files.map((file) => (
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
  );
};

export default Tabs; 