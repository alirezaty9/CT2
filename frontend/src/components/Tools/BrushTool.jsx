import React, { useRef, useCallback } from 'react';
import { fabric } from 'fabric';

const BrushTool = ({ canvas, isActive, brushColor = '#ff0000', brushWidth = 5 }) => {
  const brushRef = useRef(null);

  // Initialize brush
  React.useEffect(() => {
    if (canvas && isActive) {
      // Create brush
      brushRef.current = new fabric.PencilBrush(canvas);
      brushRef.current.width = brushWidth;
      brushRef.current.color = brushColor;
      
      // Set up drawing mode
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = brushRef.current;
      
      // Reset composite operation
      if (canvas.contextTop) {
        canvas.contextTop.globalCompositeOperation = 'source-over';
      }
      
      console.log('🖌️ Brush tool activated');
    }
  }, [canvas, isActive, brushColor, brushWidth]);

  // Cleanup when tool becomes inactive
  React.useEffect(() => {
    if (canvas && !isActive) {
      canvas.isDrawingMode = false;
      console.log('🖌️ Brush tool deactivated');
    }
  }, [canvas, isActive]);

  return (
    <div className="brush-tool">
      <div className="text-sm text-gray-600 mb-2">
        Brush Tool - Draw freely
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs">Color:</label>
        <input
          type="color"
          value={brushColor}
          onChange={(e) => {
            if (brushRef.current) {
              brushRef.current.color = e.target.value;
            }
          }}
          className="w-8 h-6 rounded border"
        />
        <label className="text-xs">Width:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushWidth}
          onChange={(e) => {
            if (brushRef.current) {
              brushRef.current.width = parseInt(e.target.value);
            }
          }}
          className="w-20"
        />
        <span className="text-xs">{brushWidth}px</span>
      </div>
    </div>
  );
};

export default BrushTool;
