import React, { useRef, useEffect, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import { useCamera } from '../../contexts/CameraContext';

const BaslerDisplay = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const panStartRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const lastFrameRef = useRef(null);
  const lastSettingsRef = useRef(null);

  const {
    cameras,
    activeTool,
    drawings,
    toolDrawings,
    isDrawing,
    currentPath,
    imageSettings,
    cursorPosition,
    startDrawing,
    continueDrawing,
    finishDrawing,
    addToolDrawing,
    wsStatus,
    panImage
  } = useCamera();

  // Fabric.js event handlers - defined before initialization
  const handleFabricPathCreated = useCallback((e) => {
    console.log('✏️ ==================== PATH CREATED ====================');
    console.log('Path object:', e.path);
    console.log('Path type:', e.path?.type);
    console.log('Path position - left:', e.path?.left, 'top:', e.path?.top);
    console.log('Stroke width:', e.path?.strokeWidth);

    if (e.path && e.path.path) {
      console.log('Path data (first 10 points):');
      const pathPoints = e.path.path.slice(0, 10);
      pathPoints.forEach((point, idx) => {
        console.log(`  Point ${idx}:`, point);
      });
      console.log('Total points in path:', e.path.path.length);

      // Log bounding box
      const bounds = e.path.getBoundingRect();
      console.log('Bounding box:', {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height
      });
    }
    console.log('======================================================');

    // Make brush paths potentially selectable (will be controlled by move tool)
    if (e.path) {
      e.path.set({
        selectable: activeTool === 'move',
        evented: activeTool === 'move',
        hasControls: true,
        hasBorders: true,
        lockRotation: false,
        perPixelTargetFind: true, // فقط stroke واقعی قابل انتخاب باشد
        targetFindTolerance: 4 // تلورانس برای انتخاب
      });
    }

    // Reset composite operation after eraser path is created
    if (activeTool === 'eraser' && fabricCanvasRef.current && fabricCanvasRef.current.contextTop) {
      // Reset to normal drawing mode after erasing
      fabricCanvasRef.current.contextTop.globalCompositeOperation = 'source-over';
    }
  }, [activeTool]);

  const handleFabricObjectAdded = useCallback((e) => {
    console.log('Fabric object added:', e.target);
  }, []);

  const handleFabricMouseDown = useCallback((e) => {
    console.log('🖱️ Mouse down - Tool:', activeTool);
  }, [activeTool]);

  const handleFabricMouseMove = useCallback((e) => {
    if (!fabricCanvasRef.current) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);

    // Prevent eraser from leaving trails
    if (activeTool === 'eraser') {
      if (fabricCanvasRef.current.contextTop) {
        fabricCanvasRef.current.contextTop.globalCompositeOperation = 'destination-out';
      }
    }

    // Pan tool implementation
    if (activeTool === 'pan') {
      if (e.e.buttons === 1 && panStartRef.current) {
        const delta = {
          x: pointer.x - panStartRef.current.x,
          y: pointer.y - panStartRef.current.y
        };
        panImage(delta.x, delta.y);
        panStartRef.current = pointer;
      }
    }

    // Update Fabric canvas rendering
    if (fabricCanvasRef.current._isCurrentlyDrawing) {
      fabricCanvasRef.current.renderAll();
    }
  }, [activeTool]);

  const handleFabricMouseUp = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current._isCurrentlyDrawing = false;
    }
  }, []);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 640,
        height: 480,
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        perPixelTargetFind: true
      });

      fabricCanvasRef.current = canvas;

      // Setup drawing modes based on active tool
      setupFabricTools(canvas);

      // Add event listeners
      canvas.on('path:created', handleFabricPathCreated);
      canvas.on('object:added', handleFabricObjectAdded);
      canvas.on('mouse:down', handleFabricMouseDown);
      canvas.on('mouse:move', handleFabricMouseMove);
      canvas.on('mouse:up', handleFabricMouseUp);

      console.log('🎯 Event listeners added to canvas');

      // Prevent background image from being selected or moved
      canvas.on('object:added', (e) => {
        if (e.target === canvas.backgroundImage) {
          e.target.set({
            selectable: false,
            evented: false,
            excludeFromExport: false
          });
        }
      });

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Update background image in Fabric.js (only for new frames)
  const updateFabricBackground = useCallback(() => {
    if (!fabricCanvasRef.current || !cameras.basler.currentFrame) return;

    const currentFrame = cameras.basler.currentFrame;
    
    // Check if frame actually changed
    if (lastFrameRef.current === currentFrame) {
      return; // No need to update
    }
    
    // Update ref
    lastFrameRef.current = currentFrame;
    console.log('🖼️ Updating Fabric.js background image');

    fabric.Image.fromURL(currentFrame, (img) => {
      // Use current canvas dimensions if available, otherwise default to 640x480
      const currentWidth = fabricCanvasRef.current.width || 640;
      const currentHeight = fabricCanvasRef.current.height || 480;
      
      img.set({
        left: 0,
        top: 0,
        scaleX: currentWidth / img.width,
        scaleY: currentHeight / img.height,
        selectable: false,
        evented: false,
        excludeFromExport: false
      });
      
      // Apply current image settings
      const filters = [];
      if (imageSettings.brightness !== 100) {
        filters.push(new fabric.Image.filters.Brightness({ brightness: (imageSettings.brightness - 100) / 100 }));
      }
      if (imageSettings.contrast !== 100) {
        filters.push(new fabric.Image.filters.Contrast({ contrast: (imageSettings.contrast - 100) / 100 }));
      }
      if (imageSettings.grayscale) {
        filters.push(new fabric.Image.filters.Grayscale());
      }
      
      img.filters = filters;
      img.applyFilters();
      
      fabricCanvasRef.current.setBackgroundImage(img, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
    });
  }, [cameras.basler.currentFrame, imageSettings.brightness, imageSettings.contrast, imageSettings.grayscale]);

  // Simple tool setup - now handled by individual tool components
  const setupFabricTools = useCallback((canvas) => {
    if (!canvas) return;

    // Reset canvas settings
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';

    // Make all objects selectable and movable when in move mode
    if (activeTool === 'move') {
      canvas.getObjects().forEach(obj => {
        if (obj !== canvas.backgroundImage) {
          obj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            lockRotation: false,
            perPixelTargetFind: true, // فقط stroke واقعی قابل انتخاب
            targetFindTolerance: 4 // تلورانس 4 پیکسل
          });
        }
      });
    } else {
      // Make objects non-selectable when using other tools
      canvas.getObjects().forEach(obj => {
        if (obj !== canvas.backgroundImage) {
          obj.set({
            selectable: false,
            evented: false
          });
        }
      });
    }

    // Configure canvas based on active tool
    if (activeTool === 'crop') {
      console.log('🔲 Configuring crop tool in BaslerDisplay...');
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      console.log('🔲 Crop tool configured in BaslerDisplay');
    } else if (activeTool === 'eraser') {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      console.log('🧹 Eraser tool configured');
    } else if (activeTool === 'move') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      console.log('✋ Move tool configured - all objects are now selectable');
    } else if (activeTool === 'brush' || activeTool === 'line') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      console.log('🖌️ Drawing tool configured:', activeTool);
    }

    canvas.renderAll();
    console.log('🔧 Canvas initialized for tool components - Active tool:', activeTool);
  }, [activeTool]);

  // همگام‌سازی ابزار فعال با Fabric.js
  useEffect(() => {
    if (fabricCanvasRef.current && activeTool) {
      setupFabricTools(fabricCanvasRef.current);
    }
  }, [activeTool, setupFabricTools]);

  // اضافی: بررسی و بازیابی background image بعد از تغییر ابزار
  useEffect(() => {
    if (fabricCanvasRef.current && activeTool) {
      // تاخیر کوتاه برای اطمینان از تکمیل تغییر ابزار
      const timeoutId = setTimeout(() => {
        if (fabricCanvasRef.current && !fabricCanvasRef.current.backgroundImage && cameras.basler.currentFrame) {
          console.log('🔄 Background image missing after tool change, restoring...');
          updateFabricBackground();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [activeTool, cameras.basler.currentFrame, updateFabricBackground]);

  // Update background only when frame changes
  useEffect(() => {
    if (fabricCanvasRef.current && cameras.basler.currentFrame) {
      updateFabricBackground();
    }
  }, [cameras.basler.currentFrame]); // Only when frame changes, not settings

  // Listen for canvas resize events (e.g., after crop)
  useEffect(() => {
    const handleCanvasResize = (event) => {
      console.log('🔲 Canvas resize event received:', event.detail);
      
      // Update HTML canvas element dimensions
      if (canvasRef.current && event.detail) {
        canvasRef.current.width = event.detail.width;
        canvasRef.current.height = event.detail.height;
        canvasRef.current.style.width = `${event.detail.width}px`;
        canvasRef.current.style.height = `${event.detail.height}px`;
        console.log('🔲 HTML canvas updated to:', event.detail.width, 'x', event.detail.height);
      }
      
      // Force re-render to update mouse coordinates
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.renderAll();
      }
    };

    window.addEventListener('canvasResized', handleCanvasResize);
    return () => {
      window.removeEventListener('canvasResized', handleCanvasResize);
    };
  }, []);

  // اضافی: اطمینان از render شدن canvas
  useEffect(() => {
    if (fabricCanvasRef.current) {
      // Force render after any change
      const timeoutId = setTimeout(() => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.renderAll();
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [activeTool, cameras.basler.currentFrame]);

  // Update only image filters without reloading background
  const updateImageFilters = useCallback(() => {
    if (!fabricCanvasRef.current || !fabricCanvasRef.current.backgroundImage) return;

    const bgImg = fabricCanvasRef.current.backgroundImage;
    
    // Apply image settings
    const filters = [];
    if (imageSettings.brightness !== 100) {
      filters.push(new fabric.Image.filters.Brightness({ brightness: (imageSettings.brightness - 100) / 100 }));
    }
    if (imageSettings.contrast !== 100) {
      filters.push(new fabric.Image.filters.Contrast({ contrast: (imageSettings.contrast - 100) / 100 }));
    }
    if (imageSettings.grayscale) {
      filters.push(new fabric.Image.filters.Grayscale());
    }
    
    bgImg.filters = filters;
    bgImg.applyFilters();
    fabricCanvasRef.current.renderAll();
  }, [imageSettings.brightness, imageSettings.contrast, imageSettings.grayscale]);

  // Update filters when settings change
  useEffect(() => {
    updateImageFilters();
  }, [updateImageFilters]);

  // Fabric.js utility functions
  const clearFabricCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    // Get current background before clearing
    const currentBg = fabricCanvasRef.current.backgroundImage;
    
    // Clear only the objects, keep background
    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach(obj => {
      // Only remove objects that are not background image
      if (obj !== fabricCanvasRef.current.backgroundImage) {
        fabricCanvasRef.current.remove(obj);
      }
    });
    
    // Ensure background is still there
    if (currentBg) {
      fabricCanvasRef.current.setBackgroundImage(currentBg, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
    } else if (cameras.basler.currentFrame) {
      // Only reload if we have a current frame and no background
      updateFabricBackground();
    }
    
    console.log('🧹 Canvas cleared - background preserved');
  }, [updateFabricBackground]);

  // Clear all user-added objects (eraser all)
  const clearAllUserObjects = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const objects = fabricCanvasRef.current.getObjects();
    let removedCount = 0;
    
    objects.forEach(obj => {
      // Only remove objects that are not background image
      if (obj !== fabricCanvasRef.current.backgroundImage) {
        fabricCanvasRef.current.remove(obj);
        removedCount++;
      }
    });
    
    fabricCanvasRef.current.renderAll();
    console.log(`🗑️ Removed ${removedCount} user objects`);
  }, []);

  const undoLastFabricAction = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const objects = fabricCanvasRef.current.getObjects();
    // Find the last user-added object (not background)
    for (let i = objects.length - 1; i >= 0; i--) {
      if (objects[i] !== fabricCanvasRef.current.backgroundImage) {
        fabricCanvasRef.current.remove(objects[i]);
        console.log('↩️ Undid last user action');
        break;
      }
    }
  }, []);

  // Expose Fabric functions to global context (if needed)
  useEffect(() => {
    if (fabricCanvasRef.current && window) {
      window.fabricCanvas = fabricCanvasRef.current;
      window.clearFabricCanvas = clearFabricCanvas;
      window.clearAllUserObjects = clearAllUserObjects;
      window.undoLastFabricAction = undoLastFabricAction;
    }
  }, [clearFabricCanvas, clearAllUserObjects, undoLastFabricAction]);

  // Legacy redraw function (disabled - using Fabric.js instead)
  const redrawCanvas = useCallback(() => {
    // Disabled to prevent conflicts with Fabric.js
    return;
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.complete) return;

    const ctx = canvas.getContext('2d');
    
    // Enable image smoothing for better quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply image filters
    const filters = [
      `brightness(${imageSettings.brightness}%)`,
      `contrast(${imageSettings.contrast}%)`,
      `saturate(${imageSettings.saturation}%)`,
      imageSettings.grayscale ? 'grayscale(100%)' : ''
    ].filter(Boolean);
    
    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

    // Draw the main image
    if (cameras.basler.currentFrame) {
      ctx.save();
      ctx.translate(imageSettings.panOffset.x, imageSettings.panOffset.y);
      ctx.scale(imageSettings.zoom, imageSettings.zoom);

      if (imageSettings.crop) {
        const { x, y, width, height } = imageSettings.crop;
        // Ensure crop coordinates are within bounds
        const safeX = Math.max(0, Math.min(x, image.naturalWidth));
        const safeY = Math.max(0, Math.min(y, image.naturalHeight));
        const safeWidth = Math.min(width, image.naturalWidth - safeX);
        const safeHeight = Math.min(height, image.naturalHeight - safeY);
        
        if (safeWidth > 0 && safeHeight > 0) {
          ctx.drawImage(image, safeX, safeY, safeWidth, safeHeight, safeX, safeY, safeWidth, safeHeight);
        }
      } else {
        // Draw full image with proper scaling
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    }

    // Reset filter for drawings (ensure crisp lines)
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = false; // Crisp lines for drawings

    // Render legacy drawings
    drawings.forEach(drawing => {
      if (toolManagerRef.current) {
        toolManagerRef.current.renderDrawing(ctx, drawing, imageSettings);
      }
    });

    // Render ToolManager drawings (exclude eraser drawings)
    toolDrawings.forEach(drawing => {
      if (toolManagerRef.current && drawing.tool !== 'eraser') {
        toolManagerRef.current.renderDrawing(ctx, drawing, imageSettings);
      }
    });

    // Render current drawing preview
    if (isDrawing && toolManagerRef.current) {
      toolManagerRef.current.renderPreview(ctx, imageSettings);
    }
    
    // نمایش پیش‌نمایش eraser حتی وقتی در حال رسم نیست
    if (activeTool === 'eraser' && !isDrawing && toolManagerRef.current) {
      const eraserTool = toolManagerRef.current.tools.get('eraser');
      if (eraserTool && eraserTool.renderPreview) {
        eraserTool.renderPreview(ctx, null, imageSettings);
      }
    }
  }, [cameras.basler.currentFrame, drawings, toolDrawings, isDrawing, currentPath, activeTool, imageSettings]);


  // تبدیل موقعیت ماوس به مختصات واقعی canvas - بهبود یافته
  const getCanvasCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, rawX: 0, rawY: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // موقعیت دقیق ماوس نسبت به canvas element
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // استفاده از Fabric.js canvas dimensions اگر موجود باشد
    const fabricCanvas = fabricCanvasRef.current;
    const canvasWidth = fabricCanvas ? fabricCanvas.width : canvas.width;
    const canvasHeight = fabricCanvas ? fabricCanvas.height : canvas.height;
    
    // Debug log only when dimensions change significantly
    if (Math.abs(canvasWidth - canvas.width) > 10 || Math.abs(canvasHeight - canvas.height) > 10) {
      console.log('🔲 Canvas dimensions mismatch - Fabric:', canvasWidth, 'x', canvasHeight, 'HTML:', canvas.width, 'x', canvas.height);
    }
    
    // تبدیل دقیق به مختصات canvas با در نظر گیری scaling
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    const rawX = clientX * scaleX;
    const rawY = clientY * scaleY;
    
    // محدود کردن مختصات به داخل canvas
    const clampedRawX = Math.max(0, Math.min(canvasWidth, rawX));
    const clampedRawY = Math.max(0, Math.min(canvasHeight, rawY));
    
    // تصحیح موقعیت با در نظر گیری zoom و pan
    const x = (clampedRawX - imageSettings.panOffset.x) / imageSettings.zoom;
    const y = (clampedRawY - imageSettings.panOffset.y) / imageSettings.zoom;
    
    return { 
      x, 
      y, 
      rawX: clampedRawX, 
      rawY: clampedRawY,
      clientX,
      clientY
    };
  }, [imageSettings.zoom, imageSettings.panOffset]);

  // مدیریت رویدادهای ماوس با ToolManager - بهبود یافته
  const handleMouseDown = useCallback((e) => {
    // Only handle pan - Fabric.js handles drawing
    if (activeTool === 'pan' && imageSettings.zoom > 1) {
      const coords = getCanvasCoordinates(e);
      panStartRef.current = { x: coords.rawX, y: coords.rawY };
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.defaultCursor = 'grabbing';
      }
    }
  }, [activeTool, imageSettings, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e) => {
    // Only handle pan - Fabric.js handles drawing
    if (activeTool === 'pan' && panStartRef.current && imageSettings.zoom > 1) {
      const coords = getCanvasCoordinates(e);
      const dx = coords.rawX - panStartRef.current.x;
      const dy = coords.rawY - panStartRef.current.y;
      panImage(dx, dy);
      panStartRef.current = { x: coords.rawX, y: coords.rawY };
    }
  }, [activeTool, imageSettings.zoom, panImage, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (activeTool === 'pan') {
      panStartRef.current = null;
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.defaultCursor = 'crosshair';
      }
    }
  }, [activeTool]);

  // Enhanced image update handling for higher resolution frames
  useEffect(() => {
    if (cameras.basler.currentFrame && imageRef.current) {
      const img = imageRef.current;
      
      // Prevent memory leaks by cleaning up previous image
      if (img.src && img.src.startsWith('data:')) {
        URL.revokeObjectURL(img.src);
      }
      
      img.src = cameras.basler.currentFrame;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas && img) {
          // Support for higher resolution Basler images (640x480 from backend)
          const naturalWidth = img.naturalWidth || 640;
          const naturalHeight = img.naturalHeight || 480;
          
          // Only resize HTML canvas if Fabric.js canvas hasn't been resized (e.g., after crop)
          const fabricCanvas = fabricCanvasRef.current;
          if (!fabricCanvas || (fabricCanvas.width === 640 && fabricCanvas.height === 480)) {
            // Set canvas size to match the actual image resolution
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;
            console.log(`📸 Basler frame loaded: ${naturalWidth}x${naturalHeight}`);
          } else {
            // Keep current dimensions if canvas was resized (e.g., after crop)
            console.log(`📸 Basler frame loaded but keeping current canvas size: ${canvas.width}x${canvas.height}`);
          }
        }
        redrawCanvas();
      };
      
      img.onerror = (error) => {
        console.error('❌ Error loading Basler image:', error);
      };
    }
  }, [cameras.basler.currentFrame, redrawCanvas]);

  // به‌روزرسانی Canvas
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // فرمت زمان
  const formatLastUpdate = useCallback((timestamp) => {
    if (!timestamp) return 'No data';
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch (error) {
      return 'Invalid time';
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black rounded-lg overflow-hidden relative flex justify-center items-center">
      <img ref={imageRef} style={{ display: 'none' }} alt="Basler frame" />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-full object-contain cursor-crosshair mx-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%',
          display: 'block',
          imageRendering: 'high-quality'
        }}
      />
      {!cameras.basler.currentFrame && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-white text-xs sm:text-sm mb-2">
              {wsStatus === 'connecting' && '🔄 اتصال به باسلر...'}
              {wsStatus === 'connected' && '⏳ در انتظار تصویر باسلر...'}
              {wsStatus === 'reconnecting' && '🔄 تلاش برای اتصال مجدد...'}
              {wsStatus === 'error' && '❌ خطا در اتصال به باسلر'}
              {wsStatus === 'failed' && '❌ اتصال ناموفق - بررسی بک‌اند'}
              {wsStatus === 'disconnected' && '⚠️ قطع ارتباط با باسلر'}
            </div>
            {(wsStatus === 'error' || wsStatus === 'failed') && (
              <div className="text-gray-400 text-xs">
                لطفاً بک‌اند را بررسی کنید
              </div>
            )}
          </div>
        </div>
      )}
      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/70 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono">
        <span className="hidden sm:inline">X: {Math.round(cursorPosition.x)} | Y: {Math.round(cursorPosition.y)}</span>
        <span className="sm:hidden">{Math.round(cursorPosition.x)},{Math.round(cursorPosition.y)}</span>
      </div>
      {activeTool && (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-primary text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
          <span className="hidden sm:inline">{activeTool}</span>
          <span className="sm:hidden">{activeTool.charAt(0)}</span>
        </div>
      )}
      <div className={`absolute bottom-1 sm:bottom-2 left-1 sm:left-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
        cameras.basler.isConnected && cameras.basler.currentFrame ? 'bg-green-500' : 'bg-red-500'
      }`} />
      {cameras.basler.lastUpdate && (
        <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/70 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
          <div className="hidden sm:block">{formatLastUpdate(cameras.basler.lastUpdate)}</div>
          <div className="sm:hidden text-xs">{formatLastUpdate(cameras.basler.lastUpdate).split(' ')[1]}</div>
          {cameras.basler.avgFps > 0 && (
            <div className="text-green-400 text-xs">
              <span className="hidden sm:inline">FPS: {cameras.basler.avgFps} | Frames: {cameras.basler.frameCount}</span>
              <span className="sm:hidden">{cameras.basler.avgFps}fps</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BaslerDisplay;