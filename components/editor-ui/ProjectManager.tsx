import { useState, useEffect } from 'react';
import { Project, DEFAULT_PROJECT } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, PlusCircle } from 'lucide-react';

interface ProjectManagerProps {
  currentProject: Project;
  onProjectChange: (project: Project) => void;
}

const ProjectManager = ({ currentProject, onProjectChange }: ProjectManagerProps) => {
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('p5_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save projects to localStorage when the array changes
  useEffect(() => {
    localStorage.setItem('p5_projects', JSON.stringify(projects));
  }, [projects]);

  const handleSaveProject = () => {
    const existingIndex = projects.findIndex(p => p.id === currentProject.id);

    // Update timestamp
    const updatedProject = {
      ...currentProject,
      lastModified: Date.now()
    };

    if (existingIndex >= 0) {
      // Update existing project
      const updatedProjects = [...projects];
      updatedProjects[existingIndex] = updatedProject;
      setProjects(updatedProjects);
    } else {
      // Add new project
      setProjects([...projects, updatedProject]);
    }
  };

  const handleNewProject = () => {
    // Generate new project with unique ID
    const newProject = {
      ...DEFAULT_PROJECT,
      id: `project-${Date.now()}`,
      name: `Untitled Project ${projects.length + 1}`,
      lastModified: Date.now()
    };
    onProjectChange(newProject);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSaveProject}
        title="Save project"
      >
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNewProject}
        title="New project"
      >
        <PlusCircle className="h-4 w-4 mr-1" />
        New
      </Button>
    </div>
  );
};

export default ProjectManager; 