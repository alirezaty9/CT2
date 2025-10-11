import React, { useState, useCallback, useRef, useEffect } from "react";
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
  ChevronDown,
} from "lucide-react";
import BaslerTools from "./Toolbar";
import TabNav from "./TabNav";
import IconButton from "./common/IconButton";
import { useTranslation } from "react-i18next";
import BaslerDisplay from "./Camera/BaslerDisplay";
import MonitoringDisplay from "./Camera/MonitoringDisplay";
import HistogramDisplay from "./HistogramDisplay";
import IntensityProfileDisplay from "./IntensityProfileDisplay";
import { LayerManager } from "./Layers";

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
  <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 py-2 px-2 sm:px-4">
    <div className="panel bg-red-500 flex-1 flex items-center justify-center text-xs sm:text-sm dark:text-text min-h-[40px] sm:min-h-[50px] md:min-h-[60px] lg:min-h-[70px]">
      {t("systemStatus")}
    </div>
    <div className="card border border-black flex-shrink-0 w-full sm:w-auto h-[60px] sm:h-[70px] md:h-[90px] lg:h-[110px]">
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
  const [analysisView, setAnalysisView] = useState('histogram'); // 'histogram' or 'intensity'
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
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

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="responsive-layout gap-2 sm:gap-4 p-2 sm:p-4 bg-background dark:bg-background">
      {/* ستون چپ - در موبایل کامل عرض، در دسکتاپ 2/5 */}
      <div className="mobile-column">
        <div className="card flex-1 flex flex-col min-h-0">
          {/* نوار بالا - ارتفاع ثابت */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-border bg-background-secondary dark:bg-background-secondary dark:border-border gap-2 sm:gap-0">
            <div className="w-full sm:w-auto">
              <TabNav
                tabs={tabs.map((tab) => ({ ...tab, label: t(tab.label) }))}
              />
            </div>
            <div className="flex gap-2 items-center relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={twMerge(
                  "flex items-center gap-1 px-3 py-2 rounded-lg transition-all",
                  settingsOpen || activeButton === "Settings"
                    ? "bg-primary text-white"
                    : "bg-background-secondary text-text hover:bg-accent border border-border"
                )}
              >
                <Settings className="w-4 h-4" />
                <ChevronDown className={twMerge(
                  "w-4 h-4 transition-transform",
                  settingsOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown Menu */}
              {settingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-background-secondary dark:bg-background-primary border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <Link
                    to="/settings"
                    onClick={() => {
                      setSettingsOpen(false);
                      handleButtonClick("Settings");
                    }}
                    className="block px-4 py-2 hover:bg-accent text-text transition-colors"
                  >
                    {t("settings")}
                  </Link>
                  <div className="border-t border-border px-4 py-2">
                    <div className="text-xs text-text-muted mb-2">{t("language") || "Language"}</div>
                    <div className="flex gap-2">
                      <LanguageButton lng="en" current={i18n.language} onClick={changeLanguage} />
                      <LanguageButton lng="fa" current={i18n.language} onClick={changeLanguage} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* محتوای مرکزی - flex-1 برای باقی فضا */}
          <div className="flex-1 min-h-0 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 overflow-auto">
            <div className="h-full">
              <Outlet />
            </div>
          </div>

          {/* وضعیت سیستم / دوربین - ارتفاع ثابت */}
          <BottomPanels t={t} />
        </div>
      </div>

      {/* ستون راست - در موبایل کامل عرض، در دسکتاپ 3/5 */}
      <div className="desktop-column">
        {/* بخش بالا - تصویر باسلر */}
        <div className="flex-1 flex flex-col min-h-0 gap-0">
          <div className="card flex-1 border-b-0 relative overflow-hidden flex flex-col sm:flex-row min-h-[300px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px]">
            <div className="hidden sm:block flex-shrink-0">
              <BaslerTools />
            </div>
            <div className="flex-1 min-h-0 min-w-0 relative">
              <BaslerDisplay />
              {/* Mobile Tools Overlay */}
              <div className="sm:hidden absolute top-2 left-2 z-10">
                <div className="bg-black/70 rounded-lg p-1">
                  <div className="transform scale-75 origin-top-left">
                    <BaslerTools />
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block flex-shrink-0">
              <LayerManager className="flex-shrink-0" />
            </div>
          </div>
          {/* Image Reel - ارتفاع ثابت */}
          <div className="card flex-shrink-0 border-t-0 text-text dark:text-text font-medium text-center p-2 sm:p-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[50px] md:min-h-[60px] lg:min-h-[70px] flex items-center justify-center">
            {t("imageReel")}
          </div>
        </div>

        {/* Analysis Panel - ارتفاع بهبود یافته */}
        <div className="card flex-shrink-0 p-2 sm:p-3 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[240px] max-h-[240px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] flex flex-col">
          {/* Tab Switcher */}
          <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3 flex-shrink-0">
            <button
              onClick={() => setAnalysisView('histogram')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                analysisView === 'histogram'
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                  : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
              }`}
            >
              <span className="hidden sm:inline">📊 Histogram</span>
              <span className="sm:hidden">📊 Hist</span>
            </button>
            <button
              onClick={() => setAnalysisView('intensity')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                analysisView === 'intensity'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
              }`}
            >
              <span className="hidden sm:inline">📈 Intensity Profile</span>
              <span className="sm:hidden">📈 Intensity</span>
               
            </button>
          </div>

          {/* Display Content */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-background-secondary dark:bg-background-primary border border-border p-2">
            {analysisView === 'histogram' ? <HistogramDisplay /> : <IntensityProfileDisplay />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;