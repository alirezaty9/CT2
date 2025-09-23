import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCamera } from '../../contexts/CameraContext';
import SimpleCanvas from '../Canvas/SimpleCanvas';
import ConnectionStatus from '../common/ConnectionStatus';
import { 
  Settings, 
  RotateCcw, 
  Download,
  Upload,
  Maximize2,
  Minimize2
} from 'lucide-react';

/**
 * نمایشگر پیشرفته Basler با قابلیت‌های رسم و ویرایش حرفه‌ای
 */
const EnhancedBaslerDisplay = ({ className = '' }) => {
  const {
    cameras,
    wsStatus,
    imageSettings,
    updateImageSettings,
    toggleGrayscale,
    zoomImage,
    undoLastChange
  } = useCamera();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // تنظیمات تصویر
  const [localImageSettings, setLocalImageSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0
  });


  // تغییر تنظیمات تصویر
  const handleImageSettingChange = useCallback((setting, value) => {
    const newSettings = { ...localImageSettings, [setting]: value };
    setLocalImageSettings(newSettings);
    updateImageSettings(newSettings);
  }, [localImageSettings, updateImageSettings]);

  // ذخیره تصویر نهایی
  const handleSaveImage = useCallback(() => {
    // این قابلیت در SimpleCanvas پیاده‌سازی شده
    console.log('از دکمه دانلود داخل Canvas استفاده کنید');
  }, []);

  // ذخیره پروژه (شامل layers و تنظیمات)
  const handleSaveProject = useCallback(() => {
    const projectData = {
      imageSettings: localImageSettings,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { 
      type: 'application/json' 
    });
    
    const link = document.createElement('a');
    link.download = `basler-project-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    URL.revokeObjectURL(link.href);
  }, [localImageSettings]);

  // بارگذاری پروژه
  const handleLoadProject = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const projectData = JSON.parse(e.target.result);
        
        // بارگذاری تنظیمات
        if (projectData.imageSettings) {
          setLocalImageSettings(projectData.imageSettings);
          updateImageSettings(projectData.imageSettings);
        }
        
        console.log('پروژه با موفقیت بارگذاری شد');
      } catch (error) {
        console.error('خطا در بارگذاری پروژه:', error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // ریست input
  }, [updateImageSettings]);

  // تمام صفحه
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // محاسبه اندازه canvas
  const canvasSize = isFullscreen 
    ? { width: window.innerWidth - 100, height: window.innerHeight - 200 }
    : { width: 800, height: 600 };

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
      {/* هدر */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Basler Camera - ویرایشگر پیشرفته
          </h2>
          <ConnectionStatus 
            status={wsStatus} 
            lastUpdate={cameras.basler.lastUpdate}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* بارگذاری پروژه */}
          <label className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer">
            <Upload size={20} />
            <input
              type="file"
              accept=".json"
              onChange={handleLoadProject}
              className="hidden"
            />
          </label>
          
          {/* ذخیره پروژه */}
          <button
            onClick={handleSaveProject}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            title="ذخیره پروژه"
          >
            <Download size={20} />
          </button>
          
          {/* تنظیمات */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg transition-colors
              ${showSettings 
                ? 'bg-orange-100 text-orange-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            title="تنظیمات تصویر"
          >
            <Settings size={20} />
          </button>
          
          {/* تمام صفحه */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          {/* بازگشت */}
          <button
            onClick={undoLastChange}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="بازگشت"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* پنل تنظیمات تصویر */}
      {showSettings && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">روشنایی</label>
              <input
                type="range"
                min="0"
                max="200"
                value={localImageSettings.brightness}
                onChange={(e) => handleImageSettingChange('brightness', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">{localImageSettings.brightness}%</span>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">کنتراست</label>
              <input
                type="range"
                min="0"
                max="200"
                value={localImageSettings.contrast}
                onChange={(e) => handleImageSettingChange('contrast', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">{localImageSettings.contrast}%</span>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">اشباع</label>
              <input
                type="range"
                min="0"
                max="200"
                value={localImageSettings.saturation}
                onChange={(e) => handleImageSettingChange('saturation', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">{localImageSettings.saturation}%</span>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">تاری</label>
              <input
                type="range"
                min="0"
                max="10"
                value={localImageSettings.blur}
                onChange={(e) => handleImageSettingChange('blur', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">{localImageSettings.blur}px</span>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">رنگ</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={localImageSettings.hue}
                onChange={(e) => handleImageSettingChange('hue', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">{localImageSettings.hue}°</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={toggleGrayscale}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${imageSettings.grayscale 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }
              `}
            >
              سیاه و سفید
            </button>
            
            <button
              onClick={() => {
                const resetSettings = {
                  brightness: 100,
                  contrast: 100,
                  saturation: 100,
                  blur: 0,
                  hue: 0
                };
                setLocalImageSettings(resetSettings);
                updateImageSettings(resetSettings);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              بازنشانی
            </button>
          </div>
        </div>
      )}

      {/* ناحیه Canvas */}
      <div className={`flex-1 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50' : ''}`}>
        <SimpleCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          backgroundImage={cameras.basler.currentFrame}
          className="h-full"
        />
      </div>

      {/* اطلاعات وضعیت */}
      <div className="p-2 bg-gray-100 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>وضعیت: {cameras.basler.isConnected ? 'متصل' : 'قطع'}</span>
            <span>آخرین به‌روزرسانی: {cameras.basler.lastUpdate ? new Date(cameras.basler.lastUpdate).toLocaleTimeString('fa-IR') : '-'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>اندازه Canvas: {canvasSize.width} × {canvasSize.height}</span>
            <button
              onClick={handleSaveImage}
              className="px-3 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition-colors"
            >
              ذخیره تصویر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBaslerDisplay;
