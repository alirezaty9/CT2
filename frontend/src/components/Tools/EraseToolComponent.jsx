import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { fabric } from 'fabric';
import {
  Eraser,
  Settings,
  Trash2,
  Circle,
  Square,
  Minus,
  X,
  Info
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * کامپوننت حرفه‌ای ابزار پاک‌کن
 * قابلیت‌ها:
 * - تنظیم اندازه پاک‌کن با کنترل دقیق
 * - پیش‌نمایش زنده محدوده پاک کردن
 * - انواع مختلف پاک‌کن (دایره‌ای، مربعی، خطی)
 * - تنظیمات پیشرفته شفافیت و فشار
 * - عملیات undo/redo هوشمند
 * - پشتیبانی از کیبورد shortcuts
 */
const EraseToolComponent = ({ 
  canvas, 
  isActive = false, 
  onToolChange,
  onSettingsChange,
  onClose,
  initialSettings = {}
}) => {
  // State مدیریت تنظیمات ابزار
  const [settings, setSettings] = useState({
    size: 15,
    minSize: 5,
    maxSize: 100,
    opacity: 0.8,
    shape: 'circle', // 'circle', 'square', 'line'
    pressure: true,
    preview: true,
    smoothing: 0.7,
    hardness: 0.8,
    spacing: 0.25,
    flow: 1.0,
    dynamics: true,
    antiAliasing: true,
    blendMode: 'destination-out',
    ...initialSettings
  });

  // State مدیریت UI
  const [showSettings, setShowSettings] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [erasedObjects, setErasedObjects] = useState([]);
  const [pressure, setPressure] = useState(1.0);
  const [velocity, setVelocity] = useState(0);
  const [eraserTrail, setEraserTrail] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const [stats, setStats] = useState({
    totalErased: 0,
    sessionTime: 0,
    undoCount: 0
  });

  // Refs برای مدیریت event handlers
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const lastErasePosRef = useRef(null);
  const erasingPathRef = useRef([]);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isMouseDownRef = useRef(false);
  const pressureRef = useRef(1.0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const trailTimeoutRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const settingsRef = useRef(null);
  
  // Motion values برای انیمیشن‌های smooth
  const previewScale = useMotionValue(1);
  const previewOpacity = useMotionValue(0.8);

  // محاسبه اندازه واقعی با در نظر گیری فشار و سرعت
  const actualSize = useMemo(() => {
    let baseSize = settings.size;
    
    if (settings.pressure) {
      baseSize *= (0.3 + pressure * 0.7); // فشار بین 30% تا 100%
    }
    
    if (settings.dynamics && velocity > 0) {
      const velocityFactor = Math.min(velocity / 1000, 1); // نرمالیزه سرعت
      baseSize *= (1 - velocityFactor * 0.3); // سرعت بالا = اندازه کمتر
    }
    
    return Math.max(settings.minSize, Math.min(settings.maxSize, baseSize));
  }, [settings.size, settings.pressure, settings.dynamics, settings.minSize, settings.maxSize, pressure, velocity]);

  // مدیریت شروع پاک کردن ساده
  const handleMouseDown = useCallback((e) => {
    if (!canvas || !isActive) return;

    e.e?.preventDefault?.();
    e.e?.stopPropagation?.();

    canvas.discardActiveObject();

    const pointer = canvas.getPointer(e.e);

    isMouseDownRef.current = true;
    setIsErasing(true);
    lastErasePosRef.current = pointer;

    console.log('\n\n🧹🧹🧹 =============== MOUSE DOWN - ERASING STARTED ===============');
    console.log('📍 Mouse down at:', pointer);
    console.log('🎨 Canvas objects count:', canvas.getObjects().length);
    console.log('⚙️ isMouseDownRef.current:', isMouseDownRef.current);

    // Start erasing immediately
    performEraseAction(pointer);
  }, [canvas, isActive]);

  // مدیریت حرکت ساده
  const handleMouseMove = useCallback((e) => {
    if (!canvas || !isActive) return;

    const pointer = canvas.getPointer(e.e);
    setPreviewPosition(pointer);

    // رندر فوری پیش‌نمایش
    const ctx = canvas.contextTop;
    if (ctx) {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, settings.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (isMouseDownRef.current) {
      console.log('🖱️ MOUSE MOVE (dragging) at:', pointer, '| isMouseDown:', isMouseDownRef.current);
      performEraseAction(pointer);
    } else {
      // Just hovering, not erasing
      console.log('👆 MOUSE MOVE (hover) at:', pointer, '| isMouseDown:', isMouseDownRef.current);
    }
  }, [canvas, isActive, settings.size]);

  // مدیریت پایان پاک کردن
  const handleMouseUp = useCallback(() => {
    if (!canvas || !isActive) return;

    console.log('🛑 =============== MOUSE UP - ERASING FINISHED ===============');
    console.log('⚙️ Setting isMouseDownRef.current to false');

    isMouseDownRef.current = false;
    setIsErasing(false);
    lastErasePosRef.current = null;

    console.log('✅ Erasing session ended\n\n');
  }, [canvas, isActive]);

  // مدیریت خروج ماوس از canvas
  const handleMouseLeave = useCallback(() => {
    setPreviewPosition(null);
    if (isMouseDownRef.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  // Helper function: calculate distance from point to line
  const pointToLineDistance = useCallback((px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // تابع ساده برای پاک کردن - با دقت بالا
  const performEraseAction = useCallback((point) => {
    if (!canvas) return;

    console.log('\n🧹 ==================== PERFORM ERASE ACTION ====================');
    console.log('🎯 Eraser position:', point);
    console.log('📏 Eraser size:', settings.size);
    console.log('🔍 Tolerance:', 8);

    const objects = canvas.getObjects();
    const objectsToRemove = [];
    const tolerance = 8;

    console.log('📦 Total objects on canvas:', objects.length);

    if (objects.length === 0) {
      console.log('⚠️ No objects on canvas to erase!');
      return;
    }

    objects.forEach((obj, idx) => {
      // Skip background and preview objects
      if (obj === canvas.backgroundImage || obj._isPreview) {
        console.log(`Object ${idx}: SKIPPED (background/preview)`);
        return;
      }

      let shouldErase = false;

      console.log(`\n--- Object ${idx} ---`);
      console.log('Object type:', obj.type);
      console.log('Object position - left:', obj.left, 'top:', obj.top);
      console.log('Stroke width:', obj.strokeWidth);

      // بررسی دقیق بر اساس نوع آبجکت
      if (obj.type === 'line') {
        // برای خطوط: بررسی فاصله نقطه تا خط
        const x1 = obj.x1 + obj.left;
        const y1 = obj.y1 + obj.top;
        const x2 = obj.x2 + obj.left;
        const y2 = obj.y2 + obj.top;

        console.log('Line endpoints:', { x1, y1, x2, y2 });

        const distance = pointToLineDistance(point.x, point.y, x1, y1, x2, y2);
        const strokeWidth = obj.strokeWidth || 1;
        const threshold = strokeWidth / 2 + tolerance;

        console.log('Distance to line:', distance.toFixed(2), 'Threshold:', threshold.toFixed(2));

        if (distance <= threshold) {
          shouldErase = true;
          console.log('✅ WILL ERASE - within threshold');
        } else {
          console.log('❌ NO ERASE - too far from line');
        }
      } else if (obj.type === 'path') {
        // برای مسیرها (brush strokes): بررسی دقیق نقاط مسیر
        console.log('🎨 PATH OBJECT FOUND');
        console.log('   Path points count:', obj.path?.length || 0);
        console.log('   Stroke color:', obj.stroke);
        console.log('   Stroke width:', obj.strokeWidth);

        if (obj.path && obj.path.length > 0) {
          const strokeWidth = obj.strokeWidth || 1;
          const threshold = strokeWidth / 2 + tolerance;

          console.log('   🎯 Threshold for hit detection:', threshold.toFixed(2), 'px');
          console.log('   📍 First 5 path points:', obj.path.slice(0, 5).map((p, i) => `[${i}]: [${p[1]?.toFixed(1)}, ${p[2]?.toFixed(1)}]`).join(', '));

          let minDistance = Infinity;
          let closestPoint = null;
          let hitPoints = [];

          // بررسی فاصله از هر نقطه در مسیر
          for (let i = 0; i < obj.path.length; i++) {
            const pathPoint = obj.path[i];
            if (pathPoint.length >= 3) {
              // Path coordinates are already in global space, no need to add obj.left/top
              const px = pathPoint[1];
              const py = pathPoint[2];

              const distance = Math.sqrt(
                Math.pow(point.x - px, 2) + Math.pow(point.y - py, 2)
              );

              if (distance < minDistance) {
                minDistance = distance;
                closestPoint = { px, py, index: i, distance: distance.toFixed(2) };
              }

              if (distance <= threshold) {
                shouldErase = true;
                hitPoints.push({ index: i, distance: distance.toFixed(2) });
              }

              // بررسی فاصله از خطوط بین نقاط
              if (i > 0 && obj.path[i - 1].length >= 3) {
                const prevPx = obj.path[i - 1][1];
                const prevPy = obj.path[i - 1][2];

                const lineDistance = pointToLineDistance(point.x, point.y, prevPx, prevPy, px, py);

                if (lineDistance < minDistance) {
                  minDistance = lineDistance;
                  closestPoint = { px, py, index: i, distance: lineDistance.toFixed(2), type: 'line-segment' };
                }

                if (lineDistance <= threshold) {
                  shouldErase = true;
                  hitPoints.push({ index: `${i-1}-${i}`, distance: lineDistance.toFixed(2), type: 'line' });
                }
              }
            }
          }

          if (!shouldErase) {
            console.log(`   ❌ NO HIT - Closest distance: ${minDistance.toFixed(2)}px at`, closestPoint);
          } else {
            console.log(`   ✅ HIT DETECTED! - Hit ${hitPoints.length} points/segments:`, hitPoints);
            console.log('   🔪 Instead of partial erase, removing entire object for now...');

            // For now, just remove the entire object when hit
            // TODO: Implement proper path splitting for partial erase
            shouldErase = true;
            console.log('   ⚠️ Marking object for complete removal');
          }
        }
      } else {
        // برای سایر اشیاء: استفاده از containsPoint
        const bounds = obj.getBoundingRect();

        if (point.x >= bounds.left - tolerance &&
            point.x <= bounds.left + bounds.width + tolerance &&
            point.y >= bounds.top - tolerance &&
            point.y <= bounds.top + bounds.height + tolerance) {

          if (obj.containsPoint) {
            const objPoint = new fabric.Point(point.x, point.y);
            shouldErase = obj.containsPoint(objPoint);
          } else {
            shouldErase = true;
          }
        }
      }

      if (shouldErase) {
        console.log('⭐ Adding to removal list');
        objectsToRemove.push(obj);
      }
    });

    console.log('\n📊 ========== SUMMARY ==========');
    console.log('Objects marked for complete removal:', objectsToRemove.length);

    // Remove objects
    if (objectsToRemove.length > 0) {
      objectsToRemove.forEach((obj, idx) => {
        console.log(`   🗑️ Removing object ${idx}:`, obj.type);
        canvas.remove(obj);
      });
      canvas.requestRenderAll();
      console.log('✅ Successfully removed', objectsToRemove.length, 'objects');
    } else {
      console.log('ℹ️ No objects marked for complete removal');
    }

    console.log('📦 Final canvas objects count:', canvas.getObjects().length);
    console.log('======================================================\n');
  }, [canvas, actualSize, pointToLineDistance, settings.size]);


  // بررسی قرار گیری object در محدوده پاک‌کن
  const checkObjectInEraseBounds = (point, objBounds, size, shape) => {
    if (!objBounds || !point) return false;
    
    const centerX = objBounds.left + objBounds.width / 2;
    const centerY = objBounds.top + objBounds.height / 2;
    const radius = size / 2;

    switch (shape) {
      case 'circle':
        const distance = Math.sqrt(
          Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
        );
        // بهبود دقت تشخیص برخورد
        return distance <= radius + Math.min(objBounds.width, objBounds.height) / 4;

      case 'square':
        return (
          point.x >= objBounds.left - radius &&
          point.x <= objBounds.left + objBounds.width + radius &&
          point.y >= objBounds.top - radius &&
          point.y <= objBounds.top + objBounds.height + radius
        );

      case 'line':
        return (
          Math.abs(point.y - centerY) <= radius &&
          point.x >= objBounds.left - radius &&
          point.x <= objBounds.left + objBounds.width + radius
        );

      default:
        return false;
    }
  };

  // پاک کردن بخشی از مسیر (برای خطوط و paths)
  const erasePartialPath = (pathObj, erasePoint, size) => {
    if (!pathObj.path) return [];

    const remainingSegments = [];
    let currentSegment = [];
    const radius = size / 2;

    pathObj.path.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point[1] - erasePoint.x, 2) + Math.pow(point[2] - erasePoint.y, 2)
      );

      if (distance > radius) {
        currentSegment.push(point);
      } else {
        if (currentSegment.length > 1) {
          remainingSegments.push([...currentSegment]);
        }
        currentSegment = [];
      }
    });

    if (currentSegment.length > 1) {
      remainingSegments.push([...currentSegment]);
    }

    return remainingSegments.map((segment) => {
      return new fabric.Path(segment, {
        stroke: pathObj.stroke,
        strokeWidth: pathObj.strokeWidth,
        fill: pathObj.fill,
        selectable: false,
        evented: false
      });
    });
  };


  // تغییر تنظیمات
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      onSettingsChange?.(updated);
      return updated;
    });
  }, [onSettingsChange]);

  // Undo آخرین عملیات
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      const lastState = undoStackRef.current.pop();
      canvas.loadFromJSON(lastState, () => {
        canvas.renderAll();
        console.log('⏪ Undo انجام شد');
      });
    }
  }, [canvas]);

  // پاک کردن همه objects
  const handleClearAll = useCallback(() => {
    if (!canvas) return;

    const canvasState = JSON.stringify(canvas.toJSON());
    undoStackRef.current.push(canvasState);

    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj !== canvas.backgroundImage) {
        canvas.remove(obj);
      }
    });
    
    canvas.renderAll();
    setErasedObjects([]);
    console.log('🗑️ همه objects پاک شدند');
  }, [canvas]);

  // رندر پیش‌نمایش ساده
  const renderPreview = useCallback(() => {
    if (!canvas || !previewPosition) return;

    const ctx = canvas.contextTop;
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رسم دایره قرمز ساده - همیشه نمایش داده شود
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(previewPosition.x, previewPosition.y, actualSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [canvas, previewPosition, actualSize]);

  // تنظیم event listeners با useRef برای جلوگیری از recreate شدن
  const handlersRef = useRef({
    handleMouseDown: null,
    handleMouseMove: null,
    handleMouseUp: null,
    handleMouseLeave: null
  });

  // به‌روزرسانی handlers در ref
  useEffect(() => {
    handlersRef.current.handleMouseDown = handleMouseDown;
    handlersRef.current.handleMouseMove = handleMouseMove;
    handlersRef.current.handleMouseUp = handleMouseUp;
    handlersRef.current.handleMouseLeave = handleMouseLeave;
  });

  // تنظیم event listeners
  useEffect(() => {
    if (!canvas || !isActive) return;

    // غیرفعال کردن انتخاب objects
    canvas.discardActiveObject();
    canvas.renderAll();

    const mouseDownHandler = (e) => handlersRef.current.handleMouseDown?.(e);
    const mouseMoveHandler = (e) => handlersRef.current.handleMouseMove?.(e);
    const mouseUpHandler = (e) => handlersRef.current.handleMouseUp?.(e);
    const mouseLeaveHandler = (e) => handlersRef.current.handleMouseLeave?.(e);

    canvas.on('mouse:down', mouseDownHandler);
    canvas.on('mouse:move', mouseMoveHandler);
    canvas.on('mouse:up', mouseUpHandler);
    canvas.on('mouse:leave', mouseLeaveHandler);

    return () => {
      canvas.off('mouse:down', mouseDownHandler);
      canvas.off('mouse:move', mouseMoveHandler);
      canvas.off('mouse:up', mouseUpHandler);
      canvas.off('mouse:leave', mouseLeaveHandler);
    };
  }, [canvas, isActive]);

  // رندر پیش‌نمایش
  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // تنظیم cursor و حالت canvas
  useEffect(() => {
    if (canvas && isActive) {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.renderAll();
    } else if (canvas && !isActive) {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.renderAll();
    }
  }, [canvas, isActive]);

  // پاکسازی در deactivation
  useEffect(() => {
    if (canvas && !isActive) {
      const ctx = canvas.contextTop;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvas, isActive]);

  // مدیریت کلیک بیرون منو و بستن تنظیمات
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        // بستن منو تنظیمات وقتی خارج از آن کلیک می‌شود
        setShowSettings(false);
      }
    };

    // listener اصلی برای تمام صفحه
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSettings]);

  return (
    <motion.div
      ref={settingsRef}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-72 sm:w-80 bg-background-white dark:bg-background-secondary rounded-2xl shadow-2xl border border-border p-4 sm:p-6"
    >
      {!showPanel ? (
        // Minimal view
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
                <Eraser size={16} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-text">Eraser Tool</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowPanel(true)}
                className="p-1.5 sm:p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg shadow-red-500/30"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Settings"
              >
                <Settings size={14} className="sm:w-4 sm:h-4" />
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
        </div>
      ) : (
        // Full settings panel
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
                <Eraser size={20} />
              </div>
              <span className="text-base font-semibold text-text">Eraser Tool</span>
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

          {/* Eraser Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text">Size</label>
              <span className="text-xs text-text-muted">{actualSize}px</span>
            </div>
            <input
              type="range"
              min={settings.minSize}
              max={settings.maxSize}
              value={settings.size}
              onChange={(e) => updateSettings({ size: parseInt(e.target.value) })}
              className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>{settings.minSize}px</span>
              <span>{settings.maxSize}px</span>
            </div>
          </div>

          {/* Shape Selection */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">Shape</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'circle', label: 'Circle', icon: Circle },
                { value: 'square', label: 'Square', icon: Square },
                { value: 'line', label: 'Line', icon: Minus }
              ].map(({ value, label, icon: Icon }) => (
                <motion.button
                  key={value}
                  onClick={() => updateSettings({ shape: value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl ${
                    settings.shape === value
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
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

          {/* Size Preview */}
          <div className="flex items-center justify-center bg-accent dark:bg-background-primary rounded-xl border border-border p-4">
            <div
              className={`border-2 border-dashed border-red-400 bg-red-100 ${
                settings.shape === 'square' ? '' : 'rounded-full'
              }`}
              style={{
                width: `${Math.min(actualSize, 60)}px`,
                height: settings.shape === 'line' ? '4px' : `${Math.min(actualSize, 60)}px`,
              }}
            />
          </div>

          {/* Action Buttons */}
          <motion.button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg shadow-red-500/30 font-semibold"
            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Trash2 size={18} />
            <span>Clear All</span>
          </motion.button>

          {/* Stats */}
          {erasedObjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl text-sm text-orange-800 dark:text-orange-300"
            >
              {erasedObjects.length} objects erased
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

EraseToolComponent.propTypes = {
  canvas: PropTypes.object,
  isActive: PropTypes.bool,
  onToolChange: PropTypes.func,
  onSettingsChange: PropTypes.func,
  onClose: PropTypes.func,
  initialSettings: PropTypes.object,
};

export default EraseToolComponent;