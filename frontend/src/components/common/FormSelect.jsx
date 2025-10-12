import React from 'react';
import { useTranslation } from 'react-i18next';

const FormSelect = ({
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  className = '',
  ...props
}) => {
  const { i18n } = useTranslation();
  const textAlign = i18n.language === 'fa' ? 'text-right' : 'text-left';

  const baseClasses = `
    w-full px-3 py-2 border border-border rounded-lg
    bg-background-white dark:bg-background-secondary
    text-text dark:text-text outline-none
    focus:border-primary focus:ring-2 focus:ring-primary/20
    transition-all duration-200
    text-sm font-medium
    cursor-pointer
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
    ${textAlign}
  `;

  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default FormSelect;
