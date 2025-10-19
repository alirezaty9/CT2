/**
 * CrosshairTool Component
 * Implements Requirement #22: Draw two lines passing through the center of ROI
 *
 * Features:
 * - Draws horizontal and vertical lines through ROI center
 * - Supports multiple ROI shapes (rectangle, circle, ellipse, polygon)
 * - Customizable appearance (color, width, style)
 * - Can extend beyond ROI or stay within bounds
 * - Integrates with Fabric.js canvas
 *
 * @module components/Tools/CrosshairTool
 * @author CT Scanner Development Team
 * @version 2.0.0
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Crosshair, Settings } from 'lucide-react';
import {
  calculateROICenter,
  calculateCrosshairBounds,
  validateROIForCrosshair
} from '../../utils/roi/roiGeometry';
import debugLogger from '../../utils/debugLogger';

/**
 * Default crosshair configuration
 */
const DEFAULT_CROSSHAIR_CONFIG = {
  color: '#00ff00',
  strokeWidth: 1,
  strokeDashArray: [5, 5], // Dashed line pattern
  opacity: 0.8,
  selectable: false,
  evented: false,
  extendBeyondROI: true,
  showCenter: true,
  centerRadius: 3,
  centerColor: '#ff0000'
};

/**
 * CrosshairTool Component
 */
const CrosshairTool = ({
  fabricCanvas,
  roi,
  roiShape,
  enabled = false,
  config = {},
  onCrosshairUpdate = null,
  className = ''
}) => {
  const { t } = useTranslation();
  const crosshairLinesRef = useRef({ horizontal: null, vertical: null, center: null });
  const [crosshairVisible, setCrosshairVisible] = useState(enabled);
  const [currentConfig, setCurrentConfig] = useState({ ...DEFAULT_CROSSHAIR_CONFIG, ...config });

  /**
   * Create crosshair lines on canvas
   */
  const createCrosshairLines = useCallback(() => {
    if (!fabricCanvas || !roi || !roiShape) {
      debugLogger.log('[CrosshairTool] Cannot create crosshair: missing required props', 'warn');
      return;
    }

    // Validate ROI
    const validation = validateROIForCrosshair(roi, roiShape);
    if (!validation.valid) {
      debugLogger.log(`[CrosshairTool] Invalid ROI: ${validation.errors.join(', ')}`, 'error');
      return;
    }

    try {
      // Calculate center and bounds
      const center = calculateROICenter(roi, roiShape);
      const canvasBounds = {
        width: fabricCanvas.getWidth(),
        height: fabricCanvas.getHeight()
      };

      const bounds = calculateCrosshairBounds(roi, roiShape, canvasBounds, {
        extendBeyondROI: currentConfig.extendBeyondROI,
        margin: 0
      });

      debugLogger.log(`[CrosshairTool] Creating crosshair at center (${center.x.toFixed(1)}, ${center.y.toFixed(1)})`, 'info');

      // Remove existing crosshair lines
      removeCrosshairLines();

      // Create horizontal line
      const horizontalLine = new fabric.Line(
        [bounds.horizontal.x1, bounds.horizontal.y1, bounds.horizontal.x2, bounds.horizontal.y2],
        {
          stroke: currentConfig.color,
          strokeWidth: currentConfig.strokeWidth,
          strokeDashArray: currentConfig.strokeDashArray,
          opacity: currentConfig.opacity,
          selectable: currentConfig.selectable,
          evented: currentConfig.evented,
          name: 'crosshair-horizontal'
        }
      );

      // Create vertical line
      const verticalLine = new fabric.Line(
        [bounds.vertical.x1, bounds.vertical.y1, bounds.vertical.x2, bounds.vertical.y2],
        {
          stroke: currentConfig.color,
          strokeWidth: currentConfig.strokeWidth,
          strokeDashArray: currentConfig.strokeDashArray,
          opacity: currentConfig.opacity,
          selectable: currentConfig.selectable,
          evented: currentConfig.evented,
          name: 'crosshair-vertical'
        }
      );

      // Create center marker (small circle)
      let centerMarker = null;
      if (currentConfig.showCenter) {
        centerMarker = new fabric.Circle({
          left: center.x - currentConfig.centerRadius,
          top: center.y - currentConfig.centerRadius,
          radius: currentConfig.centerRadius,
          fill: currentConfig.centerColor,
          stroke: currentConfig.color,
          strokeWidth: 1,
          opacity: currentConfig.opacity,
          selectable: false,
          evented: false,
          name: 'crosshair-center'
        });
      }

      // Add to canvas
      fabricCanvas.add(horizontalLine);
      fabricCanvas.add(verticalLine);
      if (centerMarker) {
        fabricCanvas.add(centerMarker);
      }

      // Store references
      crosshairLinesRef.current = {
        horizontal: horizontalLine,
        vertical: verticalLine,
        center: centerMarker
      };

      fabricCanvas.renderAll();

      // Notify parent
      if (onCrosshairUpdate) {
        onCrosshairUpdate({
          center,
          bounds,
          visible: true
        });
      }

      debugLogger.log('[CrosshairTool] Crosshair created successfully', 'success');
    } catch (error) {
      debugLogger.log(`[CrosshairTool] Error creating crosshair: ${error.message}`, 'error');
      console.error('[CrosshairTool] Error:', error);
    }
  }, [fabricCanvas, roi, roiShape, currentConfig, onCrosshairUpdate]);

  /**
   * Remove crosshair lines from canvas
   */
  const removeCrosshairLines = useCallback(() => {
    if (!fabricCanvas) return;

    const { horizontal, vertical, center } = crosshairLinesRef.current;

    if (horizontal) {
      fabricCanvas.remove(horizontal);
    }
    if (vertical) {
      fabricCanvas.remove(vertical);
    }
    if (center) {
      fabricCanvas.remove(center);
    }

    crosshairLinesRef.current = { horizontal: null, vertical: null, center: null };
    fabricCanvas.renderAll();

    debugLogger.log('[CrosshairTool] Crosshair removed', 'info');

    // Notify parent
    if (onCrosshairUpdate) {
      onCrosshairUpdate({ visible: false });
    }
  }, [fabricCanvas, onCrosshairUpdate]);

  /**
   * Update crosshair when ROI or config changes
   */
  useEffect(() => {
    if (enabled && crosshairVisible) {
      createCrosshairLines();
    } else {
      removeCrosshairLines();
    }

    return () => {
      removeCrosshairLines();
    };
  }, [enabled, crosshairVisible, roi, roiShape, currentConfig, createCrosshairLines, removeCrosshairLines]);

  /**
   * Update config
   */
  useEffect(() => {
    setCurrentConfig(prevConfig => ({ ...prevConfig, ...config }));
  }, [config]);

  /**
   * Toggle crosshair visibility
   */
  const toggleCrosshair = useCallback(() => {
    setCrosshairVisible(prev => !prev);
  }, []);

  /**
   * Update crosshair color
   */
  const updateColor = useCallback((color) => {
    setCurrentConfig(prev => ({ ...prev, color }));
  }, []);

  /**
   * Update stroke width
   */
  const updateStrokeWidth = useCallback((width) => {
    setCurrentConfig(prev => ({ ...prev, strokeWidth: width }));
  }, []);

  /**
   * Update opacity
   */
  const updateOpacity = useCallback((opacity) => {
    setCurrentConfig(prev => ({ ...prev, opacity }));
  }, []);

  /**
   * Toggle extend beyond ROI
   */
  const toggleExtend = useCallback(() => {
    setCurrentConfig(prev => ({ ...prev, extendBeyondROI: !prev.extendBeyondROI }));
  }, []);

  /**
   * Toggle center marker
   */
  const toggleCenterMarker = useCallback(() => {
    setCurrentConfig(prev => ({ ...prev, showCenter: !prev.showCenter }));
  }, []);

  // Expose methods to parent via ref (if needed)
  React.useImperativeHandle(React.createRef(), () => ({
    createCrosshair: createCrosshairLines,
    removeCrosshair: removeCrosshairLines,
    toggleVisibility: toggleCrosshair,
    updateColor,
    updateStrokeWidth,
    updateOpacity,
    toggleExtend,
    toggleCenterMarker
  }));

  // This component doesn't render UI directly - it manipulates the canvas
  // Return null or a small control panel
  return null;
};

CrosshairTool.propTypes = {
  fabricCanvas: PropTypes.object,
  roi: PropTypes.object,
  roiShape: PropTypes.oneOf(['rectangle', 'circle', 'ellipse', 'polygon']),
  enabled: PropTypes.bool,
  config: PropTypes.shape({
    color: PropTypes.string,
    strokeWidth: PropTypes.number,
    strokeDashArray: PropTypes.array,
    opacity: PropTypes.number,
    selectable: PropTypes.bool,
    evented: PropTypes.bool,
    extendBeyondROI: PropTypes.bool,
    showCenter: PropTypes.bool,
    centerRadius: PropTypes.number,
    centerColor: PropTypes.string
  }),
  onCrosshairUpdate: PropTypes.func,
  className: PropTypes.string
};

export default CrosshairTool;

/**
 * CrosshairControlPanel - Optional UI controls for crosshair
 */
export const CrosshairControlPanel = ({
  enabled,
  onToggle,
  config,
  onConfigChange,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('crosshairTool') || 'Crosshair Tool'}
          </h3>
        </div>
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            enabled
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400'
          }`}
        >
          {enabled ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
        </button>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              {t('lineColor') || 'Line Color'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.color}
                onChange={(e) => onConfigChange({ ...config, color: e.target.value })}
                className="w-12 h-8 rounded cursor-pointer"
              />
              <span className="text-sm font-mono text-text-muted">{config.color}</span>
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
              <span>{t('lineWidth') || 'Line Width'}</span>
              <span className="font-mono text-primary">{config.strokeWidth}px</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={config.strokeWidth}
              onChange={(e) => onConfigChange({ ...config, strokeWidth: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
              <span>{t('opacity') || 'Opacity'}</span>
              <span className="font-mono text-primary">{(config.opacity * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.opacity}
              onChange={(e) => onConfigChange({ ...config, opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Extend Beyond ROI */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text dark:text-text">
              {t('extendBeyondROI') || 'Extend Beyond ROI'}
            </span>
            <button
              onClick={() => onConfigChange({ ...config, extendBeyondROI: !config.extendBeyondROI })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                config.extendBeyondROI
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {config.extendBeyondROI ? (t('yes') || 'Yes') : (t('no') || 'No')}
            </button>
          </div>

          {/* Show Center Marker */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text dark:text-text">
              {t('showCenterMarker') || 'Show Center Marker'}
            </span>
            <button
              onClick={() => onConfigChange({ ...config, showCenter: !config.showCenter })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                config.showCenter
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {config.showCenter ? (t('yes') || 'Yes') : (t('no') || 'No')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

CrosshairControlPanel.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  className: PropTypes.string
};
