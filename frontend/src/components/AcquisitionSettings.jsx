import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid3x3,
  Layers,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import FormInput from './common/FormInput';
import FormSelect from './common/FormSelect';

const AcquisitionSettings = ({ onAcquisitionStart, disabled = false }) => {
  const { t } = useTranslation();

  // تنظیمات تصویربرداری
  const [settings, setSettings] = useState({
    // مورد 11: 180 یا 360
    rotationMode: '360',

    // مورد 12: Multi-segment برای اجسام بزرگ
    multiSegmentEnabled: false,
    numberOfSegments: 3,
    segmentOverlap: 10, // درصد همپوشانی
    totalHeight: 300, // mm

    // تنظیمات عمومی
    numberOfProjections: 360,
    exposurePerProjection: 100, // ms
  });

  // وضعیت تصویربرداری
  const [acquisitionStatus, setAcquisitionStatus] = useState({
    isRunning: false,
    currentSegment: 0,
    currentProjection: 0,
    progress: 0
  });

  // تغییر پارامتر
  const handleParamChange = (param, value) => {
    setSettings({
      ...settings,
      [param]: param === 'multiSegmentEnabled' ? value : (parseFloat(value) || value)
    });
  };

  // شروع تصویربرداری
  const startAcquisition = () => {
    setAcquisitionStatus({
      isRunning: true,
      currentSegment: 0,
      currentProjection: 0,
      progress: 0
    });

    // شبیه‌سازی تصویربرداری
    if (onAcquisitionStart) {
      onAcquisitionStart(settings);
    }

    // شبیه‌سازی progress
    const totalSteps = settings.multiSegmentEnabled
      ? settings.numberOfSegments * settings.numberOfProjections
      : settings.numberOfProjections;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;

      const currentProjection = currentStep % settings.numberOfProjections;
      const currentSegment = Math.floor(currentStep / settings.numberOfProjections);

      setAcquisitionStatus({
        isRunning: currentStep < totalSteps,
        currentSegment,
        currentProjection,
        progress: Math.min(progress, 100)
      });

      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, 50);
  };

  // توقف تصویربرداری
  const stopAcquisition = () => {
    setAcquisitionStatus({
      ...acquisitionStatus,
      isRunning: false
    });
  };

  // ریست
  const resetAcquisition = () => {
    setAcquisitionStatus({
      isRunning: false,
      currentSegment: 0,
      currentProjection: 0,
      progress: 0
    });
  };

  // محاسبه زمان کل
  const calculateTotalTime = () => {
    const totalProjections = settings.multiSegmentEnabled
      ? settings.numberOfSegments * settings.numberOfProjections
      : settings.numberOfProjections;

    const totalTimeMs = totalProjections * settings.exposurePerProjection;
    const totalTimeSec = totalTimeMs / 1000;

    return totalTimeSec < 60
      ? `${totalTimeSec.toFixed(1)}s`
      : `${(totalTimeSec / 60).toFixed(1)}min`;
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('acquisitionSettings') || 'Acquisition Settings'}
          </h3>
        </div>

        <div className="flex gap-2">
          {!acquisitionStatus.isRunning ? (
            <button
              onClick={startAcquisition}
              disabled={disabled}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
            >
              <Play className="w-4 h-4" />
              <span>{t('start') || 'Start'}</span>
            </button>
          ) : (
            <button
              onClick={stopAcquisition}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Pause className="w-4 h-4" />
              <span>{t('stop') || 'Stop'}</span>
            </button>
          )}

          <button
            onClick={resetAcquisition}
            disabled={disabled || acquisitionStatus.isRunning}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('reset') || 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {acquisitionStatus.progress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              {acquisitionStatus.isRunning ? t('acquiring') || 'Acquiring...' : t('completed') || 'Completed'}
            </span>
            <span className="font-mono font-bold text-primary">
              {acquisitionStatus.progress.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
              style={{ width: `${acquisitionStatus.progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
            <div>Segment: {acquisitionStatus.currentSegment + 1} / {settings.multiSegmentEnabled ? settings.numberOfSegments : 1}</div>
            <div>Projection: {acquisitionStatus.currentProjection} / {settings.numberOfProjections}</div>
          </div>
        </div>
      )}

      {/* Rotation Mode (مورد 11) */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
          {t('rotationMode') || 'Rotation Mode'}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {['180', '360'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleParamChange('rotationMode', mode)}
              disabled={disabled || acquisitionStatus.isRunning}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.rotationMode === mode
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              } ${disabled || acquisitionStatus.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl font-bold text-primary mb-1">{mode}°</div>
              <div className="text-xs text-text-muted">
                {mode === '180' ? t('halfRotation') || 'Half rotation' : t('fullRotation') || 'Full rotation'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Segment Settings (مورد 12) */}
      <div className="panel p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-text dark:text-text flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {t('multiSegmentImaging') || 'Multi-Segment Imaging'}
          </h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.multiSegmentEnabled}
              onChange={(e) => handleParamChange('multiSegmentEnabled', e.target.checked)}
              disabled={disabled || acquisitionStatus.isRunning}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        {settings.multiSegmentEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('numberOfSegments') || 'Number of Segments'}
              </label>
              <input
                type="number"
                value={settings.numberOfSegments}
                onChange={(e) => handleParamChange('numberOfSegments', e.target.value)}
                disabled={disabled || acquisitionStatus.isRunning}
                min="2"
                max="10"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('segmentOverlap') || 'Overlap'} (%)
              </label>
              <input
                type="number"
                value={settings.segmentOverlap}
                onChange={(e) => handleParamChange('segmentOverlap', e.target.value)}
                disabled={disabled || acquisitionStatus.isRunning}
                min="0"
                max="50"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('totalHeight') || 'Total Height'} (mm)
              </label>
              <input
                type="number"
                value={settings.totalHeight}
                onChange={(e) => handleParamChange('totalHeight', e.target.value)}
                disabled={disabled || acquisitionStatus.isRunning}
                min="10"
                step="10"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-text dark:text-text mb-2 block">
            {t('numberOfProjections') || 'Number of Projections'}
          </label>
          <input
            type="number"
            value={settings.numberOfProjections}
            onChange={(e) => handleParamChange('numberOfProjections', e.target.value)}
            disabled={disabled || acquisitionStatus.isRunning}
            min="10"
            step="10"
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text dark:text-text mb-2 block">
            {t('exposurePerProjection') || 'Exposure per Projection'} (ms)
          </label>
          <input
            type="number"
            value={settings.exposurePerProjection}
            onChange={(e) => handleParamChange('exposurePerProjection', e.target.value)}
            disabled={disabled || acquisitionStatus.isRunning}
            min="10"
            step="10"
            className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="panel p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
          {t('acquisitionSummary') || 'Acquisition Summary'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-text-muted mb-1">{t('mode') || 'Mode'}</div>
            <div className="font-semibold text-text">{settings.rotationMode}°</div>
          </div>
          <div>
            <div className="text-text-muted mb-1">{t('segments') || 'Segments'}</div>
            <div className="font-semibold text-text">
              {settings.multiSegmentEnabled ? settings.numberOfSegments : 1}
            </div>
          </div>
          <div>
            <div className="text-text-muted mb-1">{t('totalProjections') || 'Total Proj.'}</div>
            <div className="font-semibold text-text">
              {settings.multiSegmentEnabled
                ? settings.numberOfSegments * settings.numberOfProjections
                : settings.numberOfProjections}
            </div>
          </div>
          <div>
            <div className="text-text-muted mb-1">{t('estimatedTime') || 'Est. Time'}</div>
            <div className="font-semibold text-primary">{calculateTotalTime()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionSettings;
