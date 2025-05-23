'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@/components/editor-ui/Editor';
import Preview from '@/components/editor-ui/Preview';
import FileExplorer from '@/components/editor-ui/FileExplorer';
import ProjectManager from '@/components/editor-ui/ProjectManager';
import WebSocketListener from '@/components/editor-ui/WebSocketListener';
import Tabs from '@/components/editor-ui/Tabs';
import Console, { LogMessage } from '@/components/editor-ui/Console';
import { Project, ProjectFile, DEFAULT_PROJECT } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Palette, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enableWsListener, setEnableWsListener] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<LogMessage[]>([]);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [isRunning, setIsRunning] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load project from localStorage
  useEffect(() => {
    const loadProject = () => {
      try {
        // First try to load from saved projects
        const savedProjects = localStorage.getItem('p5_projects');
        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          const foundProject = projects.find((p: Project) => p.id === projectId);

          if (foundProject) {
            // Ensure the project has openTabs property
            if (!foundProject.openTabs) {
              foundProject.openTabs = foundProject.files.map((f: ProjectFile) => f.id);
            }
            setProject(foundProject);
            localStorage.setItem('current_project', JSON.stringify(foundProject));
            setLoading(false);
            return;
          }
        }

        // If not found in saved projects, check current project
        const currentProject = localStorage.getItem('current_project');
        if (currentProject) {
          const parsed = JSON.parse(currentProject);
          if (parsed.id === projectId) {
            setProject(parsed);
            setLoading(false);
            return;
          }
        }

        // If project not found, redirect to dashboard
        console.error('Project not found:', projectId);
        router.push('/');
      } catch (error) {
        console.error('Error loading project:', error);
        router.push('/');
      }
    };

    loadProject();
  }, [projectId, router]);

  // Auto-save project changes
  useEffect(() => {
    if (project) {
      try {
        localStorage.setItem('current_project', JSON.stringify(project));

        // Also update in saved projects if it exists there
        const savedProjects = localStorage.getItem('p5_projects');
        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          const index = projects.findIndex((p: Project) => p.id === project.id);
          if (index !== -1) {
            projects[index] = project;
            localStorage.setItem('p5_projects', JSON.stringify(projects));
          }
        }
      } catch (error) {
        console.error('Error saving project:', error);
      }
    }
  }, [project]);

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    if (!project) return;

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
    if (!project || !project.activeFile) return;

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
    if (!project) return;

    const updatedOpenTabs = project.openTabs.filter(id => id !== fileId);

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
    if (!project || !project.activeFile) return;

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
    clearConsole();
  };

  // Handle stop execution
  const handleStop = () => {
    setIsRunning(false);
  };

  // Go back to dashboard
  const handleBackToDashboard = () => {
    router.push('/');
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  const activeFile = project.activeFile
    ? project.files.find(f => f.id === project.activeFile)
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/40 px-4 py-3 sticky top-0 z-10">
        <div className="mx-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <p className="text-xs text-muted-foreground">p5.js AI Editor</p>
              </div>
            </div>
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