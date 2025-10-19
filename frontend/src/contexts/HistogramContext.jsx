import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const HistogramContext = createContext();

export const useHistogram = () => {
  const context = useContext(HistogramContext);
  if (!context) {
    throw new Error('useHistogram must be used within HistogramProvider');
  }
  return context;
};

export const HistogramProvider = ({ children }) => {
  const [histogramData, setHistogramData] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [currentChannel, setCurrentChannel] = useState('gray');
  const [selectionRegion, setSelectionRegion] = useState(null);

  // Window/Level state - مقادیر برای کنترل نمایش تصویر
  const [windowCenter, setWindowCenter] = useState(null); // Center of window
  const [windowWidth, setWindowWidth] = useState(null);   // Width of window
  const [minLevel, setMinLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(255);
  const [bitDepth, setBitDepth] = useState(8); // 8 or 16

  // LUT (Look-Up Table) برای تبدیل مقادیر pixel
  const [lut, setLut] = useState(null);

  // آیا Window/Level روی تصویر اعمال شده؟
  const [isWindowLevelApplied, setIsWindowLevelApplied] = useState(false);

  // تابع ایجاد LUT براساس min/max levels
  const generateLUT = useCallback((min, max, depth) => {
    const maxValue = depth === 16 ? 65535 : 255;
    const lutSize = maxValue + 1;
    const newLut = new Uint16Array(lutSize);

    // محاسبه LUT با الگوریتم Window/Level استاندارد
    const range = max - min;

    for (let i = 0; i < lutSize; i++) {
      if (i <= min) {
        newLut[i] = 0;
      } else if (i >= max) {
        newLut[i] = 255;
      } else {
        // Linear mapping between min and max
        newLut[i] = Math.round(((i - min) / range) * 255);
      }
    }

    return newLut;
  }, []);

  // به‌روزرسانی LUT هنگام تغییر levels
  useEffect(() => {
    if (minLevel !== null && maxLevel !== null && bitDepth) {
      const newLut = generateLUT(minLevel, maxLevel, bitDepth);
      setLut(newLut);
    }
  }, [minLevel, maxLevel, bitDepth, generateLUT]);

  // تابع به‌روزرسانی Window/Level
  const updateWindowLevel = useCallback((center, width) => {
    setWindowCenter(center);
    setWindowWidth(width);

    // محاسبه min/max از window/level
    const newMin = Math.max(0, center - width / 2);
    const maxValue = bitDepth === 16 ? 65535 : 255;
    const newMax = Math.min(maxValue, center + width / 2);

    setMinLevel(Math.round(newMin));
    setMaxLevel(Math.round(newMax));
  }, [bitDepth]);

  // تابع به‌روزرسانی مستقیم min/max levels
  const updateLevels = useCallback((min, max) => {
    setMinLevel(min);
    setMaxLevel(max);

    // محاسبه window/level از min/max
    const center = (min + max) / 2;
    const width = max - min;
    setWindowCenter(center);
    setWindowWidth(width);
  }, []);

  // تابع تنظیم bit depth
  const updateBitDepth = useCallback((depth) => {
    setBitDepth(depth);
    const maxValue = depth === 16 ? 65535 : 255;

    // بازنشانی levels
    setMinLevel(0);
    setMaxLevel(maxValue);
    setWindowCenter(maxValue / 2);
    setWindowWidth(maxValue);
  }, []);

  const updateHistogram = useCallback((data, point, region = null, depth = 8) => {
    setHistogramData(data);
    setSelectedPoint(point);
    setSelectionRegion(region);

    // تنظیم bit depth از داده
    if (depth !== bitDepth) {
      updateBitDepth(depth);
    }
  }, [bitDepth, updateBitDepth]);

  const clearHistogram = useCallback(() => {
    setHistogramData(null);
    setSelectedPoint(null);
    setSelectionRegion(null);
  }, []);

  const changeChannel = useCallback((channel) => {
    setCurrentChannel(channel);
  }, []);

  // تابع reset کردن levels به حالت پیش‌فرض
  const resetLevels = useCallback(() => {
    const maxValue = bitDepth === 16 ? 65535 : 255;
    setMinLevel(0);
    setMaxLevel(maxValue);
    setWindowCenter(maxValue / 2);
    setWindowWidth(maxValue);
  }, [bitDepth]);

  // Callback برای اطلاع به کامپوننت‌ها هنگام تغییر Window/Level
  // این callback رو BaslerDisplay میتونه استفاده کنه
  const [windowLevelCallback, setWindowLevelCallback] = useState(null);

  const registerWindowLevelCallback = useCallback((callback) => {
    setWindowLevelCallback(() => callback);
  }, []);

  // فراخوانی callback هنگام تغییر levels
  useEffect(() => {
    if (windowLevelCallback && minLevel !== null && maxLevel !== null) {
      windowLevelCallback(minLevel, maxLevel, bitDepth);
    }
  }, [minLevel, maxLevel, bitDepth, windowLevelCallback]);

  return (
    <HistogramContext.Provider
      value={{
        // داده‌های هیستوگرام
        histogramData,
        selectedPoint,
        currentChannel,
        selectionRegion,

        // Window/Level state
        windowCenter,
        windowWidth,
        minLevel,
        maxLevel,
        bitDepth,
        lut,
        isWindowLevelApplied,

        // توابع
        updateHistogram,
        clearHistogram,
        changeChannel,
        updateWindowLevel,
        updateLevels,
        updateBitDepth,
        resetLevels,
        registerWindowLevelCallback,
        setIsWindowLevelApplied,
      }}
    >
      {children}
    </HistogramContext.Provider>
  );
};