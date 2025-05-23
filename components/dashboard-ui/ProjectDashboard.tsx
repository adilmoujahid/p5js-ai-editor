import { useState, useEffect } from 'react';
import { Project, DEFAULT_PROJECT } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PlusCircle,
  FolderOpen,
  Trash2,
  Calendar,
  FileCode,
  Play,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface ProjectDashboardProps {
  onProjectSelect?: (project: Project) => void;
}

const ProjectDashboard = ({ onProjectSelect }: ProjectDashboardProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  // Load projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('p5_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save projects to localStorage
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('p5_projects', JSON.stringify(updatedProjects));
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      ...DEFAULT_PROJECT,
      id: `project-${Date.now()}`,
      name: `Untitled Project ${projects.length + 1}`,
      lastModified: Date.now()
    };

    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);

    // Navigate to the new project
    router.push(`/project/${newProject.id}`);
  };

  const handleOpenProject = (project: Project) => {
    // Set as current project and navigate
    localStorage.setItem('current_project', JSON.stringify(project));
    router.push(`/project/${project.id}`);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);

    // Clear current project if it's the one being deleted
    const currentProject = localStorage.getItem('current_project');
    if (currentProject) {
      const parsed = JSON.parse(currentProject);
      if (parsed.id === projectId) {
        localStorage.removeItem('current_project');
      }
    }
  };

  const handleDuplicateProject = (project: Project) => {
    const duplicatedProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      name: `${project.name} (Copy)`,
      lastModified: Date.now()
    };

    const updatedProjects = [...projects, duplicatedProject];
    saveProjects(updatedProjects);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectPreview = (project: Project) => {
    const jsFile = project.files.find(f => f.type === 'js');
    if (jsFile) {
      const lines = jsFile.content.split('\n').slice(0, 3);
      return lines.join('\n');
    }
    return 'No JavaScript files';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/40 px-6 py-4">
        <div className="flex items-center">
          <div className="ml-8">
            <h1 className="text-3xl font-bold">p5.js AI Editor</h1>
            <p className="text-muted-foreground mt-1">Create and manage your p5.js projects</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <FileCode className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first p5.js project to start coding interactive art and animations.
            </p>
            <Button onClick={handleCreateProject} size="lg">
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Projects ({projects.length})</h2>
              <Button variant="outline" onClick={handleCreateProject}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.lastModified)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenProject(project)}>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProject(project)}>
                            <FileCode className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="bg-muted/50 rounded-md p-3 mb-4 min-h-[80px]">
                      <pre className="text-xs text-muted-foreground font-mono overflow-hidden">
                        {getProjectPreview(project)}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileCode className="h-4 w-4" />
                        {project.files.length} files
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleOpenProject(project)}
                        className="group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDashboard; 