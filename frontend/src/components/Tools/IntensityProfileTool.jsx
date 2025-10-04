import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Square, Minus, Info, Download, Trash2 } from 'lucide-react';
import { fabric } from 'fabric';
import { useIntensityProfile } from '../../contexts/IntensityProfileContext';
import { useToolLayer } from '../../hooks/useToolLayer';

const IntensityProfileTool = ({ canvas, isActive }) => {
  const [regionMode, setRegionMode] = useState('line'); // 'line' or 'rectangle'
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const regionObjectRef = useRef(null);

  const { addProfile, selectedRegion, setSelectedRegion } = useIntensityProfile();
  const { addToLayer, removeFromLayer, getCurrentLayer } = useToolLayer(
    'Intensity Profile',
    'intensity-profile',
    canvas,
    isActive
  );

  // Debug: log when component mounts/updates
  useEffect(() => {
    console.log('📊 IntensityProfileTool render - canvas:', !!canvas, 'isActive:', isActive, 'isDrawing:', isDrawing);
  }, [canvas, isActive, isDrawing]);

  // Calculate intensity along a line using Bresenham's algorithm
  const calculateLineIntensity = useCallback((x1, y1, x2, y2) => {
    if (!canvas) return null;

    try {
      const ctx = canvas.getContext('2d');
      const points = [];

      // Bresenham's line algorithm
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      let x = Math.round(x1);
      let y = Math.round(y1);
      const x2Round = Math.round(x2);
      const y2Round = Math.round(y2);

      while (true) {
        // Get pixel data
        const imageData = ctx.getImageData(x, y, 1, 1);
        const data = imageData.data;

        // Calculate grayscale intensity (weighted average)
        const intensity = 0.299 * data[0] + 0.587 * data[1] + 0.114 * data[2];

        points.push({
          x,
          y,
          r: data[0],
          g: data[1],
          b: data[2],
          intensity: intensity,
          distance: Math.sqrt((x - x1) ** 2 + (y - y1) ** 2)
        });

        if (x === x2Round && y === y2Round) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }

      return points;
    } catch (err) {
      console.error('Error calculating line intensity:', err);
      return null;
    }
  }, [canvas]);

  // Calculate average intensity for a rectangular region
  const calculateRectangleIntensity = useCallback((left, top, width, height) => {
    if (!canvas) return null;

    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(left, top, width, height);
      const data = imageData.data;

      // Calculate horizontal average profile (average each column)
      const horizontalProfile = [];
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, sumIntensity = 0;

        for (let y = 0; y < height; y++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const intensity = 0.299 * r + 0.587 * g + 0.114 * b;

          sumR += r;
          sumG += g;
          sumB += b;
          sumIntensity += intensity;
        }

        horizontalProfile.push({
          position: x,
          r: sumR / height,
          g: sumG / height,
          b: sumB / height,
          intensity: sumIntensity / height
        });
      }

      // Calculate vertical average profile (average each row)
      const verticalProfile = [];
      for (let y = 0; y < height; y++) {
        let sumR = 0, sumG = 0, sumB = 0, sumIntensity = 0;

        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const intensity = 0.299 * r + 0.587 * g + 0.114 * b;

          sumR += r;
          sumG += g;
          sumB += b;
          sumIntensity += intensity;
        }

        verticalProfile.push({
          position: y,
          r: sumR / width,
          g: sumG / width,
          b: sumB / width,
          intensity: sumIntensity / width
        });
      }

      // Calculate statistics
      const allPixels = [];
      for (let i = 0; i < data.length; i += 4) {
        const intensity = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        allPixels.push(intensity);
      }

      const mean = allPixels.reduce((a, b) => a + b, 0) / allPixels.length;
      const sorted = [...allPixels].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const median = sorted[Math.floor(sorted.length / 2)];
      const stdDev = Math.sqrt(
        allPixels.reduce((sum, val) => sum + (val - mean) ** 2, 0) / allPixels.length
      );

      return {
        horizontalProfile,
        verticalProfile,
        statistics: { mean, min, max, median, stdDev, pixelCount: allPixels.length }
      };
    } catch (err) {
      console.error('Error calculating rectangle intensity:', err);
      return null;
    }
  }, [canvas]);

  // Remove region object
  const removeRegionObject = useCallback(() => {
    if (regionObjectRef.current && canvas) {
      canvas.remove(regionObjectRef.current);
      removeFromLayer(regionObjectRef.current);
      regionObjectRef.current = null;
      canvas.renderAll();
    }
  }, [canvas, removeFromLayer]);

  // Handle line drawing
  const handleLineDrawing = useCallback((x1, y1, x2, y2) => {
    removeRegionObject();

    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: '#00ff00',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    regionObjectRef.current = line;
    canvas.add(line);
    addToLayer(line);
    canvas.renderAll();

    // Calculate intensity profile
    const profile = calculateLineIntensity(x1, y1, x2, y2);

    if (profile) {
      const newProfile = addProfile({
        type: 'line',
        region: { x1, y1, x2, y2 },
        data: profile,
        length: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      });

      setSelectedRegion({
        type: 'line',
        fabricObject: line,
        profile: newProfile
      });

      console.log('📊 Line intensity profile calculated:', profile.length, 'points');
    }
  }, [canvas, addToLayer, calculateLineIntensity, addProfile, setSelectedRegion, removeRegionObject]);

  // Handle rectangle drawing
  const handleRectangleDrawing = useCallback((x1, y1, x2, y2) => {
    removeRegionObject();

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    const rect = new fabric.Rect({
      left,
      top,
      width,
      height,
      fill: 'transparent',
      stroke: '#00ff00',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    regionObjectRef.current = rect;
    canvas.add(rect);
    addToLayer(rect);
    canvas.renderAll();

    // Calculate intensity profiles
    const profiles = calculateRectangleIntensity(left, top, width, height);

    if (profiles) {
      const newProfile = addProfile({
        type: 'rectangle',
        region: { left, top, width, height },
        data: profiles,
        area: width * height
      });

      setSelectedRegion({
        type: 'rectangle',
        fabricObject: rect,
        profile: newProfile
      });

      console.log('📊 Rectangle intensity profiles calculated');
      console.log('  Horizontal profile:', profiles.horizontalProfile.length, 'points');
      console.log('  Vertical profile:', profiles.verticalProfile.length, 'points');
      console.log('  Statistics:', profiles.statistics);
    }
  }, [canvas, addToLayer, calculateRectangleIntensity, addProfile, setSelectedRegion, removeRegionObject]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    console.log('📊 Mouse down - isActive:', isActive, 'isDrawing:', isDrawing);
    if (!canvas || !isActive || !isDrawing) return;

    const pointer = canvas.getPointer(e.e);
    console.log('📊 Start point:', pointer);
    setStartPoint(pointer);
  }, [canvas, isActive, isDrawing]);

  const handleMouseMove = useCallback((e) => {
    if (!canvas || !isActive || !isDrawing || !startPoint) return;

    const pointer = canvas.getPointer(e.e);
    removeRegionObject();

    if (regionMode === 'line') {
      const line = new fabric.Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
        stroke: '#00ff00',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.7
      });
      regionObjectRef.current = line;
      canvas.add(line);
    } else if (regionMode === 'rectangle') {
      const rect = new fabric.Rect({
        left: Math.min(startPoint.x, pointer.x),
        top: Math.min(startPoint.y, pointer.y),
        width: Math.abs(pointer.x - startPoint.x),
        height: Math.abs(pointer.y - startPoint.y),
        fill: 'transparent',
        stroke: '#00ff00',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.7
      });
      regionObjectRef.current = rect;
      canvas.add(rect);
    }

    canvas.renderAll();
  }, [canvas, isActive, isDrawing, startPoint, regionMode, removeRegionObject]);

  const handleMouseUp = useCallback((e) => {
    console.log('📊 Mouse up - isActive:', isActive, 'isDrawing:', isDrawing, 'startPoint:', startPoint);
    if (!canvas || !isActive || !isDrawing || !startPoint) return;

    const pointer = canvas.getPointer(e.e);
    console.log('📊 End point:', pointer);

    if (regionMode === 'line') {
      console.log('📊 Drawing line profile');
      handleLineDrawing(
        Math.round(startPoint.x),
        Math.round(startPoint.y),
        Math.round(pointer.x),
        Math.round(pointer.y)
      );
    } else if (regionMode === 'rectangle') {
      console.log('📊 Drawing rectangle profile');
      handleRectangleDrawing(
        Math.round(startPoint.x),
        Math.round(startPoint.y),
        Math.round(pointer.x),
        Math.round(pointer.y)
      );
    }

    setIsDrawing(false);
    setStartPoint(null);
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
  }, [canvas, isActive, isDrawing, startPoint, regionMode, handleLineDrawing, handleRectangleDrawing]);

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas || !isActive) return;

    console.log('📊 Setting up intensity profile event listeners');
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      console.log('📊 Cleaning up intensity profile event listeners');
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, isActive, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Cleanup when tool becomes inactive
  useEffect(() => {
    if (!isActive && canvas) {
      setIsDrawing(false);
      setStartPoint(null);
      removeRegionObject();
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    }
  }, [isActive, canvas, removeRegionObject]);

  const startDrawing = useCallback(() => {
    if (!canvas) return;
    console.log('📊 Starting intensity profile drawing, mode:', regionMode);
    setIsDrawing(true);
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
  }, [canvas, regionMode]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-80 bg-background-white dark:bg-background-secondary rounded-2xl shadow-2xl border border-border p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
            <Activity size={20} />
          </div>
          <span className="text-base font-semibold text-text">Intensity Profile</span>
        </div>
      </div>

      {/* Region Mode Selection */}
      {!isDrawing && (
        <div className="mb-5">
          <div className="text-sm font-semibold text-text mb-2">Region Type</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { mode: 'line', label: 'Line', icon: Minus },
              { mode: 'rectangle', label: 'Rectangle', icon: Square }
            ].map(({ mode, label, icon: Icon }) => (
              <motion.button
                key={mode}
                onClick={() => setRegionMode(mode)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${
                  regionMode === mode
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isDrawing && (
        <div className="mb-5 p-4 bg-accent dark:bg-background-primary rounded-xl border border-border">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text leading-relaxed">
              {regionMode === 'line' && 'Draw a line to get intensity profile along the path'}
              {regionMode === 'rectangle' && 'Draw a rectangle to get average horizontal and vertical intensity profiles'}
            </p>
          </div>
        </div>
      )}

      {/* Start Drawing Button */}
      {!isDrawing && (
        <motion.button
          onClick={startDrawing}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg shadow-green-500/30 font-semibold"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {regionMode === 'line' ? <Minus size={18} /> : <Square size={18} />}
          <span>Draw {regionMode === 'line' ? 'Line' : 'Rectangle'}</span>
        </motion.button>
      )}

      {/* Drawing indicator */}
      {isDrawing && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl border border-green-500"
        >
          <div className="flex items-center gap-2">
            {regionMode === 'line' ? <Minus size={18} className="animate-pulse" /> : <Square size={18} className="animate-pulse" />}
            <p className="text-sm font-semibold">
              {regionMode === 'line' && 'Click and drag to draw line...'}
              {regionMode === 'rectangle' && 'Click and drag to draw rectangle...'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Current Layer Info */}
      {getCurrentLayer() && (
        <div className="mt-4 p-3 bg-background-secondary dark:bg-background-primary rounded-lg border border-border">
          <div className="text-xs text-text-muted">Layer</div>
          <div className="text-sm font-semibold text-text">{getCurrentLayer().name}</div>
        </div>
      )}
    </motion.div>
  );
};

export default IntensityProfileTool;
