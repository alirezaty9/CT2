import React from "react";
import { NavLink } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

const TabNav = ({ tabs }) => {
  const { i18n, t } = useTranslation();

  // دیباگ


  return (
    <div
      className={twMerge("flex gap-1 overflow-x-auto scrollbar-hide pb-1", i18n.language === "fa" ? "font-vazir" : "")}
      dir={i18n.language === "fa" ? "rtl" : "ltr"}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {tabs.map((tab, index) => (
        <NavLink
          key={index}
          to={tab.to}
          className={({ isActive }) =>
            twMerge(
              "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300 flex items-center whitespace-nowrap flex-shrink-0 min-w-fit",
              isActive ? "tab-active" : "tab-inactive"
            )
          }
        >
          {tab.icon}
          <span className={twMerge(
            i18n.language === "fa" ? "mr-1" : "ml-1",
            "hidden xs:inline"
          )}>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default TabNav;