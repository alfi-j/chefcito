"use client";

import { useTranslation } from "react-i18next";
import { BarChart3, ChefHat, ClipboardList, LayoutGrid } from "lucide-react";

const STEP_ICONS = [LayoutGrid, ClipboardList, ChefHat, BarChart3];

export function Journey() {
  const { t } = useTranslation();

  const steps = [
    { title: t("landing.journey.step1.title"), body: t("landing.journey.step1.body") },
    { title: t("landing.journey.step2.title"), body: t("landing.journey.step2.body") },
    { title: t("landing.journey.step3.title"), body: t("landing.journey.step3.body") },
    { title: t("landing.journey.step4.title"), body: t("landing.journey.step4.body") },
  ];

  return (
    <section id="journey" className="border-y border-[#E9E0CC] bg-[#FFFDF8]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFB700]">
          {t("landing.journey.eyebrow")}
        </p>
        <h2 className="mt-3 max-w-2xl font-headline text-3xl font-bold tracking-tight text-[#201D15] sm:text-4xl">
          {t("landing.journey.title")}
        </h2>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <div key={step.title} className="relative">
                <div className="flex items-end gap-3">
                  <span className="font-headline text-5xl font-bold leading-none text-[#EADFC8]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mb-1 rounded-lg bg-[#FAF5EA] p-2">
                    <Icon className="h-5 w-5 text-[#201D15]" />
                  </span>
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-[#201D15]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5C554A]">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}