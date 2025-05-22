import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/types';
import { LogMessage } from './Console';

interface PreviewProps {
  project: Project;
  height?: string;
  className?: string;
  onConsoleMessage?: (message: LogMessage) => void;
}

const Preview = ({ project, height = '100%', className, onConsoleMessage }: PreviewProps) => {
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

    // Add console interceptor script
    const consoleInterceptor = `
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
          };

          // Override console methods
          console.log = function() {
            const args = Array.from(arguments);
            originalConsole.log.apply(console, args);
            sendConsoleMessage('log', args);
          };
          
          console.warn = function() {
            const args = Array.from(arguments);
            originalConsole.warn.apply(console, args);
            sendConsoleMessage('warning', args);
          };
          
          console.error = function() {
            const args = Array.from(arguments);
            originalConsole.error.apply(console, args);
            sendConsoleMessage('error', args);
          };
          
          console.info = function() {
            const args = Array.from(arguments);
            originalConsole.info.apply(console, args);
            sendConsoleMessage('info', args);
          };

          // Send message to parent
          function sendConsoleMessage(type, args) {
            try {
              const content = args.map(arg => {
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch (e) {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ');
              
              window.parent.postMessage({
                source: 'p5js-console',
                type: type,
                content: content,
                timestamp: Date.now()
              }, '*');
            } catch (e) {
              originalConsole.error('Error sending console message:', e);
            }
          }

          // Capture global errors
          window.addEventListener('error', function(event) {
            sendConsoleMessage('error', [event.message + ' at ' + event.filename + ':' + event.lineno]);
          });
        })();
      </script>
    `;

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

    // Insert console interceptor at the beginning of head
    const headStartIndex = htmlContent.indexOf('<head>') + 6;
    if (headStartIndex > 5) {
      htmlContent =
        htmlContent.slice(0, headStartIndex) +
        consoleInterceptor +
        htmlContent.slice(headStartIndex);
    }

    // Use data URI to avoid cross-origin issues
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    iframeRef.current.src = dataUri;
  };

  // Set up message listener for console messages
  useEffect(() => {
    if (!onConsoleMessage) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'p5js-console') {
        onConsoleMessage({
          id: `console-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: event.data.type,
          content: event.data.content,
          timestamp: event.data.timestamp
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleMessage]);

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