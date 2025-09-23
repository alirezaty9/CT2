import React from "react";
import PropTypes from "prop-types";
import { twMerge } from "tailwind-merge";

const IconButton = ({
  Icon,
  title = "",
  onClick = () => {},
  type = "button",
  size = "md",
  variant = "default",
  iconClassName = "",
  disabled = false,
  className = "",
  ...props
}) => {
  const sizeClasses = {
    sm: "p-1 text-sm",
    md: "p-2 text-base",
    lg: "p-3 text-lg",
  };

  const baseClasses =
    "rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        `variant-${variant}`,
        className
      )}
      {...props}
    >
      {Icon && <Icon className={twMerge("w-5 h-5", iconClassName)} />}
    </button>
  );
};

IconButton.propTypes = {
  Icon: PropTypes.elementType.isRequired,
  title: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  variant: PropTypes.oneOf(["default", "primary", "highlight"]),
  iconClassName: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default IconButton;
