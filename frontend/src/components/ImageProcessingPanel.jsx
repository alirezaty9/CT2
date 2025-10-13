import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Zap,
  Filter,
  Contrast,
  Sun,
  Layers,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Image Processing Panel
 * Provides UI for all image processing operations
 */
const ImageProcessingPanel = ({ onApplyFilter, onApplyTransform }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [filterParams, setFilterParams] = useState({});

  const categories = [
    {
      id: 'filters',
      name: 'Filters',
      icon: Filter,
      items: [
        {
          id: 'gaussian',
          name: 'Gaussian Blur',
          params: [{ name: 'sigma', label: 'Sigma', min: 0.1, max: 5, default: 1, step: 0.1 }]
        },
        {
          id: 'median',
          name: 'Median Filter',
          params: [{ name: 'kernelSize', label: 'Kernel Size', min: 3, max: 9, default: 3, step: 2 }]
        },
        {
          id: 'mean',
          name: 'Mean Filter',
          params: [{ name: 'kernelSize', label: 'Kernel Size', min: 3, max: 9, default: 3, step: 2 }]
        },
        {
          id: 'unsharp',
          name: 'Sharpen',
          params: [
            { name: 'amount', label: 'Amount', min: 0, max: 2, default: 1, step: 0.1 },
            { name: 'sigma', label: 'Sigma', min: 0.1, max: 5, default: 1, step: 0.1 }
          ]
        },
        {
          id: 'variance',
          name: 'Variance Filter',
          params: [{ name: 'kernelSize', label: 'Kernel Size', min: 3, max: 9, default: 3, step: 2 }]
        }
      ]
    },
    {
      id: 'edges',
      name: 'Edge Detection',
      icon: Activity,
      items: [
        { id: 'sobel', name: 'Sobel', params: [] },
        { id: 'laplacian', name: 'Laplacian', params: [] }
      ]
    },
    {
      id: 'transforms',
      name: 'Transformations',
      icon: Sliders,
      items: [
        {
          id: 'gamma',
          name: 'Gamma Correction',
          params: [{ name: 'gamma', label: 'Gamma', min: 0.1, max: 3, default: 1, step: 0.1 }]
        },
        {
          id: 'normalize',
          name: 'Normalize',
          params: []
        },
        {
          id: 'equalize',
          name: 'Histogram Equalization',
          params: []
        },
        {
          id: 'invert',
          name: 'Invert (Log)',
          params: [{ name: 'maxIntensity', label: 'Max Intensity', min: 1, max: 65535, default: 255, step: 1 }]
        },
        {
          id: 'invertSimple',
          name: 'Invert (Simple)',
          params: []
        },
        {
          id: 'windowLevel',
          name: 'Window/Level',
          params: [
            { name: 'center', label: 'Center', min: 0, max: 255, default: 128, step: 1 },
            { name: 'width', label: 'Width', min: 1, max: 255, default: 128, step: 1 }
          ]
        }
      ]
    },
    {
      id: 'fft',
      name: 'Frequency Domain',
      icon: Zap,
      items: [
        { id: 'fft', name: 'Show FFT', params: [] },
        {
          id: 'lowpass',
          name: 'Low-Pass Filter',
          params: [{ name: 'cutoff', label: 'Cutoff Radius', min: 1, max: 100, default: 30, step: 1 }]
        },
        {
          id: 'highpass',
          name: 'High-Pass Filter',
          params: [{ name: 'cutoff', label: 'Cutoff Radius', min: 1, max: 100, default: 30, step: 1 }]
        },
        {
          id: 'bandpass',
          name: 'Band-Pass Filter',
          params: [
            { name: 'lowCutoff', label: 'Low Cutoff', min: 1, max: 100, default: 10, step: 1 },
            { name: 'highCutoff', label: 'High Cutoff', min: 1, max: 100, default: 50, step: 1 }
          ]
        }
      ]
    },
    {
      id: 'geometric',
      name: 'Geometric',
      icon: Layers,
      items: [
        {
          id: 'rotate',
          name: 'Rotate',
          params: [{ name: 'angle', label: 'Angle', type: 'select', options: [90, 180, 270], default: 90 }]
        },
        {
          id: 'mirror',
          name: 'Mirror',
          params: [{ name: 'direction', label: 'Direction', type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' }]
        },
        {
          id: 'binning',
          name: 'Pixel Binning',
          params: [{ name: 'binSize', label: 'Bin Size', type: 'select', options: [2, 3, 4], default: 2 }]
        }
      ]
    }
  ];

  const toggleCategory = (categoryId) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  const handleParamChange = (filterId, paramName, value) => {
    setFilterParams(prev => ({
      ...prev,
      [filterId]: {
        ...prev[filterId],
        [paramName]: parseFloat(value) || value
      }
    }));
  };

  const applyOperation = (item) => {
    const params = filterParams[item.id] || {};

    // Set default values for missing params
    item.params?.forEach(param => {
      if (params[param.name] === undefined) {
        params[param.name] = param.default;
      }
    });

    if (onApplyFilter) {
      onApplyFilter(item.id, params);
    }
  };

  return (
    <div className="bg-background-secondary dark:bg-background-primary rounded-lg border border-border p-3 max-h-[600px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-text">Image Processing</h3>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <div key={category.id} className="border border-border rounded-lg overflow-hidden">
              {/* Category Header */}
              <motion.button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2 bg-accent dark:bg-background-secondary hover:bg-primary/10 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-text">{category.name}</span>
                </div>
                {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </motion.button>

              {/* Category Items */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-background-primary dark:bg-background-secondary"
                  >
                    <div className="p-2 space-y-2">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className="border border-border rounded p-2 bg-white dark:bg-background-primary"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text">{item.name}</span>
                            <motion.button
                              onClick={() => applyOperation(item)}
                              className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Apply
                            </motion.button>
                          </div>

                          {/* Parameters */}
                          {item.params && item.params.length > 0 && (
                            <div className="space-y-2">
                              {item.params.map((param) => (
                                <div key={param.name} className="space-y-1">
                                  <label className="text-xs text-text-muted flex justify-between">
                                    <span>{param.label}</span>
                                    <span className="font-mono">
                                      {filterParams[item.id]?.[param.name] || param.default}
                                    </span>
                                  </label>

                                  {param.type === 'select' ? (
                                    <select
                                      value={filterParams[item.id]?.[param.name] || param.default}
                                      onChange={(e) => handleParamChange(item.id, param.name, e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background-secondary dark:bg-background-primary text-text"
                                    >
                                      {param.options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="range"
                                      min={param.min}
                                      max={param.max}
                                      step={param.step}
                                      value={filterParams[item.id]?.[param.name] || param.default}
                                      onChange={(e) => handleParamChange(item.id, param.name, e.target.value)}
                                      className="w-full"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageProcessingPanel;
