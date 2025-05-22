import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Sketch {
  id: string;
  name: string;
  code: string;
  lastModified: number;
}

interface SketchManagerProps {
  currentCode: string;
  onLoadSketch: (code: string) => void;
}

const SketchManager = ({ currentCode, onLoadSketch }: SketchManagerProps) => {
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [sketchName, setSketchName] = useState('Untitled Sketch');

  // Load sketches from localStorage on component mount
  useEffect(() => {
    const savedSketches = localStorage.getItem('p5_sketches');
    if (savedSketches) {
      setSketches(JSON.parse(savedSketches));
    }
  }, []);

  // Save sketches to localStorage when the array changes
  useEffect(() => {
    localStorage.setItem('p5_sketches', JSON.stringify(sketches));
  }, [sketches]);

  const handleSaveSketch = () => {
    // Check if sketch with same name exists
    const existingIndex = sketches.findIndex(sketch => sketch.name === sketchName);

    if (existingIndex >= 0) {
      // Update existing sketch
      const updatedSketches = [...sketches];
      updatedSketches[existingIndex] = {
        ...updatedSketches[existingIndex],
        code: currentCode,
        lastModified: Date.now()
      };
      setSketches(updatedSketches);
    } else {
      // Create new sketch
      const newSketch: Sketch = {
        id: Date.now().toString(),
        name: sketchName,
        code: currentCode,
        lastModified: Date.now()
      };
      setSketches([...sketches, newSketch]);
    }
  };

  const handleLoadSketch = (sketch: Sketch) => {
    setSketchName(sketch.name);
    onLoadSketch(sketch.code);
  };

  const handleDeleteSketch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSketches(sketches.filter(sketch => sketch.id !== id));
  };

  const handleDownloadSketch = () => {
    const element = document.createElement('a');
    const file = new Blob([currentCode], { type: 'text/javascript' });
    element.href = URL.createObjectURL(file);
    element.download = `${sketchName}.js`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Set the name based on the file name (remove extension)
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setSketchName(fileName);
        onLoadSketch(content);
      }
    };
    reader.readAsText(file);

    // Reset the file input
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={sketchName}
          onChange={(e) => setSketchName(e.target.value)}
          placeholder="Sketch name"
        />
        <Button onClick={handleSaveSketch}>Save</Button>
        <Button variant="outline" onClick={handleDownloadSketch}>Download</Button>
        <div className="relative">
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            Upload
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".js"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {sketches.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <h3 className="font-medium p-2 bg-muted">Saved Sketches</h3>
          <div className="max-h-60 overflow-y-auto">
            {sketches.map((sketch) => (
              <div
                key={sketch.id}
                onClick={() => handleLoadSketch(sketch)}
                className="flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <div>
                  <div className="font-medium">{sketch.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(sketch.lastModified).toLocaleString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteSketch(sketch.id, e)}
                  className="opacity-50 hover:opacity-100"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SketchManager; 