import React, { useRef, useEffect, useState, useCallback } from 'react';
import CanvasManager from './CanvasManager';
import { 
  Brush, 
  Square, 
  Circle, 
  Triangle, 
  Minus, 
  Type, 
  Crop, 
  Move, 
  MousePointer, 
  Eraser,
  Undo,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Palette
} from 'lucide-react';

/**
 * کامپوننت Canvas پیشرفته با استفاده از کتابخانه‌های حرفه‌ای
 */
const AdvancedCanvas = ({ 
  width = 800, 
  height = 600, 
  backgroundImage = null,
  onCanvasReady = null,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const canvasManagerRef = useRef(null);
  const [currentTool, setCurrentTool] = useState('brush');
  const [brushSettings, setBrushSettings] = useState({
    color: '#000000',
    width: 5,
    opacity: 1,
    shadowBlur: 0
  });
  const [zoom, setZoom] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // ابزارهای موجود
  const tools = [
    { id: 'select', icon: MousePointer, label: 'انتخاب', mode: 'SELECT' },
    { id: 'brush', icon: Brush, label: 'برس', mode: 'DRAW' },
    { id: 'eraser', icon: Eraser, label: 'پاک‌کن', mode: 'DRAW' },
    { id: 'rectangle', icon: Square, label: 'مستطیل', mode: 'SELECT' },
    { id: 'circle', icon: Circle, label: 'دایره', mode: 'SELECT' },
    { id: 'triangle', icon: Triangle, label: 'مثلث', mode: 'SELECT' },
    { id: 'line', icon: Minus, label: 'خط', mode: 'SELECT' },
    { id: 'text', icon: Type, label: 'متن', mode: 'SELECT' },
    { id: 'crop', icon: Crop, label: 'برش', mode: 'CROP' },
    { id: 'pan', icon: Move, label: 'جابجایی', mode: 'PAN' }
  ];

  // راه‌اندازی canvas
  useEffect(() => {
    if (canvasRef.current && !canvasManagerRef.current) {
      canvasManagerRef.current = new CanvasManager(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff'
      });

      setIsReady(true);
      
      if (onCanvasReady) {
        onCanvasReady(canvasManagerRef.current);
      }
    }

    return () => {
      if (canvasManagerRef.current) {
        canvasManagerRef.current.dispose();
      }
    };
  }, [width, height, onCanvasReady]);

  // تنظیم تصویر پس‌زمینه
  useEffect(() => {
    if (canvasManagerRef.current && backgroundImage && isReady) {
      canvasManagerRef.current.setBackgroundImage(backgroundImage);
    }
  }, [backgroundImage, isReady]);

  // تغییر ابزار
  const handleToolChange = useCallback((toolId) => {
    if (!canvasManagerRef.current) return;

    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    setCurrentTool(toolId);

    // تنظیم حالت canvas
    canvasManagerRef.current.setMode(tool.mode);

    // عملیات خاص هر ابزار
    switch (toolId) {
      case 'brush':
        canvasManagerRef.current.setBrushSettings(brushSettings);
        break;
      case 'eraser':
        canvasManagerRef.current.setBrushSettings({
          ...brushSettings,
          color: '#ffffff' // یا transparent
        });
        break;
      case 'rectangle':
      case 'circle':
      case 'triangle':
      case 'line':
        canvasManagerRef.current.addShape(toolId);
        break;
      case 'text':
        canvasManagerRef.current.addText('متن نمونه');
        break;
    }
  }, [brushSettings, tools]);

  // تنظیمات برس
  const handleBrushSettingChange = useCallback((setting, value) => {
    const newSettings = { ...brushSettings, [setting]: value };
    setBrushSettings(newSettings);
    
    if (canvasManagerRef.current && currentTool === 'brush') {
      canvasManagerRef.current.setBrushSettings(newSettings);
    }
  }, [brushSettings, currentTool]);

  // عملیات canvas
  const handleUndo = useCallback(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.undo();
    }
  }, []);

  const handleClear = useCallback(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.clear();
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.deleteSelected();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setZoom(newZoom);
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setZoom(newZoom);
    }
  }, [zoom]);

  const handleDownload = useCallback(() => {
    if (canvasManagerRef.current) {
      const dataURL = canvasManagerRef.current.getImage('png', 1);
      const link = document.createElement('a');
      link.download = 'canvas-image.png';
      link.href = dataURL;
      link.click();
    }
  }, []);

  return (
    <div className={`flex flex-col bg-gray-50 ${className}`}>
      {/* نوار ابزار بالا */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 bg-white border-b border-gray-200 shadow-sm gap-2 sm:gap-0">
        {/* ابزارهای اصلی */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 flex-shrink-0
                  ${currentTool === tool.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
                title={tool.label}
              >
                <IconComponent size={16} className="sm:w-5 sm:h-5" />
              </button>
            );
          })}
        </div>

        {/* ابزارهای عملیاتی */}
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleUndo}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="بازگشت"
            >
              <Undo size={16} className="sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="حذف انتخاب شده"
            >
              <Trash2 size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleZoomOut}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="کوچک کردن"
            >
              <ZoomOut size={16} className="sm:w-5 sm:h-5" />
            </button>
            
            <span className="text-xs sm:text-sm text-gray-600 min-w-[50px] sm:min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="بزرگ کردن"
            >
              <ZoomIn size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
          
          <button
            onClick={handleDownload}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            title="دانلود"
          >
            <Download size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* تنظیمات برس */}
      {currentTool === 'brush' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-gray-600 sm:w-4 sm:h-4" />
            <input
              type="color"
              value={brushSettings.color}
              onChange={(e) => handleBrushSettingChange('color', e.target.value)}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">ضخامت:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSettings.width}
              onChange={(e) => handleBrushSettingChange('width', parseInt(e.target.value))}
              className="w-16 sm:w-24"
            />
            <span className="text-xs sm:text-sm text-gray-600 min-w-[25px] sm:min-w-[30px]">{brushSettings.width}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">شفافیت:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={brushSettings.opacity}
              onChange={(e) => handleBrushSettingChange('opacity', parseFloat(e.target.value))}
              className="w-16 sm:w-24"
            />
            <span className="text-xs sm:text-sm text-gray-600 min-w-[25px] sm:min-w-[30px]">{Math.round(brushSettings.opacity * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">سایه:</span>
            <input
              type="range"
              min="0"
              max="20"
              value={brushSettings.shadowBlur}
              onChange={(e) => handleBrushSettingChange('shadowBlur', parseInt(e.target.value))}
              className="w-16 sm:w-24"
            />
            <span className="text-xs sm:text-sm text-gray-600 min-w-[25px] sm:min-w-[30px]">{brushSettings.shadowBlur}</span>
          </div>
        </div>
      )}

      {/* ناحیه canvas */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto">
        <div className="relative bg-white rounded-lg shadow-lg flex justify-center items-center w-full h-full min-h-[200px] sm:min-h-[300px]">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedCanvas;
