import React from 'react';
import { useTranslation } from 'react-i18next';

const ToggleButton = ({
  active,
  onClick,
  icon: Icon,
  label,
  disabled = false,
  className = '',
  showStatus = true
}) => {
  const { t, i18n } = useTranslation();
  const textAlign = i18n.language === 'fa' ? 'text-right' : 'text-left';

  const buttonClasses = `
    h-10 px-4 rounded-lg font-medium transition-all duration-200
    ${active
      ? 'bg-primary hover:bg-primary-dark text-white shadow-md'
      : 'bg-background-secondary hover:bg-accent text-text-muted'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div>
      {showStatus && (
        <div className="flex items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${active ? 'bg-primary' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-medium transition-colors duration-200 ${
              active ? 'text-primary dark:text-primary' : 'text-text-muted dark:text-text-muted'
            } ${textAlign}`}>
              {active ? t('active') : t('inactive')}
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={buttonClasses}
      >
        <div className="flex items-center justify-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          <span>{label || (active ? t('active') : t('inactive'))}</span>
        </div>
      </button>
    </div>
  );
};

export default ToggleButton;