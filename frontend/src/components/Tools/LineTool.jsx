import React, { useRef, useCallback } from 'react';
import { fabric } from 'fabric';

const LineTool = ({ canvas, isActive, lineColor = '#ff0000', lineWidth = 2 }) => {
  const isDrawingRef = useRef(false);
  const currentLineRef = useRef(null);

  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    if (!canvas || !isActive) return;
    
    const pointer = canvas.getPointer(e.e);
    
    // Create new line
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: lineColor,
      strokeWidth: lineWidth,
      selectable: true,
      evented: true
    });
    
    canvas.add(line);
    canvas.setActiveObject(line);
    currentLineRef.current = line;
    isDrawingRef.current = true;
    
    console.log('📏 Line started at:', pointer);
  }, [canvas, isActive, lineColor, lineWidth]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (!canvas || !isActive || !isDrawingRef.current || !currentLineRef.current) return;
    
    const pointer = canvas.getPointer(e.e);
    
    // Update line end point
    currentLineRef.current.set({ x2: pointer.x, y2: pointer.y });
    canvas.renderAll();
  }, [canvas, isActive]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!canvas || !isActive) return;
    
    isDrawingRef.current = false;
    currentLineRef.current = null;
    console.log('📏 Line finished');
  }, [canvas, isActive]);

  // Add event listeners
  React.useEffect(() => {
    if (canvas && isActive) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      
      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      };
    }
  }, [canvas, isActive, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Cleanup when tool becomes inactive
  React.useEffect(() => {
    if (canvas && !isActive) {
      canvas.selection = true;
      console.log('📏 Line tool deactivated');
    }
  }, [canvas, isActive]);

  return (
    <div className="line-tool">
      <div className="text-sm text-gray-600 mb-2">
        Line Tool - Click and drag to draw lines
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs">Color:</label>
        <input
          type="color"
          value={lineColor}
          onChange={(e) => {
            // Color will be applied to new lines
          }}
          className="w-8 h-6 rounded border"
        />
        <label className="text-xs">Width:</label>
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => {
            // Width will be applied to new lines
          }}
          className="w-20"
        />
        <span className="text-xs">{lineWidth}px</span>
      </div>
    </div>
  );
};

export default LineTool;
