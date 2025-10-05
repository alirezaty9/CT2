import React from "react";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="p-4 sm:p-6 text-text">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">{t("homePage")}</h1>
      <p className="text-sm sm:text-base text-text-muted">{t("welcome")}</p>
    </div>
  );
}
