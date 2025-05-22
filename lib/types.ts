export type FileType = 'js' | 'html' | 'css' | 'txt' | 'jpg' | 'png' | 'gif' | 'mp3' | 'wav' | 'json';

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: FileType;
  lastModified: number;
}

export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  lastModified: number;
  activeFile?: string; // ID of the active file
  openTabs: string[]; // IDs of files that are open in tabs
}

export const getFileTypeFromName = (filename: string): FileType => {
  const extension = filename.split('.').pop()?.toLowerCase() as FileType;
  if (['js', 'html', 'css', 'txt', 'jpg', 'png', 'gif', 'mp3', 'wav', 'json'].includes(extension)) {
    return extension;
  }
  return 'txt';
};

export const DEFAULT_PROJECT: Project = {
  id: 'default',
  name: 'Untitled Project',
  lastModified: Date.now(),
  files: [
    {
      id: 'sketch',
      name: 'sketch.js',
      type: 'js',
      lastModified: Date.now(),
      content: `function setup() {
  createCanvas(800, 500);
  background(240);
}

function draw() {
  // Draw a circle that follows the mouse
  fill(237, 34, 93);
  noStroke();
  ellipse(mouseX, mouseY, 60, 60);
}`
    },
    {
      id: 'index',
      name: 'index.html',
      type: 'html',
      lastModified: Date.now(),
      content: `<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <script src="sketch.js"></script>
    <link rel="stylesheet" type="text/css" href="style.css">
  </head>
  <body>
  </body>
</html>`
    },
    {
      id: 'style',
      name: 'style.css',
      type: 'css',
      lastModified: Date.now(),
      content: `html, body {
  margin: 0;
  padding: 0;
}

canvas {
  display: block;
}`
    }
  ],
  activeFile: 'sketch',
  openTabs: ['sketch', 'index', 'style'] // Initially all files are open
}; 