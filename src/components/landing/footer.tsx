"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChefHat } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#E9E0CC] bg-[#FAF5EA]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-[#FFB700]" />
            <span className="font-headline text-base font-semibold tracking-tight text-[#201D15]">
              Chefcito
            </span>
          </div>
          <p className="max-w-xs text-center text-sm text-[#5C554A] md:text-left">
            {t("landing.footer.tagline")}
          </p>
        </div>

        <nav className="flex gap-8 text-sm font-medium text-[#5C554A]">
          <Link href="/login" className="transition-colors hover:text-[#201D15]">
            {t("landing.footer.login")}
          </Link>
          <a href="#journey" className="transition-colors hover:text-[#201D15]">
            {t("landing.footer.journey")}
          </a>
          <a href="#features" className="transition-colors hover:text-[#201D15]">
            {t("landing.footer.features")}
          </a>
        </nav>
      </div>

      <div className="border-t border-[#E9E0CC] py-4">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-[#8A8172]">
          {t("landing.footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}