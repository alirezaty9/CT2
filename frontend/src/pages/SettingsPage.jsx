import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Factory } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme, industrialUI, setIndustrialUI } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleIndustrialUI = () => {
    setIndustrialUI(!industrialUI);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-4 sm:p-6 text-text dark:text-text space-y-6 sm:space-y-8 max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">{t("settingsPage")}</h1>
      <p className="text-sm sm:text-base text-muted-foreground text-center">{t("settingsDescription")}</p>

      {/* 🏭 Industrial UI Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-3 sm:p-4 rounded-xl shadow-sm border gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
          <div>
            <span className="font-medium text-sm sm:text-base block">Industrial UI</span>
            <span className="text-xs text-text-muted">Windows XP-inspired interface</span>
          </div>
        </div>
        <button
          onClick={toggleIndustrialUI}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg transition text-sm sm:text-base ${
            industrialUI
              ? "bg-highlight text-white hover:bg-highlight-dark"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {industrialUI ? "Disable Industrial" : "Enable Industrial"}
        </button>
      </div>

      {/* 🌓 تغییر تم */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-3 sm:p-4 rounded-xl shadow-sm border gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {theme === "light" ? (
            <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
          )}
          <span className="font-medium text-sm sm:text-base">{t("theme")}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition text-sm sm:text-base"
        >
          {t("switchTo", { mode: theme === "light" ? t("dark") : t("light") })}
        </button>
      </div>

      {/* 🌐 زبان */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-3 sm:p-4 rounded-xl shadow-sm border gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-medium text-sm sm:text-base">{t("language")}</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {["en", "fa"].map((lng) => (
            <button
              key={lng}
              onClick={() => changeLanguage(lng)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-sm transition font-medium
                ${
                  i18n.language === lng
                    ? "bg-primary text-white shadow"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
