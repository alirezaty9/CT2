import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const PositionFeedback = ({ targetPosition = null, disabled = false }) => {
  const { t } = useTranslation();

  // موقعیت فعلی (شبیه‌سازی)
  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
    z: 0,
    theta: 0,
    gamma: 0
  });

  // خطای موقعیت
  const [positionError, setPositionError] = useState({
    x: 0,
    y: 0,
    z: 0,
    theta: 0,
    gamma: 0
  });

  // شبیه‌سازی حرکت به موقعیت هدف
  useEffect(() => {
    if (!targetPosition) return;

    const interval = setInterval(() => {
      setCurrentPosition(prev => {
        const newPosition = { ...prev };

        // برای هر محور، به آرامی به سمت موقعیت هدف حرکت کن
        Object.keys(targetPosition).forEach(axis => {
          const target = targetPosition[axis];
          const current = prev[axis];
          const diff = target - current;

          // اگر خیلی نزدیک هستیم، مستقیم به هدف برو
          if (Math.abs(diff) < 0.01) {
            newPosition[axis] = target;
          } else {
            // در غیر این صورت، ۱۰٪ از مسافت را طی کن
            newPosition[axis] = current + diff * 0.1;
          }
        });

        return newPosition;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [targetPosition]);

  // محاسبه خطا
  useEffect(() => {
    if (!targetPosition) {
      setPositionError({ x: 0, y: 0, z: 0, theta: 0, gamma: 0 });
      return;
    }

    const error = {};
    Object.keys(targetPosition).forEach(axis => {
      error[axis] = targetPosition[axis] - currentPosition[axis];
    });
    setPositionError(error);
  }, [currentPosition, targetPosition]);

  // تابع برای نمایش وضعیت (آیا در موقعیت هدف هستیم؟)
  const isAtTarget = () => {
    if (!targetPosition) return false;

    return Object.keys(targetPosition).every(axis =>
      Math.abs(positionError[axis]) < 0.1
    );
  };

  // تابع برای رنگ بندی خطا
  const getErrorColor = (error) => {
    const absError = Math.abs(error);
    if (absError < 0.1) return 'text-green-600 dark:text-green-400';
    if (absError < 1) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const axes = [
    { key: 'x', label: 'X', unit: 'mm' },
    { key: 'y', label: 'Y', unit: 'mm' },
    { key: 'z', label: 'Z', unit: 'mm' },
    { key: 'theta', label: 'θ', unit: '°' },
    { key: 'gamma', label: 'γ', unit: '°' }
  ];

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('positionFeedback') || 'Position Feedback'}
          </h3>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isAtTarget() ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                At Target
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Moving
              </span>
            </>
          )}
        </div>
      </div>

      {/* Position Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {axes.map(({ key, label, unit }) => (
          <div key={key} className="panel p-4 rounded-lg space-y-2">
            {/* Axis Label */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-muted">
                {label}
              </span>
              <span className="text-xs text-text-muted">{unit}</span>
            </div>

            {/* Current Position */}
            <div>
              <div className="text-xs text-text-muted mb-1">
                {t('currentPosition') || 'Current'}
              </div>
              <div className="text-2xl font-bold font-mono text-primary">
                {currentPosition[key].toFixed(2)}
              </div>
            </div>

            {/* Target Position */}
            {targetPosition && (
              <div>
                <div className="text-xs text-text-muted mb-1">
                  {t('targetPosition') || 'Target'}
                </div>
                <div className="text-lg font-semibold font-mono text-text">
                  {targetPosition[key].toFixed(2)}
                </div>
              </div>
            )}

            {/* Position Error */}
            {targetPosition && (
              <div>
                <div className="text-xs text-text-muted mb-1">
                  {t('positionError') || 'Error'}
                </div>
                <div className={`text-lg font-bold font-mono ${getErrorColor(positionError[key])}`}>
                  {positionError[key] >= 0 ? '+' : ''}{positionError[key].toFixed(2)}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {targetPosition && Math.abs(positionError[key]) > 0.1 && (
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, (1 - Math.abs(positionError[key]) / Math.abs(targetPosition[key])) * 100))}%`
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Real-time Position Display */}
      <div className="panel p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
          {t('realTimePosition') || 'Real-time Position Display'}
        </h4>
        <div className="flex flex-wrap gap-4 text-sm">
          {axes.map(({ key, label, unit }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-text-muted">{label}:</span>
              <span className="font-mono font-bold text-text">
                {currentPosition[key].toFixed(2)} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PositionFeedback;
