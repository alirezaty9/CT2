import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Canvas, 
  PencilBrush, 
  Rect, 
  Circle as FabricCircle, 
  Triangle as FabricTriangle, 
  Line as FabricLine, 
  Text as FabricText, 
  FabricImage 
} from 'fabric';
import { 
  Brush, 
  Square, 
  Circle, 
  Triangle, 
  Minus, 
  Type, 
  MousePointer, 
  Eraser,
  Undo,
  Trash2,
  Download,
  Palette,
  X
} from 'lucide-react';

/**
 * کامپوننت Canvas ساده با Fabric.js
 * این نسخه بدون وابستگی به کتابخانه‌های اضافی کار می‌کند
 */
const SimpleCanvas = ({ 
  width = 800, 
  height = 600, 
  backgroundImage = null,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState('brush');
  const [showEraserMenu, setShowEraserMenu] = useState(false);
  const [brushSettings, setBrushSettings] = useState({
    color: '#000000',
    width: 5,
    opacity: 1
  });

  // ابزارهای موجود
  const tools = [
    { id: 'select', icon: MousePointer, label: 'انتخاب' },
    { id: 'brush', icon: Brush, label: 'برس' },
    { id: 'eraser', icon: Eraser, label: 'پاک‌کن' },
    { id: 'rectangle', icon: Square, label: 'مستطیل' },
    { id: 'circle', icon: Circle, label: 'دایره' },
    { id: 'triangle', icon: Triangle, label: 'مثلث' },
    { id: 'line', icon: Minus, label: 'خط' },
    { id: 'text', icon: Type, label: 'متن' }
  ];

  // راه‌اندازی canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        enableRetinaScaling: true,
        selection: true,
        preserveObjectStacking: true
      });

      setupBrush();
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [width, height]);

  // تنظیم برس
  const setupBrush = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const brush = new PencilBrush(fabricCanvasRef.current);
    brush.color = brushSettings.color;
    brush.width = brushSettings.width;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    
    fabricCanvasRef.current.freeDrawingBrush = brush;
  }, [brushSettings]);

  // تنظیم تصویر پس‌زمینه
  useEffect(() => {
    if (fabricCanvasRef.current && backgroundImage) {
      FabricImage.fromURL(backgroundImage).then((img) => {
        const canvasWidth = fabricCanvasRef.current.width;
        const canvasHeight = fabricCanvasRef.current.height;
        
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvasWidth - img.width * scale) / 2,
          top: (canvasHeight - img.height * scale) / 2,
          selectable: false,
          evented: false
        });
        
        fabricCanvasRef.current.setBackgroundImage(img, () => {
          fabricCanvasRef.current.renderAll();
        });
      });
    }
  }, [backgroundImage]);

  // تغییر ابزار
  const handleToolChange = useCallback((toolId) => {
    if (!fabricCanvasRef.current) return;

    setCurrentTool(toolId);

    switch (toolId) {
      case 'select':
        fabricCanvasRef.current.isDrawingMode = false;
        fabricCanvasRef.current.selection = true;
        fabricCanvasRef.current.forEachObject(obj => {
          obj.selectable = true;
        });
        break;

      case 'brush':
        fabricCanvasRef.current.isDrawingMode = true;
        fabricCanvasRef.current.selection = false;
        setupBrush();
        break;

      case 'eraser':
        fabricCanvasRef.current.isDrawingMode = true;
        fabricCanvasRef.current.selection = false;
        const eraser = new PencilBrush(fabricCanvasRef.current);
        eraser.color = '#ffffff';
        eraser.width = brushSettings.width * 2;
        fabricCanvasRef.current.freeDrawingBrush = eraser;
        break;

      case 'rectangle':
        fabricCanvasRef.current.isDrawingMode = false;
        addShape('rectangle');
        break;

      case 'circle':
        fabricCanvasRef.current.isDrawingMode = false;
        addShape('circle');
        break;

      case 'triangle':
        fabricCanvasRef.current.isDrawingMode = false;
        addShape('triangle');
        break;

      case 'line':
        fabricCanvasRef.current.isDrawingMode = false;
        addShape('line');
        break;

      case 'text':
        fabricCanvasRef.current.isDrawingMode = false;
        addText();
        break;
    }
  }, [brushSettings, setupBrush]);

  // مدیریت کلیک روی دکمه پاک‌کن
  const handleEraserClick = useCallback(() => {
    // کلیک ساده: فقط تولبار را انتخاب می‌کند اما منو باز نمی‌شود
    if (currentTool !== 'eraser') {
      handleToolChange('eraser');
    }
  }, [currentTool, handleToolChange]);

  // مدیریت دابل کلیک روی دکمه پاک‌کن
  const handleEraserDoubleClick = useCallback(() => {
    setShowEraserMenu(!showEraserMenu);
  }, [showEraserMenu]);

  // مدیریت کلیک راست روی دکمه پاک‌کن
  const handleEraserRightClick = useCallback((e) => {
    e.preventDefault();
    setShowEraserMenu(!showEraserMenu);
  }, [showEraserMenu]);

  // اضافه کردن شکل
  const addShape = useCallback((type) => {
    if (!fabricCanvasRef.current) return;

    let shape;
    
    switch (type) {
      case 'rectangle':
        shape = new Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: brushSettings.color,
          strokeWidth: 2
        });
        break;
        
      case 'circle':
        shape = new FabricCircle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: brushSettings.color,
          strokeWidth: 2
        });
        break;
        
      case 'triangle':
        shape = new FabricTriangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: brushSettings.color,
          strokeWidth: 2
        });
        break;
        
      case 'line':
        shape = new FabricLine([50, 100, 200, 100], {
          stroke: brushSettings.color,
          strokeWidth: 2
        });
        break;
    }
    
    if (shape) {
      fabricCanvasRef.current.add(shape);
      fabricCanvasRef.current.setActiveObject(shape);
      fabricCanvasRef.current.renderAll();
    }
  }, [brushSettings.color]);

  // اضافه کردن متن
  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const text = new FabricText('متن نمونه', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: brushSettings.color
    });
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  }, [brushSettings.color]);

  // تنظیمات برس
  const handleBrushSettingChange = useCallback((setting, value) => {
    const newSettings = { ...brushSettings, [setting]: value };
    setBrushSettings(newSettings);
    
    if (fabricCanvasRef.current && currentTool === 'brush') {
      setupBrush();
    }
  }, [brushSettings, currentTool, setupBrush]);

  // عملیات canvas
  const handleUndo = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const objects = fabricCanvasRef.current.getObjects();
    if (objects.length > 0) {
      fabricCanvasRef.current.remove(objects[objects.length - 1]);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const handleClear = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = '#ffffff';
    fabricCanvasRef.current.renderAll();
  }, []);

  const handleDelete = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length) {
      fabricCanvasRef.current.remove(...activeObjects);
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    });
    
    const link = document.createElement('a');
    link.download = 'canvas-image.png';
    link.href = dataURL;
    link.click();
  }, []);

  return (
    <div className={`flex flex-col bg-gray-50 ${className}`}>
      {/* نوار ابزار */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            
            // برای پاک‌کن از هندلرهای خاص استفاده می‌کنیم
            if (tool.id === 'eraser') {
              return (
                <button
                  key={tool.id}
                  onClick={handleEraserClick}
                  onDoubleClick={handleEraserDoubleClick}
                  onContextMenu={handleEraserRightClick}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                    ${currentTool === tool.id 
                      ? 'bg-red-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  title={`${tool.label} (دابل کلیک یا کلیک راست برای تنظیمات)`}
                >
                  <IconComponent size={20} />
                </button>
              );
            }
            
            return (
              <button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                  ${currentTool === tool.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
                title={tool.label}
              >
                <IconComponent size={20} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="بازگشت"
          >
            <Undo size={20} />
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="حذف انتخاب شده"
          >
            <Trash2 size={20} />
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            title="دانلود"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* تنظیمات برس */}
      {currentTool === 'brush' && (
        <div className="flex items-center gap-4 p-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-gray-600" />
            <input
              type="color"
              value={brushSettings.color}
              onChange={(e) => handleBrushSettingChange('color', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">ضخامت:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSettings.width}
              onChange={(e) => handleBrushSettingChange('width', parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 min-w-[30px]">{brushSettings.width}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">شفافیت:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={brushSettings.opacity}
              onChange={(e) => handleBrushSettingChange('opacity', parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 min-w-[30px]">{Math.round(brushSettings.opacity * 100)}%</span>
          </div>
        </div>
      )}

      {/* منوی پیشرفته پاک‌کن */}
      {currentTool === 'eraser' && showEraserMenu && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eraser size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">تنظیمات پیشرفته پاک‌کن</span>
            </div>
            <button
              onClick={() => setShowEraserMenu(false)}
              className="flex items-center justify-center w-6 h-6 rounded bg-red-200 text-red-600 hover:bg-red-300 transition-colors"
              title="بستن منو"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-700">اندازه پاک‌کن:</span>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSettings.width * 2}
                onChange={(e) => handleBrushSettingChange('width', parseInt(e.target.value) / 2)}
                className="w-24"
              />
              <span className="text-sm text-red-700 min-w-[30px]">{brushSettings.width * 2}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                پاک کردن همه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ناحیه canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="relative bg-white rounded-lg shadow-lg flex justify-center items-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleCanvas;
