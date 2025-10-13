import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Zap, Thermometer, Gauge, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const RealtimeMonitoringDashboard = ({ disabled = false }) => {
  const { t } = useTranslation();

  // داده‌های لحظه‌ای سیستم
  const [systemData, setSystemData] = useState({
    // پارامترهای اصلی
    xrayVoltage: 0,
    xrayCurrent: 0,
    xrayPower: 0,
    tubeTemperature: 0,

    // پارامترهای آشکارساز
    detectorTemperature: 0,
    detectorFrameRate: 0,
    detectorExposure: 0,

    // پارامترهای محیطی
    cabinetTemperature: 0,
    coolingFlowRate: 0,
    vacuumPressure: 0,

    // پارامترهای عملکردی
    acquisitionProgress: 0,
    imagesAcquired: 0,
    dataTransferRate: 0,
    systemLoad: 0
  });

  // سابقه داده‌ها (برای نمودارهای ساده)
  const [dataHistory, setDataHistory] = useState({
    voltage: [],
    current: [],
    temperature: [],
    power: []
  });

  // هشدارها
  const [alerts, setAlerts] = useState([]);

  // شبیه‌سازی داده‌های لحظه‌ای
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = {
        xrayVoltage: 100 + Math.random() * 40, // 100-140 kVp
        xrayCurrent: 150 + Math.random() * 100, // 150-250 mA
        xrayPower: 15 + Math.random() * 10, // 15-25 kW
        tubeTemperature: 45 + Math.random() * 15, // 45-60 °C

        detectorTemperature: -20 + Math.random() * 2, // -20 to -18 °C
        detectorFrameRate: 8 + Math.random() * 4, // 8-12 fps
        detectorExposure: 80 + Math.random() * 40, // 80-120 ms

        cabinetTemperature: 22 + Math.random() * 3, // 22-25 °C
        coolingFlowRate: 18 + Math.random() * 4, // 18-22 L/min
        vacuumPressure: 1e-6 + Math.random() * 1e-6, // 1-2 ×10⁻⁶ mbar

        acquisitionProgress: Math.min(100, systemData.acquisitionProgress + Math.random() * 5),
        imagesAcquired: Math.floor(systemData.imagesAcquired + Math.random() * 3),
        dataTransferRate: 50 + Math.random() * 50, // 50-100 MB/s
        systemLoad: 40 + Math.random() * 30 // 40-70%
      };

      setSystemData(newData);

      // به‌روزرسانی سابقه
      setDataHistory(prev => ({
        voltage: [...prev.voltage.slice(-19), newData.xrayVoltage],
        current: [...prev.current.slice(-19), newData.xrayCurrent],
        temperature: [...prev.temperature.slice(-19), newData.tubeTemperature],
        power: [...prev.power.slice(-19), newData.xrayPower]
      }));

      // بررسی هشدارها
      const newAlerts = [];
      if (newData.tubeTemperature > 55) {
        newAlerts.push({
          id: Date.now(),
          severity: 'warning',
          message: t('tubeTempHigh') || 'Tube temperature is high',
          value: `${newData.tubeTemperature.toFixed(1)}°C`
        });
      }
      if (newData.xrayPower > 23) {
        newAlerts.push({
          id: Date.now() + 1,
          severity: 'warning',
          message: t('powerHigh') || 'X-ray power is high',
          value: `${newData.xrayPower.toFixed(1)} kW`
        });
      }
      if (newData.coolingFlowRate < 19) {
        newAlerts.push({
          id: Date.now() + 2,
          severity: 'warning',
          message: t('coolingFlowLow') || 'Cooling flow rate is low',
          value: `${newData.coolingFlowRate.toFixed(1)} L/min`
        });
      }
      setAlerts(newAlerts);
    }, 1000);

    return () => clearInterval(interval);
  }, [systemData.acquisitionProgress, systemData.imagesAcquired, t]);

  // کامپوننت نمایش متریک
  const MetricCard = ({ icon: Icon, label, value, unit, color, trend }) => (
    <div className="panel p-4 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <span className="text-xs font-medium text-text-muted">{label}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold text-${color}-600`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-text-muted">{unit}</span>
      </div>
    </div>
  );

  // کامپوننت نمودار ساده
  const MiniChart = ({ data, color }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-12">
        {data.map((value, index) => (
          <div
            key={index}
            className={`flex-1 bg-${color}-500 rounded-t transition-all`}
            style={{
              height: `${((value - min) / range) * 100}%`,
              opacity: 0.3 + (index / data.length) * 0.7
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('realtimeMonitoring') || 'Real-time Monitoring Dashboard'}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span className="font-semibold">{t('active') || 'Active'}</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                alert.severity === 'warning'
                  ? 'bg-yellow-500/10 border-2 border-yellow-500/30'
                  : 'bg-red-500/10 border-2 border-red-500/30'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${alert.severity === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
              <div className="flex-1">
                <span className="text-sm font-medium text-text">{alert.message}</span>
              </div>
              <span className="text-sm font-bold text-text">{alert.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Zap}
          label={t('voltage') || 'Voltage'}
          value={systemData.xrayVoltage}
          unit="kVp"
          color="blue"
          trend={dataHistory.voltage.length > 1 ? ((dataHistory.voltage[dataHistory.voltage.length - 1] - dataHistory.voltage[dataHistory.voltage.length - 2]) / dataHistory.voltage[dataHistory.voltage.length - 2]) * 100 : 0}
        />
        <MetricCard
          icon={Zap}
          label={t('current') || 'Current'}
          value={systemData.xrayCurrent}
          unit="mA"
          color="purple"
          trend={dataHistory.current.length > 1 ? ((dataHistory.current[dataHistory.current.length - 1] - dataHistory.current[dataHistory.current.length - 2]) / dataHistory.current[dataHistory.current.length - 2]) * 100 : 0}
        />
        <MetricCard
          icon={Gauge}
          label={t('power') || 'Power'}
          value={systemData.xrayPower}
          unit="kW"
          color="green"
          trend={dataHistory.power.length > 1 ? ((dataHistory.power[dataHistory.power.length - 1] - dataHistory.power[dataHistory.power.length - 2]) / dataHistory.power[dataHistory.power.length - 2]) * 100 : 0}
        />
        <MetricCard
          icon={Thermometer}
          label={t('tubeTemp') || 'Tube Temp'}
          value={systemData.tubeTemperature}
          unit="°C"
          color="red"
          trend={dataHistory.temperature.length > 1 ? ((dataHistory.temperature[dataHistory.temperature.length - 1] - dataHistory.temperature[dataHistory.temperature.length - 2]) / dataHistory.temperature[dataHistory.temperature.length - 2]) * 100 : 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="panel p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
            {t('voltage') || 'Voltage'} ({t('last20s') || 'Last 20s'})
          </h4>
          <MiniChart data={dataHistory.voltage} color="blue" />
        </div>
        <div className="panel p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
            {t('current') || 'Current'} ({t('last20s') || 'Last 20s'})
          </h4>
          <MiniChart data={dataHistory.current} color="purple" />
        </div>
        <div className="panel p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
            {t('power') || 'Power'} ({t('last20s') || 'Last 20s'})
          </h4>
          <MiniChart data={dataHistory.power} color="green" />
        </div>
        <div className="panel p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
            {t('temperature') || 'Temperature'} ({t('last20s') || 'Last 20s'})
          </h4>
          <MiniChart data={dataHistory.temperature} color="red" />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="panel p-3 rounded-lg">
          <div className="text-xs text-text-muted mb-1">{t('detectorTemp') || 'Detector Temp'}</div>
          <div className="text-lg font-bold text-text">{systemData.detectorTemperature.toFixed(1)}°C</div>
        </div>
        <div className="panel p-3 rounded-lg">
          <div className="text-xs text-text-muted mb-1">{t('frameRate') || 'Frame Rate'}</div>
          <div className="text-lg font-bold text-text">{systemData.detectorFrameRate.toFixed(1)} fps</div>
        </div>
        <div className="panel p-3 rounded-lg">
          <div className="text-xs text-text-muted mb-1">{t('exposure') || 'Exposure'}</div>
          <div className="text-lg font-bold text-text">{systemData.detectorExposure.toFixed(0)} ms</div>
        </div>
        <div className="panel p-3 rounded-lg">
          <div className="text-xs text-text-muted mb-1">{t('coolingFlow') || 'Cooling Flow'}</div>
          <div className="text-lg font-bold text-text">{systemData.coolingFlowRate.toFixed(1)} L/min</div>
        </div>
        <div className="panel p-3 rounded-lg">
          <div className="text-xs text-text-muted mb-1">{t('dataRate') || 'Data Rate'}</div>
          <div className="text-lg font-bold text-text">{systemData.dataTransferRate.toFixed(0)} MB/s</div>
        </div>
        <div className="panel p-3 rounded-lg">
          <div className="text-xs text-text-muted mb-1">{t('systemLoad') || 'System Load'}</div>
          <div className="text-lg font-bold text-text">{systemData.systemLoad.toFixed(0)}%</div>
        </div>
      </div>

      {/* Acquisition Progress */}
      <div className="panel p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text dark:text-text">
            {t('acquisitionProgress') || 'Acquisition Progress'}
          </h4>
          <span className="text-sm font-mono font-bold text-primary">
            {systemData.acquisitionProgress.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${systemData.acquisitionProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>{t('imagesAcquired') || 'Images Acquired'}: {systemData.imagesAcquired}</span>
          <span>{t('estimatedTimeRemaining') || 'Est. Time'}: {Math.max(0, Math.floor((100 - systemData.acquisitionProgress) * 2))}s</span>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMonitoringDashboard;
