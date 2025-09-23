import React from "react";
import { useTranslation } from "react-i18next";

export default function ImageReel() {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{t("imageReel")}</h1>
    </div>
  );
}