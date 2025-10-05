import React from 'react';
import { useTranslation } from 'react-i18next';

const FormInput = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  disabled = false,
  className = '',
  ...props
}) => {
  const { i18n } = useTranslation();
  const textAlign = i18n.language === 'fa' ? 'text-right' : 'text-left';

  const baseClasses = `
    w-full p-2 sm:p-3 border border-border rounded-lg 
    bg-background-white dark:bg-background-secondary 
    text-text dark:text-text outline-none 
    focus:border-primary focus:shadow-sm focus:shadow-primary/50 
    transition-colors text-sm sm:text-base
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
    ${textAlign}
  `;

  return (
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
};

export default FormInput;