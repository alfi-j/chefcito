"use client";

import { useTranslation } from "react-i18next";
import { BarChart3, ClipboardList, Languages, LayoutGrid, ShieldCheck, Wallet } from "lucide-react";

const FEATURE_ICONS = [LayoutGrid, ClipboardList, Wallet, BarChart3, ShieldCheck, Languages];

export function Features() {
  const { t } = useTranslation();

  const features = [
    { title: t("landing.features.f1.title"), body: t("landing.features.f1.body") },
    { title: t("landing.features.f2.title"), body: t("landing.features.f2.body") },
    { title: t("landing.features.f3.title"), body: t("landing.features.f3.body") },
    { title: t("landing.features.f4.title"), body: t("landing.features.f4.body") },
    { title: t("landing.features.f5.title"), body: t("landing.features.f5.body") },
    { title: t("landing.features.f6.title"), body: t("landing.features.f6.body") },
  ];

  return (
    <section id="features" className="bg-[#FAF5EA]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFB700]">
          {t("landing.features.eyebrow")}
        </p>
        <h2 className="mt-3 max-w-2xl font-headline text-3xl font-bold tracking-tight text-[#201D15] sm:text-4xl">
          {t("landing.features.title")}
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-[#E9E0CC] bg-[#FFFDF8] p-6 transition-colors hover:border-[#FFB700]"
              >
                <span className="inline-flex rounded-lg bg-[#FFB700]/15 p-2.5">
                  <Icon className="h-5 w-5 text-[#201D15]" />
                </span>
                <h3 className="mt-4 font-headline text-lg font-bold text-[#201D15]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5C554A]">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}