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
  Zap,
  AlertTriangle,
} from "lucide-react";
import BaslerTools from "./Toolbar";
import TabNav from "./TabNav";
import IconButton from "./common/IconButton";
import { useTranslation } from "react-i18next";
import BaslerDisplay from "./Camera/BaslerDisplay";
import MonitoringDisplay from "./Camera/MonitoringDisplay";
import HistogramDisplay from "./HistogramDisplay";
import { useXray } from "../contexts/XrayContext";

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

// System Status Bar (moved to top)
const SystemStatusBar = ({ t, isPowerOn, onPowerOn, onPowerOff }) => (
  <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-background-secondary dark:bg-background-secondary">
    <div className="flex items-center gap-3">
      <div className={`panel flex-1 flex items-center justify-center gap-2 text-sm text-white font-semibold h-10 transition-all duration-200 ${
        isPowerOn ? 'bg-green-500' : 'bg-red-500'
      }`}>
        <Zap className="w-4 h-4" />
        <span>{t("xrayStatus")}: {isPowerOn ? t("xrayOn") : t("xrayOff")}</span>
        {isPowerOn && <AlertTriangle className="w-4 h-4 ml-2 animate-pulse" />}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPowerOn}
          className={`h-10 px-4 rounded-lg transition-all duration-200 font-semibold text-sm min-w-[70px] ${
            isPowerOn
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-500 hover:text-white'
          }`}
        >
          ON
        </button>
        <button
          onClick={onPowerOff}
          className={`h-10 px-4 rounded-lg transition-all duration-200 font-semibold text-sm min-w-[70px] ${
            !isPowerOn
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white'
          }`}
        >
          OFF
        </button>
      </div>
    </div>
    {isPowerOn && (
      <div className="mt-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
          {t("xraySafetyWarning")}
        </span>
      </div>
    )}
  </div>
);

// کامپوننت اصلی Layout
const Layout = () => {
  const location = useLocation();
  const defaultActive = location.pathname.includes("settings")
    ? "Settings"
    : null;

  const [activeButton, setActiveButton] = useState(defaultActive);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const { t, i18n } = useTranslation();
  const { isXrayOn, turnOnXray, turnOffXray } = useXray();

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
          {/* System Status Bar - بالای همه */}
          <SystemStatusBar
            t={t}
            isPowerOn={isXrayOn}
            onPowerOn={turnOnXray}
            onPowerOff={turnOffXray}
          />

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
          </div>
          {/* Image Reel - ارتفاع ثابت */}
          <div className="card flex-shrink-0 border-t-0 text-text dark:text-text font-medium text-center p-2 sm:p-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[50px] md:min-h-[60px] lg:min-h-[70px] flex items-center justify-center">
            {t("imageReel")}
          </div>
        </div>

        {/* Histogram Panel with Camera */}
        <div className="card flex-shrink-0 p-2 sm:p-3 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[240px] max-h-[240px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] flex">
          {/* Histogram Display - Left Side */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-background-secondary dark:bg-background-primary border border-border p-2">
            <HistogramDisplay />
          </div>

          {/* Camera Display - Right Side */}
          <div className="flex-shrink-0 w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px] rounded-lg border border-border overflow-hidden ml-2">
            <MonitoringDisplay />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;