import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useHistogram } from '../contexts/HistogramContext';
import { useFormData } from '../contexts/FormDataContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  calculateStatistics,
  calculateAllMetrics,
  exportHistogramToCSV
} from '../utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Enhanced Histogram Display with Chart.js
 * با استفاده از کتابخانه‌های جدید
 */
const EnhancedHistogramDisplay = () => {
  const { histogramData, selectedPoint, currentChannel, selectionRegion } = useHistogram();
  const { formData } = useFormData();

  // Get bitDepth from initialParameters
  const bitDepth = formData?.initialParameters?.bitDepth || '8-bit';
  const maxIntensity = bitDepth === '16-bit' ? 65535 : 255;

  // Level adjustment state
  const [minLevel, setMinLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(maxIntensity);
  const [showStats, setShowStats] = useState(true);

  // Update maxLevel when bitDepth changes
  useEffect(() => {
    setMaxLevel(maxIntensity);
  }, [maxIntensity]);

  // Calculate statistics from histogram
  const statistics = useMemo(() => {
    if (!histogramData || !histogramData['gray']) return null;

    const data = histogramData['gray'];

    // Convert histogram to pixel array for statistics
    const pixelArray = [];
    data.forEach((count, intensity) => {
      for (let i = 0; i < count; i++) {
        pixelArray.push(intensity);
      }
    });

    if (pixelArray.length === 0) return null;

    return calculateStatistics(pixelArray);
  }, [histogramData]);

  // Prepare Chart.js data
  const chartData = useMemo(() => {
    if (!histogramData || !histogramData['gray']) {
      return null;
    }

    const data = histogramData['gray'];
    const labels = Array.from({ length: data.length }, (_, i) => i);

    // Apply level adjustment
    const processedData = data.map((value, index) => {
      if (index < minLevel || index > maxLevel) {
        return 0;
      }
      return value;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Intensity Distribution',
          data: processedData,
          backgroundColor: 'rgba(107, 114, 128, 0.7)',
          borderColor: 'rgba(75, 85, 99, 1)',
          borderWidth: 0,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        }
      ]
    };
  }, [histogramData, minLevel, maxLevel]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => `Intensity: ${context[0].label}`,
          label: (context) => `Count: ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Intensity Value',
          color: '#6b7280',
          font: {
            size: 11,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 10,
          color: '#6b7280',
          font: {
            size: 10
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Pixel Count',
          color: '#6b7280',
          font: {
            size: 11,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10
          },
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    },
    animation: {
      duration: 300
    }
  };

  // Handle level slider changes
  const handleMinLevelChange = (e) => {
    const value = parseInt(e.target.value);
    setMinLevel(Math.min(value, maxLevel - 1));
  };

  const handleMaxLevelChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxLevel(Math.max(value, minLevel + 1));
  };

  // Export histogram
  const handleExport = () => {
    if (!histogramData || !histogramData['gray']) return;

    const metadata = {
      bitDepth,
      maxIntensity,
      minLevel,
      maxLevel,
      timestamp: new Date().toISOString(),
      ...statistics
    };

    exportHistogramToCSV(histogramData['gray'], 'histogram.csv', metadata);
  };

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
      {/* Top - Controls and Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        {/* Selected Point Info */}
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
        </div>

        {/* Gray Value */}
        <div className="text-center bg-gray-100 dark:bg-gray-900/20 rounded-lg px-2 py-1">
          <div className="text-xs text-text-muted">Gray Value</div>
          <div className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-400">
            {selectedPoint.pixel.gray || Math.round((selectedPoint.pixel.r + selectedPoint.pixel.g + selectedPoint.pixel.b) / 3)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 rounded-lg bg-background-secondary hover:bg-accent border border-border transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle Statistics"
          >
            <TrendingUp size={14} className="text-primary" />
          </motion.button>

          <motion.button
            onClick={handleExport}
            className="p-1.5 rounded-lg bg-background-secondary hover:bg-accent border border-border hover:border-green-500 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Export to CSV"
          >
            <Download size={14} className="text-green-500" />
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-border p-2">
        {chartData ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-text-muted">
            No data available
          </div>
        )}
      </div>

      {/* Level Controls */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1 border border-red-300 dark:border-red-700">
          <div className="text-xs text-text-muted mb-1">Min Level</div>
          <input
            type="range"
            min="0"
            max={maxIntensity}
            value={minLevel}
            onChange={handleMinLevelChange}
            className="w-full"
          />
          <div className="font-mono text-sm font-semibold text-red-700 dark:text-red-400 text-center">
            {minLevel}
          </div>
        </div>

        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1 border border-green-300 dark:border-green-700">
          <div className="text-xs text-text-muted mb-1">Max Level</div>
          <input
            type="range"
            min="0"
            max={maxIntensity}
            value={maxLevel}
            onChange={handleMaxLevelChange}
            className="w-full"
          />
          <div className="font-mono text-sm font-semibold text-green-700 dark:text-green-400 text-center">
            {maxLevel}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {showStats && statistics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-3 gap-1 text-xs flex-shrink-0"
        >
          <div className="bg-background-secondary dark:bg-background-primary rounded px-2 py-1 border border-border">
            <div className="text-text-muted">Mean</div>
            <div className="font-mono font-semibold text-text">{statistics.mean.toFixed(2)}</div>
          </div>
          <div className="bg-background-secondary dark:bg-background-primary rounded px-2 py-1 border border-border">
            <div className="text-text-muted">Std Dev</div>
            <div className="font-mono font-semibold text-text">{statistics.stdDev.toFixed(2)}</div>
          </div>
          <div className="bg-background-secondary dark:bg-background-primary rounded px-2 py-1 border border-border">
            <div className="text-text-muted">Median</div>
            <div className="font-mono font-semibold text-text">{statistics.median.toFixed(2)}</div>
          </div>
          <div className="bg-background-secondary dark:bg-background-primary rounded px-2 py-1 border border-border">
            <div className="text-text-muted">Min</div>
            <div className="font-mono font-semibold text-text">{statistics.min}</div>
          </div>
          <div className="bg-background-secondary dark:bg-background-primary rounded px-2 py-1 border border-border">
            <div className="text-text-muted">Max</div>
            <div className="font-mono font-semibold text-text">{statistics.max}</div>
          </div>
          <div className="bg-background-secondary dark:bg-background-primary rounded px-2 py-1 border border-border">
            <div className="text-text-muted">Count</div>
            <div className="font-mono font-semibold text-text">{statistics.count.toLocaleString()}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedHistogramDisplay;
