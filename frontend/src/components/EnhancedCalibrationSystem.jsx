import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Camera, RotateCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const EnhancedCalibrationSystem = ({ disabled = false }) => {
  const { t } = useTranslation();

  // نوع کالیبراسیون
  const [calibrationType, setCalibrationType] = useState('single'); // single or rotational

  // وضعیت کالیبراسیون
  const [calibrationStatus, setCalibrationStatus] = useState({
    status: 'notCalibrated', // notCalibrated, calibrating, calibrated
    date: null,
    quality: 0, // 0-100
    singleImageCaptured: false,
    rotationalProgress: 0,
    rotationalAngles: 0
  });

  // تنظیمات کالیبراسیون چرخشی
  const [rotationalSettings, setRotationalSettings] = useState({
    numberOfAngles: 36,
    angleStep: 10
  });

  // گرفتن تصویر کالیبراسیون تکی
  const captureSingleImage = () => {
    setCalibrationStatus({
      ...calibrationStatus,
      status: 'calibrating'
    });

    // شبیه‌سازی گرفتن تصویر
    setTimeout(() => {
      const quality = 85 + Math.random() * 15; // 85-100%
      setCalibrationStatus({
        status: 'calibrated',
        date: new Date().toLocaleString(),
        quality: Math.round(quality),
        singleImageCaptured: true,
        rotationalProgress: 0,
        rotationalAngles: 0
      });
    }, 2000);
  };

  // شروع کالیبراسیون چرخشی
  const startRotationalCalibration = () => {
    setCalibrationStatus({
      ...calibrationStatus,
      status: 'calibrating',
      rotationalProgress: 0
    });

    // شبیه‌سازی کالیبراسیون چرخشی
    let currentAngle = 0;
    const totalAngles = rotationalSettings.numberOfAngles;

    const interval = setInterval(() => {
      currentAngle++;
      const progress = (currentAngle / totalAngles) * 100;

      if (currentAngle >= totalAngles) {
        clearInterval(interval);
        const quality = 90 + Math.random() * 10; // 90-100%
        setCalibrationStatus({
          status: 'calibrated',
          date: new Date().toLocaleString(),
          quality: Math.round(quality),
          singleImageCaptured: false,
          rotationalProgress: 100,
          rotationalAngles: totalAngles
        });
      } else {
        setCalibrationStatus(prev => ({
          ...prev,
          status: 'calibrating',
          rotationalProgress: progress,
          rotationalAngles: currentAngle
        }));
      }
    }, 100);
  };

  // ریست کالیبراسیون
  const resetCalibration = () => {
    setCalibrationStatus({
      status: 'notCalibrated',
      date: null,
      quality: 0,
      singleImageCaptured: false,
      rotationalProgress: 0,
      rotationalAngles: 0
    });
  };

  // آیکون و رنگ وضعیت
  const getStatusDisplay = () => {
    switch (calibrationStatus.status) {
      case 'notCalibrated':
        return {
          icon: <XCircle className="w-6 h-6" />,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: t('notCalibrated') || 'Not Calibrated'
        };
      case 'calibrating':
        return {
          icon: <AlertCircle className="w-6 h-6 animate-pulse" />,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: t('calibrating') || 'Calibrating...'
        };
      case 'calibrated':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: t('calibrated') || 'Calibrated'
        };
      default:
        return {};
    }
  };

  const statusDisplay = getStatusDisplay();

  // رنگ کیفیت
  const getQualityColor = (quality) => {
    if (quality >= 95) return 'text-green-600 dark:text-green-400';
    if (quality >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('calibrationSystem') || 'Calibration System'}
          </h3>
        </div>
      </div>

      {/* Status Panel */}
      <div className={`panel p-4 rounded-lg border-2 ${statusDisplay.border} ${statusDisplay.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text dark:text-text">
            {t('calibrationStatus') || 'Calibration Status'}
          </h4>
          <div className={`flex items-center gap-2 ${statusDisplay.color}`}>
            {statusDisplay.icon}
            <span className="font-semibold">{statusDisplay.text}</span>
          </div>
        </div>

        {calibrationStatus.status === 'calibrated' && (
          <div className="grid grid-cols-2 gap-3 text-sm mt-3 pt-3 border-t border-border">
            <div>
              <div className="text-text-muted mb-1">{t('calibrationDate') || 'Date'}</div>
              <div className="font-semibold text-text">{calibrationStatus.date}</div>
            </div>
            <div>
              <div className="text-text-muted mb-1">{t('calibrationQuality') || 'Quality'}</div>
              <div className={`font-semibold text-lg ${getQualityColor(calibrationStatus.quality)}`}>
                {calibrationStatus.quality}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calibration Type Selection */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
          {t('calibrationType') || 'Calibration Type'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setCalibrationType('single')}
            disabled={disabled || calibrationStatus.status === 'calibrating'}
            className={`p-4 rounded-lg border-2 transition-all ${
              calibrationType === 'single'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            } ${disabled || calibrationStatus.status === 'calibrating' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="font-semibold text-text">
                {t('singleImageCalibration') || 'Single Image'}
              </span>
            </div>
            <div className="text-xs text-text-muted text-left">
              Calibrate using a single phantom image
            </div>
          </button>

          <button
            onClick={() => setCalibrationType('rotational')}
            disabled={disabled || calibrationStatus.status === 'calibrating'}
            className={`p-4 rounded-lg border-2 transition-all ${
              calibrationType === 'rotational'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            } ${disabled || calibrationStatus.status === 'calibrating' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <RotateCw className="w-5 h-5 text-primary" />
              <span className="font-semibold text-text">
                {t('rotationalCalibration') || 'Rotational'}
              </span>
            </div>
            <div className="text-xs text-text-muted text-left">
              Calibrate using multiple angles for higher accuracy
            </div>
          </button>
        </div>
      </div>

      {/* Single Image Calibration */}
      {calibrationType === 'single' && (
        <div className="space-y-4">
          <button
            onClick={captureSingleImage}
            disabled={disabled || calibrationStatus.status === 'calibrating'}
            className="w-full px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Camera className="w-5 h-5" />
            <span>{t('captureCalibrationImage') || 'Capture Calibration Image'}</span>
          </button>
        </div>
      )}

      {/* Rotational Calibration */}
      {calibrationType === 'rotational' && (
        <div className="space-y-4">
          {/* Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('numberOfSteps') || 'Number of Angles'}
              </label>
              <input
                type="number"
                value={rotationalSettings.numberOfAngles}
                onChange={(e) => setRotationalSettings({
                  ...rotationalSettings,
                  numberOfAngles: parseInt(e.target.value),
                  angleStep: 360 / parseInt(e.target.value)
                })}
                disabled={disabled || calibrationStatus.status === 'calibrating'}
                min="12"
                max="72"
                step="6"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('anglePerStep') || 'Angle Step'} (°)
              </label>
              <input
                type="number"
                value={rotationalSettings.angleStep.toFixed(1)}
                disabled
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-gray-100 dark:bg-gray-700 text-text dark:text-text outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {calibrationStatus.status === 'calibrating' && calibrationStatus.rotationalProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  Angle: {calibrationStatus.rotationalAngles} / {rotationalSettings.numberOfAngles}
                </span>
                <span className="font-mono font-bold text-primary">
                  {calibrationStatus.rotationalProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                  style={{ width: `${calibrationStatus.rotationalProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={startRotationalCalibration}
            disabled={disabled || calibrationStatus.status === 'calibrating'}
            className="w-full px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <RotateCw className="w-5 h-5" />
            <span>{t('startCalibrationScan') || 'Start Calibration Scan'}</span>
          </button>
        </div>
      )}

      {/* Recalibrate Button */}
      {calibrationStatus.status === 'calibrated' && (
        <button
          onClick={resetCalibration}
          disabled={disabled}
          className="w-full px-6 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-400 transition-colors font-semibold"
        >
          {t('recalibrate') || 'Recalibrate System'}
        </button>
      )}
    </div>
  );
};

export default EnhancedCalibrationSystem;
