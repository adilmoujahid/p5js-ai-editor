import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Download, Upload, Save, Trash2 } from 'lucide-react';

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
    <div className="space-y-4 w-full">
      <Input
        type="text"
        value={sketchName}
        onChange={(e) => setSketchName(e.target.value)}
        placeholder="Sketch name"
        className="h-9"
      />

      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={handleSaveSketch}
          size="sm"
          className="w-full"
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadSketch}
          size="sm"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-1" />
          Down
        </Button>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
            size="sm"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-1" />
            Up
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
        <div className="border rounded-md overflow-hidden bg-background mt-4">
          <div className="bg-muted/50 p-2 text-sm font-medium border-b">Saved Sketches</div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y">
            {sketches.map((sketch) => (
              <div
                key={sketch.id}
                onClick={() => handleLoadSketch(sketch)}
                className="flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
              >
                <div className="overflow-hidden">
                  <div className="font-medium text-sm truncate">{sketch.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(sketch.lastModified).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteSketch(sketch.id, e)}
                  className="h-7 w-7 opacity-60 hover:opacity-100 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
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