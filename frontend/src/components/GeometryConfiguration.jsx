import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Ruler,
  Maximize,
  Focus,
  Aperture,
  Save,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import FormInput from './common/FormInput';

const GeometryConfiguration = ({ onGeometryChange, disabled = false }) => {
  const { t } = useTranslation();

  // پارامترهای هندسی
  const [geometry, setGeometry] = useState({
    // فاصله‌ها
    sod: 1000, // Source to Object Distance (mm)
    sdd: 1500, // Source to Detector Distance (mm)

    // مشخصات detector
    detectorWidth: 400, // mm
    detectorHeight: 300, // mm
    pixelPitch: 0.2, // mm
    effectivePixelSize: 0.2, // mm

    // زاویه‌ها
    coneBeamAngle: 15, // degrees

    // بزرگنمایی
    magnification: 1.5, // محاسبه شده: SDD/SOD

    // دیگر پارامترها
    focalSpotSize: 0.4, // mm
    detectorType: 'Flat Panel',
  });

  // وضعیت کالیبراسیون
  const [calibrationStatus, setCalibrationStatus] = useState({
    isCalibrated: false,
    lastCalibration: null,
    geometricAccuracy: null
  });

  // محاسبه خودکار بزرگنمایی
  const calculateMagnification = (sod, sdd) => {
    if (sod > 0) {
      return (sdd / sod).toFixed(3);
    }
    return 0;
  };

  // محاسبه اندازه پیکسل مؤثر
  const calculateEffectivePixelSize = (pixelPitch, magnification) => {
    if (magnification > 0) {
      return (pixelPitch / magnification).toFixed(4);
    }
    return pixelPitch;
  };

  // تغییر پارامتر
  const handleParamChange = (param, value) => {
    const numValue = parseFloat(value) || 0;
    let updated = { ...geometry, [param]: numValue };

    // محاسبات خودکار
    if (param === 'sod' || param === 'sdd') {
      const mag = calculateMagnification(
        param === 'sod' ? numValue : geometry.sod,
        param === 'sdd' ? numValue : geometry.sdd
      );
      updated.magnification = parseFloat(mag);
      updated.effectivePixelSize = parseFloat(
        calculateEffectivePixelSize(geometry.pixelPitch, mag)
      );
    }

    if (param === 'pixelPitch') {
      updated.effectivePixelSize = parseFloat(
        calculateEffectivePixelSize(numValue, geometry.magnification)
      );
    }

    setGeometry(updated);

    if (onGeometryChange) {
      onGeometryChange(updated);
    }
  };

  // اجرای کالیبراسیون
  const runCalibration = () => {
    setCalibrationStatus({
      isCalibrated: false,
      lastCalibration: null,
      geometricAccuracy: null
    });

    // شبیه‌سازی کالیبراسیون
    setTimeout(() => {
      const accuracy = 0.95 + Math.random() * 0.05;
      setCalibrationStatus({
        isCalibrated: true,
        lastCalibration: new Date().toISOString(),
        geometricAccuracy: accuracy.toFixed(4)
      });
    }, 3000);
  };

  // ذخیره تنظیمات
  const saveGeometry = () => {
    const data = JSON.stringify({
      geometry,
      calibrationStatus,
      timestamp: new Date().toISOString()
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geometry_config_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // بارگذاری تنظیمات
  const loadGeometry = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setGeometry(data.geometry);
          setCalibrationStatus(data.calibrationStatus || calibrationStatus);
          if (onGeometryChange) {
            onGeometryChange(data.geometry);
          }
        } catch (error) {
          alert('Invalid geometry configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  // FOV محاسبه
  const calculateFOV = () => {
    const fovWidth = (geometry.detectorWidth / geometry.magnification).toFixed(2);
    const fovHeight = (geometry.detectorHeight / geometry.magnification).toFixed(2);
    return { width: fovWidth, height: fovHeight };
  };

  const fov = calculateFOV();

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('geometryConfiguration') || 'Geometry Configuration'}
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runCalibration}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-1.5 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('calibrate') || 'Calibrate'}</span>
          </button>

          <button
            onClick={saveGeometry}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-1.5 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('export')}</span>
          </button>

          <label className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 cursor-pointer transition-colors flex items-center gap-1.5 text-sm">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('import')}</span>
            <input
              type="file"
              accept=".json"
              onChange={loadGeometry}
              className="hidden"
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      {/* Calibration Status */}
      {calibrationStatus.isCalibrated && (
        <div className="panel p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-green-800 dark:text-green-300 mb-1">
                {t('systemCalibrated') || 'System Calibrated'}
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">
                {t('lastCalibration') || 'Last calibration'}: {new Date(calibrationStatus.lastCalibration).toLocaleString()}
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">
                {t('geometricAccuracy') || 'Geometric accuracy'}: {(parseFloat(calibrationStatus.geometricAccuracy) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distance Parameters */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3 flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          {t('distanceParameters') || 'Distance Parameters'}
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              SOD - Source to Object (mm)
            </label>
            <FormInput
              type="number"
              value={geometry.sod}
              onChange={(e) => handleParamChange('sod', e.target.value)}
              disabled={disabled}
              min="1"
              step="1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              SDD - Source to Detector (mm)
            </label>
            <FormInput
              type="number"
              value={geometry.sdd}
              onChange={(e) => handleParamChange('sdd', e.target.value)}
              disabled={disabled}
              min="1"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Detector Parameters */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3 flex items-center gap-2">
          <Maximize className="w-4 h-4" />
          {t('detectorParameters') || 'Detector Parameters'}
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              {t('detectorWidth') || 'Detector Width'} (mm)
            </label>
            <FormInput
              type="number"
              value={geometry.detectorWidth}
              onChange={(e) => handleParamChange('detectorWidth', e.target.value)}
              disabled={disabled}
              min="1"
              step="1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              {t('detectorHeight') || 'Detector Height'} (mm)
            </label>
            <FormInput
              type="number"
              value={geometry.detectorHeight}
              onChange={(e) => handleParamChange('detectorHeight', e.target.value)}
              disabled={disabled}
              min="1"
              step="1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              {t('pixelPitch') || 'Pixel Pitch'} (mm)
            </label>
            <FormInput
              type="number"
              value={geometry.pixelPitch}
              onChange={(e) => handleParamChange('pixelPitch', e.target.value)}
              disabled={disabled}
              min="0.001"
              step="0.001"
            />
          </div>
        </div>
      </div>

      {/* Calculated Values */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3 flex items-center gap-2">
          <Focus className="w-4 h-4" />
          {t('calculatedValues') || 'Calculated Values'}
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="panel p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="text-xs text-text-muted mb-1">{t('magnification') || 'Magnification'}</div>
            <div className="text-xl font-bold text-primary font-mono">
              {geometry.magnification.toFixed(3)}x
            </div>
          </div>
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">{t('effectivePixelSize') || 'Effective Pixel Size'} (mm)</div>
            <div className="text-xl font-bold text-text dark:text-text font-mono">
              {geometry.effectivePixelSize.toFixed(4)}
            </div>
          </div>
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">FOV {t('width') || 'Width'} (mm)</div>
            <div className="text-xl font-bold text-text dark:text-text font-mono">
              {fov.width}
            </div>
          </div>
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">FOV {t('height') || 'Height'} (mm)</div>
            <div className="text-xl font-bold text-text dark:text-text font-mono">
              {fov.height}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Parameters */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3 flex items-center gap-2">
          <Aperture className="w-4 h-4" />
          {t('additionalParameters') || 'Additional Parameters'}
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              {t('coneBeamAngle') || 'Cone Beam Angle'} (°)
            </label>
            <FormInput
              type="number"
              value={geometry.coneBeamAngle}
              onChange={(e) => handleParamChange('coneBeamAngle', e.target.value)}
              disabled={disabled}
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text dark:text-text mb-2 block">
              {t('focalSpotSize') || 'Focal Spot Size'} (mm)
            </label>
            <FormInput
              type="number"
              value={geometry.focalSpotSize}
              onChange={(e) => handleParamChange('focalSpotSize', e.target.value)}
              disabled={disabled}
              min="0.001"
              step="0.001"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeometryConfiguration;
