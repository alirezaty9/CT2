import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Zap, Sparkles, X, Check } from 'lucide-react';
import {
  applyGaussianFilter,
  applyMedianFilter,
  applyMeanFilter,
  applySobelEdgeDetection,
  applyLaplacianEdgeDetection,
  applyUnsharpMask,
  applyVarianceFilter,
  applyGammaCorrection,
  equalizeHistogram,
  normalizeHistogram,
  invertImage,
  invertImageSimple,
  applyWindowLevel,
  rotateImage,
  mirrorImage
} from '../utils';

/**
 * Filter Toolbar Component
 * Quick access to apply filters on image
 */
const FilterToolbar = ({ onApplyFilter, currentImageData }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [params, setParams] = useState({
    sigma: 1.5,
    kernelSize: 3,
    amount: 1.5,
    gamma: 1.2,
    windowCenter: 128,
    windowWidth: 100
  });

  const filters = [
    {
      id: 'gaussian',
      name: 'Gaussian',
      icon: '🌀',
      category: 'blur',
      params: ['sigma'],
      apply: (imageData) => applyGaussianFilter(imageData, params.sigma)
    },
    {
      id: 'median',
      name: 'Median',
      icon: '🎯',
      category: 'denoise',
      params: ['kernelSize'],
      apply: (imageData) => applyMedianFilter(imageData, params.kernelSize)
    },
    {
      id: 'mean',
      name: 'Mean',
      icon: '📊',
      category: 'blur',
      params: ['kernelSize'],
      apply: (imageData) => applyMeanFilter(imageData, params.kernelSize)
    },
    {
      id: 'unsharp',
      name: 'Sharpen',
      icon: '✨',
      category: 'enhance',
      params: ['amount', 'sigma'],
      apply: (imageData) => applyUnsharpMask(imageData, params.amount, params.sigma)
    },
    {
      id: 'sobel',
      name: 'Sobel Edge',
      icon: '🔲',
      category: 'edge',
      params: [],
      apply: (imageData) => applySobelEdgeDetection(imageData)
    },
    {
      id: 'laplacian',
      name: 'Laplacian',
      icon: '◇',
      category: 'edge',
      params: [],
      apply: (imageData) => applyLaplacianEdgeDetection(imageData)
    },
    {
      id: 'variance',
      name: 'Variance',
      icon: '📈',
      category: 'enhance',
      params: ['kernelSize'],
      apply: (imageData) => applyVarianceFilter(imageData, params.kernelSize)
    },
    {
      id: 'gamma',
      name: 'Gamma',
      icon: '☀️',
      category: 'adjust',
      params: ['gamma'],
      apply: (imageData) => applyGammaCorrection(imageData, params.gamma)
    },
    {
      id: 'equalize',
      name: 'Equalize',
      icon: '📉',
      category: 'adjust',
      params: [],
      apply: (imageData) => equalizeHistogram(imageData)
    },
    {
      id: 'normalize',
      name: 'Normalize',
      icon: '⚖️',
      category: 'adjust',
      params: [],
      apply: (imageData) => normalizeHistogram(imageData)
    },
    {
      id: 'invert',
      name: 'Invert',
      icon: '🔄',
      category: 'adjust',
      params: [],
      apply: (imageData) => invertImageSimple(imageData)
    },
    {
      id: 'windowLevel',
      name: 'Window/Level',
      icon: '🎚️',
      category: 'adjust',
      params: ['windowCenter', 'windowWidth'],
      apply: (imageData) => applyWindowLevel(imageData, params.windowCenter, params.windowWidth)
    }
  ];

  const paramConfig = {
    sigma: { label: 'Sigma', min: 0.1, max: 5, step: 0.1 },
    kernelSize: { label: 'Kernel', min: 3, max: 9, step: 2 },
    amount: { label: 'Amount', min: 0, max: 3, step: 0.1 },
    gamma: { label: 'Gamma', min: 0.1, max: 3, step: 0.1 },
    windowCenter: { label: 'Center', min: 0, max: 255, step: 1 },
    windowWidth: { label: 'Width', min: 1, max: 255, step: 1 }
  };

  const handleApply = (filter) => {
    if (!currentImageData) {
      alert('No image data available!');
      return;
    }

    try {
      const result = filter.apply(currentImageData);
      if (onApplyFilter) {
        onApplyFilter(result);
      }
      setSelectedFilter(null);
    } catch (error) {
      console.error('Filter application error:', error);
      alert('Error applying filter: ' + error.message);
    }
  };

  const QuickFilterButton = ({ filter }) => (
    <motion.button
      onClick={() => {
        if (filter.params.length === 0) {
          handleApply(filter);
        } else {
          setSelectedFilter(filter);
        }
      }}
      className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      title={filter.name}
    >
      <span className="text-2xl">{filter.icon}</span>
      <span className="text-xs font-medium text-text">{filter.name}</span>
    </motion.button>
  );

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
          showFilters
            ? 'bg-primary text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-text border border-border hover:border-primary'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles size={18} />
        <span>Filters</span>
        {showFilters && <X size={16} />}
      </motion.button>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg border border-border shadow-xl p-4 z-50 min-w-[400px]"
        >
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            Select Filter
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {filters.map((filter) => (
              <QuickFilterButton key={filter.id} filter={filter} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Parameter Dialog */}
      {selectedFilter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <span className="text-2xl">{selectedFilter.icon}</span>
                {selectedFilter.name}
              </h3>
              <button
                onClick={() => setSelectedFilter(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedFilter.params.map((paramName) => {
                const config = paramConfig[paramName];
                return (
                  <div key={paramName} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-text">
                        {config.label}
                      </label>
                      <span className="text-sm font-mono font-bold text-primary">
                        {params[paramName]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={params[paramName]}
                      onChange={(e) =>
                        setParams({ ...params, [paramName]: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={() => setSelectedFilter(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-text rounded-lg font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={() => handleApply(selectedFilter)}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check size={18} />
                Apply Filter
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;
