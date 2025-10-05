import React, { useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { motion } from 'framer-motion';
import {
  Crop,
  Check,
  X,
  Square,
  Maximize,
  Undo2,
  Settings
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

    // Save all objects' state
    const objectsState = canvas.getObjects()
      .filter(obj => !obj.excludeFromExport)
      .map(obj => ({
        object: obj,
        left: obj.left,
        top: obj.top,
        path: obj.path ? JSON.parse(JSON.stringify(obj.path)) : null
      }));

    setOriginalState({
      src: imgElement.src,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      imageScaleX: bgImage.scaleX,
      imageScaleY: bgImage.scaleY,
      imageLeft: bgImage.left,
      imageTop: bgImage.top,
      objectsState: objectsState
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

    // Restore all objects' positions and paths
    if (originalState.objectsState) {
      originalState.objectsState.forEach(savedState => {
        const obj = savedState.object;

        // Restore position
        obj.set({
          left: savedState.left,
          top: savedState.top
        });

        // Restore path data for brush strokes
        if (savedState.path && obj.path) {
          obj.path = JSON.parse(JSON.stringify(savedState.path));
          obj.setCoords();
        }
      });
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
    if (!canvas) return;

    setCropMode(false);
    removeCropBox();
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.renderAll();
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
    const cropLeft = cropRect.left;
    const cropTop = cropRect.top;

    // Get all objects (excluding overlays and crop rectangle)
    const objects = canvas.getObjects().filter(obj =>
      !obj.excludeFromExport && obj !== cropRectRef.current && !overlaysRef.current.includes(obj)
    );

    // Calculate scale factors from canvas to original image
    const originalWidth = imgElement.naturalWidth || imgElement.width;
    const originalHeight = imgElement.naturalHeight || imgElement.height;
    const scaleX = originalWidth / canvas.width;
    const scaleY = originalHeight / canvas.height;

    // Convert crop coordinates to original image coordinates
    const cropData = {
      left: cropLeft * scaleX,
      top: cropTop * scaleY,
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

    // Create crop canvas for background
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

      // Adjust all objects to match the crop
      objects.forEach(obj => {
        // Calculate new position relative to crop
        const newLeft = obj.left - cropLeft;
        const newTop = obj.top - cropTop;

        obj.set({
          left: newLeft,
          top: newTop
        });

        // For path objects (brush strokes), adjust path data
        if (obj.path) {
          obj.path.forEach(segment => {
            if (segment.length > 1) {
              segment[1] -= cropLeft; // x coordinate
            }
            if (segment.length > 2) {
              segment[2] -= cropTop;  // y coordinate
            }
            if (segment.length > 3) {
              segment[3] -= cropLeft; // control point x1
            }
            if (segment.length > 4) {
              segment[4] -= cropTop;  // control point y1
            }
            if (segment.length > 5) {
              segment[5] -= cropLeft; // control point x2
            }
            if (segment.length > 6) {
              segment[6] -= cropTop;  // control point y2
            }
          });
          obj.setCoords();
        }
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

  // Auto-start crop mode when tool becomes active, cleanup when inactive
  useEffect(() => {
    if (canvas && isActive) {
      startCropMode();
    } else if (canvas && !isActive && cropRectRef.current) {
      // Only clean up if there's actually something to clean up
      setCropMode(false);

      // Remove crop box and overlays
      overlaysRef.current.forEach(overlay => canvas.remove(overlay));
      overlaysRef.current = [];
      canvas.remove(cropRectRef.current);
      cropRectRef.current = null;

      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.renderAll();
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
    { value: 'free', label: 'Free', icon: Maximize }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-72 sm:w-80 bg-background-white dark:bg-background-secondary rounded-2xl shadow-2xl border border-border p-4 sm:p-6"
    >
      {!showPanel && !cropMode ? (
        // Minimal view
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
              <Crop size={16} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-text">Crop Tool</span>
          </div>
          <motion.button
            onClick={() => setShowPanel(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/30 text-xs sm:text-sm font-semibold"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={14} className="sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      ) : cropMode ? (
        // Crop mode active
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div
                className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crop size={16} className="sm:w-5 sm:h-5" />
              </motion.div>
              <span className="text-sm sm:text-base font-semibold text-primary">Crop Active</span>
            </div>
            <div className="flex gap-1 sm:gap-2">
              {canUndo && (
                <motion.button
                  onClick={undoCrop}
                  className="p-2 sm:p-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg shadow-orange-500/30"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title="Undo Last Crop"
                >
                  <Undo2 size={14} className="sm:w-4 sm:h-4" />
                </motion.button>
              )}
              <motion.button
                onClick={applyCrop}
                className="p-2 sm:p-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg shadow-green-500/30"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Apply Crop"
              >
                <Check size={14} className="sm:w-4 sm:h-4" />
              </motion.button>
              <motion.button
                onClick={cancelCropMode}
                className="p-2 sm:p-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg shadow-red-500/30"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Cancel"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-accent dark:bg-background-primary rounded-xl border border-border">
            <p className="text-xs sm:text-sm text-text leading-relaxed">
              🎯 Click and drag to draw crop area, then adjust as needed. Click ✓ to apply or ✕ to cancel.
            </p>
          </div>
        </div>
      ) : (
        // Full settings panel
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                <Crop size={16} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-text">Crop Settings</span>
            </div>
            <motion.button
              onClick={() => setShowPanel(false)}
              className="p-1.5 sm:p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </motion.button>
          </div>

          {/* Main Actions */}
          <div className="space-y-2 sm:space-y-3">
            <motion.button
              onClick={startCropMode}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/30 text-sm sm:text-base font-semibold"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Crop size={16} className="sm:w-4 sm:h-5" />
              <span>Start Crop</span>
            </motion.button>

            {canUndo && (
              <motion.button
                onClick={undoCrop}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg shadow-orange-500/30 text-sm sm:text-base font-semibold"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Undo2 size={16} className="sm:w-4 sm:h-5" />
                <span>Undo Last Crop</span>
              </motion.button>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
});

export default CropTool;