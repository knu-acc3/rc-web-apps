"use client";

import { RefreshCw } from "lucide-react";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Switch, Textarea } from "@/ui/field";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { InvisiblePanel } from "./InvisiblePanel";
import { PLATFORMS, SAMPLE, STYLE_NAMES, type PlatformId } from "./names";
import { CyrBadge, StyleRow } from "./StyleRow";
import { T } from "./strings";
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
} from "./styles";

export interface FancyTextProps {
  locale: Locale;
  /** Variant page of one style: shown large at the top. */
  style?: StyleId;
  /** Platform page: recommended styles first. */
  platform?: PlatformId;
  /** Invisible-character page. */
  invisible?: boolean;
}

export default function FancyText({ locale, style, platform, invisible = false }: FancyTextProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("");
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [zalgo, setZalgo] = useState<ZalgoLevel>("medium");
  const [cyrOnly, setCyrOnly] = useState(false);

  const deferred = useDeferredValue(text);
  const src = deferred || SAMPLE[locale];
  const cyr = hasCyrillic(src);

  const outputs = useMemo(() => {
    const out = {} as Record<StyleId, string>;
    for (const s of STYLE_IDS) out[s] = stylize(s, src, { seed, zalgo });
    return out;
  }, [src, seed, zalgo]);

  const regenerate = () => setSeed(randomSeed());
  const pf = platform ? PLATFORMS[platform] : null;
  const firstIds = pf ? pf.styles : style ? [style] : [];
  const visible = (s: StyleId) => !(cyr && cyrOnly && STYLES[s].cyr === "none");
  const rest = STYLE_IDS.filter((s) => !firstIds.includes(s) && visible(s));

  const row = (s: StyleId) => (
    <StyleRow
      key={s}
      id={s}
      locale={locale}
      text={outputs[s]}
      t={t}
      cyr={cyr}
      onRegenerate={STYLES[s].random ? regenerate : undefined}
      extra={pf?.xCounter ? <XCount text={outputs[s]} label={t.xCount} /> : undefined}
    />
  );

  const input = (
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
          rows={3}
          maxLength={3000}
          autoComplete="off"
          className="min-h-24! font-sans! text-base!"
        />
      </Field>
      {cyr && (
        <Switch label={t.cyrOnly} checked={cyrOnly} onChange={(e) => setCyrOnly(e.target.checked)} className="mt-3 text-sm!" />
      )}
    </Panel>
  );

  return (
    <div className="flex flex-col gap-4">
      {invisible && <InvisiblePanel locale={locale} t={t} />}
      {invisible && <h2 className="mt-2 text-lg font-semibold text-fg">{t.generatorTitle}</h2>}
      {input}

      {style && (
        <FocusCard
          id={style}
          locale={locale}
          text={outputs[style]}
          notice={cyrillicNotice(style, src)}
          zalgo={zalgo}
          onZalgo={setZalgo}
          onRegenerate={regenerate}
        />
      )}

      {pf && (
        <Panel>
          <PanelHeader title={t.goodFor(pf.forName[locale])} />
          <ul>{pf.styles.filter(visible).map(row)}</ul>
        </Panel>
      )}

      {rest.length > 0 && (
        <Panel>
          <PanelHeader title={firstIds.length ? t.otherStyles : t.allStyles} />
          <ul>{rest.map(row)}</ul>
        </Panel>
      )}
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

function FocusCard({
  id,
  locale,
  text,
  notice,
  zalgo,
  onZalgo,
  onRegenerate,
}: {
  id: StyleId;
  locale: Locale;
  text: string;
  notice: "partial" | "none" | null;
  zalgo: ZalgoLevel;
  onZalgo: (z: ZalgoLevel) => void;
  onRegenerate: () => void;
}) {
  const t = T[locale];
  const info = STYLES[id];
  const name = STYLE_NAMES[id][locale];
  return (
    <Panel className={cn(info.random && "overflow-hidden")}>
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            {name}
            <CyrBadge id={id} show={notice !== null} t={t} />
          </span>
        }
        actions={
          info.random ? (
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              <RefreshCw aria-hidden />
              <span className="hidden sm:inline">{t.regenerate}</span>
              <span className="sr-only sm:hidden">{t.regenerate}</span>
            </Button>
          ) : undefined
        }
      />
      <div className={cn("px-4 sm:px-5", info.random ? "py-6" : "py-4")}>
        <p className="text-2xl leading-relaxed font-medium whitespace-pre-wrap text-fg [overflow-wrap:anywhere] sm:text-3xl" aria-live="polite">
          {text}
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        {id === "zalgo" ? (
          <Segmented
            label={t.intensity}
            value={zalgo}
            onChange={onZalgo}
            options={ZALGO_LEVELS.map((z) => ({ value: z, label: t.zalgo[z] }))}
            size="sm"
          />
        ) : (
          <span />
        )}
        <CopyButton value={text} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" className="self-start sm:self-auto" />
      </div>
      {notice && (
        <Notice tone="warn" className="mx-4 mb-4 sm:mx-5">
          {notice === "none" ? t.noticeNone(info.digits !== "none") : t.noticePartial}
        </Notice>
      )}
    </Panel>
  );
}
