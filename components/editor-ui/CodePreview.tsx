import { useEffect, useRef } from 'react';
import { createP5Frame } from '@/lib/template';
import { cn } from '@/lib/utils';

interface CodePreviewProps {
  code: string;
  height?: string;
  className?: string;
}

const CodePreview = ({ code, height = '70vh', className }: CodePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      updateIframe();
    }
  }, [code]);

  const updateIframe = () => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const htmlContent = createP5Frame(code);

    // Use data URI to avoid cross-origin issues
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    iframe.src = dataUri;
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
        title="P5.js Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default CodePreview; 