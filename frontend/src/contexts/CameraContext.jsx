import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useWebSocket } from './WebSocketContext';
import debugLogger from '../utils/debugLogger';

const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
  // Get WebSocket context
  const { isConnected, connectionStatus, addMessageCallback } = useWebSocket();

  // Log render
  debugLogger.logRender('CameraProvider', { connectionStatus });

  // Use refs for frame data to avoid re-renders on every frame
  const cameraFramesRef = useRef({
    basler: {
      currentFrame: null,
      lastUpdate: 0,
      frameCount: 0,
      avgFps: 0,
      lastFpsCalculation: 0
    },
    monitoring: {
      currentFrame: null,
      lastUpdate: 0,
      frameCount: 0,
      avgFps: 0,
      lastFpsCalculation: 0
    }
  });

  // Lightweight state for connection status only (not frames)
  const [cameraStatus, setCameraStatus] = useState({
    basler: { isConnected: false },
    monitoring: { isConnected: false }
  });

  // Track connection status to avoid unnecessary state updates
  const connectionStatusRef = useRef({
    basler: false,
    monitoring: false
  });

  // Frame update callbacks - components can register to be notified of new frames
  const frameCallbacksRef = useRef(new Set());

  // State برای ابزارها
  const [activeTool, setActiveTool] = useState(null);

  // State برای نقاشی
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // State برای ToolManager drawings
  const [toolDrawings, setToolDrawings] = useState([]);

  // State برای تنظیمات تصویر
  const [imageSettings, setImageSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    zoom: 1,
    grayscale: false,
    crop: null,
    panOffset: { x: 0, y: 0 }
  });

  // State برای موقعیت ماوس
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // State برای تاریخچه تغییرات
  const [history, setHistory] = useState([]);

  // Handle WebSocket messages for camera frames
  useEffect(() => {
    const handleCameraMessage = (message) => {
      try {
        // Handle response messages
        if (typeof message === 'string' && message.startsWith('response:')) {
          console.log('Backend Response:', message.slice(9));
          return;
        }

        if (typeof message !== 'string') return;

        const colonIndex = message.indexOf(':');
        if (colonIndex === -1) return;

        const channel = message.substring(0, colonIndex);
        const base64Data = message.substring(colonIndex + 1);
        if (!base64Data) return;

        // Validate channel
        if (!['basler', 'monitoring'].includes(channel)) {
          console.warn('Unknown channel:', channel);
          return;
        }

        const frameData = `data:image/jpeg;base64,${base64Data}`;
        const now = Date.now();

        // Update refs directly (no re-render)
        const currentChannel = cameraFramesRef.current[channel];
        const newFrameCount = currentChannel.frameCount + 1;

        // Calculate FPS every 5 seconds
        let avgFps = currentChannel.avgFps;
        let lastFpsCalculation = currentChannel.lastFpsCalculation;

        if (now - lastFpsCalculation >= 5000) { // 5 seconds
          if (lastFpsCalculation > 0) {
            const timeDiff = (now - lastFpsCalculation) / 1000;
            const framesSinceLastCalc = newFrameCount - (currentChannel.frameCount - newFrameCount + 1);
            avgFps = Math.round((framesSinceLastCalc / timeDiff) * 10) / 10;
          }
          lastFpsCalculation = now;
        }

        // Update ref data
        cameraFramesRef.current[channel] = {
          currentFrame: frameData,
          lastUpdate: now,
          frameCount: newFrameCount,
          avgFps,
          lastFpsCalculation
        };

        // Update connection status if needed (only once when connecting)
        if (!connectionStatusRef.current[channel]) {
          connectionStatusRef.current[channel] = true;
          setCameraStatus(prev => ({
            ...prev,
            [channel]: { isConnected: true }
          }));
        }

        // Notify registered components via callbacks (no re-render)
        frameCallbacksRef.current.forEach(callback => {
          try {
            callback(channel);
          } catch (err) {
            console.error('Frame callback error:', err);
          }
        });

      } catch (error) {
        console.error('❌ Error processing camera message:', error);
      }
    };

    // Register message callback
    const unsubscribe = addMessageCallback(handleCameraMessage);

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [addMessageCallback]);

  // Update camera connection status based on WebSocket status
  useEffect(() => {
    if (!isConnected) {
      // Clear refs
      cameraFramesRef.current.basler.currentFrame = null;
      cameraFramesRef.current.monitoring.currentFrame = null;

      // Reset connection tracking
      connectionStatusRef.current.basler = false;
      connectionStatusRef.current.monitoring = false;

      // Update status
      setCameraStatus({
        basler: { isConnected: false },
        monitoring: { isConnected: false }
      });
    }
  }, [isConnected]);

  // فعال‌سازی ابزار
  const applyTool = useCallback((tool) => {
    setActiveTool(tool);
    console.log(`ابزار: ${tool}`);
  }, []);

  // اضافه کردن drawing جدید از ToolManager
  const addToolDrawing = useCallback((drawing) => {
    if (drawing) {
      // اگر drawing نوع eraser است، عملیات پاک کردن را انجام بده
      if (drawing.tool === 'eraser') {
        handleEraserDrawing(drawing);
      } else {
        setToolDrawings(prev => [...prev, drawing]);
        setHistory(prev => [...prev, { type: 'tool-drawing', action: 'add', drawing }]);
      }
    }
  }, []);

  // مدیریت عملیات پاک کردن
  const handleEraserDrawing = useCallback((eraserDrawing) => {
    const eraserRadius = eraserDrawing.eraserRadius || 15;
    const eraserPath = eraserDrawing.path || [];

    if (eraserPath.length === 0) return;

    // پاک کردن از toolDrawings
    setToolDrawings(prev => {
      const remainingDrawings = [];
      const erasedDrawings = [];

      prev.forEach(drawing => {
        if (drawing.tool === 'eraser') {
          // eraser drawings را نگه می‌داریم (اختیاری)
          return;
        }

        // بررسی تداخل با eraser
        let hasIntersection = false;
        if (drawing.path && drawing.path.length > 0) {
          for (const drawingPoint of drawing.path) {
            for (const eraserPoint of eraserPath) {
              const distance = Math.sqrt(
                Math.pow(drawingPoint.x - eraserPoint.x, 2) + 
                Math.pow(drawingPoint.y - eraserPoint.y, 2)
              );
              if (distance <= eraserRadius) {
                hasIntersection = true;
                break;
              }
            }
            if (hasIntersection) break;
          }
        }

        if (hasIntersection) {
          erasedDrawings.push(drawing);
        } else {
          remainingDrawings.push(drawing);
        }
      });

      return remainingDrawings;
    });

    // پاک کردن از legacy drawings
    setDrawings(prev => {
      const remainingDrawings = [];
      
      prev.forEach(drawing => {
        let hasIntersection = false;
        if (drawing.path && drawing.path.length > 0) {
          for (const drawingPoint of drawing.path) {
            for (const eraserPoint of eraserPath) {
              const distance = Math.sqrt(
                Math.pow(drawingPoint.x - eraserPoint.x, 2) + 
                Math.pow(drawingPoint.y - eraserPoint.y, 2)
              );
              if (distance <= eraserRadius) {
                hasIntersection = true;
                break;
              }
            }
            if (hasIntersection) break;
          }
        }

        if (!hasIntersection) {
          remainingDrawings.push(drawing);
        }
      });

      return remainingDrawings;
    });

    // اضافه کردن به تاریخچه
    setHistory(prev => [...prev, { 
      type: 'eraser', 
      action: 'erase', 
      eraserDrawing,
      eraserRadius 
    }]);
  }, []);

  // شروع نقاشی یا کراپ
  const startDrawing = useCallback((x, y) => {
    if (!activeTool || activeTool === 'pan') return;
    if (activeTool === 'crop' && imageSettings.crop) {
      // غیرفعال کردن کراپ با کلیک
      setImageSettings(prev => ({ ...prev, crop: null }));
      setActiveTool(null);
      setHistory(prev => [...prev, { type: 'crop', action: 'remove' }]);
      return;
    }
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  }, [activeTool, imageSettings.crop]);

  // ادامه نقاشی یا کراپ
  const continueDrawing = useCallback((x, y) => {
    setCursorPosition({ x, y });
    if (!isDrawing || !activeTool) return;
    setCurrentPath(prev => [...prev, { x, y }]);
  }, [isDrawing, activeTool]);

  // پایان نقاشی یا کراپ
  const finishDrawing = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }
    if (activeTool === 'crop') {
      const start = currentPath[0];
      const end = currentPath[currentPath.length - 1];
      const cropSettings = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
      };
      setImageSettings(prev => ({ ...prev, crop: cropSettings }));
      setHistory(prev => [...prev, { type: 'crop', action: 'apply', settings: cropSettings }]);
    } else {
      const newDrawing = {
        id: Date.now(),
        tool: activeTool,
        path: currentPath
      };
      setDrawings(prev => [...prev, newDrawing]);
      setHistory(prev => [...prev, { type: 'drawing', action: 'add', drawing: newDrawing }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, activeTool]);

  // پاک کردن نقاشی‌ها
  const clearDrawings = useCallback(() => {
    setDrawings([]);
    setToolDrawings([]);
    setCurrentPath([]);
    setIsDrawing(false);
    setImageSettings(prev => ({ ...prev, crop: null }));
    setHistory(prev => [...prev, { type: 'clear', action: 'all' }]);
    
    // Clear Fabric.js canvas if available
    if (window.clearFabricCanvas) {
      window.clearFabricCanvas();
    }
  }, []);

  // تغییر تنظیمات تصویر
  const updateImageSettings = useCallback((newSettings) => {
    setImageSettings(prev => ({ ...prev, ...newSettings }));
    // Add to history separately to avoid infinite loop
    setHistory(prev => [...prev, { type: 'settings', action: 'update', settings: newSettings }]);
  }, []);

  // فیلتر سیاه و سفید
  const toggleGrayscale = useCallback(() => {
    setImageSettings(prev => {
      const newGrayscale = !prev.grayscale;
      setHistory(history => [...history, { type: 'grayscale', action: 'toggle', value: newGrayscale }]);
      return { ...prev, grayscale: newGrayscale };
    });
  }, []);

  // زوم
  const zoomImage = useCallback((direction) => {
    setImageSettings(prev => {
      const newZoom = direction === 'in' ? prev.zoom * 1.2 : prev.zoom / 1.2;
      const clampedZoom = Math.max(0.2, Math.min(5, newZoom));
      setHistory(history => [...history, { type: 'zoom', action: 'change', value: clampedZoom, prevValue: prev.zoom }]);
      return { ...prev, zoom: clampedZoom };
    });
  }, []);

  // Zoom In
  const zoomIn = useCallback(() => {
    setImageSettings(prev => {
      const newZoom = prev.zoom * 1.2;
      const clampedZoom = Math.max(0.2, Math.min(5, newZoom));
      setHistory(history => [...history, { type: 'zoom', action: 'in', value: clampedZoom, prevValue: prev.zoom }]);

      // Apply zoom to Fabric canvas with proper viewport transform
      if (window.fabricCanvas) {
        const canvas = window.fabricCanvas;
        const center = canvas.getCenter();
        canvas.zoomToPoint({ x: center.left, y: center.top }, clampedZoom);
        canvas.requestRenderAll();
      }

      return { ...prev, zoom: clampedZoom };
    });
  }, []);

  // Zoom Out
  const zoomOut = useCallback(() => {
    setImageSettings(prev => {
      const newZoom = prev.zoom / 1.2;
      const clampedZoom = Math.max(0.2, Math.min(5, newZoom));
      setHistory(history => [...history, { type: 'zoom', action: 'out', value: clampedZoom, prevValue: prev.zoom }]);

      // Apply zoom to Fabric canvas with proper viewport transform
      if (window.fabricCanvas) {
        const canvas = window.fabricCanvas;
        const center = canvas.getCenter();
        canvas.zoomToPoint({ x: center.left, y: center.top }, clampedZoom);
        canvas.requestRenderAll();
      }

      return { ...prev, zoom: clampedZoom };
    });
  }, []);

  // Reset Zoom
  const resetZoom = useCallback(() => {
    setImageSettings(prev => {
      setHistory(history => [...history, { type: 'zoom', action: 'reset', value: 1, prevValue: prev.zoom }]);

      // Reset zoom on Fabric canvas
      if (window.fabricCanvas) {
        const canvas = window.fabricCanvas;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.requestRenderAll();
      }

      return { ...prev, zoom: 1 };
    });
  }, []);

  // جابجایی تصویر
  const panImage = useCallback((dx, dy) => {
    setImageSettings(prev => {
      const newOffset = {
        x: prev.panOffset.x + dx,
        y: prev.panOffset.y + dy
      };
      setHistory(history => [...history, { type: 'pan', action: 'move', offset: newOffset, prevOffset: prev.panOffset }]);
      return { ...prev, panOffset: newOffset };
    });
  }, []);

  // بازگشت آخرین تغییر
  const undoLastChange = useCallback(() => {
    // Try Fabric.js undo first
    if (window.undoLastFabricAction) {
      window.undoLastFabricAction();
      return;
    }

    // Fallback to legacy undo
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const lastChange = prev[prev.length - 1];
      const newHistory = prev.slice(0, -1);

      switch (lastChange.type) {
        case 'drawing':
          if (lastChange.action === 'add') {
            setDrawings(drawings => drawings.slice(0, -1));
          }
          break;
        case 'tool-drawing':
          if (lastChange.action === 'add') {
            setToolDrawings(drawings => drawings.slice(0, -1));
          }
          break;
        case 'eraser':
          if (lastChange.action === 'erase') {
            // برای eraser، باید تمام drawings را بازیابی کنیم
            // این پیچیده است و نیاز به ذخیره snapshot دارد
            console.log('Undo eraser operation - complex operation');
            // TODO: پیاده‌سازی بازیابی drawing های پاک شده
          }
          break;
        case 'crop':
          if (lastChange.action === 'apply') {
            setImageSettings(settings => ({ ...settings, crop: null }));
          } else if (lastChange.action === 'remove') {
            setImageSettings(settings => ({ ...settings, crop: lastChange.settings }));
          }
          break;
        case 'grayscale':
          setImageSettings(settings => ({ ...settings, grayscale: !lastChange.value }));
          break;
        case 'zoom':
          setImageSettings(settings => ({ ...settings, zoom: lastChange.prevValue }));
          break;
        case 'settings':
          setImageSettings(settings => ({ ...settings, ...lastChange.prevSettings }));
          break;
        case 'pan':
          setImageSettings(settings => ({ ...settings, panOffset: lastChange.prevOffset }));
          break;
      }

      return newHistory;
    });
  }, []);

  // Helper function to get current frame data from ref
  const getCameraFrame = useCallback((channel) => {
    return cameraFramesRef.current[channel]?.currentFrame || null;
  }, []);

  // Helper function to get camera stats
  const getCameraStats = useCallback((channel) => {
    const data = cameraFramesRef.current[channel];
    return {
      frameCount: data?.frameCount || 0,
      avgFps: data?.avgFps || 0,
      lastUpdate: data?.lastUpdate || 0
    };
  }, []);

  // Register a callback to be notified of new frames
  const addFrameCallback = useCallback((callback) => {
    frameCallbacksRef.current.add(callback);
    return () => frameCallbacksRef.current.delete(callback);
  }, []);

  // Remove a frame callback
  const removeFrameCallback = useCallback((callback) => {
    frameCallbacksRef.current.delete(callback);
  }, []);

  // Create a stable cameras object that doesn't change on every frame
  const cameras = useMemo(() => ({
    basler: {
      get currentFrame() {
        return cameraFramesRef.current.basler.currentFrame;
      },
      get frameCount() {
        return cameraFramesRef.current.basler.frameCount;
      },
      get avgFps() {
        return cameraFramesRef.current.basler.avgFps;
      },
      get lastUpdate() {
        return cameraFramesRef.current.basler.lastUpdate;
      },
      isConnected: cameraStatus.basler.isConnected
    },
    monitoring: {
      get currentFrame() {
        return cameraFramesRef.current.monitoring.currentFrame;
      },
      get frameCount() {
        return cameraFramesRef.current.monitoring.frameCount;
      },
      get avgFps() {
        return cameraFramesRef.current.monitoring.avgFps;
      },
      get lastUpdate() {
        return cameraFramesRef.current.monitoring.lastUpdate;
      },
      isConnected: cameraStatus.monitoring.isConnected
    }
  }), [cameraStatus]); // Only recreate when connection status changes

  const value = useMemo(() => ({
    // Camera data access
    cameras, // Stable object with getters
    cameraStatus,
    getCameraFrame,
    getCameraStats,
    addFrameCallback, // Components can register for frame updates
    removeFrameCallback,

    // Tool and drawing state
    activeTool,
    drawings,
    toolDrawings,
    isDrawing,
    currentPath,
    imageSettings,
    cursorPosition,
    wsStatus: connectionStatus,

    // Functions
    applyTool,
    startDrawing,
    continueDrawing,
    finishDrawing,
    clearDrawings,
    addToolDrawing,
    updateImageSettings,
    toggleGrayscale,
    zoomImage,
    zoomIn,
    zoomOut,
    resetZoom,
    panImage,
    undoLastChange
  }), [
    // State values only (functions are stable with useCallback)
    cameras, // Stable object that only changes on connection status
    cameraStatus,
    activeTool,
    drawings,
    toolDrawings,
    isDrawing,
    currentPath,
    imageSettings,
    cursorPosition,
    connectionStatus,
    getCameraFrame,
    getCameraStats,
    addFrameCallback,
    removeFrameCallback
    // Other functions omitted - they're stable with useCallback
  ]);

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) throw new Error('useCamera must be used within CameraProvider');
  return context;
};