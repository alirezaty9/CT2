import React, { useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useToolLayer } from '../../hooks/useToolLayer';

const BrushTool = ({ canvas, isActive, brushColor = '#ff0000', brushWidth = 5 }) => {
  const brushRef = useRef(null);

  // Use layer system
  const { addToLayer, getCurrentLayer } = useToolLayer('Brush', 'brush', canvas, isActive);

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

      // Listen for path created events to add to layer
      const handlePathCreated = (e) => {
        if (e.path) {
          addToLayer(e.path);
          console.log('🖌️ Brush stroke added to layer:', getCurrentLayer()?.name);
        }
      };

      canvas.on('path:created', handlePathCreated);

      console.log('🖌️ Brush tool activated with layer:', getCurrentLayer()?.name);

      return () => {
        canvas.off('path:created', handlePathCreated);
      };
    }
  }, [canvas, isActive, brushColor, brushWidth, addToLayer, getCurrentLayer]);

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
