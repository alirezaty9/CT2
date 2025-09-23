import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormData } from '../contexts/FormDataContext';

export const useFormPage = (pageName, defaultData) => {
  const { formData, updateFormData } = useFormData();
  const { i18n } = useTranslation();

  // ✅ ترکیب داده‌های پیش‌فرض با داده‌های ذخیره شده
  const pageData = useMemo(() => {
    const savedData = formData[pageName] || {};
    return { ...defaultData, ...savedData };
  }, [defaultData, formData, pageName]);

  // ✅ هندلر تغییر داده‌ها
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    updateFormData(pageName, {
      ...pageData,
      [name]: type === 'checkbox' ? checked : value,
    });
  }, [pageData, updateFormData, pageName]);

  // ✅ تنظیمات RTL
  const isRtl = i18n.language === 'fa';
  const flexDir = isRtl ? 'flex-row-reverse' : 'flex-row';
  const textAlign = isRtl ? 'text-right' : 'text-left';

  return {
    pageData,
    handleChange,
    updateFormData: (data) => updateFormData(pageName, data),
    isRtl,
    flexDir,
    textAlign
  };
};