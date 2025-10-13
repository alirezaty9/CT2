import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const ImageQualityAssessment = ({ disabled = false }) => {
  const { t } = useTranslation();

  // پارامترهای کیفیت تصویر
  const [qualityMetrics, setQualityMetrics] = useState({
    snr: 0, // Signal-to-Noise Ratio
    cnr: 0, // Contrast-to-Noise Ratio
    spatialResolution: 0, // خطوط بر میلی‌متر
    uniformity: 0, // درصد
    artifacts: 0, // تعداد
    overallQuality: 0 // 0-100
  });

  // وضعیت ارزیابی
  const [assessmentStatus, setAssessmentStatus] = useState({
    isAssessing: false,
    lastAssessment: null,
    assessmentCount: 0
  });

  // شبیه‌سازی ارزیابی کیفیت
  useEffect(() => {
    if (assessmentStatus.isAssessing) {
      const interval = setInterval(() => {
        setQualityMetrics({
          snr: 25 + Math.random() * 15, // 25-40 dB
          cnr: 15 + Math.random() * 10, // 15-25 dB
          spatialResolution: 8 + Math.random() * 4, // 8-12 lp/mm
          uniformity: 90 + Math.random() * 8, // 90-98%
          artifacts: Math.floor(Math.random() * 5), // 0-4
          overallQuality: 75 + Math.random() * 20 // 75-95
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [assessmentStatus.isAssessing]);

  // شروع ارزیابی
  const startAssessment = () => {
    setAssessmentStatus({
      isAssessing: true,
      lastAssessment: new Date().toLocaleString(),
      assessmentCount: assessmentStatus.assessmentCount + 1
    });
  };

  // توقف ارزیابی
  const stopAssessment = () => {
    setAssessmentStatus({
      ...assessmentStatus,
      isAssessing: false
    });
  };

  // تعیین رنگ بر اساس کیفیت
  const getQualityColor = (value, thresholds) => {
    if (value >= thresholds.excellent) return 'text-green-600 dark:text-green-400';
    if (value >= thresholds.good) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // تعیین وضعیت کلی
  const getOverallStatus = () => {
    const quality = qualityMetrics.overallQuality;
    if (quality >= 90) {
      return {
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        text: t('excellent') || 'Excellent'
      };
    } else if (quality >= 75) {
      return {
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: t('good') || 'Good'
      };
    } else {
      return {
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: t('needsImprovement') || 'Needs Improvement'
      };
    }
  };

  const overallStatus = getOverallStatus();

  // متریک‌های کیفیت
  const metrics = [
    {
      key: 'snr',
      label: 'SNR',
      value: qualityMetrics.snr,
      unit: 'dB',
      thresholds: { excellent: 35, good: 30 },
      description: 'Signal-to-Noise Ratio'
    },
    {
      key: 'cnr',
      label: 'CNR',
      value: qualityMetrics.cnr,
      unit: 'dB',
      thresholds: { excellent: 20, good: 17 },
      description: 'Contrast-to-Noise Ratio'
    },
    {
      key: 'spatialResolution',
      label: t('spatialResolution') || 'Spatial Resolution',
      value: qualityMetrics.spatialResolution,
      unit: 'lp/mm',
      thresholds: { excellent: 10, good: 9 },
      description: 'Line pairs per millimeter'
    },
    {
      key: 'uniformity',
      label: t('uniformity') || 'Uniformity',
      value: qualityMetrics.uniformity,
      unit: '%',
      thresholds: { excellent: 95, good: 92 },
      description: 'Image uniformity'
    },
    {
      key: 'artifacts',
      label: t('artifacts') || 'Artifacts',
      value: qualityMetrics.artifacts,
      unit: '',
      thresholds: { excellent: 1, good: 2 },
      description: 'Number of visible artifacts',
      inverted: true // کمتر بهتر است
    }
  ];

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('imageQualityAssessment') || 'Image Quality Assessment'}
          </h3>
        </div>

        {/* Control Button */}
        {!assessmentStatus.isAssessing ? (
          <button
            onClick={startAssessment}
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            {t('start') || 'Start Assessment'}
          </button>
        ) : (
          <button
            onClick={stopAssessment}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            {t('stop') || 'Stop'}
          </button>
        )}
      </div>

      {assessmentStatus.isAssessing && (
        <>
          {/* Overall Status */}
          <div className={`panel p-4 rounded-lg border-2 ${overallStatus.border} ${overallStatus.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-muted mb-1">
                  {t('overallQuality') || 'Overall Quality'}
                </div>
                <div className={`text-3xl font-bold ${overallStatus.color}`}>
                  {qualityMetrics.overallQuality.toFixed(1)}%
                </div>
              </div>
              <div className={`flex items-center gap-2 ${overallStatus.color}`}>
                {overallStatus.icon}
                <span className="font-semibold">{overallStatus.text}</span>
              </div>
            </div>
          </div>

          {/* Quality Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const color = metric.inverted
                ? getQualityColor(metric.thresholds.excellent - metric.value + metric.thresholds.excellent, metric.thresholds)
                : getQualityColor(metric.value, metric.thresholds);

              return (
                <div key={metric.key} className="panel p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-muted">
                      {metric.label}
                    </span>
                    {metric.unit && (
                      <span className="text-xs text-text-muted">{metric.unit}</span>
                    )}
                  </div>

                  <div className={`text-2xl font-bold font-mono ${color}`}>
                    {metric.value.toFixed(1)}
                  </div>

                  <div className="text-xs text-text-muted">
                    {metric.description}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        color.includes('green') ? 'bg-green-500' :
                        color.includes('yellow') ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{
                        width: metric.inverted
                          ? `${Math.max(0, Math.min(100, 100 - (metric.value / 5) * 100))}%`
                          : `${Math.min(100, (metric.value / (metric.thresholds.excellent * 1.2)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assessment Info */}
          <div className="panel p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <span className="text-text-muted">{t('lastAssessment') || 'Last Assessment'}:</span>
                <span className="font-semibold text-text ml-2">
                  {assessmentStatus.lastAssessment}
                </span>
              </div>
              <div>
                <span className="text-text-muted">{t('assessments') || 'Total Assessments'}:</span>
                <span className="font-semibold text-primary ml-2">
                  {assessmentStatus.assessmentCount}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {!assessmentStatus.isAssessing && assessmentStatus.assessmentCount === 0 && (
        <div className="panel p-8 rounded-lg text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-30" />
          <p className="text-text-muted">
            {t('startAssessmentMessage') || 'Click "Start Assessment" to begin quality evaluation'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageQualityAssessment;
