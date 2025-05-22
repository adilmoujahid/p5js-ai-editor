import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/types';

interface PreviewProps {
  project: Project;
  height?: string;
  className?: string;
}

const Preview = ({ project, height = '100%', className }: PreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      updateIframe();
    }
  }, [project]);

  const updateIframe = () => {
    if (!iframeRef.current) return;

    // Get HTML file
    const htmlFile = project.files.find(file => file.name === 'index.html');

    // Handle HTML processing
    let htmlContent = '';

    if (htmlFile) {
      // Start with existing HTML
      htmlContent = htmlFile.content;

      // Process the HTML to replace script src references with actual content
      project.files.forEach(file => {
        if (file.type === 'js' && file.name !== 'index.html') {
          // Look for script tags referencing this file
          const scriptRegex = new RegExp(`<script[^>]*src=["']${file.name}["'][^>]*>.*?</script>`, 'g');
          if (scriptRegex.test(htmlContent)) {
            // Replace reference with inline script
            htmlContent = htmlContent.replace(
              scriptRegex,
              `<script>${file.content}</script>`
            );
          }
        }

        if (file.type === 'css' && file.name !== 'index.html') {
          // Look for CSS links referencing this file
          const cssRegex = new RegExp(`<link[^>]*href=["']${file.name}["'][^>]*>`, 'g');
          if (cssRegex.test(htmlContent)) {
            // Replace reference with inline style
            htmlContent = htmlContent.replace(
              cssRegex,
              `<style>${file.content}</style>`
            );
          }
        }
      });
    } else {
      // If no HTML file exists, create a simple one with all scripts
      const cssFile = project.files.find(file => file.type === 'css');
      const jsFiles = project.files.filter(file => file.type === 'js');

      const cssContent = cssFile ? `<style>${cssFile.content}</style>` : '';
      const jsContent = jsFiles.map(file => `<script>${file.content}</script>`).join('\n');

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${project.name}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
          ${cssContent}
        </head>
        <body>
          ${jsContent}
        </body>
        </html>
      `;
    }

    // Add p5.js library if not present
    if (!htmlContent.includes('p5.js') && !htmlContent.includes('p5.min.js')) {
      const headEndIndex = htmlContent.indexOf('</head>');
      if (headEndIndex !== -1) {
        htmlContent =
          htmlContent.slice(0, headEndIndex) +
          '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>\n' +
          htmlContent.slice(headEndIndex);
      }
    }

    // Use data URI to avoid cross-origin issues
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    iframeRef.current.src = dataUri;
  };

  return (
    <div
      className={cn(
        "w-full h-full overflow-auto bg-white",
        className
      )}
      style={{
        overflowX: 'auto',
        overflowY: 'auto'
      }}
    >
      <iframe
        ref={iframeRef}
        className="min-w-full min-h-full"
        style={{ height, width: '100%' }}
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default Preview; 