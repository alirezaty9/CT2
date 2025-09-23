import React, { useRef, useCallback } from 'react';

const MoveTool = ({ canvas, isActive }) => {
  const isMovingRef = useRef(false);
  const lastPointRef = useRef(null);

  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    if (!canvas || !isActive) return;
    
    const pointer = canvas.getPointer(e.e);
    const target = canvas.findTarget(e.e);
    
    if (target && target !== canvas.backgroundImage) {
      canvas.setActiveObject(target);
      isMovingRef.current = true;
      lastPointRef.current = pointer;
      console.log('🖱️ Moving object:', target.type);
    }
  }, [canvas, isActive]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (!canvas || !isActive || !isMovingRef.current) return;
    
    const pointer = canvas.getPointer(e.e);
    const activeObject = canvas.getActiveObject();
    
    if (activeObject) {
      const deltaX = pointer.x - lastPointRef.current.x;
      const deltaY = pointer.y - lastPointRef.current.y;
      
      activeObject.set({
        left: activeObject.left + deltaX,
        top: activeObject.top + deltaY
      });
      
      canvas.renderAll();
      lastPointRef.current = pointer;
    }
  }, [canvas, isActive]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!canvas || !isActive) return;
    
    isMovingRef.current = false;
    lastPointRef.current = null;
    console.log('🖱️ Move finished');
  }, [canvas, isActive]);

  // Add event listeners
  React.useEffect(() => {
    if (canvas && isActive) {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      
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
      console.log('🖱️ Move tool deactivated');
    }
  }, [canvas, isActive]);

  return (
    <div className="move-tool">
      <div className="text-sm text-gray-600 mb-2">
        Move Tool - Click and drag to move objects
      </div>
      <div className="text-xs text-gray-500">
        Click on any object to select and move it
      </div>
    </div>
  );
};

export default MoveTool;
