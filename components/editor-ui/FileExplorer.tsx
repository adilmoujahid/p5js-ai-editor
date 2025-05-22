import { useState } from 'react';
import { Project, ProjectFile, getFileTypeFromName, FileType } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileCode,
  File,
  FileImage,
  FileAudio,
  Plus,
  Trash2,
  Download,
  Upload,
  MoreVertical,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface FileExplorerProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onFileSelect: (fileId: string) => void;
}

const FileTypeIcon = ({ type }: { type: FileType }) => {
  switch (type) {
    case 'js':
      return <FileCode className="w-4 h-4 mr-2 text-amber-500" />;
    case 'html':
      return <FileCode className="w-4 h-4 mr-2 text-blue-500" />;
    case 'css':
      return <File className="w-4 h-4 mr-2 text-purple-500" />;
    case 'jpg':
    case 'png':
    case 'gif':
      return <FileImage className="w-4 h-4 mr-2 text-green-500" />;
    case 'mp3':
    case 'wav':
      return <FileAudio className="w-4 h-4 mr-2 text-orange-500" />;
    case 'json':
      return <File className="w-4 h-4 mr-2 text-yellow-500" />;
    default:
      return <FileText className="w-4 h-4 mr-2 text-gray-500" />;
  }
};

const FileExplorer = ({ project, onProjectChange, onFileSelect }: FileExplorerProps) => {
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleFileSelect = (fileId: string) => {
    onFileSelect(fileId);
  };

  const handleRenameProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProjectChange({
      ...project,
      name: e.target.value,
      lastModified: Date.now()
    });
  };

  const handleAddFile = () => {
    if (!newFileName) return;

    // Generate unique ID
    const fileId = `file-${Date.now()}`;
    const fileType = getFileTypeFromName(newFileName);

    // Create default content based on file type
    let defaultContent = '';
    if (fileType === 'js') {
      defaultContent = '// Your code goes here\n';
    } else if (fileType === 'html') {
      defaultContent = '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page Title</title>\n</head>\n<body>\n\n</body>\n</html>';
    } else if (fileType === 'css') {
      defaultContent = '/* Your styles go here */\n';
    }

    const newFile: ProjectFile = {
      id: fileId,
      name: newFileName,
      content: defaultContent,
      type: fileType,
      lastModified: Date.now()
    };

    onProjectChange({
      ...project,
      files: [...project.files, newFile],
      activeFile: fileId,
      lastModified: Date.now()
    });

    setNewFileName('');
    setShowNewFileInput(false);
  };

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = project.files.filter(file => file.id !== fileId);

    let activeFile = project.activeFile;
    if (project.activeFile === fileId) {
      activeFile = updatedFiles.length > 0 ? updatedFiles[0].id : undefined;
    }

    onProjectChange({
      ...project,
      files: updatedFiles,
      activeFile,
      lastModified: Date.now()
    });
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    if (!newName.trim()) return;

    // Make sure the file extension is preserved
    let finalName = newName;
    const oldFile = project.files.find(f => f.id === fileId);

    if (oldFile) {
      const oldExt = oldFile.name.split('.').pop();
      const newExt = newName.split('.').pop();

      // If new name doesn't have an extension but old one did, add it
      if (oldExt && oldExt !== newExt) {
        finalName = `${newName}.${oldExt}`;
      }

      // Update the file type based on the new name
      const fileType = getFileTypeFromName(finalName);

      const updatedFiles = project.files.map(file => {
        if (file.id === fileId) {
          return {
            ...file,
            name: finalName,
            type: fileType,
            lastModified: Date.now()
          };
        }

        // Check for references to this file in HTML
        if (file.type === 'html' && oldFile) {
          let content = file.content;

          // Update script src attributes
          if (oldFile.type === 'js') {
            content = content.replace(
              new RegExp(`src=["']${oldFile.name}["']`, 'g'),
              `src="${finalName}"`
            );
          }

          // Update link href attributes
          if (oldFile.type === 'css') {
            content = content.replace(
              new RegExp(`href=["']${oldFile.name}["']`, 'g'),
              `href="${finalName}"`
            );
          }

          if (content !== file.content) {
            return {
              ...file,
              content,
              lastModified: Date.now()
            };
          }
        }

        return file;
      });

      onProjectChange({
        ...project,
        files: updatedFiles,
        lastModified: Date.now()
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const fileId = `file-${Date.now()}`;
        const fileType = getFileTypeFromName(file.name);

        const newFile: ProjectFile = {
          id: fileId,
          name: file.name,
          content,
          type: fileType,
          lastModified: Date.now()
        };

        onProjectChange({
          ...project,
          files: [...project.files, newFile],
          activeFile: fileId,
          lastModified: Date.now()
        });
      }
    };
    reader.readAsText(file);

    // Reset the file input
    e.target.value = '';
  };

  const handleDownloadProject = () => {
    // Create a zip file with all project files
    alert('Project download functionality will be implemented');
    // For now we could just download the active file
    if (project.activeFile) {
      const activeFile = project.files.find(file => file.id === project.activeFile);
      if (activeFile) {
        const element = document.createElement('a');
        const file = new Blob([activeFile.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = activeFile.name;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    }
  };

  const startRenameFile = (fileId: string, currentName: string) => {
    setFileToRename(fileId);
    setRenameValue(currentName);
  };

  const completeRename = () => {
    if (fileToRename && renameValue.trim()) {
      handleRenameFile(fileToRename, renameValue);
    }
    setFileToRename(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <Input
          value={project.name}
          onChange={handleRenameProject}
          className="h-7 text-sm font-medium bg-transparent border-none focus-visible:ring-1"
        />
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => document.getElementById('file-upload')?.click()}
            className="h-7 w-7"
            title="Upload file"
          >
            <Upload className="h-4 w-4" />
            <input
              id="file-upload"
              type="file"
              accept=".js,.html,.css,.txt,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadProject}
            className="h-7 w-7"
            title="Download project"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Files</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNewFileInput(true)}
          className="h-6 w-6"
          title="Add new file"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showNewFileInput && (
        <div className="px-2 pb-2 flex items-center">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename.ext"
            className="h-7 text-xs"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddFile()}
            onBlur={() => {
              if (!newFileName) setShowNewFileInput(false);
              else handleAddFile();
            }}
          />
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        {project.files.map((file) => (
          <div
            key={file.id}
            onClick={() => handleFileSelect(file.id)}
            className={cn(
              "flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm relative",
              project.activeFile === file.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="flex items-center overflow-hidden">
              <FileTypeIcon type={file.type} />
              <span className="truncate">{file.name}</span>
            </div>

            {fileToRename === file.id ? (
              <div className="absolute inset-0 flex items-center bg-background z-10 px-2">
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') completeRename();
                    else if (e.key === 'Escape') setFileToRename(null);
                  }}
                  onBlur={completeRename}
                  className="h-7 text-xs"
                />
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      startRenameFile(file.id, file.name);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer; 