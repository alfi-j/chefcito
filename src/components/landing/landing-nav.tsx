"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChefHat } from "lucide-react";
import { LanguageSwitcher } from "@/components/landing/language-switcher";

export function LandingNav() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-[#E9E0CC]/80 bg-[#FAF5EA]/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Chefcito home">
          <ChefHat className="h-7 w-7 text-[#FFB700]" strokeWidth={2.2} />
          <span className="font-headline text-lg font-semibold tracking-tight">Chefcito</span>
        </a>

        <div className="hidden items-center gap-6 lg:flex">
          <a
            href="#journey"
            className="text-sm font-medium text-[#5C554A] transition-colors hover:text-[#201D15]"
          >
            {t("landing.nav.journey")}
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-[#5C554A] transition-colors hover:text-[#201D15]"
          >
            {t("landing.nav.features")}
          </a>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#5C554A] transition-colors hover:text-[#201D15]"
          >
            {t("landing.nav.login")}
          </Link>
          <Link
            href="/login"
            className="hidden rounded-lg bg-[#FFB700] px-4 py-2 text-sm font-bold text-[#201D15] shadow-sm transition-colors hover:bg-[#E8A400] sm:inline-block"
          >
            {t("landing.nav.start")}
          </Link>
        </div>
      </nav>
    </header>
  );
}