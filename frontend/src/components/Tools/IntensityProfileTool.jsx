import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Square, Minus, Info, X, Settings, ArrowRightLeft } from 'lucide-react';
import { fabric } from 'fabric';
import { useIntensityProfile } from '../../contexts/IntensityProfileContext';
import { useToolLayer } from '../../hooks/useToolLayer';

const IntensityProfileTool = ({ canvas, isActive, onClose }) => {
  const [regionMode, setRegionMode] = useState('parallel-lines'); // Only parallel-lines mode
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(50); // spacing for parallel lines
  const regionObjectRef = useRef(null);
  const overlayTextRef = useRef([]);
  const startPointRef = useRef(null);
  const listenersAttachedRef = useRef(false);

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

  // Calculate average intensity between two parallel lines
  const calculateParallelLinesIntensity = useCallback((x1, y1, x2, y2, spacing) => {
    if (!canvas) return null;

    try {
      const ctx = canvas.getContext('2d');

      // Calculate perpendicular direction
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Unit vector along the line
      const ux = dx / length;
      const uy = dy / length;

      // Perpendicular unit vector
      const perpX = -uy;
      const perpY = ux;

      // Create two parallel lines
      const line1 = {
        x1: x1 + perpX * spacing / 2,
        y1: y1 + perpY * spacing / 2,
        x2: x2 + perpX * spacing / 2,
        y2: y2 + perpY * spacing / 2
      };

      const line2 = {
        x1: x1 - perpX * spacing / 2,
        y1: y1 - perpY * spacing / 2,
        x2: x2 - perpX * spacing / 2,
        y2: y2 - perpY * spacing / 2
      };

      // Sample points along the main line
      const numSamples = Math.ceil(length);
      const profiles = [];

      for (let i = 0; i < numSamples; i++) {
        const t = i / (numSamples - 1);
        const centerX = x1 + dx * t;
        const centerY = y1 + dy * t;

        // Sample perpendicular line between the two parallel lines
        const samples = [];
        const numPerpSamples = Math.ceil(spacing);

        for (let j = 0; j < numPerpSamples; j++) {
          const s = (j / (numPerpSamples - 1) - 0.5) * spacing;
          const sampleX = Math.round(centerX + perpX * s);
          const sampleY = Math.round(centerY + perpY * s);

          // Check bounds
          if (sampleX >= 0 && sampleX < canvas.width && sampleY >= 0 && sampleY < canvas.height) {
            const imageData = ctx.getImageData(sampleX, sampleY, 1, 1);
            const data = imageData.data;
            samples.push({
              r: data[0],
              g: data[1],
              b: data[2],
              intensity: 0.299 * data[0] + 0.587 * data[1] + 0.114 * data[2]
            });
          }
        }

        // Calculate average for this perpendicular section
        if (samples.length > 0) {
          const avgR = samples.reduce((sum, s) => sum + s.r, 0) / samples.length;
          const avgG = samples.reduce((sum, s) => sum + s.g, 0) / samples.length;
          const avgB = samples.reduce((sum, s) => sum + s.b, 0) / samples.length;
          const avgIntensity = samples.reduce((sum, s) => sum + s.intensity, 0) / samples.length;

          profiles.push({
            position: i,
            x: centerX,
            y: centerY,
            r: avgR,
            g: avgG,
            b: avgB,
            intensity: avgIntensity,
            distance: i
          });
        }
      }

      return {
        profiles,
        line1,
        line2,
        spacing,
        length
      };
    } catch (err) {
      console.error('Error calculating parallel lines intensity:', err);
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
    if (!canvas) return;

    try {
      // Remove overlay text
      if (overlayTextRef.current.length > 0) {
        overlayTextRef.current.forEach(text => {
          if (text) {
            try {
              canvas.remove(text);
              removeFromLayer(text);
            } catch (e) {
              // Object may already be removed
            }
          }
        });
        overlayTextRef.current = [];
      }

      // Remove region objects (handle both single objects and multiple objects)
      if (regionObjectRef.current) {
        if (Array.isArray(regionObjectRef.current)) {
          // Array of objects
          regionObjectRef.current.forEach(obj => {
            if (obj) {
              try {
                canvas.remove(obj);
                removeFromLayer(obj);
              } catch (e) {
                // Object may already be removed
              }
            }
          });
        } else if (typeof regionObjectRef.current === 'object') {
          // Object with properties (like parallel lines)
          Object.values(regionObjectRef.current).forEach(obj => {
            if (obj) {
              try {
                canvas.remove(obj);
                removeFromLayer(obj);
              } catch (e) {
                // Object may already be removed
              }
            }
          });
        } else {
          // Single object
          try {
            canvas.remove(regionObjectRef.current);
            removeFromLayer(regionObjectRef.current);
          } catch (e) {
            // Object may already be removed
          }
        }
        regionObjectRef.current = null;
      }

      canvas.renderAll();
    } catch (error) {
      console.error('Error removing region objects:', error);
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

  // Handle parallel lines drawing
  const handleParallelLinesDrawing = useCallback((x1, y1, x2, y2) => {
    removeRegionObject();

    // Clear any existing overlay text
    overlayTextRef.current.forEach(text => canvas.remove(text));
    overlayTextRef.current = [];

    // Calculate intensity profile
    const result = calculateParallelLinesIntensity(x1, y1, x2, y2, lineSpacing);

    if (result) {
      const { profiles, line1, line2 } = result;

      // Create a group for all visual elements
      const group = new fabric.Group([], {
        selectable: false,
        evented: false
      });

      // Draw the two parallel lines
      const fabricLine1 = new fabric.Line(
        [line1.x1, line1.y1, line1.x2, line1.y2],
        {
          stroke: '#ff0000',
          strokeWidth: 2,
          selectable: false,
          evented: false
        }
      );

      const fabricLine2 = new fabric.Line(
        [line2.x1, line2.y1, line2.x2, line2.y2],
        {
          stroke: '#ff0000',
          strokeWidth: 2,
          selectable: false,
          evented: false
        }
      );

      canvas.add(fabricLine1);
      canvas.add(fabricLine2);
      addToLayer(fabricLine1);
      addToLayer(fabricLine2);

      // Draw connecting lines at start and end
      const startConnector = new fabric.Line(
        [line1.x1, line1.y1, line2.x1, line2.y1],
        {
          stroke: '#ff0000',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false
        }
      );

      const endConnector = new fabric.Line(
        [line1.x2, line1.y2, line2.x2, line2.y2],
        {
          stroke: '#ff0000',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false
        }
      );

      canvas.add(startConnector);
      canvas.add(endConnector);
      addToLayer(startConnector);
      addToLayer(endConnector);

      // Draw intensity profile chart directly on the image between the parallel lines
      // Calculate perpendicular direction
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / length;
      const perpY = dx / length;

      // Scale the intensity values to fit within the region
      const minIntensity = Math.min(...profiles.map(p => p.intensity));
      const maxIntensity = Math.max(...profiles.map(p => p.intensity));
      const intensityRange = maxIntensity - minIntensity || 1;

      // Create polyline points for the chart
      const chartPoints = profiles.map((point, index) => {
        // Normalize intensity to 0-1 range
        const normalizedIntensity = (point.intensity - minIntensity) / intensityRange;

        // Calculate perpendicular offset based on intensity
        // Map intensity to position between the two parallel lines
        const offset = (normalizedIntensity - 0.5) * lineSpacing;

        return {
          x: point.x + perpX * offset,
          y: point.y + perpY * offset
        };
      });

      // Draw the intensity profile as a polyline
      const polylinePoints = chartPoints.map(p => ({ x: p.x, y: p.y }));
      const intensityPolyline = new fabric.Polyline(polylinePoints, {
        stroke: '#00ff00',
        strokeWidth: 2,
        fill: '',
        selectable: false,
        evented: false,
        objectCaching: false
      });

      canvas.add(intensityPolyline);
      addToLayer(intensityPolyline);
      overlayTextRef.current.push(intensityPolyline);

      // Add min/max labels
      const minText = new fabric.Text(`Min: ${minIntensity.toFixed(0)}`, {
        left: x1 - perpX * lineSpacing / 2,
        top: y1 - perpY * lineSpacing / 2 - 20,
        fontSize: 14,
        fill: '#ffff00',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 3,
        selectable: false,
        evented: false,
        fontWeight: 'bold'
      });

      const maxText = new fabric.Text(`Max: ${maxIntensity.toFixed(0)}`, {
        left: x1 + perpX * lineSpacing / 2,
        top: y1 + perpY * lineSpacing / 2 - 20,
        fontSize: 14,
        fill: '#ffff00',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 3,
        selectable: false,
        evented: false,
        fontWeight: 'bold'
      });

      canvas.add(minText);
      canvas.add(maxText);
      addToLayer(minText);
      addToLayer(maxText);
      overlayTextRef.current.push(minText);
      overlayTextRef.current.push(maxText);

      regionObjectRef.current = { fabricLine1, fabricLine2, startConnector, endConnector };
      canvas.renderAll();

      // Store the profile data
      const newProfile = addProfile({
        type: 'parallel-lines',
        region: { x1, y1, x2, y2, spacing: lineSpacing },
        data: profiles,
        length: result.length,
        spacing: result.spacing
      });

      setSelectedRegion({
        type: 'parallel-lines',
        fabricObject: { fabricLine1, fabricLine2 },
        profile: newProfile
      });

      console.log('📊 Parallel lines intensity profile calculated:', profiles.length, 'points');
    }
  }, [canvas, addToLayer, calculateParallelLinesIntensity, addProfile, setSelectedRegion, removeRegionObject, lineSpacing]);

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
    if (!canvas || !isActive) return;

    // Clear previous drawings before starting new one
    removeRegionObject();

    const pointer = canvas.getPointer(e.e);
    console.log('📊 Start point:', pointer);
    startPointRef.current = pointer;
    setIsDrawing(true);
  }, [canvas, isActive, isDrawing, removeRegionObject]);

  const handleMouseMove = useCallback((e) => {
    if (!canvas || !isActive || !startPointRef.current) return;

    const pointer = canvas.getPointer(e.e);
    const startPoint = startPointRef.current;

    // Remove previous preview
    if (regionObjectRef.current) {
      if (typeof regionObjectRef.current === 'object' && regionObjectRef.current.line1) {
        canvas.remove(regionObjectRef.current.line1);
        canvas.remove(regionObjectRef.current.line2);
        canvas.remove(regionObjectRef.current.startConnector);
        canvas.remove(regionObjectRef.current.endConnector);
      }
      regionObjectRef.current = null;
    }

    // Calculate perpendicular direction for parallel lines preview
    const dx = pointer.x - startPoint.x;
    const dy = pointer.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const perpX = -dy / length;
      const perpY = dx / length;

      const line1 = new fabric.Line(
        [
          startPoint.x + perpX * lineSpacing / 2,
          startPoint.y + perpY * lineSpacing / 2,
          pointer.x + perpX * lineSpacing / 2,
          pointer.y + perpY * lineSpacing / 2
        ],
        {
          stroke: '#ff0000',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          opacity: 0.7
        }
      );

      const line2 = new fabric.Line(
        [
          startPoint.x - perpX * lineSpacing / 2,
          startPoint.y - perpY * lineSpacing / 2,
          pointer.x - perpX * lineSpacing / 2,
          pointer.y - perpY * lineSpacing / 2
        ],
        {
          stroke: '#ff0000',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          opacity: 0.7
        }
      );

      const startConnector = new fabric.Line(
        [
          startPoint.x + perpX * lineSpacing / 2,
          startPoint.y + perpY * lineSpacing / 2,
          startPoint.x - perpX * lineSpacing / 2,
          startPoint.y - perpY * lineSpacing / 2
        ],
        {
          stroke: '#ff0000',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          opacity: 0.7
        }
      );

      const endConnector = new fabric.Line(
        [
          pointer.x + perpX * lineSpacing / 2,
          pointer.y + perpY * lineSpacing / 2,
          pointer.x - perpX * lineSpacing / 2,
          pointer.y - perpY * lineSpacing / 2
        ],
        {
          stroke: '#ff0000',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
          opacity: 0.7
        }
      );

      canvas.add(line1);
      canvas.add(line2);
      canvas.add(startConnector);
      canvas.add(endConnector);
      regionObjectRef.current = { line1, line2, startConnector, endConnector };
    }

    canvas.renderAll();
  }, [canvas, isActive, lineSpacing]);

  const handleMouseUp = useCallback((e) => {
    console.log('📊 Mouse up - isActive:', isActive, 'startPoint:', startPointRef.current);
    if (!canvas || !isActive || !startPointRef.current) return;

    const pointer = canvas.getPointer(e.e);
    const startPoint = startPointRef.current;
    console.log('📊 End point:', pointer);

    // Draw parallel lines with intensity values
    handleParallelLinesDrawing(
      Math.round(startPoint.x),
      Math.round(startPoint.y),
      Math.round(pointer.x),
      Math.round(pointer.y)
    );

    setIsDrawing(false);
    startPointRef.current = null;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
  }, [canvas, isActive, handleParallelLinesDrawing]);

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas || !isActive) {
      listenersAttachedRef.current = false;
      return;
    }

    // Prevent attaching listeners multiple times
    if (listenersAttachedRef.current) {
      console.log('📊 Listeners already attached, skipping');
      return;
    }

    console.log('📊 Setting up intensity profile event listeners');

    // Remove any existing listeners first
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    // Add new listeners
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    listenersAttachedRef.current = true;

    return () => {
      console.log('📊 Cleaning up intensity profile event listeners');
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      listenersAttachedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, isActive]);

  // Auto-start drawing when tool becomes active
  useEffect(() => {
    if (isActive && canvas) {
      startDrawing();
    } else if (!isActive && canvas) {
      setIsDrawing(false);
      startPointRef.current = null;
      // Don't remove region objects when tool becomes inactive
      // This allows the lines to persist
      if (canvas.defaultCursor) {
        canvas.defaultCursor = 'default';
      }
      if (canvas.hoverCursor) {
        canvas.hoverCursor = 'move';
      }
    }
  }, [isActive, canvas]);

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
      className="w-72 sm:w-80 bg-background-white dark:bg-background-secondary rounded-2xl shadow-2xl border border-border p-4 sm:p-6"
    >
      {!showPanel && !isDrawing ? (
        // Minimal view
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                <Activity size={16} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-text">Intensity Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  setShowPanel(true);
                  setIsDrawing(false);
                }}
                className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg shadow-green-500/30"
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
      ) : isDrawing ? (
        // Drawing indicator
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                <Activity size={20} />
              </div>
              <span className="text-base font-semibold text-text">Intensity Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  setShowPanel(true);
                  setIsDrawing(false);
                }}
                className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg shadow-green-500/30"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Settings"
              >
                <Settings size={16} className="sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                onClick={onClose}
                className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Close Tool"
              >
                <X size={16} className="sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl border border-green-500"
          >
            <div className="flex items-center gap-2">
              {regionMode === 'line' && <Minus size={18} className="animate-pulse" />}
              {regionMode === 'parallel-lines' && <ArrowRightLeft size={18} className="animate-pulse" />}
              {regionMode === 'rectangle' && <Square size={18} className="animate-pulse" />}
              <p className="text-sm font-semibold">
                {regionMode === 'line' && 'Click and drag to draw line...'}
                {regionMode === 'parallel-lines' && 'Click and drag to draw parallel lines...'}
                {regionMode === 'rectangle' && 'Click and drag to draw rectangle...'}
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                <Activity size={20} />
              </div>
              <span className="text-base font-semibold text-text">Intensity Profile</span>
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

          {/* Line Spacing Control */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">
              Region Width: {lineSpacing}px
            </div>
            <input
              type="range"
              min="20"
              max="200"
              value={lineSpacing}
              onChange={(e) => setLineSpacing(parseInt(e.target.value))}
              className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer slider-green"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((lineSpacing - 20) / 180) * 100}%, #e5e7eb ${((lineSpacing - 20) / 180) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>20px</span>
              <span>200px</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-accent dark:bg-background-primary rounded-xl border border-border">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-text leading-relaxed">
                Click and drag to select a region. The intensity profile will be displayed directly on the image with min/max values.
              </p>
            </div>
          </div>

          {/* Start Drawing Button */}
          <motion.button
            onClick={startDrawing}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg shadow-green-500/30 font-semibold"
            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {regionMode === 'line' && <Minus size={18} />}
            {regionMode === 'parallel-lines' && <ArrowRightLeft size={18} />}
            {regionMode === 'rectangle' && <Square size={18} />}
            <span>Draw {regionMode === 'line' ? 'Line' : regionMode === 'parallel-lines' ? 'Parallel Lines' : 'Rectangle'}</span>
          </motion.button>

          {/* Current Layer Info */}
          {getCurrentLayer() && (
            <div className="p-3 bg-background-secondary dark:bg-background-primary rounded-lg border border-border">
              <div className="text-xs text-text-muted">Layer</div>
              <div className="text-sm font-semibold text-text">{getCurrentLayer().name}</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default IntensityProfileTool;
