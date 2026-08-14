"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Banknote, ChefHat, CreditCard, Smartphone } from "lucide-react";
import { TicketBoard } from "@/components/landing/ticket-board";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:pb-4 lg:pt-20">
        <div className="animate-fade-in-up motion-reduce:animate-none">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E9E0CC] bg-[#FFFDF8] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#5C554A]">
            <ChefHat className="h-3.5 w-3.5 text-[#FFB700]" />
            {t("landing.hero.badge")}
          </p>

          <h1 className="mt-5 max-w-3xl font-headline text-4xl font-bold leading-[1.05] tracking-tight text-[#201D15] sm:text-5xl lg:text-6xl">
            {t("landing.hero.title_1")} <span className="text-[#FFB700]">{t("landing.hero.title_2")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#5C554A]">
            {t("landing.hero.body")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FFB700] px-5 py-3 font-headline font-bold text-[#201D15] shadow-sm transition-colors hover:bg-[#E8A400]"
            >
              {t("landing.hero.cta_login")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#journey"
              className="inline-flex items-center gap-2 rounded-lg border border-[#D8CDB4] bg-[#FFFDF8] px-5 py-3 font-headline font-bold text-[#201D15] transition-colors hover:border-[#201D15]"
            >
              {t("landing.hero.cta_follow")}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[#5C554A]">
            <span className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4" />
              {t("landing.hero.cash")}
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              {t("landing.hero.card")}
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" />
              {t("landing.hero.payphone")}
            </span>
            <span className="text-[#8A8172]">{t("landing.hero.built_for")}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="animate-fade-in-up motion-reduce:animate-none">
          <TicketBoard />
        </div>
      </div>
    </section>
  );
}