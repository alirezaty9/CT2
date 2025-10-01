import React, { useState, useCallback } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import {
  LayoutDashboard,
  Move3D,
  Focus,
  ImagePlus,
  Wrench,
  Settings,
  Sparkles,
} from "lucide-react";
import BaslerTools from "./Toolbar";
import TabNav from "./TabNav";
import IconButton from "./common/IconButton";
import { useTranslation } from "react-i18next";
import BaslerDisplay from "./Camera/BaslerDisplay";
import MonitoringDisplay from "./Camera/MonitoringDisplay";
import HistogramDisplay from "./HistogramDisplay";

// تب‌های بالا
const tabs = [
  {
    to: "/initial",
    label: "initial",
    icon: <LayoutDashboard className="w-4 h-4 mr-1" />,
  },
  {
    to: "/position",
    label: "position",
    icon: <Move3D className="w-4 h-4 mr-1" />,
  },
  {
    to: "/projection",
    label: "projection",
    icon: <Focus className="w-4 h-4 mr-1" />,
  },
  {
    to: "/post-processing",
    label: "postProcessing",
    icon: <Wrench className="w-4 h-4 mr-1" />,
  },
  {
    to: "/reconstruction",
    label: "reconstruction",
    icon: <ImagePlus className="w-4 h-4 mr-1" />,
  },
];

// دکمه انتخاب زبان
const LanguageButton = ({ lng, current, onClick }) => (
  <button
    onClick={() => onClick(lng)}
    className={twMerge(
      "px-2 py-1 text-sm rounded-md",
      current === lng
        ? "bg-primary text-white"
        : "bg-background-secondary text-text-muted"
    )}
  >
    {lng.toUpperCase()}
  </button>
);

// پنل پایین (وضعیت سیستم و دوربین)
const BottomPanels = ({ t }) => (
  <div className="h-40 md:h-44 flex gap-4 py-1 px-4 pt-0">
    <div className="panel flex-1 flex items-center justify-center text-sm dark:text-text">
      {t("systemStatus")}
    </div>
    <div className="card h-40 md:h-44 border border-black">
      <MonitoringDisplay />
    </div>
  </div>
);

// کامپوننت اصلی Layout
const Layout = () => {
  const location = useLocation();
  const defaultActive = location.pathname.includes("settings")
    ? "Settings"
    : null;

  const [activeButton, setActiveButton] = useState(defaultActive);
  const { t, i18n } = useTranslation();

  const handleButtonClick = useCallback((name) => {
    setActiveButton(name);
  }, []);

  const changeLanguage = useCallback(
    (lng) => {
      i18n.changeLanguage(lng);
      console.log("Changed language to:", lng);
    },
    [i18n]
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen max-h-screen gap-4 p-4 bg-background dark:bg-background overflow-hidden">
      {/* ستون چپ - 2/3 عرض */}
      <div className="w-full md:w-5/12 flex flex-col gap-4 min-h-0">
        <div className="card flex-1 flex flex-col min-h-0">
          {/* نوار بالا - ارتفاع ثابت */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary dark:bg-background-secondary dark:border-border rounded-t-xl">
            <TabNav
              tabs={tabs.map((tab) => ({ ...tab, label: t(tab.label) }))}
            />
            <div className="flex gap-2 items-center">
              <Link to="/settings">
                <IconButton
                  Icon={Settings}
                  title={t("settings")}
                  variant={activeButton === "Settings" ? "primary" : "default"}
                  size="md"
                  onClick={() => handleButtonClick("Settings")}
                />
              </Link>
            </div>
          </div>

          {/* محتوای مرکزی - flex-1 برای باقی فضا */}
          <div className="flex-1 min-h-0 px-6 py-4">
            <div className="h-full overflow-auto rounded-md">
              <Outlet />
            </div>
          </div>

          {/* وضعیت سیستم / دوربین - ارتفاع ثابت */}
          <div className="flex-shrink-0">
            <BottomPanels t={t} />
          </div>
        </div>
      </div>

      {/* ستون راست - 1/3 عرض */}
      <div className="w-full md:w-7/12 flex flex-col gap-4 min-h-0">
        {/* بخش بالا - تصویر باسلر */}
        <div className="flex-1 flex flex-col gap-0 min-h-0">
          <div className="card flex-1 rounded-b-none border-b-0 relative overflow-hidden flex min-h-0">
            <BaslerTools />
            <div className="flex-1 min-h-0">
              <BaslerDisplay />
            </div>
          </div>
          {/* Image Reel - ارتفاع ثابت */}
          <div className="card flex-shrink-0 rounded-t-none border-t-0 text-text dark:text-text font-medium text-center p-4">
            {t("imageReel")}
          </div>
        </div>

        {/* هیستوگرام - ارتفاع ثابت */}
        <div className="card flex-shrink-0 h-40 md:h-44 p-4">
          <HistogramDisplay />
        </div>
      </div>
    </div>
  );
};

export default Layout;
