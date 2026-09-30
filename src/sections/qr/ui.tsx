"use client";

import { ImagePlus, X } from "lucide-react";
import { useId, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Segmented } from "@/ui/segmented";
import type { Ecc } from "./qr";

const T = {
  ru: {
    ecc: "Коррекция ошибок",
    eccTitle: { L: "≈7% повреждений", M: "≈15% повреждений", Q: "≈25% повреждений", H: "≈30% повреждений" },
    color: "Цвет",
    bg: "Фон",
    logo: "Логотип",
    removeLogo: "Убрать логотип",
    fixedH: "С логотипом — всегда H",
    fixedM: "Для платежей EPC — всегда M",
  },
  en: {
    ecc: "Error correction",
    eccTitle: { L: "≈7% damage", M: "≈15% damage", Q: "≈25% damage", H: "≈30% damage" },
    color: "Colour",
    bg: "Background",
    logo: "Logo",
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

/** One quiet row of secondary options: error correction, colours, logo. */
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
      <div className="flex items-center gap-2">
        <span id={`${id}-ecc`}>{t.ecc}</span>
        <Segmented<Ecc>
          size="sm"
          label={t.ecc}
          value={shown}
          onChange={(v) => !fixed && onChange({ ...look, ecc: v })}
          options={(["L", "M", "Q", "H"] as const).map((v) => ({ value: v, label: v, title: t.eccTitle[v] }))}
        />
        {fixed && <span className="text-[13px] text-fg-3">{fixed === "H" ? t.fixedH : t.fixedM}</span>}
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="color" value={look.fg} onChange={(e) => onChange({ ...look, fg: e.target.value })} className="size-7 cursor-pointer rounded border border-line bg-surface p-0.5" />
        {t.color}
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="color" value={look.bg} onChange={(e) => onChange({ ...look, bg: e.target.value })} className="size-7 cursor-pointer rounded border border-line bg-surface p-0.5" />
        {t.bg}
      </label>
      {allowLogo &&
        (look.logo ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...look, logo: null })}>
            <X className="size-4" aria-hidden />
            {t.removeLogo}
          </Button>
        ) : (
          <>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pickLogo(e.target.files?.[0])} />
            <Button variant="ghost" size="sm" onClick={() => file.current?.click()}>
              <ImagePlus className="size-4" aria-hidden />
              {t.logo}
            </Button>
          </>
        ))}
    </div>
  );
}
