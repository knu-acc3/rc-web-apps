"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/i18n/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

interface ThemeToggleProps {
  ariaLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function ThemeToggle({
  ariaLabel,
  open,
  onOpenChange,
}: ThemeToggleProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const { setTheme, theme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const resolvedAriaLabel =
    ariaLabel ?? (isEn ? "Change theme" : "Сменить тему");

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={resolvedAriaLabel}
        title={resolvedAriaLabel}
        className="text-[var(--color-text-muted)]"
      >
        <Sun size={18} />
      </Button>
    );
  }

  const showMoon = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={resolvedAriaLabel}
          title={resolvedAriaLabel}
          className="text-[var(--color-text-muted)]"
        >
          {showMoon ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            setTheme("light");
            onOpenChange?.(false);
          }}
        >
          <Sun size={16} /> {isEn ? "Light" : "Светлая"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            setTheme("dark");
            onOpenChange?.(false);
          }}
        >
          <Moon size={16} /> {isEn ? "Dark" : "Тёмная"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            setTheme("system");
            onOpenChange?.(false);
          }}
        >
          <Monitor size={16} /> {isEn ? "System" : "Системная"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
