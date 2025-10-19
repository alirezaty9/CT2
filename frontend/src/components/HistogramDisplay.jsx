import { useRef, useEffect, useState, useCallback } from 'react';
import { useHistogram } from '../contexts/HistogramContext';
import { BarChart3, RotateCcw } from 'lucide-react';
import { scaleLinear } from 'd3-scale';
import debugLogger from '../utils/debugLogger';

/**
 * HistogramDisplay - نمایش حرفه‌ای هیستوگرام با قابلیت Window/Level
 *
 * ویژگی‌ها:
 * - پشتیبانی کامل از 8-bit و 16-bit
 * - Color Bar با گرادیانت خاکستری استاندارد
 * - Window/Level adjustment با drag handles
 * - نمایش آمار کامل (Min, Max, Mean, StdDev)
 * - اعمال LUT به تصویر در real-time
 */
const HistogramDisplay = () => {
  debugLogger.logRender('HistogramDisplay');

  const {
    histogramData,
    selectedPoint,
    selectionRegion,
    minLevel,
    maxLevel,
    updateLevels,
    resetLevels,
    bitDepth: contextBitDepth,
    isWindowLevelApplied,
    setIsWindowLevelApplied,
  } = useHistogram();

  const canvasRef = useRef(null);
  const colorBarRef = useRef(null);

  // State for dragging window/level handles
  const [isDragging, setIsDragging] = useState(null); // 'min', 'max', 'both', or null
  const [dragStart, setDragStart] = useState(null);
  const [tempMinLevel, setTempMinLevel] = useState(null);
  const [tempMaxLevel, setTempMaxLevel] = useState(null);

  // محاسبه maxIntensity بر اساس bit depth
  const maxIntensity = contextBitDepth === 16 ? 65535 : 255;

  // آمارهای محاسبه شده از هیستوگرام
  const [stats, setStats] = useState({
    min: 0,
    max: 0,
    mean: 0,
    stdDev: 0,
    pixelCount: 0,
  });

  // محاسبه آمار از داده‌های هیستوگرام
  useEffect(() => {
    if (!histogramData) return;

    const data = histogramData['gray'];
    if (!data) return;

    let totalPixels = 0;
    let sum = 0;
    let min = -1;
    let max = -1;

    // پیدا کردن min, max و محاسبه mean
    for (let i = 0; i < data.length; i++) {
      const count = data[i];
      if (count > 0) {
        if (min === -1) min = i;
        max = i;
        totalPixels += count;
        sum += i * count;
      }
    }

    const mean = totalPixels > 0 ? sum / totalPixels : 0;

    // محاسبه انحراف معیار
    let varianceSum = 0;
    for (let i = 0; i < data.length; i++) {
      const count = data[i];
      if (count > 0) {
        varianceSum += count * Math.pow(i - mean, 2);
      }
    }
    const stdDev = totalPixels > 0 ? Math.sqrt(varianceSum / totalPixels) : 0;

    setStats({
      min: min === -1 ? 0 : min,
      max: max === -1 ? 0 : max,
      mean: Math.round(mean),
      stdDev: Math.round(stdDev * 10) / 10,
      pixelCount: totalPixels,
    });
  }, [histogramData]);

  // Auto-apply Window/Level when minLevel or maxLevel changes (Live mode)
  useEffect(() => {
    // همیشه Window/Level رو فعال نگه دار (Live mode)
    // فقط با دکمه Reset غیرفعال میشه
    if (!isWindowLevelApplied) {
      console.log('🔄 Auto-enabling Window/Level (Live mode):', {
        minLevel,
        maxLevel,
        bitDepth: contextBitDepth
      });
      setIsWindowLevelApplied(true);
    }
  }, [minLevel, maxLevel, contextBitDepth, isWindowLevelApplied, setIsWindowLevelApplied]);

  // رسم Color Bar (گرادیانت خاکستری)
  useEffect(() => {
    if (!colorBarRef.current) return;

    const canvas = colorBarRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // پاک کردن canvas
    ctx.clearRect(0, 0, width, height);

    // رسم گرادیانت خاکستری
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.5, '#808080');
    gradient.addColorStop(1, '#FFFFFF');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // رسم border
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // نمایش مقادیر Min و Max levels روی color bar
    const marginLeft = 70;
    const marginRight = 20;
    const chartWidth = width - marginLeft - marginRight;

    // موقعیت min level
    const minX = marginLeft + ((tempMinLevel ?? minLevel) / maxIntensity) * chartWidth;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(minX - 3, 0, 6, height);

    // موقعیت max level
    const maxX = marginLeft + ((tempMaxLevel ?? maxLevel) / maxIntensity) * chartWidth;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.fillRect(maxX - 3, 0, 6, height);

    // سایه زدن قسمت‌های خارج از window
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(marginLeft, 0, minX - marginLeft, height);
    ctx.fillRect(maxX, 0, width - maxX - marginRight, height);

  }, [minLevel, maxLevel, maxIntensity, tempMinLevel, tempMaxLevel]);

  // رسم هیستوگرام
  useEffect(() => {
    if (!histogramData || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // پاک کردن canvas
    ctx.clearRect(0, 0, width, height);

    const data = histogramData['gray'];
    if (!data) return;

    // Margins - بزرگتر برای خوانایی بهتر
    const marginLeft = 70;
    const marginBottom = 35;
    const marginTop = 15;
    const marginRight = 20;
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginBottom - marginTop;

    // پیدا کردن max value برای scaling (نادیده گرفتن outliers)
    const sortedData = [...data].sort((a, b) => b - a);
    const maxValue = sortedData[Math.floor(sortedData.length * 0.001)] || Math.max(...data);

    // رسم محورها
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;

    // محور Y
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, height - marginBottom);
    ctx.stroke();

    // محور X
    ctx.beginPath();
    ctx.moveTo(marginLeft, height - marginBottom);
    ctx.lineTo(width - marginRight, height - marginBottom);
    ctx.stroke();

    // برچسب‌های محور Y (تعداد پیکسل)
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = Math.round((maxValue / ySteps) * i);
      const y = height - marginBottom - (chartHeight / ySteps) * i;

      ctx.fillText(value.toLocaleString(), marginLeft - 8, y);

      // خطوط شبکه
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(width - marginRight, y);
      ctx.stroke();
    }

    // برچسب‌های محور X (مقادیر شدت)
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const xSteps = contextBitDepth === 16 ? 8 : 8;
    for (let i = 0; i <= xSteps; i++) {
      const value = Math.round((maxIntensity / xSteps) * i);
      const x = marginLeft + (chartWidth / xSteps) * i;
      ctx.fillText(value.toLocaleString(), x, height - marginBottom + 5);
    }

    // نمایش Bit Depth در گوشه سمت راست
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${contextBitDepth}-bit`, width - marginRight, height - marginBottom + 5);

    // رسم میله‌های هیستوگرام
    const barWidth = chartWidth / data.length;

    // استفاده از color scale برای نمایش زیباتر
    const colorScale = scaleLinear()
      .domain([0, maxValue])
      .range(['rgba(107, 114, 128, 0.3)', 'rgba(107, 114, 128, 0.9)']);

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      if (value === 0) continue;

      const barHeight = Math.min((value / maxValue) * chartHeight, chartHeight);
      const x = marginLeft + i * barWidth;
      const y = height - marginBottom - barHeight;

      ctx.fillStyle = colorScale(value);
      ctx.fillRect(x, y, Math.max(barWidth, 0.5), barHeight);
    }

    // رسم خطوط min/max levels
    const currentMinLevel = tempMinLevel ?? minLevel;
    const currentMaxLevel = tempMaxLevel ?? maxLevel;

    // خط min level (قرمز)
    const minX = marginLeft + (currentMinLevel / maxIntensity) * chartWidth;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(minX, marginTop);
    ctx.lineTo(minX, height - marginBottom);
    ctx.stroke();

    // Handle برای min - بزرگتر و واضح‌تر
    ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
    ctx.beginPath();
    ctx.arc(minX, height - marginBottom + 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // خط max level (سبز)
    const maxX = marginLeft + (currentMaxLevel / maxIntensity) * chartWidth;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(maxX, marginTop);
    ctx.lineTo(maxX, height - marginBottom);
    ctx.stroke();

    // Handle برای max - بزرگتر و واضح‌تر
    ctx.fillStyle = 'rgba(34, 197, 94, 0.95)';
    ctx.beginPath();
    ctx.arc(maxX, height - marginBottom + 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // رسم ناحیه window (بین min و max)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(minX, marginTop, maxX - minX, chartHeight);

  }, [histogramData, minLevel, maxLevel, maxIntensity, contextBitDepth, tempMinLevel, tempMaxLevel]);

  // Mouse event handlers برای drag
  const handleMouseDown = useCallback((e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const marginLeft = 70;
    const marginBottom = 35;
    const marginRight = 20;
    const chartWidth = canvasRef.current.width - marginLeft - marginRight;

    const minX = marginLeft + (minLevel / maxIntensity) * chartWidth;
    const maxX = marginLeft + (maxLevel / maxIntensity) * chartWidth;
    const handleY = canvasRef.current.height - marginBottom + 15;

    // چک کردن کلیک روی min handle - محدوده بزرگتر برای راحتی
    if (Math.abs(canvasX - minX) < 20 && Math.abs(canvasY - handleY) < 20) {
      setIsDragging('min');
      setDragStart({ x: canvasX, minLevel, maxLevel });
      setTempMinLevel(minLevel);
      return;
    }

    // چک کردن کلیک روی max handle - محدوده بزرگتر برای راحتی
    if (Math.abs(canvasX - maxX) < 20 && Math.abs(canvasY - handleY) < 20) {
      setIsDragging('max');
      setDragStart({ x: canvasX, minLevel, maxLevel });
      setTempMaxLevel(maxLevel);
      return;
    }

    // چک کردن کلیک در ناحیه بین min و max (Window drag)
    if (canvasX > minX && canvasX < maxX && canvasY < canvasRef.current.height - marginBottom) {
      setIsDragging('both');
      setDragStart({ x: canvasX, minLevel, maxLevel });
      setTempMinLevel(minLevel);
      setTempMaxLevel(maxLevel);
      return;
    }
  }, [minLevel, maxLevel, maxIntensity]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !canvasRef.current || !dragStart) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scaleX = canvasRef.current.width / rect.width;
    const canvasX = x * scaleX;

    const marginLeft = 70;
    const marginRight = 20;
    const chartWidth = canvasRef.current.width - marginLeft - marginRight;

    const deltaX = canvasX - dragStart.x;
    const deltaLevel = (deltaX / chartWidth) * maxIntensity;

    if (isDragging === 'min') {
      const newMin = Math.round(dragStart.minLevel + deltaLevel);
      const clampedMin = Math.max(0, Math.min(newMin, dragStart.maxLevel - 1));
      setTempMinLevel(clampedMin);
    } else if (isDragging === 'max') {
      const newMax = Math.round(dragStart.maxLevel + deltaLevel);
      const clampedMax = Math.max(dragStart.minLevel + 1, Math.min(newMax, maxIntensity));
      setTempMaxLevel(clampedMax);
    } else if (isDragging === 'both') {
      // حرکت همزمان window
      const windowWidth = dragStart.maxLevel - dragStart.minLevel;
      let newMin = Math.round(dragStart.minLevel + deltaLevel);
      let newMax = Math.round(dragStart.maxLevel + deltaLevel);

      // اطمینان از اینکه از محدوده خارج نشود
      if (newMin < 0) {
        newMin = 0;
        newMax = windowWidth;
      }
      if (newMax > maxIntensity) {
        newMax = maxIntensity;
        newMin = maxIntensity - windowWidth;
      }

      setTempMinLevel(newMin);
      setTempMaxLevel(newMax);
    }
  }, [isDragging, dragStart, maxIntensity, canvasRef]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && (tempMinLevel !== null || tempMaxLevel !== null)) {
      // اعمال تغییرات
      const finalMin = tempMinLevel ?? minLevel;
      const finalMax = tempMaxLevel ?? maxLevel;
      console.log('🖱️ Mouse Up - Applying new levels:', {
        finalMin,
        finalMax,
        tempMinLevel,
        tempMaxLevel,
        isDragging
      });
      updateLevels(finalMin, finalMax);
    }

    setIsDragging(null);
    setDragStart(null);
    setTempMinLevel(null);
    setTempMaxLevel(null);
  }, [isDragging, tempMinLevel, tempMaxLevel, minLevel, maxLevel, updateLevels]);

  // اضافه کردن event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // تغییر cursor در حالت hover
  const handleCanvasMouseMove = useCallback((e) => {
    if (!canvasRef.current || isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const marginLeft = 70;
    const marginBottom = 35;
    const marginRight = 20;
    const chartWidth = canvasRef.current.width - marginLeft - marginRight;

    const minX = marginLeft + (minLevel / maxIntensity) * chartWidth;
    const maxX = marginLeft + (maxLevel / maxIntensity) * chartWidth;
    const handleY = canvasRef.current.height - marginBottom + 15;

    // تغییر cursor
    if (
      (Math.abs(canvasX - minX) < 20 && Math.abs(canvasY - handleY) < 20) ||
      (Math.abs(canvasX - maxX) < 20 && Math.abs(canvasY - handleY) < 20)
    ) {
      canvasRef.current.style.cursor = 'ew-resize';
    } else if (
      canvasX > minX &&
      canvasX < maxX &&
      canvasY < canvasRef.current.height - marginBottom
    ) {
      canvasRef.current.style.cursor = 'move';
    } else {
      canvasRef.current.style.cursor = 'default';
    }
  }, [minLevel, maxLevel, maxIntensity, isDragging]);

  if (!histogramData || !selectedPoint) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted">
        <BarChart3 size={32} className="mb-2 opacity-50" />
        <p className="text-sm text-center">Select Histogram tool and click on image to see distribution</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden p-2">
      {/* اطلاعات انتخاب و آمار */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {/* اطلاعات ناحیه انتخاب شده */}
        <div className="bg-accent dark:bg-background-primary rounded-lg px-2 py-1 border border-border flex-shrink-0">
          {selectionRegion?.type === 'point' && (
            <>
              <div className="text-xs text-text-muted">Point (R={selectionRegion.radius}px)</div>
              <div className="font-mono text-xs font-semibold text-text">
                ({selectedPoint.x}, {selectedPoint.y})
              </div>
            </>
          )}
          {selectionRegion?.type === 'area' && (
            <>
              <div className="text-xs text-text-muted">
                Area {selectionRegion.width}×{selectionRegion.height}px
              </div>
              <div className="font-mono text-xs font-semibold text-text">
                ({selectedPoint.x}, {selectedPoint.y})
              </div>
            </>
          )}
          {selectionRegion?.type === 'line' && (
            <>
              <div className="text-xs text-text-muted">Line ({selectionRegion.length}px)</div>
              <div className="font-mono text-xs font-semibold text-text">
                ({selectedPoint.x}, {selectedPoint.y})
              </div>
            </>
          )}
        </div>

        {/* مقدار Gray */}
        <div className="text-center bg-gray-100 dark:bg-gray-900/20 rounded-lg px-2 py-1 border border-border flex-shrink-0">
          <div className="text-xs text-text-muted">Gray Value</div>
          <div className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-400">
            {selectedPoint.pixel.gray ||
              Math.round(
                (selectedPoint.pixel.r + selectedPoint.pixel.g + selectedPoint.pixel.b) / 3
              )}
          </div>
        </div>

        {/* آمارها */}
        <div className="flex gap-1 flex-shrink-0">
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 border border-blue-300 dark:border-blue-700">
            <div className="text-xs text-text-muted">Min</div>
            <div className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
              {stats.min}
            </div>
          </div>
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 border border-blue-300 dark:border-blue-700">
            <div className="text-xs text-text-muted">Max</div>
            <div className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
              {stats.max}
            </div>
          </div>
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 border border-blue-300 dark:border-blue-700">
            <div className="text-xs text-text-muted">Mean</div>
            <div className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
              {stats.mean}
            </div>
          </div>
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 border border-blue-300 dark:border-blue-700">
            <div className="text-xs text-text-muted">σ</div>
            <div className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
              {stats.stdDev}
            </div>
          </div>
        </div>

        {/* دکمه‌های کنترل */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => {
              resetLevels();
              setIsWindowLevelApplied(false);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold transition-colors"
            title="Reset Window/Level to Original"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Color Bar */}
      <div className="flex-shrink-0">
        <div className="text-xs text-text-muted mb-1 font-semibold">Grayscale Color Bar</div>
        <canvas
          ref={colorBarRef}
          width={1400}
          height={40}
          className="w-full rounded border border-border"
          style={{ height: '40px' }}
        />
      </div>

      {/* Histogram Chart */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-border overflow-hidden" style={{ minHeight: '180px' }}>
        <canvas
          ref={canvasRef}
          width={1400}
          height={180}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleCanvasMouseMove}
        />
      </div>

      {/* Window/Level Controls */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1 border border-red-300 dark:border-red-700">
          <div className="text-xs text-text-muted">Min Level</div>
          <div className="font-mono text-sm font-semibold text-red-700 dark:text-red-400">
            {tempMinLevel ?? minLevel}
          </div>
        </div>
        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1 border border-green-300 dark:border-green-700">
          <div className="text-xs text-text-muted">Max Level</div>
          <div className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">
            {tempMaxLevel ?? maxLevel}
          </div>
        </div>
        <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1 border border-purple-300 dark:border-purple-700">
          <div className="text-xs text-text-muted">Window</div>
          <div className="font-mono text-sm font-semibold text-purple-700 dark:text-purple-400">
            {(tempMaxLevel ?? maxLevel) - (tempMinLevel ?? minLevel)}
          </div>
        </div>
        <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1 border border-indigo-300 dark:border-indigo-700">
          <div className="text-xs text-text-muted">Bit Depth</div>
          <div className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-400">
            {contextBitDepth}-bit
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistogramDisplay;
