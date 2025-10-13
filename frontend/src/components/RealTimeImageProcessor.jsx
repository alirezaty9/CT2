import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useImageProcessing } from '../contexts/ImageProcessingContext';
import { Sparkles, RotateCw, FlipHorizontal, FlipVertical, Contrast, Sun, Scissors } from 'lucide-react';
import ImageComparisonViewer from './ImageComparisonViewer';

const RealTimeImageProcessor = () => {
  const { t } = useTranslation();
  const { applyFilter, originalImage } = useImageProcessing();

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [rotation, setRotation] = useState(0);

  // فیلترهای سریع
  const quickFilters = [
    {
      name: 'grayscale',
      label: t('grayscale') || 'Grayscale',
      icon: Contrast,
      action: () => applyFilter('grayscale')
    },
    {
      name: 'invert',
      label: t('invert') || 'Invert',
      icon: Sparkles,
      action: () => applyFilter('invert')
    },
    {
      name: 'histogram',
      label: t('histogramEqualization') || 'Histogram Eq.',
      icon: Sparkles,
      action: () => applyFilter('histogramEqualization')
    },
    {
      name: 'median',
      label: t('medianFilter') || 'Median Filter',
      icon: Sparkles,
      action: () => applyFilter('median', { kernelSize: 3 })
    },
    {
      name: 'gaussian',
      label: t('gaussianFilter') || 'Gaussian Filter',
      icon: Sparkles,
      action: () => applyFilter('gaussian', { sigma: 1.0 })
    },
    {
      name: 'sharpen',
      label: t('sharpening') || 'Sharpen',
      icon: Sparkles,
      action: () => applyFilter('sharpen', { factor: 1 })
    },
    {
      name: 'sobel',
      label: t('sobel') || 'Sobel Edge',
      icon: Sparkles,
      action: () => applyFilter('sobel')
    },
    {
      name: 'threshold',
      label: t('threshold') || 'Threshold',
      icon: Scissors,
      action: () => applyFilter('threshold', { threshold: 128 })
    }
  ];

  // تبدیلات
  const transformations = [
    {
      name: 'rotate90',
      label: '90°',
      icon: RotateCw,
      action: () => {
        setRotation(prev => prev + 90);
        applyFilter('rotation', { angle: 90 });
      }
    },
    {
      name: 'flipH',
      label: t('flipHorizontal') || 'Flip H',
      icon: FlipHorizontal,
      action: () => applyFilter('flipHorizontal')
    },
    {
      name: 'flipV',
      label: t('flipVertical') || 'Flip V',
      icon: FlipVertical,
      action: () => applyFilter('flipVertical')
    }
  ];

  // Handler for brightness change
  const handleBrightnessChange = (value) => {
    setBrightness(value);
  };

  // Handler for contrast change
  const handleContrastChange = (value) => {
    setContrast(value);
  };

  // Apply brightness/contrast
  const applyAdjustments = () => {
    if (brightness !== 0) {
      applyFilter('brightness', { value: brightness });
    }
    if (contrast !== 0) {
      applyFilter('contrast', { value: contrast });
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Viewer */}
      <ImageComparisonViewer />

      {/* Quick Filters */}
      <div className="card p-4 lg:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text dark:text-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t('quickFilters') || 'Quick Filters'}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={filter.action}
              disabled={!originalImage}
              className="p-3 rounded-lg border-2 border-border hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
            >
              <filter.icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-text dark:text-text text-center">
                {filter.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Transformations */}
      <div className="card p-4 lg:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text dark:text-text flex items-center gap-2">
          <RotateCw className="w-5 h-5 text-primary" />
          {t('transformations') || 'Transformations'}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {transformations.map((transform) => (
            <button
              key={transform.name}
              onClick={transform.action}
              disabled={!originalImage}
              className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
            >
              <transform.icon className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-text dark:text-text">
                {transform.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Adjustments */}
      <div className="card p-4 lg:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text dark:text-text flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary" />
          {t('adjustments') || 'Adjustments'}
        </h3>

        <div className="space-y-4">
          {/* Brightness */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text dark:text-text">
                {t('brightness') || 'Brightness'}
              </label>
              <span className="text-sm font-mono font-bold text-primary">
                {brightness > 0 ? '+' : ''}{brightness}
              </span>
            </div>
            <input
              type="range"
              value={brightness}
              onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
              disabled={!originalImage}
              min="-100"
              max="100"
              className="w-full"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text dark:text-text">
                {t('contrast') || 'Contrast'}
              </label>
              <span className="text-sm font-mono font-bold text-primary">
                {contrast > 0 ? '+' : ''}{contrast}
              </span>
            </div>
            <input
              type="range"
              value={contrast}
              onChange={(e) => handleContrastChange(parseInt(e.target.value))}
              disabled={!originalImage}
              min="-100"
              max="100"
              className="w-full"
            />
          </div>

          {/* Apply Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={applyAdjustments}
              disabled={!originalImage || (brightness === 0 && contrast === 0)}
              className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors font-semibold"
            >
              {t('apply') || 'Apply Adjustments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeImageProcessor;
