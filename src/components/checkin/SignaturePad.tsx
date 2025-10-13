import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SignaturePadProps {
  onCapture: (signatureData: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export function SignaturePad({ onCapture }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [paths, setPaths] = useState<Point[][]>([]);

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set up canvas with high DPI support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    context.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Set drawing styles for better signature experience
    context.strokeStyle = '#1f2937'; // Darker color for better visibility
    context.lineWidth = 3; // Thicker lines
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowColor = 'rgba(0, 0, 0, 0.1)';
    context.shadowBlur = 2;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    initializeCanvas();
    
    // Re-initialize on resize
    const handleResize = () => {
      setTimeout(initializeCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas]);

  const getPointFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    
    const point = getPointFromEvent(e);
    setLastPoint(point);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.beginPath();
    context.moveTo(point.x, point.y);
    
    // Start a new path
    setPaths(prev => [...prev, [point]]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    e.preventDefault();
    
    const point = getPointFromEvent(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Draw smooth curves
    const midX = (lastPoint.x + point.x) / 2;
    const midY = (lastPoint.y + point.y) / 2;
    
    context.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
    context.stroke();

    setLastPoint(point);
    
    // Update current path
    setPaths(prev => {
      const newPaths = [...prev];
      if (newPaths.length > 0) {
        newPaths[newPaths.length - 1] = [...newPaths[newPaths.length - 1], point];
      }
      return newPaths;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setPaths([]);
  };

  const captureSignature = async () => {
    if (!hasSignature) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const signatureData = canvas.toDataURL('image/png');
      onCapture(signatureData);
    } finally {
      setIsProcessing(false);
    }
  };

  const undoLastStroke = () => {
    if (paths.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all paths except the last one
    const newPaths = paths.slice(0, -1);
    setPaths(newPaths);
    
    if (newPaths.length === 0) {
      setHasSignature(false);
    } else {
      // Redraw remaining paths
      context.beginPath();
      newPaths.forEach(path => {
        if (path.length > 0) {
          context.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            const midX = (path[i-1].x + path[i].x) / 2;
            const midY = (path[i-1].y + path[i].y) / 2;
            context.quadraticCurveTo(path[i-1].x, path[i-1].y, midX, midY);
          }
          context.stroke();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Digital Signature</h4>
        <p className="text-sm text-gray-600">
          Please sign in the box below using your finger or mouse
        </p>
      </div>

      {/* Signature Area */}
      <div className="relative">
        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 transition-colors hover:border-gray-400">
          <canvas
            ref={canvasRef}
            className="w-full h-40 sm:h-48 cursor-crosshair touch-none bg-white rounded-lg shadow-inner"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
          
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">✍️</div>
                <div className="text-gray-500 text-sm font-medium">Sign here...</div>
                <div className="text-gray-400 text-xs mt-1">Use your finger or mouse</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Signature Preview */}
        {hasSignature && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Signature captured
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary Actions */}
        <div className="flex space-x-3">
          <button
            onClick={undoLastStroke}
            disabled={!hasSignature || paths.length === 0}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
          
          <button
            onClick={clearSignature}
            disabled={!hasSignature}
            className="flex-1 bg-red-100 text-red-700 py-3 px-4 rounded-lg font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>

        {/* Confirm Button */}
        <button
          onClick={captureSignature}
          disabled={!hasSignature || isProcessing}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm Signature
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 Tip: Sign naturally - the system will smooth your strokes
        </p>
      </div>
    </div>
  );
}
