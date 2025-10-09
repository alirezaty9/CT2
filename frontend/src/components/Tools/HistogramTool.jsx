import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Crosshair, Info, Square, Minus, X, Settings } from 'lucide-react';
import { useHistogram } from '../../contexts/HistogramContext';
import { fabric } from 'fabric';
import { useToolLayer } from '../../hooks/useToolLayer';

const HistogramTool = ({ canvas, isActive, onClose }) => {
  const [selectionMode, setSelectionMode] = useState('area'); // 'point', 'area', 'line' - default to 'area'
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const selectionObjectRef = useRef(null);
  const overlaysRef = useRef([]);
  const { updateHistogram } = useHistogram();

  // Use layer system
  const { addToLayer, removeFromLayer, getCurrentLayer } = useToolLayer(
    'Histogram Selection',
    'histogram',
    canvas,
    isActive
  );

  // Calculate histogram from image data
  const calculateHistogramFromData = useCallback((data) => {
    const histogram = {
      red: new Array(256).fill(0),
      green: new Array(256).fill(0),
      blue: new Array(256).fill(0),
      gray: new Array(256).fill(0)
    };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      histogram.red[r]++;
      histogram.green[g]++;
      histogram.blue[b]++;
      histogram.gray[gray]++;
    }

    // Normalize to percentages
    const totalPixels = data.length / 4;
    Object.keys(histogram).forEach(channel => {
      histogram[channel] = histogram[channel].map(v => (v / totalPixels) * 100);
    });

    return histogram;
  }, []);

  // Get pixel data at a specific point
  const getPixelData = useCallback((x, y) => {
    if (!canvas) return null;

    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(x, y, 1, 1);
      const data = imageData.data;

      return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3]
      };
    } catch (err) {
      console.error('Error getting pixel data:', err);
      return null;
    }
  }, [canvas]);

  // Calculate average pixel for display
  const calculateAveragePixel = useCallback((imageData) => {
    let r = 0, g = 0, b = 0, a = 0;
    const data = imageData.data;
    const count = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3];
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
      a: Math.round(a / count)
    };
  }, []);

  // Create overlays for dark area outside selection
  const createOverlays = useCallback((selectionObj) => {
    if (!canvas) return;

    const bounds = { left: 0, top: 0, width: canvas.width, height: canvas.height };
    let overlays = [];

    if (selectionObj.type === 'circle') {
      // For circle/point selection, create a dark overlay with a transparent circle
      const fullOverlay = new fabric.Rect({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        fill: 'rgba(0,0,0,0.5)',
        selectable: false,
        evented: false,
        excludeFromExport: true
      });

      const clearCircle = new fabric.Circle({
        left: selectionObj.left,
        top: selectionObj.top,
        radius: selectionObj.radius,
        fill: 'transparent',
        stroke: 'transparent',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        excludeFromExport: true,
        globalCompositeOperation: 'destination-out'
      });

      overlays = [fullOverlay, clearCircle];
    } else if (selectionObj.type === 'rect') {
      // For rectangular selection
      const actualWidth = selectionObj.width * (selectionObj.scaleX || 1);
      const actualHeight = selectionObj.height * (selectionObj.scaleY || 1);

      overlays = [
        // Top
        new fabric.Rect({
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: Math.max(0, selectionObj.top - bounds.top),
          fill: 'rgba(0,0,0,0.5)',
          selectable: false,
          evented: false,
          excludeFromExport: true
        }),
        // Bottom
        new fabric.Rect({
          left: bounds.left,
          top: selectionObj.top + actualHeight,
          width: bounds.width,
          height: Math.max(0, bounds.height - (selectionObj.top + actualHeight)),
          fill: 'rgba(0,0,0,0.5)',
          selectable: false,
          evented: false,
          excludeFromExport: true
        }),
        // Left
        new fabric.Rect({
          left: bounds.left,
          top: selectionObj.top,
          width: Math.max(0, selectionObj.left - bounds.left),
          height: actualHeight,
          fill: 'rgba(0,0,0,0.5)',
          selectable: false,
          evented: false,
          excludeFromExport: true
        }),
        // Right
        new fabric.Rect({
          left: selectionObj.left + actualWidth,
          top: selectionObj.top,
          width: Math.max(0, bounds.width - (selectionObj.left + actualWidth)),
          height: actualHeight,
          fill: 'rgba(0,0,0,0.5)',
          selectable: false,
          evented: false,
          excludeFromExport: true
        })
      ];
    } else if (selectionObj.type === 'line') {
      // For line selection, just use a full dark overlay (line is thin)
      overlays = [
        new fabric.Rect({
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          fill: 'rgba(0,0,0,0.5)',
          selectable: false,
          evented: false,
          excludeFromExport: true
        })
      ];
    }

    overlays.forEach(overlay => canvas.add(overlay));
    overlaysRef.current = overlays;
  }, [canvas]);

  // Remove selection object and overlays
  const removeSelectionObject = useCallback(() => {
    if (!canvas) return;

    try {
      // Remove overlays
      overlaysRef.current.forEach(overlay => {
        if (overlay) {
          canvas.remove(overlay);
          removeFromLayer(overlay);
        }
      });
      overlaysRef.current = [];

      // Remove selection object
      if (selectionObjectRef.current) {
        canvas.remove(selectionObjectRef.current);
        removeFromLayer(selectionObjectRef.current);
        selectionObjectRef.current = null;
      }

      // Only render if canvas is properly initialized
      if (canvas.getContext && canvas.getContext('2d')) {
        canvas.renderAll();
      }
    } catch (error) {
      console.warn('Error removing selection objects:', error);
    }
  }, [canvas, removeFromLayer]);

  // Point selection
  const handlePointSelection = useCallback((pointer) => {
    const x = Math.round(pointer.x);
    const y = Math.round(pointer.y);

    console.log('📍 Point Selection:');
    console.log('  Position:', { x, y });

    // Get pixel data
    const pixelData = getPixelData(x, y);
    console.log('  Pixel at point:', pixelData);

    // Calculate histogram for 50px radius
    try {
      const ctx = canvas.getContext('2d');
      const radius = 50;
      const imageData = ctx.getImageData(
        Math.max(0, x - radius),
        Math.max(0, y - radius),
        Math.min(radius * 2, canvas.width - (x - radius)),
        Math.min(radius * 2, canvas.height - (y - radius))
      );

      console.log('  Analyzed pixels:', imageData.data.length / 4);
      console.log('  Area size:', imageData.width, 'x', imageData.height);

      const histogram = calculateHistogramFromData(imageData.data);
      console.log('  Histogram calculated - Red channel sample:', histogram.red.slice(0, 10));

      // Create visual indicator for point selection
      const circle = new fabric.Circle({
        left: x,
        top: y,
        radius: radius,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      });

      const region = { type: 'point', x, y, radius, fabricObject: circle };
      updateHistogram(histogram, { x, y, pixel: pixelData, mode: 'point' }, region);

      // Add circle and overlays to canvas
      removeSelectionObject();
      selectionObjectRef.current = circle;
      canvas.add(circle);
      addToLayer(circle);
      createOverlays(circle);
      // Add overlays to layer as well
      overlaysRef.current.forEach(overlay => addToLayer(overlay));
      canvas.renderAll();
    } catch (err) {
      console.error('❌ Error calculating histogram:', err);
    }
  }, [canvas, getPixelData, calculateHistogramFromData, updateHistogram, removeSelectionObject, createOverlays, addToLayer]);

  // Area selection
  const handleAreaSelection = useCallback((x1, y1, x2, y2) => {
    console.log('🔲 Area Selection:');
    console.log('  Start:', { x: x1, y: y1 });
    console.log('  End:', { x: x2, y: y2 });

    try {
      const ctx = canvas.getContext('2d');
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      console.log('  Rectangle:', { left, top, width, height });

      const imageData = ctx.getImageData(left, top, width, height);
      console.log('  Analyzed pixels:', imageData.data.length / 4);

      const histogram = calculateHistogramFromData(imageData.data);
      const avgPixel = calculateAveragePixel(imageData);

      console.log('  Average pixel:', avgPixel);
      console.log('  Histogram calculated - Red channel sample:', histogram.red.slice(0, 10));

      // Keep the rectangle visible on canvas
      const rect = new fabric.Rect({
        left: left,
        top: top,
        width: width,
        height: height,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });

      const region = { type: 'area', left, top, width, height, fabricObject: rect };
      updateHistogram(histogram, {
        x: Math.round((x1 + x2) / 2),
        y: Math.round((y1 + y2) / 2),
        pixel: avgPixel,
        mode: 'area',
        width,
        height
      }, region);

      // Keep rect visible with overlays
      removeSelectionObject();
      selectionObjectRef.current = rect;
      canvas.add(rect);
      addToLayer(rect);
      createOverlays(rect);
      // Add overlays to layer as well
      overlaysRef.current.forEach(overlay => addToLayer(overlay));
      canvas.renderAll();
    } catch (err) {
      console.error('❌ Error calculating histogram:', err);
    }
  }, [canvas, calculateHistogramFromData, calculateAveragePixel, updateHistogram, removeSelectionObject, createOverlays, addToLayer]);

  // Line selection
  const handleLineSelection = useCallback((x1, y1, x2, y2) => {
    console.log('➖ Line Selection:');
    console.log('  Start:', { x: x1, y: y1 });
    console.log('  End:', { x: x2, y: y2 });

    try {
      const ctx = canvas.getContext('2d');

      // Bresenham's line algorithm to get all points on the line
      const points = [];
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      let x = x1, y = y1;
      while (true) {
        points.push({ x, y });
        if (x === x2 && y === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }

      console.log('  Points on line:', points.length);
      console.log('  First 5 points:', points.slice(0, 5));

      // Collect pixel data along the line
      const lineData = [];
      points.forEach(point => {
        const imageData = ctx.getImageData(point.x, point.y, 1, 1);
        lineData.push(...Array.from(imageData.data));
      });

      console.log('  Total pixels analyzed:', lineData.length / 4);

      const histogram = calculateHistogramFromData(new Uint8ClampedArray(lineData));
      const avgPixel = calculateAveragePixel({ data: new Uint8ClampedArray(lineData) });

      const length = Math.round(Math.sqrt(dx * dx + dy * dy));
      console.log('  Line length:', length, 'pixels');
      console.log('  Average pixel:', avgPixel);
      console.log('  Histogram calculated - Red channel sample:', histogram.red.slice(0, 10));

      // Keep the line visible on canvas
      const line = new fabric.Line([x1, y1, x2, y2], {
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });

      const region = { type: 'line', x1, y1, x2, y2, length, fabricObject: line };
      updateHistogram(histogram, {
        x: Math.round((x1 + x2) / 2),
        y: Math.round((y1 + y2) / 2),
        pixel: avgPixel,
        mode: 'line',
        length
      }, region);

      // Keep line visible with overlays
      removeSelectionObject();
      selectionObjectRef.current = line;
      canvas.add(line);
      addToLayer(line);
      createOverlays(line);
      // Add overlays to layer as well
      overlaysRef.current.forEach(overlay => addToLayer(overlay));
      canvas.renderAll();
    } catch (err) {
      console.error('❌ Error calculating histogram:', err);
    }
  }, [canvas, calculateHistogramFromData, calculateAveragePixel, updateHistogram, removeSelectionObject, createOverlays, addToLayer]);

  // Mouse down handler
  const handleMouseDown = useCallback((e) => {
    if (!canvas || !isActive || !isSelecting) return;

    const pointer = canvas.getPointer(e.e);
    setStartPoint(pointer);

    if (selectionMode === 'point') {
      handlePointSelection(pointer);
      setIsSelecting(false);
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    }
  }, [canvas, isActive, isSelecting, selectionMode, handlePointSelection]);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (!canvas || !isActive || !isSelecting || !startPoint) return;
    if (selectionMode === 'point') return;

    const pointer = canvas.getPointer(e.e);
    removeSelectionObject();

    if (selectionMode === 'area') {
      const rect = new fabric.Rect({
        left: Math.min(startPoint.x, pointer.x),
        top: Math.min(startPoint.y, pointer.y),
        width: Math.abs(pointer.x - startPoint.x),
        height: Math.abs(pointer.y - startPoint.y),
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
      selectionObjectRef.current = rect;
      canvas.add(rect);
    } else if (selectionMode === 'line') {
      const line = new fabric.Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
      selectionObjectRef.current = line;
      canvas.add(line);
    }

    canvas.renderAll();
  }, [canvas, isActive, isSelecting, startPoint, selectionMode, removeSelectionObject]);

  // Mouse up handler
  const handleMouseUp = useCallback((e) => {
    if (!canvas || !isActive || !isSelecting || !startPoint) return;
    if (selectionMode === 'point') return;

    const pointer = canvas.getPointer(e.e);

    if (selectionMode === 'area') {
      handleAreaSelection(startPoint.x, startPoint.y, pointer.x, pointer.y);
    } else if (selectionMode === 'line') {
      handleLineSelection(Math.round(startPoint.x), Math.round(startPoint.y), Math.round(pointer.x), Math.round(pointer.y));
    }

    // Don't remove selection object - keep it visible
    setIsSelecting(false);
    setStartPoint(null);
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
  }, [canvas, isActive, isSelecting, startPoint, selectionMode, handleAreaSelection, handleLineSelection]);

  // Start selection
  const startSelection = useCallback(() => {
    if (!canvas) return;
    setIsSelecting(true);
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
  }, [canvas]);

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas || !isActive) return;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, isActive, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Auto-start selection when tool becomes active
  useEffect(() => {
    if (isActive && canvas) {
      startSelection();
    } else if (!isActive && canvas) {
      setIsSelecting(false);
      setStartPoint(null);
      removeSelectionObject();
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    }
  }, [isActive, canvas, removeSelectionObject]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-72 sm:w-80 bg-background-white dark:bg-background-secondary rounded-2xl shadow-2xl border border-border p-4 sm:p-6"
    >
      {!showPanel && !isSelecting ? (
        // Minimal view
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                <BarChart3 size={16} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-text">Histogram Tool</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  setShowPanel(true);
                  setIsSelecting(false);
                }}
                className="p-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary shadow-md hover:shadow-lg shadow-primary/30"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Settings"
              >
                <Settings size={16} />
              </motion.button>
              <motion.button
                onClick={onClose}
                className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Close Tool"
              >
                <X size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      ) : isSelecting ? (
        // Selecting indicator
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                <BarChart3 size={20} />
              </div>
              <span className="text-base font-semibold text-text">Histogram Tool</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  setShowPanel(true);
                  setIsSelecting(false);
                }}
                className="p-1.5 sm:p-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary shadow-md hover:shadow-lg shadow-primary/30"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Settings"
              >
                <Settings size={16} className="sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Close Tool"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl border border-primary"
          >
            <div className="flex items-center gap-2">
              {selectionMode === 'point' && <Crosshair size={18} className="animate-pulse" />}
              {selectionMode === 'area' && <Square size={18} className="animate-pulse" />}
              {selectionMode === 'line' && <Minus size={18} className="animate-pulse" />}
              <p className="text-sm font-semibold">
                {selectionMode === 'point' && 'Click anywhere on the image...'}
                {selectionMode === 'area' && 'Click and drag to select area...'}
                {selectionMode === 'line' && 'Click and drag to draw line...'}
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        // Full settings panel
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                <BarChart3 size={20} />
              </div>
              <span className="text-base font-semibold text-text">Histogram Tool</span>
            </div>
            <motion.button
              onClick={() => setShowPanel(false)}
              className="p-1.5 sm:p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.93 }}
              title="Collapse"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </motion.button>
          </div>

          {/* Selection Mode Buttons */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">Selection Mode</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'point', label: 'Point', icon: Crosshair },
                { mode: 'area', label: 'Area', icon: Square },
                { mode: 'line', label: 'Line', icon: Minus }
              ].map(({ mode, label, icon: Icon }) => (
                <motion.button
                  key={mode}
                  onClick={() => setSelectionMode(mode)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl ${
                    selectionMode === mode
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                      : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
                  }`}
                  style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon size={18} />
                  <span className="text-xs font-semibold">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-accent dark:bg-background-primary rounded-xl border border-border">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-text leading-relaxed">
                {selectionMode === 'point' && 'Click on a point to analyze 50px radius around it'}
                {selectionMode === 'area' && 'Click and drag to select a rectangular area'}
                {selectionMode === 'line' && 'Click and drag to draw a line across the image'}
              </p>
            </div>
          </div>

          {/* Start Selection Button */}
          <motion.button
            onClick={startSelection}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary shadow-md hover:shadow-lg shadow-primary/30 font-semibold"
            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {selectionMode === 'point' && <Crosshair size={18} />}
            {selectionMode === 'area' && <Square size={18} />}
            {selectionMode === 'line' && <Minus size={18} />}
            <span>Start {selectionMode === 'point' ? 'Point' : selectionMode === 'area' ? 'Area' : 'Line'} Selection</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default HistogramTool;