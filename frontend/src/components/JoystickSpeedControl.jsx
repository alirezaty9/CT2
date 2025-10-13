import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, Zap, TrendingUp } from 'lucide-react';

const JoystickSpeedControl = ({ speed, onSpeedChange, disabled = false }) => {
  const { t } = useTranslation();

  const speedOptions = [
    {
      value: 'low',
      label: t('joystickSpeedLow') || 'Low',
      icon: Gauge,
      color: 'bg-green-500',
      description: t('lowSpeedDesc') || 'Precise movements, best for fine-tuning',
      multiplier: '1x'
    },
    {
      value: 'medium',
      label: t('joystickSpeedMedium') || 'Medium',
      icon: Zap,
      color: 'bg-yellow-500',
      description: t('mediumSpeedDesc') || 'Balanced speed for general positioning',
      multiplier: '5x'
    },
    {
      value: 'high',
      label: t('joystickSpeedHigh') || 'High',
      icon: TrendingUp,
      color: 'bg-red-500',
      description: t('highSpeedDesc') || 'Fast movements for large adjustments',
      multiplier: '10x'
    }
  ];

  return (
    <div className="card p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-text dark:text-text">
          {t('joystickSpeed')}
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {speedOptions.map((option) => {
          const Icon = option.icon;
          const isActive = speed?.toLowerCase() === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onSpeedChange(option.value)}
              disabled={disabled}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${isActive
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border hover:border-primary/50 hover:bg-background-secondary/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${option.color} bg-opacity-20`}>
                  <Icon className={`w-5 h-5 ${option.color.replace('bg-', 'text-')}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-text dark:text-text">
                      {option.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {option.multiplier}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted dark:text-text-muted">
                    {option.description}
                  </p>

                  {isActive && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${option.color} animate-pulse`}></div>
                      <span className="text-xs font-medium text-primary">
                        {t('active') || 'Active'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Speed Indicator */}
      <div className="mt-4 p-3 panel rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted dark:text-text-muted">
            {t('currentSpeed') || 'Current Speed'}:
          </span>
          <span className="text-sm font-semibold text-text dark:text-text">
            {speedOptions.find(opt => opt.value === speed?.toLowerCase())?.label || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default JoystickSpeedControl;
