import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Play, Pause, RotateCcw } from 'lucide-react';

const LinearDetectorImaging = ({ disabled = false }) => {
  const { t } = useTranslation();

  // تنظیمات
  const [settings, setSettings] = useState({
    enabled: false,
    scanHeight: 500, // mm
    verticalStepSize: 10, // mm
    stitchingOverlap: 5, // %
    detectorHeight: 50 // mm
  });

  // وضعیت اسکن
  const [scanStatus, setScanStatus] = useState({
    isScanning: false,
    currentStep: 0,
    totalSteps: 0,
    progress: 0
  });

  // تغییر پارامتر
  const handleParamChange = (param, value) => {
    setSettings({
      ...settings,
      [param]: param === 'enabled' ? value : parseFloat(value)
    });
  };

  // محاسبه تعداد گام‌ها
  const calculateSteps = useMemo(() => {
    const effectiveHeight = settings.detectorHeight * (1 - settings.stitchingOverlap / 100);
    const steps = Math.ceil(settings.scanHeight / effectiveHeight);
    return steps;
  }, [settings.scanHeight, settings.detectorHeight, settings.stitchingOverlap]);

  // محاسبه زمان تخمینی
  const calculateEstimatedTime = useMemo(() => {
    const stepsCount = calculateSteps;
    const timePerStep = 2; // ثانیه
    const totalTimeSec = stepsCount * timePerStep;

    if (totalTimeSec < 60) {
      return `${totalTimeSec}s`;
    } else {
      return `${(totalTimeSec / 60).toFixed(1)}min`;
    }
  }, [calculateSteps]);

  // شروع اسکن
  const startScan = () => {
    const totalSteps = calculateSteps;
    setScanStatus({
      isScanning: true,
      currentStep: 0,
      totalSteps,
      progress: 0
    });

    // شبیه‌سازی اسکن
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / totalSteps) * 100;

      setScanStatus({
        isScanning: currentStep < totalSteps,
        currentStep,
        totalSteps,
        progress: Math.min(progress, 100)
      });

      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, 100);
  };

  // توقف اسکن
  const stopScan = () => {
    setScanStatus({
      ...scanStatus,
      isScanning: false
    });
  };

  // ریست
  const resetScan = () => {
    setScanStatus({
      isScanning: false,
      currentStep: 0,
      totalSteps: 0,
      progress: 0
    });
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('linearDetectorImaging') || 'Linear Detector Imaging'}
          </h3>
        </div>

        {/* Enable Toggle */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleParamChange('enabled', e.target.checked)}
            disabled={disabled || scanStatus.isScanning}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Progress Bar */}
          {scanStatus.progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  {scanStatus.isScanning ? t('acquiring') || 'Scanning...' : t('completed') || 'Completed'}
                </span>
                <span className="font-mono font-bold text-primary">
                  {scanStatus.progress.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${scanStatus.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-text-muted text-center">
                Step: {scanStatus.currentStep} / {scanStatus.totalSteps}
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('scanHeight') || 'Scan Height'} (mm)
              </label>
              <input
                type="number"
                value={settings.scanHeight}
                onChange={(e) => handleParamChange('scanHeight', e.target.value)}
                disabled={disabled || scanStatus.isScanning}
                min="10"
                step="10"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('verticalStepSize') || 'Vertical Step Size'} (mm)
              </label>
              <input
                type="number"
                value={settings.verticalStepSize}
                onChange={(e) => handleParamChange('verticalStepSize', e.target.value)}
                disabled={disabled || scanStatus.isScanning}
                min="1"
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('stitchingOverlap') || 'Stitching Overlap'} (%)
              </label>
              <input
                type="number"
                value={settings.stitchingOverlap}
                onChange={(e) => handleParamChange('stitchingOverlap', e.target.value)}
                disabled={disabled || scanStatus.isScanning}
                min="0"
                max="50"
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('detectorHeight') || 'Detector Height'} (mm)
              </label>
              <input
                type="number"
                value={settings.detectorHeight}
                onChange={(e) => handleParamChange('detectorHeight', e.target.value)}
                disabled={disabled || scanStatus.isScanning}
                min="10"
                step="5"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Summary Panel */}
          <div className="panel p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
              {t('acquisitionSummary') || 'Scan Summary'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-text-muted mb-1">{t('numberOfSteps') || 'Steps'}</div>
                <div className="font-semibold text-text">{calculateSteps}</div>
              </div>
              <div>
                <div className="text-text-muted mb-1">{t('stitchingOverlap') || 'Overlap'}</div>
                <div className="font-semibold text-text">{settings.stitchingOverlap}%</div>
              </div>
              <div>
                <div className="text-text-muted mb-1">{t('estimatedScanTime') || 'Est. Time'}</div>
                <div className="font-semibold text-primary">{calculateEstimatedTime}</div>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center">
            {!scanStatus.isScanning ? (
              <button
                onClick={startScan}
                disabled={disabled}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>{t('start') || 'Start Scan'}</span>
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                <span>{t('stop') || 'Stop'}</span>
              </button>
            )}

            <button
              onClick={resetScan}
              disabled={disabled || scanStatus.isScanning}
              className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('reset') || 'Reset'}</span>
            </button>
          </div>
        </>
      )}

      {!settings.enabled && (
        <div className="panel p-8 rounded-lg text-center">
          <Maximize2 className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-30" />
          <p className="text-text-muted">
            {t('linearDetectorMode') || 'Enable Linear Detector Mode to configure settings'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LinearDetectorImaging;
