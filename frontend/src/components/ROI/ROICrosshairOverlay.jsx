/**
 * ROICrosshairOverlay Component
 * High-level wrapper for CrosshairTool with ROI management
 * Implements Requirement #22: Draw two lines passing through ROI center
 *
 * Features:
 * - Automatically detects ROI objects on canvas
 * - Supports multiple simultaneous ROIs with crosshairs
 * - Provides UI controls for crosshair configuration
 * - Integrates seamlessly with BaslerDisplay and other canvas components
 *
 * @module components/ROI/ROICrosshairOverlay
 * @author CT Scanner Development Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Crosshair, Settings, X } from 'lucide-react';
import CrosshairTool from '../Tools/CrosshairTool';

/**
 * Detect ROI objects on Fabric canvas
 * @param {fabric.Canvas} fabricCanvas
 * @returns {Array} Array of ROI definitions with {roi, shape, fabricObject}
 */
const detectROIsOnCanvas = (fabricCanvas) => {
  if (!fabricCanvas) return [];

  const rois = [];
  const objects = fabricCanvas.getObjects();

  objects.forEach(obj => {
    // Skip non-ROI objects
    if (!obj.name || !obj.name.startsWith('roi-')) return;

    let roi = null;
    let shape = null;

    // Detect Rectangle/Square
    if (obj.type === 'rect') {
      roi = {
        x: obj.left,
        y: obj.top,
        width: obj.width * obj.scaleX,
        height: obj.height * obj.scaleY
      };
      shape = 'rectangle';
    }
    // Detect Circle
    else if (obj.type === 'circle') {
      roi = {
        centerX: obj.left + obj.radius * obj.scaleX,
        centerY: obj.top + obj.radius * obj.scaleY,
        radius: obj.radius * obj.scaleX
      };
      shape = 'circle';
    }
    // Detect Ellipse
    else if (obj.type === 'ellipse') {
      roi = {
        centerX: obj.left + obj.rx * obj.scaleX,
        centerY: obj.top + obj.ry * obj.scaleY,
        radiusX: obj.rx * obj.scaleX,
        radiusY: obj.ry * obj.scaleY
      };
      shape = 'ellipse';
    }
    // Detect Polygon
    else if (obj.type === 'polygon') {
      roi = {
        points: obj.points.map(p => ({
          x: p.x * obj.scaleX + obj.left,
          y: p.y * obj.scaleY + obj.top
        }))
      };
      shape = 'polygon';
    }

    if (roi && shape) {
      rois.push({
        roi,
        shape,
        fabricObject: obj,
        id: obj.name
      });
    }
  });

  console.log(`[ROICrosshairOverlay] Detected ${rois.length} ROIs on canvas`);
  return rois;
};

/**
 * ROICrosshairOverlay Component
 */
const ROICrosshairOverlay = ({
  fabricCanvas,
  enabled = false,
  autoDetectROIs = true,
  manualROIs = [],
  defaultConfig = {},
  showControls = true,
  onCrosshairUpdate = null,
  className = ''
}) => {
  const { t } = useTranslation();

  const [crosshairEnabled, setCrosshairEnabled] = useState(enabled);
  const [detectedROIs, setDetectedROIs] = useState([]);
  const [selectedROIId, setSelectedROIId] = useState(null);
  const [crosshairConfig, setCrosshairConfig] = useState({
    color: '#00ff00',
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    opacity: 0.8,
    extendBeyondROI: true,
    showCenter: true,
    centerRadius: 3,
    centerColor: '#ff0000',
    ...defaultConfig
  });

  const crosshairToolsRef = useRef({});
  const canvasUpdateIntervalRef = useRef(null);

  /**
   * Detect ROIs on canvas
   */
  const updateDetectedROIs = useCallback(() => {
    if (!autoDetectROIs || !fabricCanvas) return;

    const rois = detectROIsOnCanvas(fabricCanvas);
    setDetectedROIs(rois);

    // Auto-select first ROI if none selected
    if (rois.length > 0 && !selectedROIId) {
      setSelectedROIId(rois[0].id);
    }
  }, [autoDetectROIs, fabricCanvas, selectedROIId]);

  /**
   * Monitor canvas for ROI changes
   */
  useEffect(() => {
    if (!autoDetectROIs || !fabricCanvas) return;

    // Initial detection
    updateDetectedROIs();

    // Listen to canvas object events
    const handleObjectAdded = () => updateDetectedROIs();
    const handleObjectRemoved = () => updateDetectedROIs();
    const handleObjectModified = () => updateDetectedROIs();

    fabricCanvas.on('object:added', handleObjectAdded);
    fabricCanvas.on('object:removed', handleObjectRemoved);
    fabricCanvas.on('object:modified', handleObjectModified);

    // Periodic update (fallback)
    canvasUpdateIntervalRef.current = setInterval(() => {
      updateDetectedROIs();
    }, 2000);

    return () => {
      fabricCanvas.off('object:added', handleObjectAdded);
      fabricCanvas.off('object:removed', handleObjectRemoved);
      fabricCanvas.off('object:modified', handleObjectModified);

      if (canvasUpdateIntervalRef.current) {
        clearInterval(canvasUpdateIntervalRef.current);
      }
    };
  }, [autoDetectROIs, fabricCanvas, updateDetectedROIs]);

  /**
   * Get current ROIs to display crosshairs for
   */
  const getCurrentROIs = useCallback(() => {
    if (autoDetectROIs) {
      return detectedROIs;
    } else {
      return manualROIs.map((roi, index) => ({
        ...roi,
        id: roi.id || `manual-roi-${index}`
      }));
    }
  }, [autoDetectROIs, detectedROIs, manualROIs]);

  /**
   * Toggle crosshair
   */
  const toggleCrosshair = useCallback(() => {
    setCrosshairEnabled(prev => !prev);
  }, []);

  /**
   * Update config
   */
  const updateConfig = useCallback((newConfig) => {
    setCrosshairConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Handle crosshair update callback
   */
  const handleCrosshairUpdate = useCallback((roiId, updateData) => {
    if (onCrosshairUpdate) {
      onCrosshairUpdate({
        roiId,
        ...updateData
      });
    }
  }, [onCrosshairUpdate]);

  const currentROIs = getCurrentROIs();
  const selectedROI = currentROIs.find(r => r.id === selectedROIId);

  return (
    <div className={`roi-crosshair-overlay ${className}`}>
      {/* Crosshair Tools - One per ROI */}
      {currentROIs.map((roiData) => (
        <CrosshairTool
          key={roiData.id}
          fabricCanvas={fabricCanvas}
          roi={roiData.roi}
          roiShape={roiData.shape}
          enabled={crosshairEnabled && (selectedROIId === roiData.id || !selectedROIId)}
          config={crosshairConfig}
          onCrosshairUpdate={(data) => handleCrosshairUpdate(roiData.id, data)}
        />
      ))}

      {/* Control Panel */}
      {showControls && (
        <div className="card p-4 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-text dark:text-text">
                {t('roiCrosshair') || 'ROI Crosshair'}
              </h3>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                {t('requirement22') || 'Req #22'}
              </span>
            </div>
            <button
              onClick={toggleCrosshair}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                crosshairEnabled
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>{crosshairEnabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}</span>
            </button>
          </div>

          {/* ROI Selector */}
          {currentROIs.length > 1 && (
            <div className="mb-4">
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('selectROI') || 'Select ROI'}
              </label>
              <select
                value={selectedROIId || ''}
                onChange={(e) => setSelectedROIId(e.target.value)}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary"
              >
                <option value="">{t('allROIs') || 'All ROIs'}</option>
                {currentROIs.map((roiData) => (
                  <option key={roiData.id} value={roiData.id}>
                    {roiData.id} ({roiData.shape})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {currentROIs.length === 0 ? (
                <>
                  <strong>{t('noROIsDetected') || 'No ROIs detected'}</strong>
                  <br />
                  {t('drawROIOnCanvas') || 'Draw a rectangle, circle, or other shape on the canvas to create an ROI.'}
                </>
              ) : (
                <>
                  <strong>{t('detectedROIs', { count: currentROIs.length }) || `Detected ${currentROIs.length} ROI(s)`}</strong>
                  <br />
                  {t('crosshairInfo') || 'Crosshair lines will be drawn through the center of each ROI.'}
                </>
              )}
            </p>
          </div>

          {/* Settings (only when enabled) */}
          {crosshairEnabled && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Color */}
              <div>
                <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                  {t('lineColor') || 'Line Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={crosshairConfig.color}
                    onChange={(e) => updateConfig({ color: e.target.value })}
                    className="w-12 h-8 rounded cursor-pointer border border-border"
                  />
                  <span className="text-sm font-mono text-text-muted">{crosshairConfig.color}</span>
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                  <span>{t('lineWidth') || 'Line Width'}</span>
                  <span className="font-mono text-primary">{crosshairConfig.strokeWidth}px</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={crosshairConfig.strokeWidth}
                  onChange={(e) => updateConfig({ strokeWidth: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                  <span>{t('opacity') || 'Opacity'}</span>
                  <span className="font-mono text-primary">{(crosshairConfig.opacity * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={crosshairConfig.opacity}
                  onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Extend Beyond ROI */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text dark:text-text">
                  {t('extendBeyondROI') || 'Extend Beyond ROI'}
                </span>
                <button
                  onClick={() => updateConfig({ extendBeyondROI: !crosshairConfig.extendBeyondROI })}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    crosshairConfig.extendBeyondROI
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {crosshairConfig.extendBeyondROI ? (t('yes') || 'Yes') : (t('no') || 'No')}
                </button>
              </div>

              {/* Show Center Marker */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text dark:text-text">
                  {t('showCenterMarker') || 'Show Center Marker'}
                </span>
                <button
                  onClick={() => updateConfig({ showCenter: !crosshairConfig.showCenter })}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    crosshairConfig.showCenter
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {crosshairConfig.showCenter ? (t('yes') || 'Yes') : (t('no') || 'No')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ROICrosshairOverlay.propTypes = {
  fabricCanvas: PropTypes.object,
  enabled: PropTypes.bool,
  autoDetectROIs: PropTypes.bool,
  manualROIs: PropTypes.arrayOf(PropTypes.shape({
    roi: PropTypes.object.isRequired,
    shape: PropTypes.string.isRequired,
    id: PropTypes.string
  })),
  defaultConfig: PropTypes.object,
  showControls: PropTypes.bool,
  onCrosshairUpdate: PropTypes.func,
  className: PropTypes.string
};

export default ROICrosshairOverlay;
