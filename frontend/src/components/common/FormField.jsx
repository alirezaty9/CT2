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
      className={`card p-6 transition-all duration-200 hover:shadow-md ${className}`}
    >
      {" "}
      <div className={`flex items-center justify-between mb-3 ${flexDir}`}>
        {" "}
        <div className={`flex items-center gap-2 ${flexDir}`}>
          {" "}
          {Icon && <Icon className="w-5 h-5 text-primary" />}{" "}
          <label
            className={`font-medium text-text dark:text-text font-vazir ${textAlign}`}
          >
            {" "}
            {label}{" "}
          </label>{" "}
        </div>{" "}
        {showValue && value && (
          <span
            className={`text-sm text-primary dark:text-primary font-medium font-vazir ${textAlign}`}
          >
            {" "}
            {value} {unit}{" "}
          </span>
        )}{" "}
      </div>{" "}
      {children}{" "}
    </div>
  );
};
export default FormField;
