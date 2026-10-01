"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { tr } from "@/i18n/config";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../types";
import { detectFeatures, FEATURE_GROUPS, FEATURES } from "./lib/features";
import { useDetected } from "./lib/probe";
import { COMMON, Hero, Pending, Stack } from "./ui/kit";

type Filter = "all" | "yes" | "no";

const T = {
  ru: {
    label: "Поддерживается возможностей",
    of: "из",
    sub: "проверено прямо в вашем браузере, без загрузки чего-либо",
    filter: "Показать",
    all: "Все",
    yes: "Есть",
    no: "Нет",
    report: "Возможности браузера",
  },
  en: {
    label: "Features supported",
    of: "of",
    sub: "checked right in your browser, without downloading anything",
    filter: "Show",
    all: "All",
    yes: "Supported",
    no: "Missing",
    report: "Browser features",
  },
} as const;

const detect = () => detectFeatures();

export default function FeaturesInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const d = useDetected(detect);
  const [filter, setFilter] = useState<Filter>("all");
  const ok = d ? FEATURES.filter((f) => d[f.id]).length : 0;
  const report = d
    ? [t.report, ...FEATURE_GROUPS.flatMap((g) => ["", tr(g.name, locale), ...FEATURES.filter((f) => f.group === g.id).map((f) => `${d[f.id] ? "✓" : "✗"} ${tr(f.name, locale)}`)])].join("\n")
    : undefined;

  return (
    <Stack>
      <Hero locale={locale} label={t.label} value={d ? `${ok} ${t.of} ${FEATURES.length}` : null} sub={d ? t.sub : undefined} copy={report}>
        <Segmented
          className="mt-3"
          label={t.filter}
          value={filter}
          onChange={setFilter}
          size="sm"
          options={[
            { value: "all", label: t.all },
            { value: "yes", label: t.yes },
            { value: "no", label: t.no },
          ]}
        />
      </Hero>
      <div className="gap-10 lg:columns-2">
        {FEATURE_GROUPS.map((g) => {
          const total = FEATURES.filter((f) => f.group === g.id);
          const items = total.filter((f) => !d || filter === "all" || (filter === "yes") === d[f.id]);
          if (d && items.length === 0) return null;
          return (
            <section key={g.id} className="mb-6 break-inside-avoid">
              <h2 className="flex items-baseline justify-between gap-3 text-sm font-semibold text-fg-2">
                {tr(g.name, locale)}
                {d ? <span className="tabular font-normal text-fg-3">{`${total.filter((f) => d[f.id]).length}/${total.length}`}</span> : null}
              </h2>
              <ul className="mt-1 divide-y divide-line border-y border-line">
                {items.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-[0.9375rem]">
                    <span className="min-w-0 text-fg">{tr(f.name, locale)}</span>
                    {d ? (
                      d[f.id] ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm text-ok">
                          <Check className="size-4" aria-hidden />
                          {c.yes}
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm text-fg-3">
                          <X className="size-4" aria-hidden />
                          {c.no}
                        </span>
                      )
                    ) : (
                      <span className="shrink-0 text-sm">
                        <Pending locale={locale} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Stack>
  );
}

