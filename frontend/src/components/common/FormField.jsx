import React from "react";
import { useTranslation } from "react-i18next";
const FormField = ({
  label,
  icon: Icon,
  children,
  value,
  unit,
  className = "",
  showValue = true,
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "fa";
  const flexDir = isRtl ? "flex-row-reverse" : "flex-row";
  const textAlign = isRtl ? "text-right" : "text-left";
  return (
    <div
      className={`card p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${className}`}
    >
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-0`}>
        <div className={`flex items-center gap-2 ${flexDir}`}>
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />}
          <label
            className={`font-medium text-sm sm:text-base text-text dark:text-text font-vazir ${textAlign}`}
          >
            {label}
          </label>
        </div>
        {showValue && value && (
          <span
            className={`text-xs sm:text-sm text-primary dark:text-primary font-medium font-vazir ${textAlign} flex-shrink-0`}
          >
            {value} {unit}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};
export default FormField;
