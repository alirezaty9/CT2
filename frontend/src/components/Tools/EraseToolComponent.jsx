import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { fabric } from 'fabric';
import { 
  Eraser, 
  Settings, 
  RotateCcw, 
  Trash2, 
  Eye, 
  EyeOff,
  Circle,
  Square,
  Minus,
  Zap,
  Target,
  MousePointer,
  Layers,
  History,
  Sparkles,
  X
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="eraser-tool bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eraser className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-800">ابزار پاک‌کن</h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Close Button */}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              title="بستن پنل"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Settings Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Single click no longer opens the settings menu
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
              showSettings ? 'bg-gray-100' : ''
            }`}
            title="دابل کلیک/راست کلیک: تنظیمات پیشرفته"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* اندازه پاک‌کن */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">اندازه</label>
          <span className="text-xs text-gray-500">{actualSize}px</span>
        </div>
        <input
          type="range"
          min={settings.minSize}
          max={settings.maxSize}
          value={settings.size}
          onChange={(e) => updateSettings({ size: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{settings.minSize}px</span>
          <span>{settings.maxSize}px</span>
        </div>
      </div>

      {/* نوع پاک‌کن */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">شکل</label>
        <div className="flex gap-2">
          {[
            { value: 'circle', icon: Circle, label: 'دایره' },
            { value: 'square', icon: Square, label: 'مربع' },
            { value: 'line', icon: Minus, label: 'خط' }
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => updateSettings({ shape: value })}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                settings.shape === value
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* پیش‌نمایش اندازه */}
      <div className="mb-4 flex items-center justify-center bg-gray-50 rounded-lg p-4">
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

      {/* تنظیمات پیشرفته */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg"
          >
            {/* شفافیت */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-600">شفافیت</label>
                <span className="text-xs text-gray-500">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.opacity}
                onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Smoothing */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-600">نرمی</label>
                <span className="text-xs text-gray-500">{Math.round(settings.smoothing * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.smoothing}
                onChange={(e) => updateSettings({ smoothing: parseFloat(e.target.value) })}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* تنظیمات boolean */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">پیش‌نمایش</label>
              <button
                onClick={() => updateSettings({ preview: !settings.preview })}
                className="p-1"
              >
                {settings.preview ? 
                  <Eye className="w-4 h-4 text-blue-500" /> : 
                  <EyeOff className="w-4 h-4 text-gray-400" />
                }
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">حساسیت به فشار</label>
              <button
                onClick={() => updateSettings({ pressure: !settings.pressure })}
                className={`w-10 h-5 rounded-full transition-colors ${
                  settings.pressure ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.pressure ? 'translate-x-5' : 'translate-x-0.5'
                } translate-y-0.5`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* دکمه‌های عملیاتی */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (canvas) {
              // Add test objects
              const line = new fabric.Line([50, 50, 150, 150], {
                stroke: '#ff0000',
                strokeWidth: 3,
                selectable: true,
                evented: true
              });
              const rect = new fabric.Rect({
                left: 200,
                top: 100,
                width: 100,
                height: 80,
                fill: 'transparent',
                stroke: '#00ff00',
                strokeWidth: 2,
                selectable: true,
                evented: true
              });
              canvas.add(line);
              canvas.add(rect);
              canvas.renderAll();
              console.log('📏 Test objects added');
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <Circle className="w-4 h-4" />
          <span className="text-sm">Add Test</span>
        </button>
        
        <button
          onClick={handleClearAll}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Clear All</span>
        </button>
      </div>

      {/* نمایش آمار */}
      {erasedObjects.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          {erasedObjects.length} آبجکت پاک شده
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