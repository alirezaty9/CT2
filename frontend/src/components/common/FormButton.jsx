import React from 'react';
import { useTranslation } from 'react-i18next';
 
const FormButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';

  const baseClasses = 'font-vazir transition-all duration-200 rounded-lg font-medium';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base', 
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-background-secondary hover:bg-accent text-text-muted',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  const buttonClass = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClass}
      {...props}
    >
      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          Icon && <Icon className="w-4 h-4" />
        )}
        {children}
      </div>
    </button>
  );
};

export default FormButton;