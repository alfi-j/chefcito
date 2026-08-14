"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

export function CtaBand() {
  const { t } = useTranslation();

  return (
    <section className="bg-[#201D15] text-[#FAF5EA]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 className="max-w-2xl font-headline text-3xl font-bold tracking-tight sm:text-4xl">
          {t("landing.cta.title")}
        </h2>
        <p className="max-w-xl text-lg leading-relaxed text-[#A99F8A]">
          {t("landing.cta.body")}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-[#FFB700] px-6 py-3 font-headline font-bold text-[#201D15] transition-colors hover:bg-[#FFC224]"
        >
          {t("landing.cta.button")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-[#6B6354]">{t("landing.cta.footnote")}</p>
      </div>
    </section>
  );
}