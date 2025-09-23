// src/pages/PositionAndOptimization.jsx - نسخه بهینه‌شده
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Move3D, Sliders, Upload } from 'lucide-react';

// کامپوننت‌های مشترک
import ConnectionStatus from '../components/common/ConnectionStatus';
import FormField from '../components/common/FormField';
import FormInput from '../components/common/FormInput';
import FormSelect from '../components/common/FormSelect';
import PageContainer from '../components/common/PageContainer';
import { useFormPage } from '../hooks/useFormPage';

const PositionAndOptimization = () => {
  const { t } = useTranslation();

  // ✅ تنظیمات پیش‌فرض
  const defaultData = useMemo(() => ({
    manipulatorX: '',
    manipulatorY: '',
    manipulatorZ: '',
    manipulatorTheta: '',
    manipulatorGamma: '',
    joystickSpeed: 'Medium',
    uploadedFile: null,
  }), []);

  // ✅ استفاده از hook مشترک
  const { pageData, handleChange, updateFormData } = useFormPage('positionAndOptimization', defaultData);

  // ✅ گزینه‌های joystick speed
  const joystickSpeedOptions = [
    { value: 'Low', label: t('joystickSpeedLow') },
    { value: 'Medium', label: t('joystickSpeedMedium') },
    { value: 'High', label: t('joystickSpeedHigh') }
  ];

  // ✅ فیلدهای manipulator (بهینه‌شده با useMemo)
  const manipulatorFields = useMemo(() => [
    { name: 'manipulatorX', label: t('manipulatorX'), placeholder: t('enterManipulatorX') },
    { name: 'manipulatorY', label: t('manipulatorY'), placeholder: t('enterManipulatorY') },
    { name: 'manipulatorZ', label: t('manipulatorZ'), placeholder: t('enterManipulatorZ') },
    { name: 'manipulatorTheta', label: t('manipulatorTheta'), placeholder: t('enterManipulatorTheta') },
    { name: 'manipulatorGamma', label: t('manipulatorGamma'), placeholder: t('enterManipulatorGamma') }
  ], [t]);

  // ✅ آپلود فایل (بهینه‌شده)
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    updateFormData({
      ...pageData,
      uploadedFile: file ? file.name : null,
    });
  }, [pageData, updateFormData]);

  return (
    <PageContainer>
      {/* Connection Status */}
      <ConnectionStatus icon={Move3D} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Manipulator Section */}
        <div className="card p-6 lg:col-span-2">
          <FormField label={t('manipulator')} icon={Move3D} showValue={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {manipulatorFields.map((field) => (
                <div key={field.name}>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 font-vazir block">
                    {field.label}
                  </label>
                  <FormInput
                    type="number"
                    name={field.name}
                    value={pageData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    step="0.1"
                  />
                </div>
              ))}
            </div>
          </FormField>
        </div>

        {/* Joystick Speed */}
        <FormField label={t('joystickSpeed')} icon={Sliders}>
          <FormSelect
            name="joystickSpeed"
            value={pageData.joystickSpeed}
            onChange={handleChange}
            options={joystickSpeedOptions}
          />
        </FormField>

        {/* File Upload */}
        <FormField label={t('uploadFile')} icon={Upload}>
          <input
            type="file"
            name="uploadedFile"
            onChange={handleFileUpload}
            className="w-full p-3 border border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:shadow-sm focus:shadow-primary/50 transition-colors font-vazir"
          />
          {pageData.uploadedFile && (
            <div className="mt-2">
              <span className="text-sm text-primary dark:text-primary font-medium font-vazir">
                {t('selectedFile')}: {pageData.uploadedFile}
              </span>
            </div>
          )}
        </FormField>
      </div>
    </PageContainer>
  );
};

export default PositionAndOptimization;