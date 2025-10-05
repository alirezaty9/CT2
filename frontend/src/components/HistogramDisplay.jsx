import React, { useRef, useEffect } from 'react';
import { useHistogram } from '../contexts/HistogramContext';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const HistogramDisplay = () => {
  const { histogramData, selectedPoint, currentChannel, selectionRegion, changeChannel } = useHistogram();
  const canvasRef = useRef(null);

  // Draw histogram chart
  useEffect(() => {
    if (!histogramData || !currentChannel || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const data = histogramData[currentChannel];
    if (!data) return;

    // Find max value for scaling
    const maxValue = Math.max(...data);

    // Draw bars
    const barWidth = width / 256;
    const colors = {
      red: 'rgba(239, 68, 68, 0.7)',
      green: 'rgba(34, 197, 94, 0.7)',
      blue: 'rgba(59, 130, 246, 0.7)',
      gray: 'rgba(107, 114, 128, 0.7)'
    };

    ctx.fillStyle = colors[currentChannel];

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * height;
      const x = index * barWidth;
      const y = height - barHeight;

      ctx.fillRect(x, y, Math.max(barWidth, 1), barHeight);
    });
  }, [histogramData, currentChannel]);

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

        {/* Pixel Values */}
        <div className="flex gap-1 flex-shrink-0">
          <div className="text-center bg-red-100 dark:bg-red-900/20 rounded-lg px-2 py-1">
            <div className="text-xs text-text-muted">R</div>
            <div className="font-mono text-xs font-semibold text-red-700 dark:text-red-400">
              {selectedPoint.pixel.r}
            </div>
          </div>
          <div className="text-center bg-green-100 dark:bg-green-900/20 rounded-lg px-2 py-1">
            <div className="text-xs text-text-muted">G</div>
            <div className="font-mono text-xs font-semibold text-green-700 dark:text-green-400">
              {selectedPoint.pixel.g}
            </div>
          </div>
          <div className="text-center bg-blue-100 dark:bg-blue-900/20 rounded-lg px-2 py-1">
            <div className="text-xs text-text-muted">B</div>
            <div className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
              {selectedPoint.pixel.b}
            </div>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex gap-1 flex-shrink-0 flex-wrap">
          {[
            { key: 'red', label: 'R', color: 'from-red-500 to-red-600' },
            { key: 'green', label: 'G', color: 'from-green-500 to-green-600' },
            { key: 'blue', label: 'B', color: 'from-blue-500 to-blue-600' },
            { key: 'gray', label: 'Gray', color: 'from-gray-500 to-gray-600' }
          ].map(({ key, label, color }) => (
            <motion.button
              key={key}
              onClick={() => changeChannel(key)}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all duration-300 flex-shrink-0 ${
                currentChannel === key
                  ? `bg-gradient-to-r ${color} text-white shadow-md`
                  : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom - Histogram Chart */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1024}
          height={128}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default HistogramDisplay;