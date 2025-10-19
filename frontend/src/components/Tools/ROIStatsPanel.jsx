/**
 * ROI Statistics Panel - Requirements #28-31
 * Displays real-time statistics for selected ROI regions
 *
 * Features:
 * - Auto-detect ROIs on canvas (rectangle, circle)
 * - Calculate and display statistics when ROI is selected
 * - Requirement #28: Average Gray Value
 * - Requirement #29: Min/Max Gray Values
 * - Requirement #30: ROI Area
 * - Requirement #31: Pixel Count
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  X,
  Square,
  Circle as CircleIcon,
  TrendingUp,
  TrendingDown,
  Hash,
  Maximize2
} from 'lucide-react';
import { analyzeROI } from '../../utils/roi/roiAnalysis';
import { fabric } from 'fabric';

/**
 * Detect ROI objects on Fabric.js canvas
 */
const detectROIsOnCanvas = (canvas) => {
  if (!canvas) return [];

  const objects = canvas.getObjects();
  console.log(`📊 detectROIsOnCanvas: Found ${objects.length} object(s) on canvas`);

  const rois = [];

  objects.forEach((obj, index) => {
    console.log(`  Object ${index}: type=${obj.type}, width=${obj.width}, height=${obj.height}`);

    // Detect rectangles
    if (obj.type === 'rect') {
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      const width = Math.round(obj.width * scaleX);
      const height = Math.round(obj.height * scaleY);

      rois.push({
        id: obj.name || `roi-rect-${index}`,
        type: 'rectangle',
        shape: 'rectangle',
        object: obj,
        bounds: {
          x: Math.round(obj.left),
          y: Math.round(obj.top),
          width: width,
          height: height
        }
      });
    }
    // Detect circles
    else if (obj.type === 'circle') {
      const scale = obj.scaleX || 1;
      const radius = Math.round(obj.radius * scale);

      rois.push({
        id: obj.name || `roi-circle-${index}`,
        type: 'circle',
        shape: 'circle',
        object: obj,
        bounds: {
          centerX: Math.round(obj.left + obj.radius * scale),
          centerY: Math.round(obj.top + obj.radius * scale),
          radius: radius
        }
      });
    }
  });

  return rois;
};

/**
 * Get ImageData from canvas for ROI analysis
 */
const getCanvasImageData = (canvas) => {
  if (!canvas) return null;

  try {
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (error) {
    console.error('Error getting canvas ImageData:', error);
    return null;
  }
};

const ROIStatsPanel = ({ canvas, isActive, onClose }) => {
  const { t } = useTranslation();
  const [rois, setRois] = useState([]);
  const [selectedROI, setSelectedROI] = useState(null);
  const [stats, setStats] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Detect ROIs on canvas
  const updateROIs = useCallback(() => {
    if (!canvas) {
      console.log('❌ ROIStatsPanel: No canvas available');
      return;
    }

    const detectedROIs = detectROIsOnCanvas(canvas);
    console.log(`🔍 ROIStatsPanel: Detected ${detectedROIs.length} ROI(s)`, detectedROIs);
    setRois(detectedROIs);

    // If we had a selected ROI, try to keep it selected
    if (selectedROI) {
      const stillExists = detectedROIs.find(roi => roi.id === selectedROI.id);
      if (!stillExists) {
        setSelectedROI(null);
        setStats(null);
      }
    }
  }, [canvas, selectedROI]);

  // Calculate statistics for selected ROI
  const calculateStats = useCallback(async (roi) => {
    if (!canvas || !roi) return;

    setIsCalculating(true);

    try {
      // Get image data from canvas
      const imageData = getCanvasImageData(canvas.lowerCanvasEl);

      if (!imageData) {
        console.error('Failed to get image data from canvas');
        setIsCalculating(false);
        return;
      }

      // Analyze ROI
      const result = analyzeROI(imageData, roi.bounds, roi.shape, {
        channel: 'gray',
        calculateMetrics: false // We only need basic stats for now
      });

      setStats(result);
    } catch (error) {
      console.error('Error calculating ROI statistics:', error);
      setStats(null);
    } finally {
      setIsCalculating(false);
    }
  }, [canvas]);

  // Handle ROI selection
  const handleROISelect = useCallback((roi) => {
    setSelectedROI(roi);
    calculateStats(roi);

    // Highlight the selected ROI on canvas
    if (canvas && roi.object) {
      canvas.setActiveObject(roi.object);
      canvas.renderAll();
    }
  }, [calculateStats, canvas]);

  // Listen to canvas events
  useEffect(() => {
    if (!canvas || !isActive) return;

    updateROIs();

    const handleObjectAdded = () => updateROIs();
    const handleObjectRemoved = () => updateROIs();
    const handleObjectModified = () => {
      updateROIs();
      if (selectedROI) {
        calculateStats(selectedROI);
      }
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleObjectModified);
    canvas.on('selection:updated', handleObjectModified);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleObjectModified);
      canvas.off('selection:updated', handleObjectModified);
    };
  }, [canvas, isActive, updateROIs, selectedROI, calculateStats]);

  // Listen for roiAdded event to auto-select newly drawn ROIs
  useEffect(() => {
    const handleROIAdded = () => {
      console.log('📡 ROIStatsPanel received roiAdded event');
      // Update ROIs list
      updateROIs();

      // Auto-select the last added ROI after a short delay
      setTimeout(() => {
        const updatedROIs = detectROIsOnCanvas(canvas);
        if (updatedROIs.length > 0) {
          const latestROI = updatedROIs[updatedROIs.length - 1];
          console.log('🎯 Auto-selecting latest ROI:', latestROI.id);
          handleROISelect(latestROI);
        }
      }, 100);
    };

    window.addEventListener('roiAdded', handleROIAdded);

    return () => {
      window.removeEventListener('roiAdded', handleROIAdded);
    };
  }, [canvas, updateROIs, handleROISelect]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-80 h-[600px] bg-background-secondary border border-border rounded-xl shadow-lg overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary-dark/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text">
            {t('roiStatistics')}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-background-primary/50 transition-colors"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* ROI Selector */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">
            {t('selectROI')}
          </label>

          {rois.length === 0 ? (
            <div className="text-sm text-text-muted italic p-3 bg-background-primary rounded-lg space-y-2">
              <p>{t('noROIsDetected')}</p>
              <p className="text-xs pt-2 border-t border-border">
                💡 Press <kbd className="px-2 py-1 bg-background-secondary rounded font-mono text-xs">R</kbd> to draw a rectangle ROI
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rois.map((roi, index) => (
                <motion.button
                  key={roi.id}
                  onClick={() => handleROISelect(roi)}
                  className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    selectedROI?.id === roi.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background-primary border-border hover:border-primary/50 text-text'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {roi.type === 'rectangle' ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <CircleIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {t(roi.type)} #{index + 1}
                  </span>
                </motion.button>
              ))}

              {/* Clear All ROIs button */}
              <button
                onClick={() => {
                  if (!canvas) return;
                  // Remove all ROIs
                  const objects = canvas.getObjects();
                  objects.forEach(obj => {
                    if (obj.type === 'rect' || obj.type === 'circle') {
                      canvas.remove(obj);
                    }
                  });
                  canvas.renderAll();
                  setSelectedROI(null);
                  setStats(null);
                  updateROIs();
                }}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium mt-2"
              >
                🗑️ Clear All ROIs
              </button>
            </div>
          )}
        </div>

        {/* Statistics Display */}
        <AnimatePresence mode="wait">
          {selectedROI && stats && !isCalculating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-3"
            >
              {/* Requirement #28: Average Gray Value */}
              <div className="p-3 bg-background-primary rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-text-muted">
                      {t('averageGrayValue')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text">
                    {stats.statistics.mean.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Requirement #29: Min/Max Gray Values */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-background-primary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-text-muted">
                      {t('minGrayValue')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text">
                    {stats.statistics.min}
                  </span>
                </div>

                <div className="p-3 bg-background-primary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-text-muted">
                      {t('maxGrayValue')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text">
                    {stats.statistics.max}
                  </span>
                </div>
              </div>

              {/* Requirement #30: ROI Area */}
              <div className="p-3 bg-background-primary rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-text-muted">
                      {t('roiArea')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text">
                    {Math.round(stats.area)} {t('pixels')}²
                  </span>
                </div>
              </div>

              {/* Requirement #31: Pixel Count */}
              <div className="p-3 bg-background-primary rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium text-text-muted">
                      {t('pixelCount')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text">
                    {stats.pixelCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Standard Deviation - Main Display */}
              <div className="p-3 bg-background-primary rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-medium text-text-muted">
                      {t('standardDeviation')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text">
                    {stats.statistics.stdDev.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Additional Stats - Median */}
              <div className="p-3 bg-gradient-to-r from-primary/5 to-primary-dark/5 rounded-lg border border-primary/20">
                <div className="text-xs text-text-muted">
                  <div className="flex justify-between">
                    <span>{t('median')}:</span>
                    <span className="font-mono">{stats.statistics.median.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {isCalculating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-8"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Text */}
        <div className="text-xs text-text-muted italic p-3 bg-background-primary rounded-lg">
          {t('roiStatsDescription')}
        </div>
      </div>
    </motion.div>
  );
};

export default ROIStatsPanel;
