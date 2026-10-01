"use client";

import { ImagePlus, X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Segmented } from "@/ui/segmented";
import type { Ecc } from "../lib/qr";

const T = {
  ru: {
    ecc: "Коррекция ошибок",
    eccTitle: { L: "≈7% повреждений", M: "≈15% повреждений", Q: "≈25% повреждений", H: "≈30% повреждений" },
    color: "Цвет кода",
    bg: "Фон",
    logo: "Логотип",
    addLogo: "Добавить логотип",
    removeLogo: "Убрать логотип",
    fixedH: "С логотипом — всегда H",
    fixedM: "Для платежей EPC — всегда M",
  },
  en: {
    ecc: "Error correction",
    eccTitle: { L: "≈7% damage", M: "≈15% damage", Q: "≈25% damage", H: "≈30% damage" },
    color: "Code colour",
    bg: "Background",
    logo: "Logo",
    addLogo: "Add a logo",
    removeLogo: "Remove logo",
    fixedH: "With a logo it's always H",
    fixedM: "EPC payments always use M",
  },
} as const;

export interface LookState {
  ecc: Ecc;
  fg: string;
  bg: string;
  logo: string | null;
}

/** A small label above a group of controls. */
export function OptionGroup({ label, id, children, aside }: { label: ReactNode; id?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <span id={id} className="text-sm font-medium text-fg-2">
        {label}
      </span>
      {children}
      {aside}
    </div>
  );
}

/** A colour field: a round swatch and the hex code on a tonal pill; the whole pill opens the colour picker. */
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium text-fg-2">{label}</span>
      <span className="relative flex h-11 w-fit min-w-[8.5rem] cursor-pointer items-center gap-2.5 rounded-full bg-surface-2 pr-4 pl-1.5 transition-colors hover:bg-surface-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
        <span aria-hidden className="size-8 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]" style={{ background: value }} />
        <span className="font-mono text-sm text-fg uppercase">{value}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </span>
    </label>
  );
}

/** QR look: error correction, colours and a logo — grouped, each with its own label. */
export function LookRow({ locale, look, onChange, fixed, allowLogo = true }: { locale: Locale; look: LookState; onChange: (l: LookState) => void; fixed?: "H" | "M"; allowLogo?: boolean }) {
  const t = T[locale];
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const shown: Ecc = fixed ?? look.ecc;

  function pickLogo(f: File | undefined) {
    if (!f || !f.type.startsWith("image/") || f.size > 3 * 1024 * 1024) return;
    const r = new FileReader();
    r.onload = () => typeof r.result === "string" && onChange({ ...look, logo: r.result });
    r.readAsDataURL(f);
  }

  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
      <OptionGroup id={`${id}-ecc`} label={t.ecc} aside={fixed && <span className="text-[0.8125rem] text-fg-3">{fixed === "H" ? t.fixedH : t.fixedM}</span>}>
        <Segmented<Ecc> label={t.ecc} value={shown} onChange={(v) => !fixed && onChange({ ...look, ecc: v })} options={(["L", "M", "Q", "H"] as const).map((v) => ({ value: v, label: v, title: t.eccTitle[v] }))} />
      </OptionGroup>
      <div className="flex flex-wrap gap-x-4 gap-y-5">
        <ColorField label={t.color} value={look.fg} onChange={(fg) => onChange({ ...look, fg })} />
        <ColorField label={t.bg} value={look.bg} onChange={(bg) => onChange({ ...look, bg })} />
      </div>
      {allowLogo && (
        <OptionGroup id={`${id}-logo`} label={t.logo}>
          {look.logo ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL preview */}
              <img src={look.logo} alt="" className="size-11 rounded-[0.75rem] bg-surface-2 object-contain p-1" />
              <Button variant="outlined" onClick={() => onChange({ ...look, logo: null })}>
                <X className="size-4" aria-hidden />
                {t.removeLogo}
              </Button>
            </div>
          ) : (
            <>
              <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pickLogo(e.target.files?.[0])} />
              <Button variant="outlined" onClick={() => file.current?.click()} className="w-fit">
                <ImagePlus className="size-4" aria-hidden />
                {t.addLogo}
              </Button>
            </>
          )}
        </OptionGroup>
      )}
    </div>
  );
}
