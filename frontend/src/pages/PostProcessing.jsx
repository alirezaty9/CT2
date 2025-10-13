// src/pages/PostProcessing.jsx - نسخه بهینه‌شده
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../contexts/WebSocketContext';
import {
  RotateCcw, FlipHorizontal, Sparkles, Filter, Maximize, Search, Download
} from 'lucide-react';

// کامپوننت‌های مشترک
import ConnectionStatus from '../components/common/ConnectionStatus';
import FormField from '../components/common/FormField';
import FormInput from '../components/common/FormInput';
import FormSelect from '../components/common/FormSelect';
import ToggleButton from '../components/common/ToggleButton';
import FormButton from '../components/common/FormButton';
import PageContainer from '../components/common/PageContainer';
import { useFormPage } from '../hooks/useFormPage';

// کامپوننت‌های مورد 16-18
import ImageQualityAssessment from '../components/ImageQualityAssessment';
import DetectorConfiguration from '../components/DetectorConfiguration';
import AdvancedFiltering from '../components/AdvancedFiltering';

const PostProcessing = () => {
  const { t, i18n } = useTranslation();
  const { isConnected, send } = useWebSocket();

  // ✅ تنظیمات پیش‌فرض
  const defaultData = useMemo(() => ({
    rotationAngle: 'None',
    mirroring: false,
    medianFilter: false,
    gaussianFilter: false,
    gaussianSigma: '1.0',
    meanFilter: false,
    varianceFilter: false,
    pseudoColorFilter: false,
    fourierFilter: 'Low Pass',
    sharpening: false,
    kernelSize: '3x3',
    sharpeningStrength: '1.0',
    edgeDetection: false,
    threshold: '100',
    edgeMethod: 'Sobel',
    exportFormat: 'TIFF',
  }), []);

  // ✅ استفاده از hook مشترک
  const { pageData, handleChange, updateFormData } = useFormPage('postProcessing', defaultData);

  // ✅ گزینه‌های مختلف (بهینه‌شده با useMemo)
  const options = useMemo(() => ({
    rotation: [
      { value: 'None', label: t('none') },
      { value: '90°', label: t('90degree') },
      { value: '180°', label: t('180degree') },
      { value: '270°', label: t('270degree') }
    ],
    fourierFilter: [
      { value: 'Low Pass', label: t('lowPass') },
      { value: 'Band Pass', label: t('bandPass') },
      { value: 'High Pass', label: t('highPass') }
    ],
    kernelSize: [
      { value: '3x3', label: '3x3' },
      { value: '5x5', label: '5x5' },
      { value: '7x7', label: '7x7' }
    ],
    edgeMethod: [
      { value: 'Sobel', label: t('sobel') },
      { value: 'Canny', label: t('canny') },
      { value: 'Prewitt', label: t('prewitt') }
    ],
    exportFormat: [
      { value: 'TIFF', label: t('tiff') },
      { value: 'JPG', label: t('jpg') },
      { value: 'DICOM', label: t('dicom') }
    ]
  }), [t]);

  // ✅ فیلترهای تصویر (بهینه‌شده)
  const imageFilters = useMemo(() => [
    { name: 'medianFilter', label: t('medianFilter') },
    { name: 'meanFilter', label: t('meanFilter') },
    { name: 'varianceFilter', label: t('varianceFilter') },
    { name: 'pseudoColorFilter', label: t('pseudoColorFilter') }
  ], [t]);

  // ✅ اکشن‌های ساده (بهینه‌شده)
  const simpleActions = useMemo(() => [
    { key: 'Normalize', label: t('normalize'), icon: Sparkles },
    { key: 'FFT', label: t('fft'), icon: Filter },
    { key: 'FFTInverse', label: t('fftInverse'), icon: Filter }
  ], [t]);

  // ✅ Toggle handlers (بهینه‌شده)
  const toggleHandlers = {
    mirroring: useCallback(() => {
      updateFormData({ ...pageData, mirroring: !pageData.mirroring });
    }, [pageData, updateFormData]),
    
    sharpening: useCallback(() => {
      updateFormData({ ...pageData, sharpening: !pageData.sharpening });
    }, [pageData, updateFormData]),
    
    edgeDetection: useCallback(() => {
      updateFormData({ ...pageData, edgeDetection: !pageData.edgeDetection });
    }, [pageData, updateFormData])
  };

  // ✅ WebSocket Actions (بهینه‌شده)
  const handleAction = useCallback((action, value = null) => {
    if (isConnected) {
      const message = value ? `Action:${action}:${value}` : `Action:${action}`;
      if (send(message)) {
        console.log(`✅ Action ${action} sent via WebSocket`);
      } else {
        console.error(`❌ Failed to send Action ${action}`);
      }
    }
  }, [isConnected, send]);

  // ✅ RTL settings
  const isRtl = i18n.language === 'fa';
  const textAlign = isRtl ? 'text-right' : 'text-left';

  return (
    <PageContainer>
      {/* Connection Status */}
      <ConnectionStatus icon={Sparkles} />

      {/* Image Quality Assessment - مورد 16 */}
      <ImageQualityAssessment disabled={!isConnected} />

      {/* Detector Configuration - مورد 17 */}
      <DetectorConfiguration disabled={!isConnected} />

      {/* Advanced Filtering - مورد 18 */}
      <AdvancedFiltering
        disabled={!isConnected}
        onApplyFilter={(filterConfig) => {
          console.log('Filter applied:', filterConfig);
          handleAction('ApplyFilter', JSON.stringify(filterConfig));
        }}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Image Transform */}
        <FormField label={t('imageTransform')} icon={RotateCcw}>
          <div className="space-y-4">
            <FormSelect
              name="rotationAngle"
              value={pageData.rotationAngle}
              onChange={handleChange}
              options={options.rotation}
            />
            <ToggleButton
              active={pageData.mirroring}
              onClick={toggleHandlers.mirroring}
              icon={FlipHorizontal}
              disabled={!isConnected}
            />
          </div>
        </FormField>

        {/* Simple Actions */}
        <FormField label={t('basicOperations')} icon={Sparkles} showValue={false}>
          <div className="grid grid-cols-1 gap-3">
            {simpleActions.map(({ key, label, icon }) => (
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

        {/* Fourier Filters */}
        <FormField label={t('fourierFilter')} icon={Filter}>
          <div className="space-y-4">
            <FormSelect
              name="fourierFilter"
              value={pageData.fourierFilter}
              onChange={handleChange}
              options={options.fourierFilter}
            />
            <FormButton
              variant="secondary"
              icon={Filter}
              onClick={() => handleAction('FourierFilter', pageData.fourierFilter)}
              disabled={!isConnected}
            >
              {t('applyFourierFilter')}
            </FormButton>
          </div>
        </FormField>

        {/* Export */}
        <FormField label={t('exportImage')} icon={Download}>
          <div className="space-y-4">
            <FormSelect
              name="exportFormat"
              value={pageData.exportFormat}
              onChange={handleChange}
              options={options.exportFormat}
            />
            <FormButton
              variant="primary"
              icon={Download}
              onClick={() => handleAction('Export', pageData.exportFormat)}
              disabled={!isConnected}
            >
              {t('export')}
            </FormButton>
          </div>
        </FormField>

        {/* Image Filters */}
        <div className="card p-6 lg:col-span-2">
          <FormField label={t('imageFilters')} icon={Filter} showValue={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {imageFilters.map((filter) => (
                <label
                  key={filter.name}
                  className={`flex items-center gap-2 font-vazir text-text ${textAlign} cursor-pointer hover:text-primary transition-colors`}
                >
                  <input
                    type="checkbox"
                    name={filter.name}
                    checked={pageData[filter.name] || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  {filter.label}
                </label>
              ))}
              
              {/* Gaussian Filter with Sigma */}
              <div className="sm:col-span-2">
                <label className={`flex items-center gap-2 font-vazir text-text ${textAlign} cursor-pointer`}>
                  <input
                    type="checkbox"
                    name="gaussianFilter"
                    checked={pageData.gaussianFilter || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  {t('gaussianFilter')}
                </label>
                {pageData.gaussianFilter && (
                  <div className="mt-2 ml-6">
                    <FormInput
                      type="number"
                      name="gaussianSigma"
                      value={pageData.gaussianSigma}
                      onChange={handleChange}
                      placeholder={t('enterGaussianSigma')}
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}
              </div>
            </div>
          </FormField>
        </div>

        {/* Sharpening */}
        <FormField label={t('sharpening')} icon={Maximize} showValue={false}>
          <div className="space-y-4">
            <ToggleButton
              active={pageData.sharpening}
              onClick={toggleHandlers.sharpening}
              icon={Maximize}
              disabled={!isConnected}
              showStatus={true}
            />
            
            {pageData.sharpening && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-background-secondary dark:bg-accent rounded-lg">
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                    {t('kernelSize')}
                  </label>
                  <FormSelect
                    name="kernelSize"
                    value={pageData.kernelSize}
                    onChange={handleChange}
                    options={options.kernelSize}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                    {t('sharpeningStrength')}
                  </label>
                  <FormInput
                    type="number"
                    name="sharpeningStrength"
                    value={pageData.sharpeningStrength}
                    onChange={handleChange}
                    placeholder={t('enterSharpeningStrength')}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            )}
          </div>
        </FormField>

        {/* Edge Detection */}
        <FormField label={t('edgeDetection')} icon={Search} showValue={false}>
          <div className="space-y-4">
            <ToggleButton
              active={pageData.edgeDetection}
              onClick={toggleHandlers.edgeDetection}
              icon={Search}
              disabled={!isConnected}
              showStatus={true}
            />
            
            {pageData.edgeDetection && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-background-secondary dark:bg-accent rounded-lg">
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                    {t('threshold')}
                  </label>
                  <FormInput
                    type="number"
                    name="threshold"
                    value={pageData.threshold}
                    onChange={handleChange}
                    placeholder={t('enterThreshold')}
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                    {t('edgeMethod')}
                  </label>
                  <FormSelect
                    name="edgeMethod"
                    value={pageData.edgeMethod}
                    onChange={handleChange}
                    options={options.edgeMethod}
                  />
                </div>
              </div>
            )}
          </div>
        </FormField>
      </div>
    </PageContainer>
  );
};

export default PostProcessing;