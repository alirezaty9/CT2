import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-6 text-text dark:text-text space-y-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center">{t("settingsPage")}</h1>
      <p className="text-base text-muted-foreground text-center" >{t("settingsDescription")}</p>

      {/* 🌓 تغییر تم */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          {theme === "light" ? (
            <Sun className="w-6 h-6 text-yellow-500" />
          ) : (
            <Moon className="w-6 h-6 text-blue-400" />
          )}
          <span className="font-medium">{t("theme")}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
        >
          {t("switchTo", { mode: theme === "light" ? t("dark") : t("light") })}
        </button>
      </div>

      {/* 🌐 زبان */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <span className="font-medium">{t("language")}</span>
        </div>
        <div className="flex gap-2">
          {["en", "fa"].map((lng) => (
            <button
              key={lng}
              onClick={() => changeLanguage(lng)}
              className={`px-4 py-1.5 rounded-lg text-sm transition font-medium
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
