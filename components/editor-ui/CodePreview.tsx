import { useEffect, useRef } from 'react';
import { createP5Frame } from '@/lib/template';

interface CodePreviewProps {
  code: string;
  height?: string;
}

const CodePreview = ({ code, height = '70vh' }: CodePreviewProps) => {
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
    <div className="w-full border border-border rounded-md overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        className="w-full"
        style={{ height }}
        title="P5.js Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default CodePreview; 