"use client";

import { MousePointerClick, RotateCcw } from "lucide-react";
import { useEffect, useReducer, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Notice, Panel } from "@/ui/panel";
import { CHATTER_MS, estimatePollingRate, isChatter, nearestPollingRate } from "./lib/input-stats";
import { useClientValue } from "./lib/client";
import { MouseDiagram } from "./ui/MouseDiagram";

const T = {
  ru: {
    area: "Область теста мыши",
    areaHint: "Кликайте здесь любыми кнопками, крутите колёсико и водите мышью",
    areaNote: "Контекстное меню, автопрокрутка и переход «Назад/Вперёд» внутри области отключены",
    reset: "Сбросить",
    buttons: ["Левая", "Средняя (колёсико)", "Правая", "Назад (боковая)", "Вперёд (боковая)"],
    pressed: "нажата",
    notTested: "не нажималась",
    clicks: ["нажатие", "нажатия", "нажатий"],
    chatter: (n: number, ms: string) => `${n} ${plural("ru", n, ["повтор", "повтора", "повторов"])} быстрее ${CHATTER_MS} мс (мин. ${ms} мс) — возможен дребезг`,
    dbl: "Двойной клик",
    dblCount: "Двойных кликов",
    dblLast: "Интервал последнего",
    dblHint: "Сделайте двойной клик левой кнопкой в области теста.",
    wheel: "Колёсико",
    up: "Вверх",
    down: "Вниз",
    left: "Влево",
    right: "Вправо",
    delta: "Последний шаг",
    mode: ["пиксели", "строки", "страницы"],
    poll: "Частота опроса",
    pollNow: "Сейчас",
    pollMax: "Максимум",
    pollHint: "Быстро водите мышью кругами 2–3 секунды.",
    pollNear: (n: number) => `ближе всего к ${n} Гц`,
    pollNoCoalesced: "Браузер не отдаёт промежуточные события (getCoalescedEvents), поэтому оценка может упираться в частоту обновления экрана.",
    ms: "мс",
    hz: "Гц",
  },
  en: {
    area: "Mouse test area",
    areaHint: "Click here with any button, scroll the wheel and move the mouse",
    areaNote: "Context menu, autoscroll and back/forward navigation are disabled inside this area",
    reset: "Reset",
    buttons: ["Left", "Middle (wheel)", "Right", "Back (side)", "Forward (side)"],
    pressed: "pressed",
    notTested: "not pressed yet",
    clicks: ["press", "presses"],
    chatter: (n: number, ms: string) => `${n} ${n === 1 ? "repeat" : "repeats"} faster than ${CHATTER_MS} ms (min ${ms} ms) — possible switch chatter`,
    dbl: "Double click",
    dblCount: "Double clicks",
    dblLast: "Last interval",
    dblHint: "Double-click with the left button inside the test area.",
    wheel: "Scroll wheel",
    up: "Up",
    down: "Down",
    left: "Left",
    right: "Right",
    delta: "Last step",
    mode: ["pixels", "lines", "pages"],
    poll: "Polling rate",
    pollNow: "Now",
    pollMax: "Maximum",
    pollHint: "Move the mouse quickly in circles for 2–3 seconds.",
    pollNear: (n: number) => `closest to ${n} Hz`,
    pollNoCoalesced: "This browser doesn't expose intermediate events (getCoalescedEvents), so the estimate may be capped at your screen refresh rate.",
    ms: "ms",
    hz: "Hz",
  },
} as const;

interface Btn {
  down: boolean;
  count: number;
  chatter: number;
  minGap: number | null;
}

interface State {
  btn: Btn[];
  dblCount: number;
  dblLast: number | null;
  wheel: { up: number; down: number; left: number; right: number; dx: number; dy: number; mode: number } | null;
  pollNow: number | null;
  pollMax: number | null;
}

type Action =
  | { type: "down"; b: number; gap: number | null }
  | { type: "up"; b: number }
  | { type: "release" }
  | { type: "dbl"; interval: number | null }
  | { type: "wheel"; dx: number; dy: number; mode: number }
  | { type: "poll"; hz: number }
  | { type: "reset" };

const emptyBtn = (): Btn => ({ down: false, count: 0, chatter: 0, minGap: null });
const init = (): State => ({ btn: Array.from({ length: 5 }, emptyBtn), dblCount: 0, dblLast: null, wheel: null, pollNow: null, pollMax: null });

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "reset":
      return init();
    case "release":
      return s.btn.some((b) => b.down) ? { ...s, btn: s.btn.map((b) => ({ ...b, down: false })) } : s;
    case "down":
    case "up": {
      if (a.b < 0 || a.b > 4) return s;
      const btn = s.btn.map((b, i) => {
        if (i !== a.b) return b;
        if (a.type === "up") return { ...b, down: false };
        const chatter = a.gap !== null && isChatter(a.gap);
        return {
          down: true,
          count: b.count + 1,
          chatter: b.chatter + (chatter ? 1 : 0),
          minGap: chatter ? Math.min(b.minGap ?? Infinity, a.gap!) : b.minGap,
        };
      });
      return { ...s, btn };
    }
    case "dbl":
      return { ...s, dblCount: s.dblCount + 1, dblLast: a.interval ?? s.dblLast };
    case "wheel": {
      const w = s.wheel ?? { up: 0, down: 0, left: 0, right: 0, dx: 0, dy: 0, mode: 0 };
      return {
        ...s,
        wheel: {
          up: w.up + (a.dy < 0 ? 1 : 0),
          down: w.down + (a.dy > 0 ? 1 : 0),
          left: w.left + (a.dx < 0 ? 1 : 0),
          right: w.right + (a.dx > 0 ? 1 : 0),
          dx: a.dx,
          dy: a.dy,
          mode: a.mode,
        },
      };
    }
    case "poll":
      return { ...s, pollNow: a.hz, pollMax: Math.max(s.pollMax ?? 0, a.hz) };
  }
}

export default function MouseTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [s, dispatch] = useReducer(reducer, undefined, init);
  const areaRef = useRef<HTMLDivElement>(null);
  const coalesced = useClientValue(() => typeof PointerEvent !== "undefined" && "getCoalescedEvents" in PointerEvent.prototype, true);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const lastDown: (number | null)[] = [null, null, null, null, null];
    const prevDown: (number | null)[] = [null, null, null, null, null];
    const stamps: number[] = [];
    let lastPollUi = 0;

    const inside = (e: Event) => e.target instanceof Node && area.contains(e.target);
    const blockNav = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 3 || e.button === 4) e.preventDefault();
    };
    const onDown = (e: MouseEvent) => {
      blockNav(e);
      const b = e.button;
      if (b < 0 || b > 4) return;
      const gap = lastDown[b] === null ? null : e.timeStamp - lastDown[b]!;
      prevDown[b] = lastDown[b];
      lastDown[b] = e.timeStamp;
      dispatch({ type: "down", b, gap });
    };
    const onUp = (e: MouseEvent) => {
      if (inside(e)) blockNav(e);
      dispatch({ type: "up", b: e.button });
    };
    const onDbl = () => {
      const a = prevDown[0];
      const b = lastDown[0];
      dispatch({ type: "dbl", interval: a !== null && b !== null ? b - a : null });
    };
    const prevent = (e: Event) => e.preventDefault();
    const onAux = (e: MouseEvent) => blockNav(e);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dispatch({ type: "wheel", dx: e.deltaX, dy: e.deltaY, mode: e.deltaMode });
    };
    const onMove = (e: PointerEvent) => {
      const list = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      const times = list.length ? list.map((x) => x.timeStamp) : [e.timeStamp];
      for (const ts of times) {
        if (stamps.length && ts - stamps[stamps.length - 1] > 100) stamps.length = 0; // the mouse stopped
        stamps.push(ts);
      }
      while (stamps.length > 2 && stamps[stamps.length - 1] - stamps[0] > 500) stamps.shift();
      if (e.timeStamp - lastPollUi > 250) {
        lastPollUi = e.timeStamp;
        const hz = estimatePollingRate(stamps);
        if (hz) dispatch({ type: "poll", hz });
      }
    };
    const release = () => dispatch({ type: "release" });

    area.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    area.addEventListener("dblclick", onDbl);
    area.addEventListener("contextmenu", prevent);
    area.addEventListener("auxclick", onAux);
    area.addEventListener("wheel", onWheel, { passive: false });
    area.addEventListener("pointermove", onMove);
    window.addEventListener("blur", release);
    return () => {
      area.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      area.removeEventListener("dblclick", onDbl);
      area.removeEventListener("contextmenu", prevent);
      area.removeEventListener("auxclick", onAux);
      area.removeEventListener("wheel", onWheel);
      area.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", release);
    };
  }, []);

  const ms = (n: number) => formatNumber(locale, n, { maximumFractionDigits: n < 10 ? 1 : 0 });
  const hz = (n: number) => formatNumber(locale, n, { maximumFractionDigits: 0 });

  const chatter = s.btn.map((b, i) => ({ b, i })).filter(({ b }) => b.chatter > 0);
  const w = s.wheel;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1fr)_18rem]">
          <div ref={areaRef} role="region" aria-label={t.area} className="flex min-h-80 cursor-crosshair select-none flex-col items-center justify-center gap-2 bg-surface-2 px-6 py-10 text-center lg:min-h-96">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden>
              <MousePointerClick className="size-8" />
            </span>
            <p className="max-w-sm text-[0.9375rem] font-medium text-fg">{t.areaHint}</p>
            <p className="max-w-sm text-[0.8125rem] text-fg-3">{t.areaNote}</p>
          </div>
          <div className="flex flex-col items-center gap-3 p-4 sm:p-5">
            <MouseDiagram down={s.btn.map((b) => b.down)} tested={s.btn.map((b) => b.count > 0)} wheel={!!w} labels={t.buttons} />
            <ul className="w-full text-sm">
              {s.btn.map((b, i) => (
                <li key={i} className="flex items-center gap-2 py-0.5">
                  <span className={cn("size-2.5 shrink-0 rounded-full", b.down ? "bg-accent" : b.count > 0 ? "bg-ok" : "border border-line-strong")} aria-hidden />
                  <span className={cn("min-w-0 flex-1 truncate", b.count > 0 || b.down ? "text-fg" : "text-fg-3")}>
                    {i} · {t.buttons[i]}
                  </span>
                  <span className="tabular text-fg-2">{b.down ? t.pressed : b.count > 0 ? `${b.count} ${plural(locale, b.count, t.clicks)}` : "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      {chatter.map(({ b, i }) => (
        <Notice key={i} tone="warn">
          {t.buttons[i]}: {t.chatter(b.chatter, ms(b.minGap ?? 0))}
        </Notice>
      ))}

      <dl className="facts">
        <div>
          <dt>{t.dbl}</dt>
          <dd className="tabular">
            {s.dblCount > 0 ? (
              <>
                {t.dblCount}: {s.dblCount}
                {s.dblLast !== null && ` · ${t.dblLast}: ${ms(s.dblLast)} ${t.ms}`}
              </>
            ) : (
              <span className="font-normal text-fg-3">{t.dblHint}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>{t.wheel}</dt>
          <dd className="tabular">
            {w ? (
              <>
                ↑ {w.up} · ↓ {w.down} · ← {w.left} · → {w.right}
                <span className="block text-[0.8125rem] font-normal text-fg-3">
                  {t.delta}: deltaY {formatNumber(locale, w.dy, { maximumFractionDigits: 2 })}, deltaX {formatNumber(locale, w.dx, { maximumFractionDigits: 2 })}, deltaMode {w.mode} ({t.mode[w.mode] ?? "?"})
                </span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>{t.poll}</dt>
          <dd className="tabular">
            {s.pollMax ? (
              <>
                {t.pollNow}: {s.pollNow ? `${hz(s.pollNow)} ${t.hz}` : "—"} · {t.pollMax}: {hz(s.pollMax)} {t.hz}
                <span className="block text-[0.8125rem] font-normal text-fg-3">{t.pollNear(nearestPollingRate(s.pollMax))}</span>
              </>
            ) : (
              <span className="font-normal text-fg-3">{t.pollHint}</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 basis-64 text-[0.8125rem] text-fg-3">{!coalesced && t.pollNoCoalesced}</p>
        <Button variant="tonal" onClick={() => dispatch({ type: "reset" })}>
          <RotateCcw aria-hidden />
          {t.reset}
        </Button>
      </div>
    </div>
  );
}
