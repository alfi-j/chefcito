"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Accessibility } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

type FontSize = "small" | "medium" | "large";

const STORAGE_KEY = "chefcito-accessibility-font-size";
const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  small: "a11y-text-small",
  medium: "a11y-text-medium",
  large: "a11y-text-large",
};

export function AccessibilityMenu() {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === "undefined") return "medium";
    const saved = localStorage.getItem(STORAGE_KEY) as FontSize | null;
    return saved && ["small", "medium", "large"].includes(saved) ? saved : "medium";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...Object.values(FONT_SIZE_CLASSES));
    root.classList.add(FONT_SIZE_CLASSES[fontSize]);
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  return (
    <div className="fixed bottom-20 right-6 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="rounded-full shadow-lg h-14 w-14 bg-yellow-500 hover:bg-yellow-600"
          >
            <Accessibility className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("accessibility.title")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={fontSize}
            onValueChange={(value) => setFontSize(value as FontSize)}
          >
            <DropdownMenuRadioItem value="small">
              {t("accessibility.text_small")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="medium">
              {t("accessibility.text_medium")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">
              {t("accessibility.text_large")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
