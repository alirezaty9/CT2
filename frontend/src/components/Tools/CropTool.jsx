import React, { useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { 
  Crop, 
  Check,
  X,
  Square,
  Maximize,
  Undo2
} from 'lucide-react';

const CropTool = forwardRef(({ canvas, isActive }, ref) => {
  const [showPanel, setShowPanel] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('free');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [originalState, setOriginalState] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  
  const cropRectRef = useRef(null);
  const overlaysRef = useRef([]);

  // Save original image state
  const saveOriginalState = useCallback(() => {
    if (!canvas?.backgroundImage) return;
    
    const bgImage = canvas.backgroundImage;
    const imgElement = bgImage._element || bgImage._originalElement;
    if (!imgElement) return;
    
    setOriginalState({
      src: imgElement.src,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      imageScaleX: bgImage.scaleX,
      imageScaleY: bgImage.scaleY,
      imageLeft: bgImage.left,
      imageTop: bgImage.top
    });
    setCanUndo(true);
  }, [canvas]);

  // Undo crop
  const undoCrop = useCallback(() => {
    if (!canvas || !originalState) return;
    
    // Restore canvas size
    canvas.setWidth(originalState.canvasWidth);
    canvas.setHeight(originalState.canvasHeight);
    
    const htmlCanvas = canvas.getElement();
    if (htmlCanvas) {
      htmlCanvas.width = originalState.canvasWidth;
      htmlCanvas.height = originalState.canvasHeight;
      htmlCanvas.style.width = `${originalState.canvasWidth}px`;
      htmlCanvas.style.height = `${originalState.canvasHeight}px`;
    }
    
    // Restore background image
    fabric.Image.fromURL(originalState.src, (img) => {
      img.set({
        left: originalState.imageLeft,
        top: originalState.imageTop,
        scaleX: originalState.imageScaleX,
        scaleY: originalState.imageScaleY,
        selectable: false,
        evented: false
      });
      
      canvas.setBackgroundImage(img, () => {
        canvas.renderAll();
        setCanUndo(false);
        setOriginalState(null);
        
        // Dispatch resize event
        window.dispatchEvent(new CustomEvent('canvasResized', {
          detail: { width: originalState.canvasWidth, height: originalState.canvasHeight, canvas }
        }));
      });
    });
  }, [canvas, originalState]);

  // Remove crop box and overlays
  const removeCropBox = useCallback(() => {
    if (cropRectRef.current && canvas) {
      overlaysRef.current.forEach(overlay => canvas.remove(overlay));
      overlaysRef.current = [];
      canvas.remove(cropRectRef.current);
      cropRectRef.current = null;
      canvas.renderAll();
    }
  }, [canvas]);

  // Create overlays
  const createOverlays = useCallback((cropRect) => {
    if (!canvas) return;
    
    const bounds = { left: 0, top: 0, width: canvas.width, height: canvas.height };
      const actualWidth = cropRect.width * cropRect.scaleX;
      const actualHeight = cropRect.height * cropRect.scaleY;
      
    const overlays = [
      // Top
      new fabric.Rect({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: Math.max(0, cropRect.top - bounds.top),
        fill: 'rgba(0,0,0,0.5)',
        selectable: false,
        evented: false,
        excludeFromExport: true
      }),
      // Bottom
      new fabric.Rect({
        left: bounds.left,
        top: cropRect.top + actualHeight,
        width: bounds.width,
        height: Math.max(0, bounds.height - (cropRect.top + actualHeight)),
        fill: 'rgba(0,0,0,0.5)',
        selectable: false,
        evented: false,
        excludeFromExport: true
      }),
      // Left
      new fabric.Rect({
        left: bounds.left,
        top: cropRect.top,
        width: Math.max(0, cropRect.left - bounds.left),
        height: actualHeight,
        fill: 'rgba(0,0,0,0.5)',
        selectable: false,
        evented: false,
        excludeFromExport: true
      }),
      // Right
      new fabric.Rect({
        left: cropRect.left + actualWidth,
        top: cropRect.top,
        width: Math.max(0, bounds.width - (cropRect.left + actualWidth)),
        height: actualHeight,
        fill: 'rgba(0,0,0,0.5)',
        selectable: false,
        evented: false,
        excludeFromExport: true
      })
    ];
    
    overlays.forEach(overlay => canvas.add(overlay));
    overlaysRef.current = overlays;
  }, [canvas]);

  // Create crop box
  const createCropBox = useCallback((x, y, width, height) => {
    if (!canvas) return;
    
    removeCropBox();
    
    // Create crop rectangle
    cropRectRef.current = new fabric.Rect({
      left: x,
      top: y,
      width: width,
      height: height,
      fill: 'transparent',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      lockRotation: true,
      borderColor: '#007bff',
      cornerColor: '#007bff',
      cornerSize: 12,
      transparentCorners: false
    });
    
    canvas.add(cropRectRef.current);
    createOverlays(cropRectRef.current);
    
    // Update overlays when crop box moves
    const updateOverlays = () => createOverlays(cropRectRef.current);
    cropRectRef.current.on('moving', updateOverlays);
    cropRectRef.current.on('scaling', updateOverlays);
    
    canvas.setActiveObject(cropRectRef.current);
    canvas.renderAll();
  }, [canvas, removeCropBox, createOverlays]);

  // Start crop mode
  const startCropMode = useCallback(() => {
    if (!canvas || !isActive) return;
    
    setCropMode(true);
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    
    // Create default crop box in center
    const centerX = canvas.width * 0.25;
    const centerY = canvas.height * 0.25;
    const cropWidth = canvas.width * 0.5;
    const cropHeight = canvas.height * 0.5;
    
    createCropBox(centerX, centerY, cropWidth, cropHeight);
  }, [canvas, isActive, createCropBox]);

  // Cancel crop mode
  const cancelCropMode = useCallback(() => {
    setCropMode(false);
    removeCropBox();
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
  }, [removeCropBox, canvas]);

  // Apply crop
  const applyCrop = useCallback(() => {
    if (!cropRectRef.current || !canvas?.backgroundImage) return;
    
    const cropRect = cropRectRef.current;
    const bgImage = canvas.backgroundImage;
    const imgElement = bgImage._element || bgImage._originalElement;
    
    if (!imgElement) return;
    
    // Save original state
    saveOriginalState();
    
    // Get actual crop dimensions
    const actualWidth = cropRect.width * cropRect.scaleX;
    const actualHeight = cropRect.height * cropRect.scaleY;
    
    // Calculate scale factors from canvas to original image
    const originalWidth = imgElement.naturalWidth || imgElement.width;
    const originalHeight = imgElement.naturalHeight || imgElement.height;
    const scaleX = originalWidth / canvas.width;
    const scaleY = originalHeight / canvas.height;
    
    // Convert crop coordinates to original image coordinates
    const cropData = {
      left: cropRect.left * scaleX,
      top: cropRect.top * scaleY,
      width: actualWidth * scaleX,
      height: actualHeight * scaleY
    };
    
    // Ensure crop is within image bounds
    const clampedCrop = {
      left: Math.max(0, Math.min(cropData.left, originalWidth)),
      top: Math.max(0, Math.min(cropData.top, originalHeight)),
      width: Math.min(cropData.width, originalWidth - Math.max(0, cropData.left)),
      height: Math.min(cropData.height, originalHeight - Math.max(0, cropData.top))
    };
    
    // Create crop canvas
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.max(1, Math.round(clampedCrop.width));
    cropCanvas.height = Math.max(1, Math.round(clampedCrop.height));
    const cropCtx = cropCanvas.getContext('2d');
    
    // Enable high quality image smoothing
    cropCtx.imageSmoothingEnabled = true;
    cropCtx.imageSmoothingQuality = 'high';
    
    // Draw cropped portion
    cropCtx.drawImage(
      imgElement,
      Math.round(clampedCrop.left),
      Math.round(clampedCrop.top),
      Math.round(clampedCrop.width),
      Math.round(clampedCrop.height),
      0, 0,
      Math.round(clampedCrop.width),
      Math.round(clampedCrop.height)
    );
    
    // Create new fabric image
    fabric.Image.fromURL(cropCanvas.toDataURL(), (newImg) => {
      // Center the image in the canvas
      const centerX = actualWidth / 2;
      const centerY = actualHeight / 2;
      
      newImg.set({
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        scaleX: 1,
        scaleY: 1,
        selectable: false,
        evented: false
      });
      
      // Resize canvas to match crop
      canvas.setWidth(actualWidth);
      canvas.setHeight(actualHeight);
      
      const htmlCanvas = canvas.getElement();
      if (htmlCanvas) {
        htmlCanvas.width = actualWidth;
        htmlCanvas.height = actualHeight;
        htmlCanvas.style.width = `${actualWidth}px`;
        htmlCanvas.style.height = `${actualHeight}px`;
      }
      
      // Set new background image
      canvas.setBackgroundImage(newImg, () => {
        canvas.renderAll();
        cancelCropMode();
        
        // Dispatch resize event
        window.dispatchEvent(new CustomEvent('canvasResized', {
          detail: { width: actualWidth, height: actualHeight, canvas }
        }));
      });
    });
  }, [canvas, saveOriginalState, cancelCropMode]);

  // Mouse event handlers for free drawing
  const handleMouseDown = useCallback((e) => {
    if (!cropMode || aspectRatio !== 'free' || !canvas) return;
    
    const pointer = canvas.getPointer(e.e);
    setIsDrawing(true);
    setStartPoint(pointer);
    removeCropBox();
  }, [cropMode, aspectRatio, canvas, removeCropBox]);

  const handleMouseMove = useCallback((e) => {
    if (!cropMode || aspectRatio !== 'free' || !isDrawing || !startPoint || !canvas) return;
    
    const pointer = canvas.getPointer(e.e);
    const left = Math.min(startPoint.x, pointer.x);
    const top = Math.min(startPoint.y, pointer.y);
    const width = Math.abs(pointer.x - startPoint.x);
    const height = Math.abs(pointer.y - startPoint.y);
    
    if (width > 10 && height > 10) {
      removeCropBox();
      createCropBox(left, top, width, height);
    }
  }, [cropMode, aspectRatio, isDrawing, startPoint, canvas, removeCropBox, createCropBox]);

  const handleMouseUp = useCallback((e) => {
    if (!cropMode || aspectRatio !== 'free' || !isDrawing || !canvas) return;
    
    setIsDrawing(false);
    setStartPoint(null);
    
    if (cropRectRef.current) {
      cropRectRef.current.set({ selectable: true, evented: true });
      canvas.renderAll();
    }
  }, [cropMode, aspectRatio, isDrawing, canvas]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    togglePanel: () => setShowPanel(prev => !prev),
    showPanel: () => setShowPanel(true),
    hidePanel: () => setShowPanel(false),
    startCrop: startCropMode,
    cancelCrop: cancelCropMode,
    undoCrop: undoCrop,
    canUndo: canUndo
  }), [startCropMode, cancelCropMode, undoCrop, canUndo]);

  // Auto-start crop mode when tool becomes active
  useEffect(() => {
    if (canvas && isActive) {
    startCropMode();
    }
  }, [canvas, isActive, startCropMode]);

  // Setup mouse event listeners
  useEffect(() => {
    if (!canvas || !cropMode) return;
    
      if (aspectRatio === 'free') {
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
    }
    
    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, cropMode, aspectRatio, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Aspect ratio presets
  const aspectRatios = [
    { value: 'free', label: 'Free', icon: Maximize },
    { value: 'square', label: '1:1', icon: Square },
    { value: '16:9', label: '16:9', icon: Square },
    { value: '4:3', label: '4:3', icon: Square }
  ];
  
  return (
    <div className="crop-tool p-3 border-t border-gray-200 bg-white shadow-lg">
      {!showPanel && !cropMode ? (
        // Minimal view
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">🔲 Crop Tool</span>
          <button
            onClick={() => setShowPanel(true)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Settings
          </button>
        </div>
      ) : cropMode ? (
        // Crop mode active
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-700">🔲 Crop Mode Active</span>
            <div className="flex gap-1">
              {canUndo && (
                <button
                  onClick={undoCrop}
                  className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                  title="Undo Last Crop"
                >
                  <Undo2 size={12} />
                </button>
              )}
              <button
                onClick={applyCrop}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                title="Apply Crop"
              >
                <Check size={12} />
              </button>
              <button
                onClick={cancelCropMode}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-blue-600 mb-2">
            {aspectRatio === 'free' 
              ? 'Click and drag to draw crop area, then drag to adjust. Click ✓ to apply or ✕ to cancel.'
              : 'Drag the crop area to adjust. Click ✓ to apply or ✕ to cancel.'
            }
          </div>
          
          {/* Aspect Ratio Controls */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-1">
              {aspectRatios.map(ratio => (
                <button
                  key={ratio.value}
                  onClick={() => {
                    setAspectRatio(ratio.value);
                    if (cropRectRef.current) {
                      removeCropBox();
                      startCropMode();
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    aspectRatio === ratio.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Full settings panel
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">🔲 Crop Tool</span>
            <button
              onClick={() => setShowPanel(false)}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              ✕
            </button>
          </div>
          
          {/* Main Actions */}
          <div className="mb-4">
            <button
              onClick={startCropMode}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Crop size={16} />
              <span className="text-sm">Start Crop</span>
            </button>
            
            {canUndo && (
              <button
                onClick={undoCrop}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors mt-2"
              >
                <Undo2 size={16} />
                <span className="text-sm">Undo Last Crop</span>
              </button>
            )}
          </div>
          
          {/* Aspect Ratio Selection */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-1">
              {aspectRatios.map(ratio => {
                const IconComponent = ratio.icon;
                return (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                      aspectRatio === ratio.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <IconComponent size={12} />
                    {ratio.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CropTool;