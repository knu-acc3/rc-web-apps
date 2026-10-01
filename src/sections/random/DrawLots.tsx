"use client";

import { Check, Eye, EyeOff, HeartPulse, Search, Shuffle, User, VenetianMask } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Button } from "@/ui/button";
import { Field, Input, Switch, Textarea } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { buildLots, clampCount, defaultMafia, LOTS_MAX, LOTS_MODES, type Lot, type LotsMode } from "./lib/lots";
import { shuffle } from "./lib/rng";
import { parseLines } from "./shared";

const T = {
  ru: {
    mode: "Что тянем",
    modes: { custom: "Свои варианты", straws: "Спички", numbers: "Номера", mafia: "Роли «Мафии»" },
    lines: "Варианты — по одному на строку",
    linesDefault: "Моет посуду\nВыносит мусор\nВыбирает фильм\nСвободен",
    count: "Сколько участников",
    short: "Коротких спичек",
    mafia: "Мафия",
    detective: "Комиссар",
    doctor: "Доктор",
    secret: "Тайно: каждый смотрит свой жребий сам",
    deal: "Разложить жребий",
    again: "Перемешать заново",
    openAll: "Открыть все",
    left: (n: number) => `Осталось: ${n}`,
    allTaken: "Все жребии разобраны",
    pick: "Нажмите на любую карточку, чтобы вытянуть жребий",
    yours: "Ваш жребий",
    hide: "Запомнил — скрыть",
    card: (n: number) => `Карточка ${n}`,
    taken: "взята",
    needTwo: "Нужно хотя бы два варианта",
    roles: (m: number, c: number) => `Мафия: ${m}, мирных: ${c}`,
  },
  en: {
    mode: "What to draw",
    modes: { custom: "Your options", straws: "Straws", numbers: "Numbers", mafia: "Mafia roles" },
    lines: "Options — one per line",
    linesDefault: "Washes the dishes\nTakes out the trash\nChooses the film\nFree",
    count: "Players",
    short: "Short straws",
    mafia: "Mafia",
    detective: "Detective",
    doctor: "Doctor",
    secret: "Secret: each player looks at their own lot",
    deal: "Deal the lots",
    again: "Shuffle again",
    openAll: "Reveal all",
    left: (n: number) => `Left: ${n}`,
    allTaken: "All lots are taken",
    pick: "Tap any card to draw a lot",
    yours: "Your lot",
    hide: "Got it — hide",
    card: (n: number) => `Card ${n}`,
    taken: "taken",
    needTwo: "Add at least two options",
    roles: (m: number, c: number) => `Mafia: ${m}, civilians: ${c}`,
  },
} as const;

interface Settings {
  text: string;
  count: number;
  marked: number;
  detective: boolean;
  doctor: boolean;
  secret: boolean;
}

const isSettings = (v: unknown): v is Settings => {
  const s = v as Settings;
  return (
    !!s &&
    typeof s.text === "string" &&
    typeof s.count === "number" &&
    typeof s.marked === "number" &&
    typeof s.detective === "boolean" &&
    typeof s.doctor === "boolean" &&
    typeof s.secret === "boolean"
  );
};

const isMode = (m: unknown): m is LotsMode => typeof m === "string" && (LOTS_MODES as string[]).includes(m);

/** The face of a card: a matchstick for straws, an icon for Mafia roles, plain text otherwise. */
function Face({ lot, big = false }: { lot: Lot; big?: boolean }) {
  if (lot.kind === "short" || lot.kind === "long") {
    return (
      <span className="flex size-full flex-col items-center justify-end gap-[6%] pb-[10%]">
        <span className={cn("flex w-[12%] min-w-2 flex-col items-center", lot.kind === "short" ? "h-[30%]" : "h-[66%]")}>
          <span className="aspect-[1/1.4] w-[170%] shrink-0 rounded-[50%] bg-[#d92d20]" />
          <span className="w-full flex-1 rounded-b-sm bg-[#e8c48a]" />
        </span>
        <span className={cn("font-semibold", big ? "text-2xl" : "text-[0.8125rem]")}>{lot.text}</span>
      </span>
    );
  }
  const role = { mafia: VenetianMask, detective: Search, doctor: HeartPulse, civilian: User } as const;
  const Icon = lot.kind in role ? role[lot.kind as keyof typeof role] : null;
  return (
    <span className="flex size-full flex-col items-center justify-center gap-[8%] p-[8%] text-center">
      {Icon && <Icon className={big ? "size-16" : "size-[36%]"} aria-hidden />}
      <span className={cn("break-words font-semibold leading-tight [overflow-wrap:anywhere]", big ? "text-3xl" : lot.text.length > 14 ? "text-[0.75rem]" : "text-[0.9375rem]")}>
        {lot.text}
      </span>
    </span>
  );
}

const faceTone = (k: Lot["kind"]) =>
  k === "mafia" ? "bg-[#17171c] text-white" : k === "detective" ? "bg-[#1e3a8a] text-white" : k === "doctor" ? "bg-[#ecfdf3] text-[#05603a]" : "bg-surface text-fg";

export default function DrawLots({ locale, mode: modeProp = "custom" }: { locale: Locale; mode?: string }) {
  const t = T[locale];
  const [mode, setMode] = useState<LotsMode>(isMode(modeProp) ? modeProp : "custom");
  const [s, setS] = usePersistentState<Settings>(
    "lots:v1",
    { text: t.linesDefault, count: modeProp === "mafia" ? 10 : 5, marked: modeProp === "mafia" ? 3 : 1, detective: true, doctor: true, secret: modeProp === "mafia" },
    isSettings,
  );
  const [deck, setDeck] = useState<Lot[] | null>(null);
  const [open, setOpen] = useState<boolean[]>([]);
  const [showing, setShowing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const hideRef = useRef<HTMLButtonElement>(null);

  const lots = buildLots(mode, { lines: parseLines(s.text, LOTS_MAX), count: s.count, marked: s.marked, detective: s.detective, doctor: s.doctor }, locale);
  const secret = s.secret;

  const deal = () => {
    if (lots.length < 2) {
      setError(t.needTwo);
      return;
    }
    setError("");
    setDeck(shuffle(lots));
    setOpen(Array<boolean>(lots.length).fill(false));
    setShowing(null);
  };

  const draw = (i: number) => {
    if (!deck || open[i]) return;
    setOpen((o) => o.map((v, j) => (j === i ? true : v)));
    if (secret) setShowing(i);
  };

  useEffect(() => {
    if (showing !== null) hideRef.current?.focus();
  }, [showing]);

  const left = open.filter((v) => !v).length;
  const changeMode = (m: LotsMode) => {
    setMode(m);
    setDeck(null);
    if (m === "mafia") setS({ ...s, count: Math.max(4, s.count), marked: defaultMafia(Math.max(4, s.count)), secret: true });
    else if (m === "straws") setS({ ...s, marked: 1 });
  };
  const mafiaCount = lots.filter((l) => l.kind === "mafia").length;

  return (
    <div className="flex flex-col gap-5">
      <Segmented wrap label={t.mode} value={mode} onChange={changeMode} options={LOTS_MODES.map((m) => ({ value: m, label: t.modes[m] }))} />

      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        {mode === "custom" ? (
          <Field label={t.lines} htmlFor="lots-lines" className="w-full">
            <Textarea id="lots-lines" value={s.text} onChange={(e) => setS({ ...s, text: e.target.value })} className="min-h-28 font-sans text-[0.9375rem]" />
          </Field>
        ) : (
          <Field label={t.count} htmlFor="lots-count" className="w-36">
            <Input
              id="lots-count"
              type="number"
              inputMode="numeric"
              min={mode === "mafia" ? 4 : 2}
              max={LOTS_MAX}
              value={s.count}
              onChange={(e) => {
                const count = clampCount(Number(e.target.value), mode === "mafia" ? 4 : 2);
                setS({ ...s, count, marked: mode === "mafia" ? defaultMafia(count) : Math.min(s.marked, count - 1) });
              }}
            />
          </Field>
        )}
        {mode === "straws" && (
          <Field label={t.short} htmlFor="lots-short" className="w-36">
            <Input
              id="lots-short"
              type="number"
              inputMode="numeric"
              min={1}
              max={s.count - 1}
              value={s.marked}
              onChange={(e) => setS({ ...s, marked: Math.max(1, Math.min(s.count - 1, Math.round(Number(e.target.value) || 1))) })}
            />
          </Field>
        )}
        {mode === "mafia" && (
          <>
            <Field label={t.mafia} htmlFor="lots-mafia" className="w-28">
              <Input
                id="lots-mafia"
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.max(1, Math.ceil(s.count / 2) - 1)}
                value={mafiaCount}
                onChange={(e) => setS({ ...s, marked: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
              />
            </Field>
            <Switch label={t.detective} checked={s.detective} onChange={(e) => setS({ ...s, detective: e.target.checked })} className="pb-2" />
            <Switch label={t.doctor} checked={s.doctor} onChange={(e) => setS({ ...s, doctor: e.target.checked })} className="pb-2" />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button size="lg" variant="primary" onClick={deal}>
          <Shuffle aria-hidden />
          {deck ? t.again : t.deal}
        </Button>
        <Switch label={t.secret} checked={secret} onChange={(e) => setS({ ...s, secret: e.target.checked })} />
      </div>
      {mode === "mafia" && <p className="-mt-2 text-sm text-fg-3">{t.roles(mafiaCount, lots.length - mafiaCount)}</p>}
      {error && <Notice tone="err">{error}</Notice>}

      {deck && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-fg-2" aria-live="polite">
              {left === 0 ? t.allTaken : left === deck.length ? t.pick : t.left(left)}
            </p>
            {showing !== -1 && (left > 0 || secret) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(deck.map(() => true));
                  setShowing(secret ? -1 : null);
                }}
              >
                <Eye aria-hidden />
                {t.openAll}
              </Button>
            )}
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] sm:gap-3">
            {deck.map((lot, i) => {
              const faceUp = open[i] && (!secret || showing === -1);
              return (
                <li key={i} className="aspect-[3/4] [perspective:600px]">
                  <button
                    type="button"
                    onClick={() => draw(i)}
                    disabled={open[i]}
                    aria-label={faceUp ? `${t.card(i + 1)}: ${lot.text}` : open[i] ? `${t.card(i + 1)}, ${t.taken}` : t.card(i + 1)}
                    className={cn(
                      "relative size-full rounded-[0.75rem] transition-transform duration-500 [transform-style:preserve-3d] disabled:cursor-default",
                      faceUp && "[transform:rotateY(180deg)]",
                      !open[i] && "hover:-translate-y-0.5",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[0.75rem] border border-line-strong text-white [backface-visibility:hidden] [-webkit-backface-visibility:hidden]",
                        open[i]
                          ? "bg-[repeating-linear-gradient(45deg,var(--surface-2)_0_6px,var(--line)_6px_12px)] text-fg-3"
                          : "bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_60%,#000))] shadow-sm",
                      )}
                    >
                      {open[i] ? <Check className="size-6" aria-hidden /> : <span className="text-2xl font-bold opacity-90">?</span>}
                      <span className={cn("text-xs font-semibold", open[i] ? "text-fg-3" : "opacity-80")}>{i + 1}</span>
                    </span>
                    <span
                      className={cn(
                        "absolute inset-0 overflow-hidden rounded-[0.75rem] border border-line-strong [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]",
                        faceTone(lot.kind),
                      )}
                    >
                      <Face lot={lot} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {deck && showing !== null && showing >= 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.yours}
          onKeyDown={(e) => e.key === "Escape" && setShowing(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="flex w-full max-w-xs flex-col items-center gap-4">
            <p className="text-sm font-medium text-white/80">
              {t.yours} · {t.card(showing + 1)}
            </p>
            <div
              className={cn(
                "aspect-[3/4] w-full max-w-[16rem] overflow-hidden rounded-[1rem] border border-line-strong shadow-[var(--shadow-overlay)]",
                faceTone(deck[showing].kind),
              )}
            >
              <Face lot={deck[showing]} big />
            </div>
            <Button ref={hideRef} size="lg" variant="primary" onClick={() => setShowing(null)} className="w-full max-w-[16rem]">
              <EyeOff aria-hidden />
              {t.hide}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
