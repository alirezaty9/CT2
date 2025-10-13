// src/pages/InitialParameters.jsx - نسخه بهینه‌شده
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Power, Video, VideoOff, Gauge, Zap, Battery, Filter, Clock, Layers, Settings, Camera } from 'lucide-react';

// کامپوننت‌های مشترک
import ConnectionStatus from '../components/common/ConnectionStatus';
import FormField from '../components/common/FormField';
import FormInput from '../components/common/FormInput';
import FormSelect from '../components/common/FormSelect';
import ToggleButton from '../components/common/ToggleButton';
import PageContainer from '../components/common/PageContainer';
import SystemStabilityCheck from '../components/SystemStabilityCheck';
import XrayExposureLog from '../components/XrayExposureLog';
import MonitoringDisplay from '../components/Camera/MonitoringDisplay';
import TrajectoryDefinition from '../components/TrajectoryDefinition';
import GeometryConfiguration from '../components/GeometryConfiguration';
import { useFormPage } from '../hooks/useFormPage';

// کامپوننت‌های مورد 19-20
import ScanProtocolManagement from '../components/ScanProtocolManagement';
import RealtimeMonitoringDashboard from '../components/RealtimeMonitoringDashboard';

const InitialParameters = () => {
  const { t } = useTranslation();
  const { isConnected } = useWebSocket();
  
  // ✅ تنظیمات پیش‌فرض
  const defaultData = useMemo(() => ({
    power: '',
    tubeVoltage: '',
    anodeCurrent: '',
    anodeCurrentUnit: 'mA',
    filtrationMaterial: 'Al',
    filtrationThickness: '',
    bitDepth: '8-bit',
    tubeStatus: false,
    tubeVoltageDisplay: '0',
    tubeCurrentDisplay: '0',
    exposureTime: '0',
    cabinCameraStatus: false,
    singleCalibration: '',
    rotateCalibration: '',
    fastImaging: false,
    rotationSpeed: '10',
    dualEnergy: false,
  }), []);

  // ✅ استفاده از hook مشترک
  const { pageData, handleChange, updateFormData } = useFormPage('initialParameters', defaultData);

  // ✅ حالت‌های محلی (فقط برای toggle ها)
  const [activeButton, setActiveButton] = useState(null);

  // ✅ گزینه‌های dropdown ها
  const anodeCurrentOptions = [
    { value: 'mA', label: 'mA' },
    { value: 'μA', label: 'μA' }
  ];

  const filtrationOptions = [
    { value: 'Al', label: t('aluminum') },
    { value: 'Cu', label: t('copper') },
    { value: 'Ag', label: t('silver') }
  ];

  const bitDepthOptions = [
    { value: '8-bit', label: t('8bit') },
    { value: '16-bit', label: t('16bit') }
  ];

  // ✅ Toggle handlers
  const toggleTubeStatus = useCallback(() => {
    const newStatus = !pageData.tubeStatus;
    updateFormData({
      ...pageData,
      tubeStatus: newStatus,
      tubeVoltageDisplay: newStatus ? '100' : '0',
      tubeCurrentDisplay: newStatus ? '10' : '0',
    });
  }, [pageData, updateFormData]);

  const toggleCabinCamera = useCallback(() => {
    updateFormData({
      ...pageData,
      cabinCameraStatus: !pageData.cabinCameraStatus,
    });
  }, [pageData, updateFormData]);

  const toggleFastImaging = useCallback(() => {
    updateFormData({
      ...pageData,
      fastImaging: !pageData.fastImaging,
    });
  }, [pageData, updateFormData]);

  const toggleDualEnergy = useCallback(() => {
    updateFormData({
      ...pageData,
      dualEnergy: !pageData.dualEnergy,
    });
  }, [pageData, updateFormData]);

  // ✅ Preset handlers
  const presetHandlers = {
    standard: () => {
      setActiveButton('standard');
      updateFormData({ ...pageData, power: '50', tubeVoltage: '120', anodeCurrent: '10' });
    },
    highPower: () => {
      setActiveButton('highPower');
      updateFormData({ ...pageData, power: '100', tubeVoltage: '150', anodeCurrent: '20' });
    },
    clear: () => {
      setActiveButton('clear');
      updateFormData({ ...defaultData });
    }
  };

  return (
    <PageContainer>
      {/* Connection Status */}
      <ConnectionStatus icon={Zap} />

      {/* System Stability Check */}
      <SystemStabilityCheck onStatusChange={(status) => {
        console.log('System Status:', status);
      }} />

      {/* Quick Actions */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries({
            standard: t('presetStandard'),
            highPower: t('presetHighPower'),
            clear: t('clearAll')
          }).map(([key, label]) => (
            <button
              key={key}
              onClick={presetHandlers[key]}
              className={`h-10 px-4 variant-primary rounded-lg border border-border transition-all duration-200 text-sm font-medium flex-shrink-0 ${
                activeButton === key ? 'button-active' : ''
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* Power */}
        <FormField label={t('power')} icon={Gauge} value={pageData.power} unit="W">
          <FormInput
            type="number"
            name="power"
            value={pageData.power}
            onChange={handleChange}
            placeholder={t('enterPower')}
            min="0"
            step="1"
          />
        </FormField>

        {/* Tube Voltage */}
        <FormField label={t('tubeVoltage')} icon={Zap} value={pageData.tubeVoltage} unit="kVp">
          <FormInput
            type="number"
            name="tubeVoltage"
            value={pageData.tubeVoltage}
            onChange={handleChange}
            placeholder={t('enterTubeVoltage')}
            min="0"
            step="0.1"
          />
        </FormField>

        {/* Anode Current */}
        <FormField 
          label={t('anodeCurrent')} 
          icon={Battery} 
          value={pageData.anodeCurrent} 
          unit={pageData.anodeCurrentUnit}
        >
          <div className="flex gap-3">
            <FormInput
              type="number"
              name="anodeCurrent"
              value={pageData.anodeCurrent}
              onChange={handleChange}
              placeholder={t('enterAnodeCurrent')}
              min="0"
              step="0.1"
              className="flex-1"
            />
            <FormSelect
              name="anodeCurrentUnit"
              value={pageData.anodeCurrentUnit}
              onChange={handleChange}
              options={anodeCurrentOptions}
              className="w-20"
            />
          </div>
        </FormField>

        {/* Filtration */}
        <FormField label={t('filtration')} icon={Filter}>
          <div className="flex gap-3">
            <FormSelect
              name="filtrationMaterial"
              value={pageData.filtrationMaterial}
              onChange={handleChange}
              options={filtrationOptions}
              className="flex-1"
            />
            <FormInput
              type="number"
              name="filtrationThickness"
              value={pageData.filtrationThickness}
              onChange={handleChange}
              placeholder={t('enterThickness')}
              min="0"
              step="0.01"
              className="w-28"
            />
          </div>
        </FormField>

        {/* Exposure Time */}
        <FormField label={t('exposureTime')} icon={Clock}>
          <FormInput
            type="text"
            value={pageData.exposureTime}
            disabled
            className="bg-background-secondary dark:bg-accent cursor-not-allowed"
          />
        </FormField>

        {/* Bit Depth */}
        <FormField label={t('bitDepth')} icon={Layers}>
          <FormSelect
            name="bitDepth"
            value={pageData.bitDepth}
            onChange={handleChange}
            options={bitDepthOptions}
          />
        </FormField>

        {/* Single Calibration */}
        <FormField label={t('singleCalibration')} icon={Settings} value={pageData.singleCalibration}>
          <FormInput
            type="number"
            name="singleCalibration"
            value={pageData.singleCalibration}
            onChange={handleChange}
            placeholder={t('enterSingleCalibration')}
            min="0"
            step="0.1"
          />
        </FormField>

        {/* Rotate Calibration */}
        <FormField label={t('rotateCalibration')} icon={Settings} value={pageData.rotateCalibration}>
          <FormInput
            type="number"
            name="rotateCalibration"
            value={pageData.rotateCalibration}
            onChange={handleChange}
            placeholder={t('enterRotateCalibration')}
            min="0"
            step="0.1"
          />
        </FormField>

        {/* Tube Status */}
        <div className="card p-6 lg:col-span-2">
          <FormField label={t('tubeStatus')} icon={Power} showValue={false}>
            <ToggleButton
              active={pageData.tubeStatus}
              onClick={toggleTubeStatus}
              icon={Power}
              disabled={!isConnected}
            />
          <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4">
            {[
              { label: t('voltage'), value: pageData.tubeVoltageDisplay, unit: 'kVp' },
              { label: t('current'), value: pageData.tubeCurrentDisplay, unit: 'mA' }
            ].map(({ label, value, unit }) => (
              <div key={label} className="text-center flex-1">
                <div className="text-xs sm:text-sm text-text-muted dark:text-text-muted mb-1 font-vazir">
                  {label}
                </div>
                <div className="panel px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border">
                  <span className="text-base sm:text-lg font-mono font-bold text-text dark:text-text">
                    {value}
                  </span>
                  <span className="text-xs sm:text-sm text-text-muted dark:text-text-muted ml-1 font-vazir">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </FormField>
        </div>

        {/* Fast Imaging */}
        <FormField label={t('fastImaging')} icon={Camera} showValue={false}>
          <ToggleButton
            active={pageData.fastImaging}
            onClick={toggleFastImaging}
            icon={Camera}
            disabled={!isConnected}
          />
          <div className="mt-4">
            <label className="font-medium text-text dark:text-text font-vazir mb-2 block">
              {t('rotationSpeed')}
            </label>
            <div className="flex items-center gap-2">
              <FormInput
                type="number"
                name="rotationSpeed"
                value={pageData.rotationSpeed}
                onChange={handleChange}
                placeholder={t('enterRotationSpeed')}
                min="0"
                step="0.1"
              />
              <span className="text-sm text-text-muted dark:text-text-muted font-vazir">
                rpm
              </span>
            </div>
          </div>
        </FormField>

        {/* Dual Energy */}
        <FormField label={t('dualEnergy')} icon={Zap} showValue={false}>
          <ToggleButton
            active={pageData.dualEnergy}
            onClick={toggleDualEnergy}
            icon={Zap}
            disabled={!isConnected}
          />
        </FormField>

      </div>

      {/* Cabin Camera Display */}
      <div className="card p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text dark:text-text">
              {t('cabinCameraStatus')}
            </h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              pageData.cabinCameraStatus
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {pageData.cabinCameraStatus ? t('active') : t('inactive')}
            </div>
          </div>
          <button
            onClick={toggleCabinCamera}
            disabled={!isConnected}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              pageData.cabinCameraStatus
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {pageData.cabinCameraStatus ? (
              <>
                <VideoOff className="w-4 h-4" />
                <span>{t('turnOff') || 'Turn Off'}</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>{t('turnOn') || 'Turn On'}</span>
              </>
            )}
          </button>
        </div>
        {pageData.cabinCameraStatus ? (
          <div className="rounded-lg overflow-hidden border-2 border-border">
            <MonitoringDisplay />
          </div>
        ) : (
          <div className="aspect-video bg-black rounded-lg flex flex-col items-center justify-center text-text-muted border-2 border-border">
            <VideoOff className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm">{t('cameraOff') || 'Camera is turned off'}</p>
          </div>
        )}
      </div>

      {/* Real-time Monitoring Dashboard - مورد 20 */}
      <RealtimeMonitoringDashboard disabled={!isConnected} />

      {/* Scan Protocol Management - مورد 19 */}
      <ScanProtocolManagement disabled={!isConnected} />

      {/* Trajectory Definition */}
      <TrajectoryDefinition
        onTrajectoryChange={(trajectory) => {
          console.log('Trajectory:', trajectory);
        }}
      />

      {/* Geometry Configuration */}
      <GeometryConfiguration
        onGeometryChange={(geometry) => {
          console.log('Geometry:', geometry);
        }}
      />

      {/* X-ray Exposure Log */}
      <XrayExposureLog
        tubeParams={{
          voltage: pageData.tubeVoltageDisplay,
          current: pageData.tubeCurrentDisplay,
          power: pageData.power,
          exposureTime: pageData.exposureTime,
          temperature: 25.5 + Math.random() * 5, // شبیه‌سازی دما
        }}
      />
    </PageContainer>
  );
};

export default InitialParameters;