'use client';

import { useState, useEffect } from 'react';
import Editor from '@/components/editor-ui/Editor';
import Preview from '@/components/editor-ui/Preview';
import FileExplorer from '@/components/editor-ui/FileExplorer';
import ProjectManager from '@/components/editor-ui/ProjectManager';
import WebSocketListener from '@/components/editor-ui/WebSocketListener';
import Tabs from '@/components/editor-ui/Tabs';
import Console, { LogMessage } from '@/components/editor-ui/Console';
import { Project, ProjectFile, DEFAULT_PROJECT } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Palette, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enableWsListener, setEnableWsListener] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<LogMessage[]>([]);
  const [consoleHeight, setConsoleHeight] = useState(200); // Default height in pixels
  const [isRunning, setIsRunning] = useState(true); // Code execution state

  // Load project from localStorage on initial load
  useEffect(() => {
    try {
      const savedProject = localStorage.getItem('current_project');
      if (savedProject) {
        const parsed = JSON.parse(savedProject);
        console.log('Loaded project from localStorage:', parsed);
        setProject(parsed);
      } else {
        console.log('No saved project found, using default');
      }
    } catch (error) {
      console.error('Error loading project from localStorage:', error);
    }
  }, []);

  // Save current project to localStorage when it changes
  useEffect(() => {
    try {
      console.log('Saving project to localStorage:', project);
      localStorage.setItem('current_project', JSON.stringify(project));
    } catch (error) {
      console.error('Error saving project to localStorage:', error);
    }
  }, [project]);

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    // Add to open tabs if not already there
    const updatedOpenTabs = project.openTabs.includes(fileId)
      ? project.openTabs
      : [...project.openTabs, fileId];

    setProject({
      ...project,
      activeFile: fileId,
      openTabs: updatedOpenTabs
    });
  };

  // Handle file content changes
  const handleFileChange = (content: string) => {
    if (!project.activeFile) return;

    const updatedFiles = project.files.map(file => {
      if (file.id === project.activeFile) {
        return {
          ...file,
          content,
          lastModified: Date.now()
        };
      }
      return file;
    });

    setProject({
      ...project,
      files: updatedFiles,
      lastModified: Date.now()
    });
  };

  // Handle closing a tab
  const handleCloseTab = (fileId: string) => {
    // Remove from open tabs
    const updatedOpenTabs = project.openTabs.filter(id => id !== fileId);

    // If we're closing the active file, select another one
    let activeFile = project.activeFile;
    if (project.activeFile === fileId) {
      activeFile = updatedOpenTabs.length > 0 ? updatedOpenTabs[0] : undefined;
    }

    setProject({
      ...project,
      openTabs: updatedOpenTabs,
      activeFile,
      lastModified: Date.now()
    });
  };

  // Handle updates from WebSocket
  const handleCodeUpdate = (code: string) => {
    if (!project.activeFile) return;

    const updatedFiles = project.files.map(file => {
      if (file.id === project.activeFile) {
        return {
          ...file,
          content: code,
          lastModified: Date.now()
        };
      }
      return file;
    });

    setProject({
      ...project,
      files: updatedFiles,
      lastModified: Date.now()
    });
  };

  // Handle console messages
  const handleConsoleMessage = (message: LogMessage) => {
    setConsoleMessages(prevMessages => [...prevMessages, message]);
  };

  // Clear console messages
  const clearConsole = () => {
    setConsoleMessages([]);
  };

  // Handle start execution
  const handleStart = () => {
    setIsRunning(true);
    // Clear console when starting fresh
    clearConsole();
  };

  // Handle stop execution
  const handleStop = () => {
    setIsRunning(false);
  };

  // Get active file
  const activeFile = project.activeFile
    ? project.files.find(f => f.id === project.activeFile)
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/40 px-4 py-3 sticky top-0 z-10">
        <div className="mx-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            <h1 className="text-xl font-bold">p5.js AI Editor</h1>
          </div>

          <div className="flex items-center gap-2">
            <ProjectManager
              currentProject={project}
              onProjectChange={setProject}
            />

            <Button
              variant={enableWsListener ? "default" : "outline"}
              onClick={() => setEnableWsListener(!enableWsListener)}
              className="transition-all"
              size="sm"
            >
              {enableWsListener ? 'Disable MCP' : 'Enable MCP'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer Sidebar */}
        <div
          className={`bg-card/20 border-r flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'
            }`}
        >
          {sidebarOpen && (
            <FileExplorer
              project={project}
              onProjectChange={setProject}
              onFileSelect={handleFileSelect}
            />
          )}
        </div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground p-1.5 rounded-r-md shadow-md z-20"
          style={{ marginLeft: sidebarOpen ? '16rem' : '4px' }}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* Main content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="h-full flex flex-col md:flex-row mx-4 min-w-0">
            {/* Editor Section with Console */}
            <div className="flex-1 h-1/2 md:h-full flex flex-col min-w-0">
              <Tabs
                project={project}
                onFileSelect={handleFileSelect}
                onCloseTab={handleCloseTab}
                isRunning={isRunning}
                onStart={handleStart}
                onStop={handleStop}
              />

              {activeFile && (
                <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                  {/* Editor with resizable height */}
                  <div
                    className="flex-1 overflow-hidden min-w-0"
                    style={{ height: `calc(100% - ${consoleHeight}px)` }}
                  >
                    <Editor
                      file={activeFile}
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Resize handle */}
                  <div
                    className="h-1 bg-border hover:bg-primary/60 cursor-row-resize shrink-0"
                    onMouseDown={(e) => {
                      const startY = e.clientY;
                      const startHeight = consoleHeight;

                      const handleMouseMove = (e: MouseEvent) => {
                        const deltaY = startY - e.clientY;
                        const newHeight = Math.max(50, Math.min(500, startHeight + deltaY));
                        setConsoleHeight(newHeight);
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />

                  {/* Console */}
                  <div style={{ height: `${consoleHeight}px` }} className="min-w-0 overflow-hidden">
                    <Console
                      messages={consoleMessages}
                      onClear={clearConsole}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="w-full h-1/2 md:h-full md:w-1/2 border-t md:border-t-0 md:border-l flex flex-col min-w-0">
              <div className="bg-muted/40 py-2 px-3 border-b shrink-0">
                <h2 className="text-sm font-medium">Preview</h2>
              </div>
              <div className="flex-1 overflow-auto min-w-0">
                <Preview
                  project={project}
                  onConsoleMessage={handleConsoleMessage}
                  isRunning={isRunning}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {enableWsListener && (
        <WebSocketListener onCodeUpdate={handleCodeUpdate} />
      )}
    </div>
  );
}
