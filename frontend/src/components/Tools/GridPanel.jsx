/**
 * GridPanel Component
 * UI Panel for Grid Overlay Tool - Integrates with Toolbar
 * Requirement #25: Grid overlay for image space
 *
 * @module components/Tools/GridPanel
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Grid3x3, X, Info } from 'lucide-react';
import GridOverlay from './GridOverlay';

const GridPanel = ({ canvas, isActive, onClose }) => {
  const { t } = useTranslation();
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridConfig, setGridConfig] = useState({
    spacing: 50,
    color: '#00ff00',
    strokeWidth: 1,
    opacity: 0.5,
    strokeDashArray: []
  });

  const updateConfig = useCallback((newConfig) => {
    setGridConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const presetSpacings = [25, 50, 75, 100];

  if (!isActive) return null;

  return (
    <>
      {/* GridOverlay Component - Headless rendering */}
      <GridOverlay
        canvas={canvas}
        enabled={gridEnabled}
        config={gridConfig}
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
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Grid3x3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {t('gridTool') || 'Grid Overlay'}
                </h3>
                <p className="text-white/80 text-xs">
                  {t('requirement25') || 'Requirement #25'}
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
            className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800 dark:text-purple-300">
              <p className="font-semibold mb-1">{t('gridOverlayInfo') || 'Grid Overlay'}</p>
              <p className="text-xs">
                {t('gridOverlayDescription') || 'Display a grid overlay on the entire canvas to help with alignment and measurements.'}
              </p>
            </div>
          </motion.div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-background-secondary dark:bg-accent rounded-lg">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-text dark:text-text">
                {t('showGrid') || 'Show Grid'}
              </span>
            </div>
            <button
              onClick={() => setGridEnabled(!gridEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                gridEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.span
                layout
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                animate={{ x: gridEnabled ? 26 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Configuration (only when enabled) */}
          <AnimatePresence>
            {gridEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Grid Spacing */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('gridSpacing') || 'Grid Spacing'}
                  </label>

                  {/* Preset buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {presetSpacings.map((spacing) => (
                      <button
                        key={spacing}
                        onClick={() => updateConfig({ spacing })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          gridConfig.spacing === spacing
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }`}
                      >
                        {spacing}px
                      </button>
                    ))}
                  </div>

                  {/* Custom spacing slider */}
                  <div>
                    <label className="text-xs font-medium text-text-muted mb-1 flex justify-between">
                      <span>{t('customSpacing') || 'Custom Spacing'}</span>
                      <span className="font-mono text-primary">{gridConfig.spacing}px</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={gridConfig.spacing}
                      onChange={(e) => updateConfig({ spacing: parseInt(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>

                {/* Line Color */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('lineColor') || 'Line Color'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gridConfig.color}
                      onChange={(e) => updateConfig({ color: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <span className="text-sm font-mono text-text-muted bg-background-secondary dark:bg-accent px-3 py-2 rounded-lg flex-1">
                      {gridConfig.color}
                    </span>
                  </div>
                </div>

                {/* Line Width */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                    <span>{t('lineWidth') || 'Line Width'}</span>
                    <span className="font-mono text-primary">{gridConfig.strokeWidth}px</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={gridConfig.strokeWidth}
                    onChange={(e) => updateConfig({ strokeWidth: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                    <span>{t('opacity') || 'Opacity'}</span>
                    <span className="font-mono text-primary">{(gridConfig.opacity * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={gridConfig.opacity}
                    onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Line Style */}
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('lineStyle') || 'Line Style'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateConfig({ strokeDashArray: [] })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        gridConfig.strokeDashArray.length === 0
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {t('solid') || 'Solid'}
                    </button>
                    <button
                      onClick={() => updateConfig({ strokeDashArray: [5, 5] })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        JSON.stringify(gridConfig.strokeDashArray) === JSON.stringify([5, 5])
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {t('dashed') || 'Dashed'}
                    </button>
                    <button
                      onClick={() => updateConfig({ strokeDashArray: [2, 2] })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        JSON.stringify(gridConfig.strokeDashArray) === JSON.stringify([2, 2])
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-background-secondary dark:bg-accent text-text dark:text-text hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {t('dotted') || 'Dotted'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-background-secondary dark:bg-accent border-t border-border">
          <div className="text-xs text-center text-text-muted">
            <kbd className="px-2 py-1 bg-background-white dark:bg-background-secondary rounded border border-border">
              G
            </kbd>{' '}
            {t('toToggleGrid') || 'to toggle grid overlay'}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default GridPanel;
