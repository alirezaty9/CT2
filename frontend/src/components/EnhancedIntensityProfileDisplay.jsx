import React, { useState, useMemo } from 'react';
import { useIntensityProfile } from '../contexts/IntensityProfileContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Activity, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Enhanced Intensity Profile Display with Chart.js
 * Replaces canvas-based charts with Chart.js for better performance and features
 */
const EnhancedIntensityProfileDisplay = () => {
  const { profiles, activeProfileId, getActiveProfile, removeProfile } = useIntensityProfile();
  const [showChannel, setShowChannel] = useState('intensity'); // 'intensity', 'red', 'green', 'blue'
  const [profileView, setProfileView] = useState('horizontal'); // 'horizontal', 'vertical' (for rectangle)

  const activeProfile = getActiveProfile();

  // Prepare Chart.js data for line/parallel-lines profiles
  const lineChartData = useMemo(() => {
    if (!activeProfile || (activeProfile.type !== 'line' && activeProfile.type !== 'parallel-lines')) {
      return null;
    }

    const data = activeProfile.data;
    if (!data || data.length === 0) return null;

    // Get values based on selected channel
    const values = data.map(point => {
      switch (showChannel) {
        case 'red': return point.r;
        case 'green': return point.g;
        case 'blue': return point.b;
        default: return point.intensity;
      }
    });

    const labels = data.map((_, index) => index);

    // Color mapping
    const colors = {
      intensity: { bg: 'rgba(100, 100, 100, 0.2)', border: 'rgba(100, 100, 100, 1)' },
      red: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 1)' },
      green: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 1)' },
      blue: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 1)' }
    };

    return {
      labels,
      datasets: [{
        label: showChannel === 'intensity' ? 'Intensity' : showChannel.toUpperCase(),
        data: values,
        backgroundColor: colors[showChannel].bg,
        borderColor: colors[showChannel].border,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.1
      }]
    };
  }, [activeProfile, showChannel]);

  // Prepare Chart.js data for rectangle profiles
  const rectangleChartData = useMemo(() => {
    if (!activeProfile || activeProfile.type !== 'rectangle') {
      return null;
    }

    const profileData = profileView === 'horizontal'
      ? activeProfile.data.horizontalProfile
      : activeProfile.data.verticalProfile;

    if (!profileData || profileData.length === 0) return null;

    // Get values based on selected channel
    const values = profileData.map(point => {
      switch (showChannel) {
        case 'red': return point.r;
        case 'green': return point.g;
        case 'blue': return point.b;
        default: return point.intensity;
      }
    });

    const labels = profileData.map(point => point.position);

    // Color mapping
    const colors = {
      intensity: { bg: 'rgba(100, 100, 100, 0.2)', border: 'rgba(100, 100, 100, 1)' },
      red: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 1)' },
      green: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 1)' },
      blue: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 1)' }
    };

    return {
      labels,
      datasets: [{
        label: `${profileView === 'horizontal' ? 'Horizontal' : 'Vertical'} Profile`,
        data: values,
        backgroundColor: colors[showChannel].bg,
        borderColor: colors[showChannel].border,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.1
      }]
    };
  }, [activeProfile, showChannel, profileView]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (context) => `Position: ${context[0].label}`,
          label: (context) => `Value: ${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Position',
          color: '#6b7280',
          font: { size: 10, weight: 'bold' }
        },
        grid: { display: false },
        ticks: {
          maxTicksLimit: 10,
          color: '#6b7280',
          font: { size: 9 }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Intensity',
          color: '#6b7280',
          font: { size: 10, weight: 'bold' }
        },
        grid: { color: 'rgba(229, 231, 235, 0.5)' },
        ticks: {
          color: '#6b7280',
          font: { size: 9 }
        }
      }
    },
    animation: { duration: 300 }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!activeProfile) return;

    let csvContent = '';

    if (activeProfile.type === 'line' || activeProfile.type === 'parallel-lines') {
      csvContent = 'Distance,X,Y,Red,Green,Blue,Intensity\n';
      activeProfile.data.forEach(point => {
        csvContent += `${point.distance.toFixed(2)},${point.x},${point.y},${point.r},${point.g},${point.b},${point.intensity.toFixed(2)}\n`;
      });

      if (activeProfile.type === 'parallel-lines') {
        csvContent += `\n--- Metadata ---\n`;
        csvContent += `Spacing,${activeProfile.spacing}\n`;
        csvContent += `Length,${activeProfile.length.toFixed(2)}\n`;
      }
    } else if (activeProfile.type === 'rectangle') {
      // Export horizontal profile
      csvContent = 'Position,Red,Green,Blue,Intensity\n';
      csvContent += '--- Horizontal Profile ---\n';
      activeProfile.data.horizontalProfile.forEach(point => {
        csvContent += `${point.position},${point.r.toFixed(2)},${point.g.toFixed(2)},${point.b.toFixed(2)},${point.intensity.toFixed(2)}\n`;
      });

      csvContent += '\n--- Vertical Profile ---\n';
      csvContent += 'Position,Red,Green,Blue,Intensity\n';
      activeProfile.data.verticalProfile.forEach(point => {
        csvContent += `${point.position},${point.r.toFixed(2)},${point.g.toFixed(2)},${point.b.toFixed(2)},${point.intensity.toFixed(2)}\n`;
      });

      // Add statistics
      const stats = activeProfile.data.statistics;
      csvContent += '\n--- Statistics ---\n';
      csvContent += `Mean,${stats.mean.toFixed(2)}\n`;
      csvContent += `Median,${stats.median.toFixed(2)}\n`;
      csvContent += `Min,${stats.min.toFixed(2)}\n`;
      csvContent += `Max,${stats.max.toFixed(2)}\n`;
      csvContent += `Std Dev,${stats.stdDev.toFixed(2)}\n`;
      csvContent += `Pixel Count,${stats.pixelCount}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intensity-profile-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeProfile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted">
        <Activity size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Select Intensity Profile tool and draw a region</p>
      </div>
    );
  }

  const chartData = activeProfile.type === 'rectangle' ? rectangleChartData : lineChartData;

  return (
    <div className="h-full flex flex-col gap-1.5 overflow-hidden">
      {/* Top - Controls and Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        {/* Profile Type */}
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-green-500" />
          <span className="text-xs font-semibold text-text">
            {activeProfile.type === 'line' ? 'Line' : activeProfile.type === 'parallel-lines' ? 'Parallel Lines' : 'Rectangle'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={exportToCSV}
            className="p-1.5 rounded-lg bg-background-secondary hover:bg-accent border border-border hover:border-green-500 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Export to CSV"
          >
            <Download size={12} className="text-green-500" />
          </motion.button>
          <motion.button
            onClick={() => removeProfile(activeProfile.id)}
            className="p-1.5 rounded-lg bg-background-secondary hover:bg-accent border border-border hover:border-red-500 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Delete Profile"
          >
            <Trash2 size={12} className="text-red-500" />
          </motion.button>
        </div>
      </div>

      {/* Channel and View Selectors */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {/* Channel Selector */}
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'intensity', label: 'Gray', color: 'from-gray-500 to-gray-600' },
            { key: 'red', label: 'R', color: 'from-red-500 to-red-600' },
            { key: 'green', label: 'G', color: 'from-green-500 to-green-600' },
            { key: 'blue', label: 'B', color: 'from-blue-500 to-blue-600' }
          ].map(({ key, label, color }) => (
            <motion.button
              key={key}
              onClick={() => setShowChannel(key)}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all duration-300 flex-shrink-0 ${
                showChannel === key
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

        {/* Profile View Selector (for rectangle) */}
        {activeProfile.type === 'rectangle' && (
          <div className="flex gap-1">
            {[
              { key: 'horizontal', label: 'H' },
              { key: 'vertical', label: 'V' }
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => setProfileView(key)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all duration-300 ${
                  profileView === key
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-border p-2 overflow-hidden">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-text-muted">
            No data available
          </div>
        )}
      </div>

      {/* Statistics (for rectangle) */}
      {activeProfile.type === 'rectangle' && activeProfile.data.statistics && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 text-xs flex-shrink-0">
          {Object.entries(activeProfile.data.statistics).map(([key, value]) => (
            <div key={key} className="bg-background-secondary dark:bg-background-primary rounded px-1 py-1 border border-border">
              <div className="text-text-muted capitalize truncate text-xs">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="font-mono font-semibold text-text text-xs">
                {typeof value === 'number' ? value.toFixed(1) : value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedIntensityProfileDisplay;
