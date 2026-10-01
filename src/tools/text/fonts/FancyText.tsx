"use client";

import { RefreshCw } from "lucide-react";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Switch, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { InvisibleTool } from "./ui/InvisibleTool";
import { PLATFORMS, SAMPLE, STYLE_NAMES, type PlatformId } from "./data/names";
import { StyleList } from "./ui/StyleList";
import { T, type Strings } from "./content/strings";
import {
  cyrillicNotice,
  DEFAULT_SEED,
  hasCyrillic,
  randomSeed,
  STYLE_IDS,
  STYLES,
  stylize,
  X_LIMIT,
  xWeightedLength,
  ZALGO_LEVELS,
  type StyleId,
  type ZalgoLevel,
} from "./lib/styles";
import { useCopyFlash } from "./lib/use-flash";

export interface FancyTextProps {
  locale: Locale;
  /** Style variant page: this style is the selected result. */
  style?: StyleId;
  /** Platform page: recommended styles listed first. */
  platform?: PlatformId;
  /** Invisible-character page. */
  invisible?: boolean;
}

export default function FancyText({ locale, style, platform, invisible = false }: FancyTextProps) {
  const t = T[locale];
  if (invisible) return <InvisibleTool locale={locale} t={t} />;
  return <Generator locale={locale} style={style} platform={platform} t={t} />;
}

function Generator({ locale, style, platform, t }: { locale: Locale; style?: StyleId; platform?: PlatformId; t: Strings }) {
  const id = useId();
  const pf = platform ? PLATFORMS[platform] : null;
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<StyleId>(style ?? pf?.styles[0] ?? "bold");
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [zalgo, setZalgo] = useState<ZalgoLevel>("medium");
  const [cyrOnly, setCyrOnly] = useState(false);
  const [copied, copy] = useCopyFlash<StyleId>();

  const deferred = useDeferredValue(text);
  const src = deferred || SAMPLE[locale];
  const cyr = hasCyrillic(src);

  const outputs = useMemo(() => {
    const out = {} as Record<StyleId, string>;
    for (const s of STYLE_IDS) out[s] = stylize(s, src, { seed, zalgo });
    return out;
  }, [src, seed, zalgo]);

  const pick = (s: StyleId) => {
    setSelected(s);
    void copy(s, outputs[s]);
  };
  const shown = (s: StyleId) => !(cyr && cyrOnly && STYLES[s].cyr === "none");
  const first = pf ? pf.styles.filter(shown) : [];
  const rest = STYLE_IDS.filter((s) => !first.includes(s) && shown(s));

  const info = STYLES[selected];
  const result = outputs[selected];
  const notice = cyrillicNotice(selected, src);
  const listProps = { outputs, selected, copied, onPick: pick, locale, t, cyr, xCounter: pf?.xCounter };
  const cyrSwitch = cyr ? (
    <Switch label={t.cyrOnly} checked={cyrOnly} onChange={(e) => setCyrOnly(e.target.checked)} className="text-[0.8125rem]! text-fg-2!" />
  ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-4 sm:p-5">
        <Field
          label={t.input}
          htmlFor={`${id}-in`}
          hint={text ? undefined : t.sampleHint}
          aside={
            text ? (
              <Button variant="ghost" size="sm" onClick={() => setText("")} className="-my-1 h-7!">
                {t.clear}
              </Button>
            ) : undefined
          }
        >
          <Textarea
            id={`${id}-in`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE[locale]}
            rows={2}
            maxLength={3000}
            autoComplete="off"
            className="min-h-20! font-sans! text-base!"
          />
        </Field>

        <div className={cn("mt-4 rounded-[0.625rem] bg-surface-2 px-4 sm:px-5", info.random ? "overflow-hidden py-6" : "py-4")}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[0.8125rem] text-fg-2">
            <span className="font-medium">{STYLE_NAMES[selected][locale]}</span>
            {pf?.xCounter && <XCount text={result} label={t.xCount} />}
          </div>
          <p className="mt-1 min-h-10 text-2xl leading-relaxed font-medium whitespace-pre-wrap text-fg [overflow-wrap:anywhere] sm:text-3xl">
            {result}
          </p>
          {notice && <p className="mt-2 text-[0.8125rem] text-warn">{notice === "none" ? t.noticeNone(info.digits !== "none") : t.noticePartial}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {selected === "zalgo" && (
                <Segmented label={t.intensity} value={zalgo} onChange={setZalgo} options={ZALGO_LEVELS.map((z) => ({ value: z, label: t.zalgo[z] }))} size="sm" />
              )}
              {info.random && (
                <Button variant="ghost" size="sm" onClick={() => setSeed(randomSeed())} aria-label={t.regenerateLabel} title={t.regenerateLabel}>
                  <RefreshCw aria-hidden />
                  {t.regenerate}
                </Button>
              )}
            </div>
            <CopyButton value={result} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" />
          </div>
        </div>
      </Panel>

      {pf && <StyleList title={t.goodFor(pf.forName[locale])} ids={first} aside={cyrSwitch} {...listProps} />}
      <StyleList title={pf ? t.otherStyles : t.allStyles} ids={rest} aside={pf ? undefined : cyrSwitch} {...listProps} />
      <p className="sr-only" aria-live="polite">
        {copied ? `${t.copied}: ${STYLE_NAMES[copied][locale]}` : ""}
      </p>
    </div>
  );
}

function XCount({ text, label }: { text: string; label: string }) {
  const n = xWeightedLength(text);
  return (
    <span className={cn("tabular", n > X_LIMIT ? "font-medium text-err" : "text-fg-3")}>
      {n}/{X_LIMIT} {label}
    </span>
  );
}
