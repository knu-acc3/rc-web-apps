"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Badge, Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { KeyboardVisual, type LabelMode } from "./KeyboardVisual";
import { KEY_LOCATIONS, KEYBOARD, KEYBOARD_CODES, NAV_KEYS } from "./lib/keyboard-layout";

const T = {
  ru: {
    labels: "Подписи клавиш",
    both: "Обе раскладки",
    reset: "Сбросить",
    area: "Область теста клавиатуры: нажимайте любые клавиши",
    focusOn: "Тест активен — пробел, стрелки и Backspace не прокручивают страницу.",
    focusOff: "Нажимайте клавиши. Щёлкните по клавиатуре ниже, чтобы пробел и стрелки не прокручивали страницу.",
    held: "Зажато сейчас",
    maxHeld: "Максимум одновременно",
    maxHint: "зажмите несколько клавиш",
    tested: "Проверено клавиш",
    of: (n: number) => `из ${n}`,
    legendDown: "зажата",
    legendEver: "проверена",
    legendNone: "не нажималась",
    locks: "Индикаторы",
    extra: "Клавиши вне схемы",
    last: "Последнее событие",
    log: "Журнал событий",
    logEmpty: "Нажмите любую клавишу — здесь появятся key, code, keyCode и другие свойства события.",
    colType: "Событие",
    colRepeat: "Повтор",
    colMods: "Модификаторы",
    yes: "да",
    no: "нет",
    space: "(пробел)",
    loc: { standard: "0 — обычная", left: "1 — левая", right: "2 — правая", numpad: "3 — цифровой блок" },
  },
  en: {
    labels: "Key labels",
    both: "Both",
    reset: "Reset",
    area: "Keyboard test area: press any keys",
    focusOn: "Test is active — space, arrows and Backspace won't scroll the page.",
    focusOff: "Press any keys. Click the keyboard below so space and arrows don't scroll the page.",
    held: "Held now",
    maxHeld: "Max simultaneous",
    maxHint: "hold several keys",
    tested: "Keys tested",
    of: (n: number) => `of ${n}`,
    legendDown: "held",
    legendEver: "tested",
    legendNone: "not pressed yet",
    locks: "Lock keys",
    extra: "Keys outside the layout",
    last: "Last event",
    log: "Event log",
    logEmpty: "Press any key — its key, code, keyCode and other event properties will appear here.",
    colType: "Event",
    colRepeat: "Repeat",
    colMods: "Modifiers",
    yes: "yes",
    no: "no",
    space: "(space)",
    loc: { standard: "0 — standard", left: "1 — left", right: "2 — right", numpad: "3 — numpad" },
  },
} as const;

interface Entry {
  id: number;
  type: "down" | "up";
  key: string;
  code: string;
  keyCode: number;
  location: number;
  repeat: boolean;
  mods: string;
}

interface Locks {
  caps: boolean;
  num: boolean;
  scroll: boolean;
}

interface State {
  down: ReadonlySet<string>;
  ever: ReadonlySet<string>;
  maxHeld: number;
  log: Entry[];
  extra: string[];
  seq: number;
  locks: Locks | null;
}

type Action = { type: "key"; entry: Omit<Entry, "id">; locks: Locks } | { type: "release" } | { type: "reset" };

const LOG_SIZE = 14;
const INITIAL: State = { down: new Set(), ever: new Set(), maxHeld: 0, log: [], extra: [], seq: 0, locks: null };

function reducer(s: State, a: Action): State {
  if (a.type === "reset") return INITIAL;
  if (a.type === "release") return s.down.size ? { ...s, down: new Set() } : s;
  const e = { ...a.entry, id: s.seq + 1 };
  const down = new Set(s.down);
  const ever = new Set(s.ever);
  const id = e.code || (e.key ? `key:${e.key}` : "");
  if (e.type === "down") {
    if (id) down.add(id);
  } else {
    down.delete(id);
    // macOS does not send keyup for other keys while Cmd is held
    if (e.key === "Meta") down.clear();
  }
  if (id) ever.add(id);
  const extra = e.code && !KEYBOARD_CODES.has(e.code) && !s.extra.includes(e.code) ? [...s.extra, e.code] : s.extra;
  return {
    down,
    ever,
    maxHeld: Math.max(s.maxHeld, down.size),
    log: [e, ...s.log].slice(0, LOG_SIZE),
    extra,
    seq: e.id,
    locks: a.locks,
  };
}

function isEditable(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && !!el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']");
}

const TOTAL = KEYBOARD.length;

export default function KeyboardTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [labels, setLabels] = useState<LabelMode>(locale === "ru" ? "both" : "en");
  const [focused, setFocused] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (ev: KeyboardEvent) => {
      const area = areaRef.current;
      const inArea = !!area && area.contains(document.activeElement);
      if (!inArea && isEditable(ev.target)) return;
      if (inArea && !ev.ctrlKey && !ev.metaKey) {
        if ((NAV_KEYS.has(ev.key) && !ev.altKey) || ev.key === "Alt") ev.preventDefault();
      }
      const mods = [ev.ctrlKey && "Ctrl", ev.shiftKey && "Shift", ev.altKey && "Alt", ev.metaKey && "Meta"].filter(Boolean).join("+");
      dispatch({
        type: "key",
        entry: {
          type: ev.type === "keydown" ? "down" : "up",
          key: ev.key,
          code: ev.code,
          keyCode: ev.keyCode,
          location: ev.location,
          repeat: ev.repeat,
          mods,
        },
        locks: { caps: ev.getModifierState("CapsLock"), num: ev.getModifierState("NumLock"), scroll: ev.getModifierState("ScrollLock") },
      });
    };
    // keyups are lost while the window is in the background — release everything
    const release = () => dispatch({ type: "release" });
    const onVis = () => {
      if (document.hidden) release();
    };
    window.addEventListener("keydown", handle);
    window.addEventListener("keyup", handle);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("keydown", handle);
      window.removeEventListener("keyup", handle);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const testedOnLayout = [...state.ever].filter((c) => KEYBOARD_CODES.has(c)).length;
  const last = state.log[0];
  const keyText = (k: string) => (k === " " ? t.space : k);
  const locName = (n: number) => t.loc[KEY_LOCATIONS[n] ?? "standard"] ?? String(n);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label={t.labels}
          value={labels}
          onChange={setLabels}
          options={[
            { value: "both", label: t.both },
            { value: "en", label: "QWERTY" },
            { value: "ru", label: locale === "ru" ? "ЙЦУКЕН" : "Cyrillic" },
          ]}
        />
        <span className="flex-1" />
        <Button variant="outline" onClick={() => dispatch({ type: "reset" })}>
          <RotateCcw aria-hidden />
          {t.reset}
        </Button>
      </div>

      <Panel className="overflow-hidden">
        <div
          ref={areaRef}
          role="application"
          aria-label={t.area}
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn("outline-none", focused && "ring-2 ring-inset ring-accent/40")}
        >
          <p className={cn("border-b border-line px-4 py-2.5 text-sm", focused ? "bg-accent-soft text-accent" : "text-fg-2")}>{focused ? t.focusOn : t.focusOff}</p>
          <div className="overflow-x-auto p-3 scrollbar-thin sm:p-4">
            <KeyboardVisual down={state.down} ever={state.ever} labels={labels} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-2.5 text-[0.8125rem] text-fg-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[0.1875rem] bg-accent" aria-hidden /> {t.legendDown}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[0.1875rem] border border-ok/50 bg-ok-soft" aria-hidden /> {t.legendEver}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[0.1875rem] border border-line-strong bg-surface" aria-hidden /> {t.legendNone}
          </span>
          {state.locks && (
            <span className="ml-auto inline-flex flex-wrap items-center gap-1.5">
              <span className="text-fg-3">{t.locks}:</span>
              <Badge tone={state.locks.caps ? "ok" : "neutral"}>Caps</Badge>
              <Badge tone={state.locks.num ? "ok" : "neutral"}>Num</Badge>
              <Badge tone={state.locks.scroll ? "ok" : "neutral"}>Scroll</Badge>
            </span>
          )}
        </div>
      </Panel>

      <p className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 text-[0.9375rem] text-fg-2">
        <span>
          {t.held}: <span className="tabular text-xl font-semibold text-fg">{state.down.size}</span>
        </span>
        <span>
          {t.maxHeld}: <span className="tabular text-xl font-semibold text-fg">{state.maxHeld}</span>
          {state.maxHeld < 2 && <span className="text-fg-3"> ({t.maxHint})</span>}
        </span>
        <span>
          {t.tested}: <span className="tabular text-xl font-semibold text-fg">{testedOnLayout}</span> {t.of(TOTAL)}
        </span>
      </p>

      {state.extra.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-fg-2">{t.extra}:</span>
          {state.extra.map((c) => (
            <Badge key={c} tone={state.down.has(c) ? "accent" : "ok"} className="font-mono">
              {c}
            </Badge>
          ))}
        </div>
      )}

      {last && (
        <dl className="facts">
          <div>
            <dt>key</dt>
            <dd className="font-mono">{keyText(last.key)}</dd>
          </div>
          <div>
            <dt>code</dt>
            <dd className="font-mono">{last.code || "—"}</dd>
          </div>
          <div>
            <dt>keyCode</dt>
            <dd className="font-mono">{last.keyCode}</dd>
          </div>
          <div>
            <dt>location</dt>
            <dd>{locName(last.location)}</dd>
          </div>
        </dl>
      )}

      <Panel>
        <PanelHeader title={`${t.log}${state.seq ? ` · ${state.seq}` : ""}`} />
        {state.log.length === 0 ? (
          <p className="px-4 py-4 text-sm text-fg-3">{t.logEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular">
              <thead className="bg-surface-2 text-fg-2">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">{t.colType}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">key</th>
                  <th scope="col" className="px-3 py-2 font-semibold">code</th>
                  <th scope="col" className="px-3 py-2 font-semibold">keyCode</th>
                  <th scope="col" className="px-3 py-2 font-semibold">location</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t.colRepeat}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t.colMods}</th>
                </tr>
              </thead>
              <tbody>
                {state.log.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className={cn("px-3 py-1.5 font-mono", e.type === "down" ? "text-accent" : "text-fg-3")}>{e.type === "down" ? "keydown" : "keyup"}</td>
                    <td className="px-3 py-1.5 font-mono text-fg">{keyText(e.key)}</td>
                    <td className="px-3 py-1.5 font-mono text-fg">{e.code || "—"}</td>
                    <td className="px-3 py-1.5 font-mono text-fg-2">{e.keyCode}</td>
                    <td className="px-3 py-1.5 text-fg-2">{e.location}</td>
                    <td className={cn("px-3 py-1.5", e.repeat ? "text-warn" : "text-fg-3")}>{e.repeat ? t.yes : t.no}</td>
                    <td className="px-3 py-1.5 font-mono text-fg-2">{e.mods || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
