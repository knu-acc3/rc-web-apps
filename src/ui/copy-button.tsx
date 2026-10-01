"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { buttonClass } from "./button";

export function CopyButton({
  value,
  label = "Копировать",
  copiedLabel = "Скопировано",
  showLabel = true,
  variant = "secondary",
  size = "sm",
  className,
  onCopied,
  compact = false,
}: {
  value: string | (() => string);
  label?: string;
  copiedLabel?: string;
  showLabel?: boolean;
  variant?: "filled" | "tonal" | "outlined" | "text" | "neutral" | "elevated" | "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
  onCopied?: () => void;
  /** Icon only on phones (the label stays for screen readers), icon + label from 640px. */
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handle() {
    const text = typeof value === "function" ? value() : value;
    if (!text) return;
    if (await copyText(text)) {
      setCopied(true);
      onCopied?.();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    }
  }

  const iconOnly = !showLabel || size === "icon" || size === "icon-sm" || size === "icon-lg";
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      title={iconOnly || compact ? label : undefined}
      className={cn(buttonClass(variant, size), copied && "text-ok", className)}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {!iconOnly && <span className={compact ? "max-sm:sr-only" : undefined}>{copied ? copiedLabel : label}</span>}
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}
