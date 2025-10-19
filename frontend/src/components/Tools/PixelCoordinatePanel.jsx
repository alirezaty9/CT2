/**
 * PixelCoordinatePanel Component
 * UI Panel for Pixel Coordinate Tool - Integrates with Toolbar
 * Requirement #23: Display pixel coordinates (X,Y) on cursor when enabled by user
 *
 * @module components/Tools/PixelCoordinatePanel
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crosshair, X, Info, MapPin } from 'lucide-react';
import PixelCoordinateTracker from './PixelCoordinateTracker';

const PixelCoordinatePanel = ({ canvas, isActive, onClose }) => {
  const { t } = useTranslation();
  const [trackerEnabled, setTrackerEnabled] = useState(true);
  const [displayMode, setDisplayMode] = useState('tooltip');
  const [showPixelValue, setShowPixelValue] = useState(true);
  const [trackerConfig, setTrackerConfig] = useState({
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    textColor: '#00ff00',
    fontSize: 13,
    padding: 10,
    borderRadius: 6,
    hudPosition: 'top-right'
  });

  const updateConfig = useCallback((newConfig) => {
    setTrackerConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  if (!isActive) return null;

  return (
    <>
      {/* PixelCoordinateTracker Component - Headless rendering */}
      <PixelCoordinateTracker
        canvas={canvas}
        enabled={trackerEnabled}
        displayMode={displayMode}
        showPixelValue={showPixelValue}
        config={trackerConfig}
      />

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white dark:bg-background-secondary border-2 border-border rounded-2xl shadow-2xl w-80 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {t('pixelCoordinateTool') || 'Pixel Coordinates'}
                </h3>
                <p className="text-white/80 text-xs">
                  {t('requirement23') || 'Requirement #23'}
                </p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">{t('pixelCoordinateInfo') || 'Pixel Coordinates'}</p>
              <p className="text-xs">
                {t('pixelCoordinateDescription') || 'Move your mouse over the canvas to see pixel coordinates (X,Y) and gray value.'}
              </p>
            </div>
          </motion.div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-background-secondary dark:bg-accent rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-text dark:text-text">
                {t('showCoordinates') || 'Show Coordinates'}
              </span>
            </div>
            <button
              onClick={() => setTrackerEnabled(!trackerEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                trackerEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.span
                layout
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                animate={{ x: trackerEnabled ? 26 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Configuration (only when enabled) */}
          <AnimatePresence>
            {trackerEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Display Mode Selection */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('displayMode') || 'Display Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDisplayMode('tooltip')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        displayMode === 'tooltip'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      {t('tooltip') || 'Tooltip'}
                    </button>
                    <button
                      onClick={() => setDisplayMode('hud')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        displayMode === 'hud'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      {t('hud') || 'HUD'}
                    </button>
                  </div>
                </div>

                {/* HUD Position (only when HUD mode is selected) */}
                {displayMode === 'hud' && (
                  <div>
                    <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                      {t('hudPosition') || 'HUD Position'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => (
                        <button
                          key={position}
                          onClick={() => updateConfig({ hudPosition: position })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            trackerConfig.hudPosition === position
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          {position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show Pixel Value Toggle */}
                <div className="flex items-center justify-between p-3 bg-background-secondary dark:bg-accent rounded-lg">
                  <span className="text-sm font-medium text-text dark:text-text">
                    {t('showPixelValue') || 'Show Gray Value'}
                  </span>
                  <button
                    onClick={() => setShowPixelValue(!showPixelValue)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      showPixelValue
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {showPixelValue ? (t('yes') || 'Yes') : (t('no') || 'No')}
                  </button>
                </div>

                {/* Text Color */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('textColor') || 'Text Color'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={trackerConfig.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <span className="text-sm font-mono text-text-muted bg-background-secondary dark:bg-accent px-3 py-2 rounded-lg flex-1">
                      {trackerConfig.textColor}
                    </span>
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('backgroundColor') || 'Background Color'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={trackerConfig.backgroundColor.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/, (match, r, g, b) => {
                          return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`;
                        })}
                        onChange={(e) => updateConfig({ backgroundColor: `rgba(${parseInt(e.target.value.slice(1,3), 16)}, ${parseInt(e.target.value.slice(3,5), 16)}, ${parseInt(e.target.value.slice(5,7), 16)}, 0.85)` })}
                        className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border"
                      />
                    </div>
                    <span className="text-xs font-mono text-text-muted bg-background-secondary dark:bg-accent px-3 py-2 rounded-lg flex-1">
                      Semi-transparent
                    </span>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                    <span>{t('fontSize') || 'Font Size'}</span>
                    <span className="font-mono text-primary">{trackerConfig.fontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    step="1"
                    value={trackerConfig.fontSize}
                    onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-background-secondary dark:bg-accent border-t border-border">
          <div className="text-xs text-center text-text-muted">
            <kbd className="px-2 py-1 bg-background-white dark:bg-background-secondary rounded border border-border">
              P
            </kbd>{' '}
            {t('toTogglePixelCoordinates') || 'to toggle pixel coordinates'}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PixelCoordinatePanel;
