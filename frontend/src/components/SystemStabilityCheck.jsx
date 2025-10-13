import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Thermometer,
  Zap,
  Lock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Gauge
} from 'lucide-react';

const SystemStabilityCheck = ({ onStatusChange }) => {
  const { t } = useTranslation();

  // وضعیت‌های مختلف سیستم
  const [systemStatus, setSystemStatus] = useState({
    interlock: { status: 'ok', value: 'Closed', message: '' },
    temperature: { status: 'ok', value: 25.5, message: '' },
    voltage: { status: 'ok', value: 220, message: '' },
    pressure: { status: 'ok', value: 1.0, message: '' },
    cooling: { status: 'ok', value: 'Active', message: '' },
  });

  // شبیه‌سازی دریافت داده از backend
  useEffect(() => {
    const interval = setInterval(() => {
      // شبیه‌سازی تغییرات تصادفی برای نمایش
      const newTemp = 25 + Math.random() * 10;
      const newVoltage = 215 + Math.random() * 10;

      const newStatus = {
        interlock: {
          status: Math.random() > 0.1 ? 'ok' : 'warning',
          value: Math.random() > 0.1 ? 'Closed' : 'Open',
          message: Math.random() > 0.1 ? '' : 'Door is open'
        },
        temperature: {
          status: newTemp < 30 ? 'ok' : newTemp < 35 ? 'warning' : 'error',
          value: newTemp.toFixed(1),
          message: newTemp > 30 ? 'Temperature is high' : ''
        },
        voltage: {
          status: Math.abs(newVoltage - 220) < 5 ? 'ok' : Math.abs(newVoltage - 220) < 10 ? 'warning' : 'error',
          value: newVoltage.toFixed(1),
          message: Math.abs(newVoltage - 220) > 5 ? 'Voltage unstable' : ''
        },
        pressure: {
          status: 'ok',
          value: (0.95 + Math.random() * 0.1).toFixed(2),
          message: ''
        },
        cooling: {
          status: Math.random() > 0.05 ? 'ok' : 'error',
          value: Math.random() > 0.05 ? 'Active' : 'Inactive',
          message: Math.random() > 0.05 ? '' : 'Cooling system failed'
        },
      };

      setSystemStatus(newStatus);

      // اطلاع به والد در مورد وضعیت کلی
      const hasError = Object.values(newStatus).some(s => s.status === 'error');
      const hasWarning = Object.values(newStatus).some(s => s.status === 'warning');

      if (onStatusChange) {
        onStatusChange({
          overallStatus: hasError ? 'error' : hasWarning ? 'warning' : 'ok',
          details: newStatus
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [onStatusChange]);

  // تابع برای انتخاب آیکون بر اساس وضعیت
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // تابع برای انتخاب رنگ بر اساس وضعیت
  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // آیتم‌های بررسی
  const checkItems = [
    {
      key: 'interlock',
      label: t('interlock') || 'Interlock',
      icon: Lock,
      unit: ''
    },
    {
      key: 'temperature',
      label: t('temperature') || 'Temperature',
      icon: Thermometer,
      unit: '°C'
    },
    {
      key: 'voltage',
      label: t('voltage'),
      icon: Zap,
      unit: 'V'
    },
    {
      key: 'pressure',
      label: t('pressure') || 'Pressure',
      icon: Gauge,
      unit: 'bar'
    },
    {
      key: 'cooling',
      label: t('coolingSystem') || 'Cooling System',
      icon: Shield,
      unit: ''
    }
  ];

  return (
    <div className="card p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-text dark:text-text">
          {t('systemStabilityCheck') || 'System Stability Check'}
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checkItems.map(({ key, label, icon: Icon, unit }) => {
          const item = systemStatus[key];
          return (
            <div
              key={key}
              className={`panel p-4 rounded-lg border-2 transition-all ${getStatusColor(item.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-text-muted dark:text-text-muted" />
                  <span className="text-sm font-medium text-text dark:text-text">
                    {label}
                  </span>
                </div>
                {getStatusIcon(item.status)}
              </div>

              <div className="mt-2">
                <div className="text-xl font-bold font-mono text-text dark:text-text">
                  {item.value} {unit}
                </div>
                {item.message && (
                  <div className="text-xs text-text-muted dark:text-text-muted mt-1">
                    {item.message}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemStabilityCheck;
