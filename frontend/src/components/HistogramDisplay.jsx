import React, { useRef, useEffect, useState } from 'react';
import { useHistogram } from '../contexts/HistogramContext';
import { useFormData } from '../contexts/FormDataContext';
import { BarChart3 } from 'lucide-react';
import debugLogger from '../utils/debugLogger';

const HistogramDisplay = () => {
  // Log render
  debugLogger.logRender('HistogramDisplay');

  const { histogramData, selectedPoint, currentChannel, selectionRegion } = useHistogram();
  const { formData } = useFormData();
  const canvasRef = useRef(null);

  // Get bitDepth from initialParameters
  const bitDepth = formData?.initialParameters?.bitDepth || '8-bit';
  const maxIntensity = bitDepth === '16-bit' ? 65535 : 255;

  // Level adjustment state
  const [minLevel, setMinLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(maxIntensity);
  const [isDragging, setIsDragging] = useState(null); // 'min' or 'max' or null

  // Update maxLevel when bitDepth changes
  useEffect(() => {
    setMaxLevel(maxIntensity);
  }, [maxIntensity]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale to canvas coordinates
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const marginLeft = 50;
    const marginBottom = 30;
    const chartWidth = canvasRef.current.width - marginLeft - 10;

    // Check if clicking on min handle
    const minX = marginLeft + (minLevel / maxIntensity) * chartWidth;
    const handleY = canvasRef.current.height - marginBottom + 15;

    if (Math.abs(canvasX - minX) < 10 && Math.abs(canvasY - handleY) < 10) {
      setIsDragging('min');
      return;
    }

    // Check if clicking on max handle
    const maxX = marginLeft + (maxLevel / maxIntensity) * chartWidth;

    if (Math.abs(canvasX - maxX) < 10 && Math.abs(canvasY - handleY) < 10) {
      setIsDragging('max');
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Scale to canvas coordinates
    const scaleX = canvasRef.current.width / rect.width;
    const canvasX = x * scaleX;

    const marginLeft = 50;
    const chartWidth = canvasRef.current.width - marginLeft - 10;

    // Calculate new level value
    const newLevel = Math.round(((canvasX - marginLeft) / chartWidth) * maxIntensity);
    const clampedLevel = Math.max(0, Math.min(maxIntensity, newLevel));

    if (isDragging === 'min') {
      setMinLevel(Math.min(clampedLevel, maxLevel - 1));
    } else if (isDragging === 'max') {
      setMaxLevel(Math.max(clampedLevel, minLevel + 1));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, minLevel, maxLevel, maxIntensity]);

  // Draw histogram chart
  useEffect(() => {
    if (!histogramData || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Always use gray channel
    const data = histogramData['gray'] || histogramData[currentChannel];
    if (!data) return;

    // Margins for axes
    const marginLeft = 50;
    const marginBottom = 30;
    const marginTop = 10;
    const marginRight = 10;
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginBottom - marginTop;

    // Find max value for scaling
    const maxValue = Math.max(...data);

    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;

    // Y-axis (vertical)
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, height - marginBottom);
    ctx.stroke();

    // X-axis (horizontal)
    ctx.beginPath();
    ctx.moveTo(marginLeft, height - marginBottom);
    ctx.lineTo(width - marginRight, height - marginBottom);
    ctx.stroke();

    // Draw Y-axis labels (pixel count)
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = Math.round((maxValue / ySteps) * i);
      const y = height - marginBottom - (chartHeight / ySteps) * i;

      // Format large numbers with comma separator
      const formattedValue = value.toLocaleString();
      ctx.fillText(formattedValue, marginLeft - 5, y);

      // Draw grid lines
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(width - marginRight, y);
      ctx.stroke();
    }

    // Draw X-axis labels (intensity values)
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const xSteps = 8;
    for (let i = 0; i <= xSteps; i++) {
      const value = Math.round((maxIntensity / xSteps) * i);
      const x = marginLeft + (chartWidth / xSteps) * i;
      const formattedValue = value.toLocaleString();
      ctx.fillText(formattedValue, x, height - marginBottom + 5);
    }

    // Draw bars
    const barWidth = chartWidth / data.length;

    // Always use gray color
    ctx.fillStyle = 'rgba(107, 114, 128, 0.7)';

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = marginLeft + index * barWidth;
      const y = height - marginBottom - barHeight;

      ctx.fillRect(x, y, Math.max(barWidth, 1), barHeight);
    });

    // Draw level control lines
    ctx.lineWidth = 2;

    // Min level line (red)
    const minX = marginLeft + (minLevel / maxIntensity) * chartWidth;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.beginPath();
    ctx.moveTo(minX, marginTop);
    ctx.lineTo(minX, height - marginBottom);
    ctx.stroke();

    // Draw handle for min level
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    ctx.arc(minX, height - marginBottom + 15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Max level line (green)
    const maxX = marginLeft + (maxLevel / maxIntensity) * chartWidth;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.beginPath();
    ctx.moveTo(maxX, marginTop);
    ctx.lineTo(maxX, height - marginBottom);
    ctx.stroke();

    // Draw handle for max level
    ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.beginPath();
    ctx.arc(maxX, height - marginBottom + 15, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [histogramData, currentChannel, maxIntensity, minLevel, maxLevel]);

  if (!histogramData || !selectedPoint) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted">
        <BarChart3 size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Select Histogram tool and click on image to see distribution</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* Top - Controls and Info - Horizontal Layout */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {/* Selected Point or Area Info */}
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
              <div className="text-xs text-text-muted">Area {selectionRegion.width}×{selectionRegion.height}px</div>
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
          {!selectionRegion && (
            <>
              <div className="text-xs text-text-muted">Point</div>
              <div className="font-mono text-xs font-semibold text-text">
                ({selectedPoint.x}, {selectedPoint.y})
              </div>
            </>
          )}
        </div>

        {/* Pixel Value - Gray only */}
        <div className="flex gap-1 flex-shrink-0">
          <div className="text-center bg-gray-100 dark:bg-gray-900/20 rounded-lg px-2 py-1">
            <div className="text-xs text-text-muted">Gray Value</div>
            <div className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-400">
              {selectedPoint.pixel.gray || Math.round((selectedPoint.pixel.r + selectedPoint.pixel.g + selectedPoint.pixel.b) / 3)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Histogram Chart */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1024}
          height={128}
          className="w-full h-full object-contain cursor-pointer"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Level Controls Display */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1 border border-red-300 dark:border-red-700">
          <div className="text-xs text-text-muted">Min Level</div>
          <div className="font-mono text-sm font-semibold text-red-700 dark:text-red-400">
            {minLevel}
          </div>
        </div>
        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1 border border-green-300 dark:border-green-700">
          <div className="text-xs text-text-muted">Max Level</div>
          <div className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">
            {maxLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HistogramDisplay);