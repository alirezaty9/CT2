// src/pages/ProjectionAcquisition.jsx - نسخه بهینه‌شده
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Camera, Image, Sparkles, Settings } from 'lucide-react';

// کامپوننت‌های مشترک
import ConnectionStatus from '../components/common/ConnectionStatus';
import FormField from '../components/common/FormField';
import FormInput from '../components/common/FormInput';
import FormSelect from '../components/common/FormSelect';
import ToggleButton from '../components/common/ToggleButton';
import FormButton from '../components/common/FormButton';
import PageContainer from '../components/common/PageContainer';
import { useFormPage } from '../hooks/useFormPage';

const ProjectionAcquisition = () => {
  const { t } = useTranslation();
  const { isConnected, send } = useWebSocket();

  // ✅ تنظیمات پیش‌فرض
  const defaultData = useMemo(() => ({
    imagingMode: '180°',
    multiSegmentSize: '',
    hdrStatus: false,
    energyLevel1: '80',
    energyLevel2: '120',
    imageCount: '2',
  }), []);

  // ✅ استفاده از hook مشترک
  const { pageData, handleChange, updateFormData } = useFormPage('projectionAcquisition', defaultData);

  // ✅ گزینه‌های imaging mode
  const imagingModeOptions = [
    { value: '180°', label: t('180degree') },
    { value: '360°', label: t('360degree') }
  ];

  // ✅ Toggle HDR
  const toggleHdrStatus = useCallback(() => {
    updateFormData({
      ...pageData,
      hdrStatus: !pageData.hdrStatus,
    });
  }, [pageData, updateFormData]);

  // ✅ WebSocket Actions (بهینه‌شده)
  const handleAction = useCallback((action) => {
    if (isConnected) {
      const message = `Action:${action}`;
      if (send(message)) {
        console.log(`✅ Action ${action} sent via WebSocket`);
      } else {
        console.error(`❌ Failed to send Action ${action}`);
      }
    }
  }, [isConnected, send]);

  // ✅ لیست اکشن‌ها (بهینه‌شده)
  const actions = useMemo(() => [
    { key: 'Gain', label: t('gain'), icon: Settings },
    { key: 'Offset', label: t('offset'), icon: Settings },
    { key: 'Preprocess', label: t('preprocess'), icon: Sparkles }
  ], [t]);

  return (
    <PageContainer>
      {/* Connection Status */}
      <ConnectionStatus icon={Camera} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Imaging Mode */}
        <FormField label={t('imagingMode')} icon={Camera}>
          <FormSelect
            name="imagingMode"
            value={pageData.imagingMode}
            onChange={handleChange}
            options={imagingModeOptions}
          />
        </FormField>

        {/* Multi-Segment Size */}
        <FormField 
          label={t('multiSegmentSize')} 
          icon={Image} 
          value={pageData.multiSegmentSize} 
          unit="mm"
        >
          <FormInput
            type="number"
            name="multiSegmentSize"
            value={pageData.multiSegmentSize}
            onChange={handleChange}
            placeholder={t('enterMultiSegmentSize')}
            min="0"
            step="0.1"
          />
        </FormField>

        {/* Image Adjustments - Actions */}
        <div className="card p-6 lg:col-span-2">
          <FormField label={t('imageAdjustments')} icon={Settings} showValue={false}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {actions.map(({ key, label, icon }) => (
                <FormButton
                  key={key}
                  variant="secondary"
                  icon={icon}
                  onClick={() => handleAction(key)}
                  disabled={!isConnected}
                >
                  {label}
                </FormButton>
              ))}
            </div>
          </FormField>
        </div>

        {/* HDR Section */}
        <div className="card p-6 lg:col-span-2">
          <FormField label={t('hdr')} icon={Image} showValue={false}>
            <div className="space-y-4">
              {/* HDR Toggle */}
              <ToggleButton
                active={pageData.hdrStatus}
                onClick={toggleHdrStatus}
                icon={Image}
                disabled={!isConnected}
                showStatus={true}
              />
              
              {/* HDR Settings */}
              {pageData.hdrStatus && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4 bg-background-secondary dark:bg-accent rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                      {t('energyLevel1')}
                    </label>
                    <FormInput
                      type="number"
                      name="energyLevel1"
                      value={pageData.energyLevel1}
                      onChange={handleChange}
                      placeholder={t('enterEnergyLevel1')}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                      {t('energyLevel2')}
                    </label>
                    <FormInput
                      type="number"
                      name="energyLevel2"
                      value={pageData.energyLevel2}
                      onChange={handleChange}
                      placeholder={t('enterEnergyLevel2')}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                      {t('imageCount')}
                    </label>
                    <FormInput
                      type="number"
                      name="imageCount"
                      value={pageData.imageCount}
                      onChange={handleChange}
                      placeholder={t('enterImageCount')}
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
              )}
            </div>
          </FormField>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectionAcquisition;