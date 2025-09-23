import React from "react";
import { NavLink } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";

const TabNav = ({ tabs }) => {
  const { i18n, t } = useTranslation();

  // دیباگ


  return (
    <div
      className={twMerge("flex gap-2", i18n.language === "fa" ? "font-vazir" : "")}
      dir={i18n.language === "fa" ? "rtl" : "ltr"}
    >
      {tabs.map((tab, index) => (
        <NavLink
          key={index}
          to={tab.to}
          className={({ isActive }) =>
            twMerge(
              "px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center",
              isActive ? "tab-active" : "tab-inactive"
            )
          }
        >
          {tab.icon}
          <span className={i18n.language === "fa" ? "mr-1" : "ml-1"}>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default TabNav;