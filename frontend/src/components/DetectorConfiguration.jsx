import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Settings, Save, RotateCcw, Download, Upload } from 'lucide-react';

const DetectorConfiguration = ({ disabled = false }) => {
  const { t } = useTranslation();

  // تنظیمات آشکارساز
  const [detectorSettings, setDetectorSettings] = useState({
    // تنظیمات سخت‌افزاری
    binning: '1x1', // Pixel binning
    readoutMode: 'standard', // standard, fast, low-noise
    coolingTemperature: -20, // °C
    gainMode: 'auto', // auto, low, medium, high

    // تنظیمات تصویربرداری
    exposureTime: 100, // ms
    frameRate: 10, // fps
    triggerMode: 'internal', // internal, external, software

    // تنظیمات پردازش
    darkFrameCorrection: true,
    flatFieldCorrection: true,
    badPixelCorrection: true,
    lagCorrection: false,

    // تنظیمات پیشرفته
    readoutSpeed: 1, // MHz
    verticalShift: 1, // μs
    outputAmplifier: 'EM', // EM, conventional
  });

  // وضعیت آشکارساز
  const [detectorStatus, setDetectorStatus] = useState({
    temperature: -20.5,
    temperatureStable: true,
    readoutNoise: 3.2, // electrons RMS
    darkCurrent: 0.05, // electrons/pixel/s
    lastCalibration: '2025-10-13 14:30'
  });

  // تغییر تنظیمات
  const handleSettingChange = (setting, value) => {
    setDetectorSettings({
      ...detectorSettings,
      [setting]: value
    });
  };

  // ذخیره تنظیمات
  const saveSettings = () => {
    console.log('Saving detector settings:', detectorSettings);
    // شبیه‌سازی ذخیره
    alert(t('settingsSaved') || 'Settings saved successfully!');
  };

  // بازنشانی به پیش‌فرض
  const resetToDefault = () => {
    setDetectorSettings({
      binning: '1x1',
      readoutMode: 'standard',
      coolingTemperature: -20,
      gainMode: 'auto',
      exposureTime: 100,
      frameRate: 10,
      triggerMode: 'internal',
      darkFrameCorrection: true,
      flatFieldCorrection: true,
      badPixelCorrection: true,
      lagCorrection: false,
      readoutSpeed: 1,
      verticalShift: 1,
      outputAmplifier: 'EM'
    });
  };

  // صادر کردن تنظیمات
  const exportSettings = () => {
    const dataStr = JSON.stringify(detectorSettings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `detector_config_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // وارد کردن تنظیمات
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          setDetectorSettings(settings);
          alert(t('settingsImported') || 'Settings imported successfully!');
        } catch (error) {
          alert(t('importError') || 'Error importing settings');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('detectorConfiguration') || 'Detector Configuration'}
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={exportSettings}
            disabled={disabled}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
            title={t('export') || 'Export'}
          >
            <Download className="w-4 h-4" />
          </button>

          <label className={`px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              disabled={disabled}
              className="hidden"
            />
          </label>

          <button
            onClick={resetToDefault}
            disabled={disabled}
            className="px-3 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
            title={t('reset') || 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detector Status */}
      <div className="panel p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
          {t('detectorStatus') || 'Detector Status'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-text-muted mb-1">{t('temperature') || 'Temperature'}</div>
            <div className="font-semibold text-text">{detectorStatus.temperature}°C</div>
          </div>
          <div>
            <div className="text-text-muted mb-1">{t('readoutNoise') || 'Readout Noise'}</div>
            <div className="font-semibold text-text">{detectorStatus.readoutNoise} e⁻</div>
          </div>
          <div>
            <div className="text-text-muted mb-1">{t('darkCurrent') || 'Dark Current'}</div>
            <div className="font-semibold text-text">{detectorStatus.darkCurrent} e⁻/px/s</div>
          </div>
          <div>
            <div className="text-text-muted mb-1">{t('lastCalibration') || 'Last Calibration'}</div>
            <div className="font-semibold text-text text-xs">{detectorStatus.lastCalibration}</div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="space-y-6">
        {/* Hardware Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text dark:text-text flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            {t('hardwareSettings') || 'Hardware Settings'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('binning') || 'Pixel Binning'}
              </label>
              <select
                value={detectorSettings.binning}
                onChange={(e) => handleSettingChange('binning', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="1x1">1×1</option>
                <option value="2x2">2×2</option>
                <option value="4x4">4×4</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('readoutMode') || 'Readout Mode'}
              </label>
              <select
                value={detectorSettings.readoutMode}
                onChange={(e) => handleSettingChange('readoutMode', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="standard">Standard</option>
                <option value="fast">Fast</option>
                <option value="low-noise">Low Noise</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('coolingTemperature') || 'Cooling Temp'} (°C)
              </label>
              <input
                type="number"
                value={detectorSettings.coolingTemperature}
                onChange={(e) => handleSettingChange('coolingTemperature', parseFloat(e.target.value))}
                disabled={disabled}
                min="-40"
                max="25"
                step="5"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('gainMode') || 'Gain Mode'}
              </label>
              <select
                value={detectorSettings.gainMode}
                onChange={(e) => handleSettingChange('gainMode', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="auto">Auto</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Imaging Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text dark:text-text flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            {t('imagingSettings') || 'Imaging Settings'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('exposureTime') || 'Exposure Time'} (ms)
              </label>
              <input
                type="number"
                value={detectorSettings.exposureTime}
                onChange={(e) => handleSettingChange('exposureTime', parseFloat(e.target.value))}
                disabled={disabled}
                min="1"
                max="10000"
                step="10"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('frameRate') || 'Frame Rate'} (fps)
              </label>
              <input
                type="number"
                value={detectorSettings.frameRate}
                onChange={(e) => handleSettingChange('frameRate', parseFloat(e.target.value))}
                disabled={disabled}
                min="1"
                max="60"
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('triggerMode') || 'Trigger Mode'}
              </label>
              <select
                value={detectorSettings.triggerMode}
                onChange={(e) => handleSettingChange('triggerMode', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="software">Software</option>
              </select>
            </div>
          </div>
        </div>

        {/* Processing Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text dark:text-text flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            {t('processingSettings') || 'Processing Settings'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'darkFrameCorrection', label: t('darkFrameCorrection') || 'Dark Frame Correction' },
              { key: 'flatFieldCorrection', label: t('flatFieldCorrection') || 'Flat Field Correction' },
              { key: 'badPixelCorrection', label: t('badPixelCorrection') || 'Bad Pixel Correction' },
              { key: 'lagCorrection', label: t('lagCorrection') || 'Lag Correction' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={detectorSettings[key]}
                  onChange={(e) => handleSettingChange(key, e.target.checked)}
                  disabled={disabled}
                  className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium text-text dark:text-text">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={saveSettings}
          disabled={disabled}
          className="px-8 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors flex items-center gap-2 font-semibold"
        >
          <Save className="w-5 h-5" />
          <span>{t('save') || 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};

export default DetectorConfiguration;
