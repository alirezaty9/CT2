import React from "react";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="p-6 text-text">
      <h1 className="text-2xl font-bold mb-6">{t("homePage")}</h1>
      <p className="text-text-muted">{t("welcome")}</p>
    </div>
  );
}
