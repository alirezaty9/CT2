import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';

const EraserTool = forwardRef(({ canvas, isActive }, ref) => {
  const [eraserSize, setEraserSize] = React.useState(20);
  const [showPanel, setShowPanel] = React.useState(false);
  const isErasingRef = useRef(false);
  const previewCircleRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    togglePanel: () => setShowPanel(prev => !prev),
    showPanel: () => setShowPanel(true),
    hidePanel: () => setShowPanel(false)
  }));

  // Simple and effective eraser implementation
  React.useEffect(() => {
    if (canvas && isActive) {
      // Disable selection and drawing mode
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      
      // Mouse down - start erasing
      const handleMouseDown = (e) => {
        isErasingRef.current = true;
        const pointer = canvas.getPointer(e.e);
        eraseObjectsAtPoint(pointer);
      };
      
      // Mouse move - show preview and continue erasing
      const handleMouseMove = (e) => {
        const pointer = canvas.getPointer(e.e);
        
        // Show preview circle
        showPreview(pointer);
        
        // If erasing, erase objects
        if (isErasingRef.current) {
          eraseObjectsAtPoint(pointer);
        }
      };
      
      // Mouse up - stop erasing
      const handleMouseUp = () => {
        isErasingRef.current = false;
      };
      
      // Mouse leave - stop erasing and hide preview
      const handleMouseLeave = () => {
        isErasingRef.current = false;
        hidePreview();
      };
      
      // Function to erase objects at a point
      const eraseObjectsAtPoint = (point) => {
        const objects = canvas.getObjects();
        const objectsToRemove = [];
        
        objects.forEach(obj => {
          // Skip background and preview circle
          if (obj === canvas.backgroundImage || obj === previewCircleRef.current) {
            return;
          }
          
          // Check if object is within eraser range
          if (isPointInObject(obj, point, eraserSize / 2)) {
            objectsToRemove.push(obj);
          }
        });
        
        // Remove objects
        objectsToRemove.forEach(obj => {
          canvas.remove(obj);
        });
        
        if (objectsToRemove.length > 0) {
          canvas.renderAll();
        }
      };
      
      // Check if point is within object bounds
      const isPointInObject = (obj, point, radius) => {
        const bounds = obj.getBoundingRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
        );
        
        const objRadius = Math.max(bounds.width, bounds.height) / 2;
        return distance < (radius + objRadius);
      };
      
      // Show preview circle
      const showPreview = (point) => {
        // Remove old preview
        if (previewCircleRef.current) {
          canvas.remove(previewCircleRef.current);
        }
        
        // Create new preview
        previewCircleRef.current = new fabric.Circle({
          left: point.x - eraserSize / 2,
          top: point.y - eraserSize / 2,
          radius: eraserSize / 2,
          fill: 'transparent',
          stroke: '#ff0000',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          excludeFromExport: true
        });
        
        canvas.add(previewCircleRef.current);
        canvas.renderAll();
      };
      
      // Hide preview circle
      const hidePreview = () => {
        if (previewCircleRef.current) {
          canvas.remove(previewCircleRef.current);
          previewCircleRef.current = null;
          canvas.renderAll();
        }
      };
      
      // Add event listeners
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mouse:leave', handleMouseLeave);
      
      console.log('🧹 Eraser tool activated');
      
      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
        canvas.off('mouse:leave', handleMouseLeave);
        hidePreview();
      };
      
    } else if (canvas && !isActive) {
      // Reset when deactivated
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      
      // Clean up preview
      if (previewCircleRef.current) {
        canvas.remove(previewCircleRef.current);
        previewCircleRef.current = null;
        canvas.renderAll();
      }
      
      console.log('🧹 Eraser tool deactivated');
    }
  }, [canvas, isActive, eraserSize]);

  // Simple UI that can be toggled
  return (
    <div className="eraser-tool p-3 border-t border-gray-200">
      {!showPanel ? (
        // Minimal view
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">🧹 Eraser Active</span>
          <button
            onClick={() => setShowPanel(true)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Settings
          </button>
        </div>
      ) : (
        // Full settings panel
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">🧹 Eraser Tool</span>
            <button
              onClick={() => setShowPanel(false)}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">
              Size: {eraserSize}px
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={eraserSize}
              onChange={(e) => {
                setEraserSize(parseInt(e.target.value));
              }}
              className="w-full"
            />
          </div>
          
          <div className="mb-3 flex justify-center">
            <div 
              className="border-2 border-dashed border-red-400 rounded-full bg-red-50"
              style={{ 
                width: `${Math.min(eraserSize, 60)}px`, 
                height: `${Math.min(eraserSize, 60)}px` 
              }}
            />
          </div>
          
          <button
            onClick={() => {
              if (canvas) {
                const objects = canvas.getObjects().slice(); // Copy array
                objects.forEach(obj => {
                  if (obj !== canvas.backgroundImage) {
                    canvas.remove(obj);
                  }
                });
                canvas.renderAll();
                console.log('🧹 All objects cleared');
              }
            }}
            className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
});

export default EraserTool;