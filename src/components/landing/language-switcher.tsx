"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeLanguage, type SupportedLanguage } from "@/lib/i18n";

const LANGS: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Language"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#5C554A] transition-colors hover:text-[#201D15]"
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">
            {i18n.resolvedLanguage ?? "en"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="cursor-pointer"
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
