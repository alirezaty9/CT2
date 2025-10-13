import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Download, Trash2, Pause, Play } from 'lucide-react';

const XrayExposureLog = ({ tubeParams }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [maxLogs, setMaxLogs] = useState(50);
  const logContainerRef = useRef(null);

  // افزودن لاگ جدید
  useEffect(() => {
    if (!isPaused && tubeParams) {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('en-GB'),
        voltage: tubeParams.voltage || 0,
        current: tubeParams.current || 0,
        power: tubeParams.power || 0,
        exposureTime: tubeParams.exposureTime || 0,
        temperature: tubeParams.temperature || 0,
      };

      setLogs(prevLogs => {
        const updatedLogs = [newLog, ...prevLogs];
        // حداکثر تعداد لاگ‌ها
        return updatedLogs.slice(0, maxLogs);
      });
    }
  }, [tubeParams, isPaused, maxLogs]);

  // اسکرول خودکار به آخرین لاگ
  useEffect(() => {
    if (logContainerRef.current && !isPaused) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  // دانلود لاگ‌ها به صورت CSV
  const handleDownloadLogs = () => {
    if (logs.length === 0) return;

    const headers = ['Timestamp', 'Voltage (kVp)', 'Current (mA)', 'Power (W)', 'Exposure Time (s)', 'Temperature (°C)'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log =>
        `${log.timestamp},${log.voltage},${log.current},${log.power},${log.exposureTime},${log.temperature}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `xray_exposure_log_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // پاک کردن تمام لاگ‌ها
  const handleClearLogs = () => {
    setLogs([]);
  };

  // تغییر وضعیت pause/play
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="card p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('xrayExposureLog') || 'X-ray Tube & Exposure Log'}
          </h3>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-sm"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                <span>{t('resume') || 'Resume'}</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>{t('pause') || 'Pause'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('download') || 'Download'}</span>
          </button>

          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('clear') || 'Clear'}</span>
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3 text-sm text-text-muted dark:text-text-muted">
        {t('totalLogs') || 'Total logs'}: {logs.length} / {maxLogs}
        {isPaused && (
          <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
            ({t('paused') || 'Paused'})
          </span>
        )}
      </div>

      {/* Log Table */}
      <div
        ref={logContainerRef}
        className="overflow-auto max-h-[400px] border border-border rounded-lg"
      >
        <table className="w-full text-sm">
          <thead className="bg-background-secondary dark:bg-background-primary sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-text dark:text-text border-b border-border">
                {t('time') || 'Time'}
              </th>
              <th className="px-3 py-2 text-right font-medium text-text dark:text-text border-b border-border">
                {t('voltage')} (kVp)
              </th>
              <th className="px-3 py-2 text-right font-medium text-text dark:text-text border-b border-border">
                {t('current')} (mA)
              </th>
              <th className="px-3 py-2 text-right font-medium text-text dark:text-text border-b border-border">
                {t('power')} (W)
              </th>
              <th className="px-3 py-2 text-right font-medium text-text dark:text-text border-b border-border">
                {t('exposureTime')} (s)
              </th>
              <th className="px-3 py-2 text-right font-medium text-text dark:text-text border-b border-border">
                {t('temperature')} (°C)
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center text-text-muted dark:text-text-muted">
                  {t('noLogsYet') || 'No logs recorded yet'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-background-secondary/50 dark:hover:bg-background-primary/50 transition-colors"
                >
                  <td className="px-3 py-2 text-text dark:text-text border-b border-border/50 font-mono text-xs">
                    {log.timestamp}
                  </td>
                  <td className="px-3 py-2 text-right text-text dark:text-text border-b border-border/50 font-mono">
                    {log.voltage}
                  </td>
                  <td className="px-3 py-2 text-right text-text dark:text-text border-b border-border/50 font-mono">
                    {log.current}
                  </td>
                  <td className="px-3 py-2 text-right text-text dark:text-text border-b border-border/50 font-mono">
                    {log.power}
                  </td>
                  <td className="px-3 py-2 text-right text-text dark:text-text border-b border-border/50 font-mono">
                    {log.exposureTime}
                  </td>
                  <td className="px-3 py-2 text-right text-text dark:text-text border-b border-border/50 font-mono">
                    {log.temperature}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default XrayExposureLog;
