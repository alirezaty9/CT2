import React, { useRef, useEffect, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import { useCamera } from '../../contexts/CameraContext';
import { useImageProcessing } from '../../contexts/ImageProcessingContext';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Filter, Sparkles, RotateCcw } from 'lucide-react';
import imageProcessor from '../../utils/imageProcessing';
import debugLogger from '../../utils/debugLogger';

const BaslerDisplay = () => {
  // Log render
  debugLogger.logRender('BaslerDisplay');

  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const panStartRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const lastFrameRef = useRef(null);
  const lastSettingsRef = useRef(null);
  const drawingRectRef = useRef(null);
  const rectStartPointRef = useRef(null);
  const activeToolRef = useRef(null); // استفاده از ref برای activeTool

  // Image processing states
  const [showProcessingPanel, setShowProcessingPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    denoising: false,
    sharpening: false,
    edgeEnhancement: false,
    histogramEq: false,
    grayscale: false,
    median: false,
    sobel: false,
    invert: false
  });
  const [processingParams, setProcessingParams] = useState({
    gaussianSigma: 1.0,
    sharpenFactor: 1.0,
    brightness: 0,
    contrast: 0,
    rotation: 0
  });

  const {
    cameras,
    addFrameCallback,
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

  const { resetToOriginal } = useImageProcessing();
  const { t } = useTranslation();

  // استفاده از ref برای ذخیره آخرین frame بدون re-render
  const lastProcessedFrameRef = useRef(null);

  // به‌روزرسانی activeToolRef هر بار که activeTool تغییر می‌کند
  useEffect(() => {
    activeToolRef.current = activeTool;
    console.log('🔄 activeToolRef updated to:', activeTool);
  }, [activeTool]);

  // Direct frame update via callback - NO state change!
  useEffect(() => {
    const handleBaslerFrame = (channel) => {
      if (channel !== 'basler') return;

      const frame = cameras.basler.currentFrame;
      if (!frame || frame === lastProcessedFrameRef.current) return;

      lastProcessedFrameRef.current = frame;

      // فقط Fabric canvas رو آپدیت کن - بدون state update!
      if (fabricCanvasRef.current) {
        updateFabricBackground();
      }
    };

    const unsubscribe = addFrameCallback(handleBaslerFrame);
    return () => unsubscribe();
  }, [cameras, addFrameCallback]);

  // Toggle filter
  const toggleFilter = useCallback((filterName) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  }, []);

  // Update processing parameter
  const updateParam = useCallback((paramName, value) => {
    setProcessingParams(prev => ({
      ...prev,
      [paramName]: parseFloat(value)
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setActiveFilters({
      denoising: false,
      sharpening: false,
      edgeEnhancement: false,
      histogramEq: false,
      grayscale: false,
      median: false,
      sobel: false,
      invert: false
    });
    setProcessingParams({
      gaussianSigma: 1.0,
      sharpenFactor: 1.0,
      brightness: 0,
      contrast: 0,
      rotation: 0
    });
    resetToOriginal();
  }, [resetToOriginal]);

  // Fabric.js event handlers - defined before initialization
  const handleFabricPathCreated = useCallback((e) => {

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

  const handleFabricObjectAdded = useCallback(() => {
    // Object added to canvas
  }, []);

  const handleFabricMouseDown = useCallback((e) => {
    if (!fabricCanvasRef.current) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);
    const currentTool = activeToolRef.current; // استفاده از ref به جای state

    console.log('🖱️ Mouse Down - currentTool from ref:', currentTool);
    console.log('🖱️ Pointer:', pointer);
    console.log('🖱️ currentTool === "rectangle":', currentTool === 'rectangle');

    // Rectangle tool - start drawing
    if (currentTool === 'rectangle') {
      console.log('📐 Starting rectangle draw at:', pointer);

      // Deselect any previously selected objects
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
      console.log('🔄 Deselected previous objects');

      rectStartPointRef.current = pointer;

      // Create a new rectangle
      const rect = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: 'rgba(0, 255, 0, 0.1)',
        stroke: '#00ff00',
        strokeWidth: 1, // Changed from 2 to 1 to fix handle offset issue
        selectable: false,
        evented: false,
        hasRotatingPoint: false,
        name: 'roi-rectangle', // Add name for identification
        originX: 'left',
        originY: 'top'
      });

      fabricCanvasRef.current.add(rect);
      drawingRectRef.current = rect;
      fabricCanvasRef.current.renderAll();
      console.log('✅ Rectangle object created');
    } else {
      console.log('❌ Not rectangle tool, current tool is:', currentTool);
    }

    // Pan tool
    if (currentTool === 'pan') {
      panStartRef.current = pointer;
    }
  }, []); // حذف dependency به activeTool

  const handleFabricMouseMove = useCallback((e) => {
    if (!fabricCanvasRef.current) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);
    const currentTool = activeToolRef.current; // استفاده از ref

    // Rectangle tool - update while drawing
    if (currentTool === 'rectangle' && drawingRectRef.current && rectStartPointRef.current) {
      const rect = drawingRectRef.current;
      const startPoint = rectStartPointRef.current;

      // Calculate width and height
      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;

      // Update rectangle properties
      if (width > 0) {
        rect.set({ left: startPoint.x, width: width });
      } else {
        rect.set({ left: pointer.x, width: Math.abs(width) });
      }

      if (height > 0) {
        rect.set({ top: startPoint.y, height: height });
      } else {
        rect.set({ top: pointer.y, height: Math.abs(height) });
      }

      fabricCanvasRef.current.renderAll();
    }

    // Prevent eraser from leaving trails
    if (currentTool === 'eraser') {
      if (fabricCanvasRef.current.contextTop) {
        fabricCanvasRef.current.contextTop.globalCompositeOperation = 'destination-out';
      }
    }

    // Pan tool implementation
    if (currentTool === 'pan') {
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
  }, [panImage]); // حذف activeTool از dependency

  const handleFabricMouseUp = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current._isCurrentlyDrawing = false;
    }

    const currentTool = activeToolRef.current; // استفاده از ref

    console.log('🖱️ Mouse Up - currentTool from ref:', currentTool, 'Drawing Rect:', !!drawingRectRef.current);

    // Rectangle tool - finish drawing
    if (currentTool === 'rectangle' && drawingRectRef.current) {
      const rect = drawingRectRef.current;
      console.log('📐 Finishing rectangle - Size:', rect.width, 'x', rect.height);

      // Make the rectangle selectable after drawing
      rect.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: false,
        // Constrain rectangle within canvas bounds
        lockMovementX: false,
        lockMovementY: false,
        // Custom corner style - align perfectly with rectangle corners
        cornerSize: 8,
        cornerColor: '#00ff00',
        cornerStyle: 'circle',
        borderColor: '#00ff00',
        transparentCorners: false,
        // Fix origin to prevent offset
        originX: 'left',
        originY: 'top',
        // Critical settings to align handles perfectly
        padding: 0,
        strokeUniform: true,
        objectCaching: false,
        noScaleCache: true,
        // Position handles at exact corners
        borderDashArray: null,
        borderOpacityWhenMoving: 0.4
      });

      console.log('📐 Rectangle properties set:', {
        selectable: rect.selectable,
        evented: rect.evented,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      });

      fabricCanvasRef.current.setActiveObject(rect);
      fabricCanvasRef.current.renderAll();

      console.log('✅ Rectangle ROI created and made active');
      console.log('📊 Total objects on canvas:', fabricCanvasRef.current.getObjects().length);

      // Dispatch custom event to notify ROIStatsPanel
      window.dispatchEvent(new CustomEvent('roiAdded', {
        detail: { roi: rect }
      }));
      console.log('📡 Dispatched roiAdded event');

      // Reset refs
      drawingRectRef.current = null;
      rectStartPointRef.current = null;
    }

    // Reset pan start
    panStartRef.current = null;
  }, []); // حذف activeTool از dependency

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

      // Constrain objects within canvas bounds (accounting for control handles)
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        const handlePadding = 5; // Half of cornerSize to keep handles inside

        // Constrain horizontal position
        if (obj.left < handlePadding) {
          obj.left = handlePadding;
        }
        if (obj.left + obj.width * obj.scaleX > canvas.width - handlePadding) {
          obj.left = canvas.width - obj.width * obj.scaleX - handlePadding;
        }
        // Constrain vertical position
        if (obj.top < handlePadding) {
          obj.top = handlePadding;
        }
        if (obj.top + obj.height * obj.scaleY > canvas.height - handlePadding) {
          obj.top = canvas.height - obj.height * obj.scaleY - handlePadding;
        }
      });

      // Constrain objects while scaling (accounting for control handles)
      canvas.on('object:scaling', (e) => {
        const obj = e.target;
        const handlePadding = 5; // Half of cornerSize to keep handles inside
        const width = obj.width * obj.scaleX;
        const height = obj.height * obj.scaleY;

        // Prevent scaling beyond canvas bounds
        if (obj.left + width > canvas.width - handlePadding) {
          obj.scaleX = (canvas.width - obj.left - handlePadding) / obj.width;
        }
        if (obj.top + height > canvas.height - handlePadding) {
          obj.scaleY = (canvas.height - obj.top - handlePadding) / obj.height;
        }
        if (obj.left < handlePadding) {
          obj.left = handlePadding;
        }
        if (obj.top < handlePadding) {
          obj.top = handlePadding;
        }
      });

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

  // Update background image in Fabric.js with processing (for new frames OR filter changes)
  const updateFabricBackground = useCallback(async () => {
    const currentFrame = cameras.basler.currentFrame;
    if (!fabricCanvasRef.current || !currentFrame) return;

    // Create a signature of current state (frame + filters)
    const currentState = JSON.stringify({ frame: currentFrame.substring(0, 100), activeFilters, processingParams });

    // Check if frame or filters actually changed
    if (lastFrameRef.current === currentState) {
      return; // No need to update
    }

    // Update ref
    lastFrameRef.current = currentState;
    console.log('🖼️ Updating Fabric.js background image (frame or filter changed)');

    // Check if any filters are active
    const hasActiveFilters = Object.values(activeFilters).some(v => v) ||
                            processingParams.brightness !== 0 ||
                            processingParams.contrast !== 0 ||
                            processingParams.rotation !== 0;

    // Apply processing if filters are active
    let imageToDisplay = currentFrame;
    if (hasActiveFilters) {
      try {
        console.log('🎨 [FILTER] Starting image processing...');
        console.log('🎨 [FILTER] Active filters:', JSON.stringify(activeFilters));
        console.log('🎨 [FILTER] Processing params:', JSON.stringify(processingParams));

        // Load image directly into imageProcessor
        const loadStartTime = performance.now();
        await imageProcessor.loadImage(currentFrame);
        console.log(`✅ [FILTER] Image loaded in ${(performance.now() - loadStartTime).toFixed(2)}ms`);

        // Apply each active filter in sequence using imageProcessor directly
        if (activeFilters.grayscale) {
          const startTime = performance.now();
          imageProcessor.convertToGrayscale();
          console.log(`✅ [FILTER] Grayscale applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (activeFilters.denoising) {
          const startTime = performance.now();
          imageProcessor.applyGaussianFilter(processingParams.gaussianSigma);
          console.log(`✅ [FILTER] Gaussian (σ=${processingParams.gaussianSigma}) applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (activeFilters.median) {
          const startTime = performance.now();
          imageProcessor.applyMedianFilter(3);
          console.log(`✅ [FILTER] Median applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (activeFilters.sharpening) {
          const startTime = performance.now();
          imageProcessor.applySharpen(processingParams.sharpenFactor);
          console.log(`✅ [FILTER] Sharpen (factor=${processingParams.sharpenFactor}) applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (activeFilters.sobel || activeFilters.edgeEnhancement) {
          const startTime = performance.now();
          imageProcessor.applySobelFilter();
          console.log(`✅ [FILTER] Sobel edge detection applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (activeFilters.histogramEq) {
          const startTime = performance.now();
          imageProcessor.applyHistogramEqualization();
          console.log(`✅ [FILTER] Histogram Equalization applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (activeFilters.invert) {
          const startTime = performance.now();
          imageProcessor.applyInvert();
          console.log(`✅ [FILTER] Invert applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (processingParams.brightness !== 0) {
          const startTime = performance.now();
          imageProcessor.adjustBrightness(processingParams.brightness);
          console.log(`✅ [FILTER] Brightness (${processingParams.brightness}) applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (processingParams.contrast !== 0) {
          const startTime = performance.now();
          imageProcessor.adjustContrast(processingParams.contrast);
          console.log(`✅ [FILTER] Contrast (${processingParams.contrast}) applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }
        if (processingParams.rotation !== 0) {
          const startTime = performance.now();
          imageProcessor.applyRotation(processingParams.rotation);
          console.log(`✅ [FILTER] Rotation (${processingParams.rotation}°) applied in ${(performance.now() - startTime).toFixed(2)}ms`);
        }

        // Get the final processed image as data URL
        const finalProcessedImage = imageProcessor.getImageDataURL(true);
        if (finalProcessedImage) {
          const imageSizeKB = (finalProcessedImage.length / 1024).toFixed(2);
          imageToDisplay = finalProcessedImage;
          console.log(`✅ [FILTER] Processed image ready (${imageSizeKB} KB)`);
          console.log(`✅ [FILTER] Image preview: ${imageToDisplay.substring(0, 50)}...`);
        } else {
          console.error('❌ [FILTER] CRITICAL: No processed image returned!');
        }
      } catch (error) {
        console.error('❌ [FILTER] Error processing image:', error);
        console.error('❌ [FILTER] Error stack:', error.stack);
      }
    }

    fabric.Image.fromURL(imageToDisplay, (img) => {
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

      // Apply current image settings from CameraContext
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
  }, [imageSettings, activeFilters, processingParams, cameras]);

  // Simple tool setup - now handled by individual tool components
  const setupFabricTools = useCallback((canvas) => {
    if (!canvas) return;

    console.log('🔧 setupFabricTools - Active Tool:', activeTool);

    // Reset canvas settings
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';

    // Make all objects selectable and movable when in move mode OR rectangle mode
    if (activeTool === 'move' || activeTool === 'rectangle') {
      console.log('✅ Making objects selectable for tool:', activeTool);
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
      console.log('❌ Making objects non-selectable for tool:', activeTool);
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
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    } else if (activeTool === 'eraser') {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    } else if (activeTool === 'move') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    } else if (activeTool === 'rectangle') {
      canvas.selection = true;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      console.log('📐 Rectangle tool configured');
    } else if (activeTool === 'brush' || activeTool === 'line') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    }

    canvas.renderAll();
    console.log('🔧 setupFabricTools complete - Objects count:', canvas.getObjects().length);
  }, [activeTool]);

  // همگام‌سازی ابزار فعال با Fabric.js
  useEffect(() => {
    console.log('🔄 activeTool changed to:', activeTool);
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
          updateFabricBackground();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [activeTool, updateFabricBackground, cameras]);

  // Update background when frame changes OR filters change
  useEffect(() => {
    if (fabricCanvasRef.current && cameras.basler.currentFrame) {
      updateFabricBackground();
    }
  }, [activeFilters, processingParams, updateFabricBackground, cameras]);

  // Listen for canvas resize events (e.g., after crop)
  useEffect(() => {
    const handleCanvasResize = (event) => {
      // Update HTML canvas element dimensions
      if (canvasRef.current && event.detail) {
        canvasRef.current.width = event.detail.width;
        canvasRef.current.height = event.detail.height;
        canvasRef.current.style.width = `${event.detail.width}px`;
        canvasRef.current.style.height = `${event.detail.height}px`;
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
  }, [activeTool, cameras]);

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
  }, []);

  const undoLastFabricAction = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const objects = fabricCanvasRef.current.getObjects();
    // Find the last user-added object (not background)
    for (let i = objects.length - 1; i >= 0; i--) {
      if (objects[i] !== fabricCanvasRef.current.backgroundImage) {
        fabricCanvasRef.current.remove(objects[i]);
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
  }, [drawings, toolDrawings, isDrawing, currentPath, activeTool, imageSettings, cameras]);


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
          }
        }
        redrawCanvas();
      };
      
      img.onerror = (error) => {
        console.error('❌ Error loading Basler image:', error);
      };
    }
  }, [redrawCanvas, cameras]);

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
    <div ref={containerRef} className="w-full h-full bg-black rounded-lg overflow-hidden relative flex flex-col">

      {/* Processing Panel - Collapsible */}
      <div className="absolute top-0 left-0 right-0 z-10">
        {/* Panel Toggle Button */}
        <button
          onClick={() => setShowProcessingPanel(!showProcessingPanel)}
          className="w-full bg-gradient-to-b from-black/90 to-black/70 text-white px-4 py-2 flex items-center justify-between hover:from-black/95 hover:to-black/75 transition-all"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-primary" />
            <span className="text-sm font-medium">{t('imageProcessing') || 'پردازش تصویر'}</span>
            {Object.values(activeFilters).some(v => v) && (
              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                {Object.values(activeFilters).filter(v => v).length}
              </span>
            )}
          </div>
          {showProcessingPanel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Processing Controls */}
        {showProcessingPanel && (
          <div className="bg-gradient-to-b from-black/95 to-black/85 text-white p-4 max-h-96 overflow-y-auto backdrop-blur-sm">

            {/* Quick Filters */}
            <div className="mb-4">
              <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                {t('quickFilters') || 'فیلترهای سریع'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => toggleFilter('grayscale')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.grayscale
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('grayscale') || 'خاکستری'}
                </button>
                <button
                  onClick={() => toggleFilter('denoising')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.denoising
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('denoising') || 'حذف نویز'}
                </button>
                <button
                  onClick={() => toggleFilter('sharpening')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.sharpening
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('sharpening') || 'تیزسازی'}
                </button>
                <button
                  onClick={() => toggleFilter('sobel')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.sobel
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('edgeDetection') || 'تشخیص لبه'}
                </button>
                <button
                  onClick={() => toggleFilter('median')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.median
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('medianFilter') || 'فیلتر میانه'}
                </button>
                <button
                  onClick={() => toggleFilter('histogramEq')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.histogramEq
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('histogramEq') || 'هیستوگرام'}
                </button>
                <button
                  onClick={() => toggleFilter('invert')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    activeFilters.invert
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {t('invert') || 'معکوس'}
                </button>
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 rounded text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all flex items-center justify-center gap-1"
                >
                  <RotateCcw size={12} />
                  {t('reset') || 'ریست'}
                </button>
              </div>
            </div>

            {/* Advanced Parameters */}
            <div className="space-y-3">
              {/* Gaussian Sigma */}
              {activeFilters.denoising && (
                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    {t('gaussianSigma') || 'مقدار Gaussian'}: {processingParams.gaussianSigma}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={processingParams.gaussianSigma}
                    onChange={(e) => updateParam('gaussianSigma', e.target.value)}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Sharpen Factor */}
              {activeFilters.sharpening && (
                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    {t('sharpenFactor') || 'مقدار تیزسازی'}: {processingParams.sharpenFactor}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={processingParams.sharpenFactor}
                    onChange={(e) => updateParam('sharpenFactor', e.target.value)}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Brightness */}
              <div>
                <label className="text-xs text-white/70 mb-1 block">
                  {t('brightness') || 'روشنایی'}: {processingParams.brightness}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={processingParams.brightness}
                  onChange={(e) => updateParam('brightness', e.target.value)}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <label className="text-xs text-white/70 mb-1 block">
                  {t('contrast') || 'کنتراست'}: {processingParams.contrast}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={processingParams.contrast}
                  onChange={(e) => updateParam('contrast', e.target.value)}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Rotation */}
              <div>
                <label className="text-xs text-white/70 mb-1 block">
                  {t('rotation') || 'چرخش'}: {processingParams.rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={processingParams.rotation}
                  onChange={(e) => updateParam('rotation', e.target.value)}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Display */}
      <div className="flex-1 flex justify-center items-center relative">
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
    </div>
  );
};

export default React.memo(BaslerDisplay);