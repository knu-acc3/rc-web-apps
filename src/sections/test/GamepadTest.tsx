"use client";

import { Gamepad2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Notice } from "@/ui/panel";
import { useClientValue } from "./lib/client";
import { stickMagnitude } from "./lib/input-stats";
import { GamepadCard, type DriftResult, type PadSnap } from "./GamepadCard";

const DRIFT_MS = 3000;

const T = {
  ru: {
    waiting: "Подключите геймпад и нажмите на нём любую кнопку",
    waitingSub: "Браузер показывает контроллер только после нажатия кнопки, пока вкладка активна. Подходят геймпады Xbox, PlayStation, Switch Pro и другие.",
    unsupported: "Этот браузер не поддерживает Gamepad API. Откройте страницу в Chrome, Edge, Firefox или Safari последних версий.",
  },
  en: {
    waiting: "Connect a gamepad and press any button on it",
    waitingSub: "Browsers only reveal a controller after a button press while this tab is active. Xbox, PlayStation, Switch Pro and other pads work.",
    unsupported: "This browser doesn't support the Gamepad API. Use a recent Chrome, Edge, Firefox or Safari.",
  },
} as const;

function readPads(ever: Map<number, boolean[]>): PadSnap[] {
  const out: PadSnap[] = [];
  for (const gp of navigator.getGamepads()) {
    if (!gp || !gp.connected) continue;
    const seen = ever.get(gp.index) ?? [];
    gp.buttons.forEach((b, i) => {
      if (b.pressed) seen[i] = true;
    });
    ever.set(gp.index, seen);
    out.push({
      index: gp.index,
      id: gp.id,
      standard: gp.mapping === "standard",
      buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
      axes: [...gp.axes],
      ever: gp.buttons.map((_, i) => !!seen[i]),
      vibration: typeof gp.vibrationActuator?.playEffect === "function",
    });
  }
  return out;
}

const signature = (pads: PadSnap[]) =>
  pads.map((p) => `${p.index}:${p.buttons.map((b) => (b.pressed ? 1 : 0) + Math.round(b.value * 100)).join(",")}|${p.axes.map((a) => Math.round(a * 1000)).join(",")}`).join(";");

export default function GamepadTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const supported = useClientValue(() => typeof navigator !== "undefined" && typeof navigator.getGamepads === "function", true);
  const [pads, setPads] = useState<PadSnap[]>([]);
  const [drift, setDrift] = useState<Record<number, DriftResult>>({});
  const driftRef = useRef(new Map<number, { until: number; max: number[] }>());

  useEffect(() => {
    if (typeof navigator.getGamepads !== "function") return;
    const ever = new Map<number, boolean[]>();
    const drifts = driftRef.current;
    let raf = 0;
    let sig = "";
    const loop = () => {
      const snap = readPads(ever);
      const now = performance.now();
      for (const p of snap) {
        const d = drifts.get(p.index);
        if (!d) continue;
        if (!d.until) d.until = now + DRIFT_MS;
        for (let s = 0; s * 2 + 1 < p.axes.length && s < 2; s++) d.max[s] = Math.max(d.max[s] ?? 0, stickMagnitude(p.axes[s * 2], p.axes[s * 2 + 1]));
        if (now >= d.until) {
          drifts.delete(p.index);
          const sticks = [...d.max];
          setDrift((prev) => ({ ...prev, [p.index]: { measuring: false, sticks } }));
        }
      }
      const next = signature(snap);
      if (next !== sig) {
        sig = next;
        setPads(snap);
      }
      raf = snap.length ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("gamepadconnected", kick);
    window.addEventListener("gamepaddisconnected", kick);
    kick(); // a pad may already be exposed
    return () => {
      cancelAnimationFrame(raf);
      raf = -1;
      window.removeEventListener("gamepadconnected", kick);
      window.removeEventListener("gamepaddisconnected", kick);
    };
  }, []);

  function rumble(index: number) {
    const gp = navigator.getGamepads()[index];
    gp?.vibrationActuator?.playEffect("dual-rumble", { startDelay: 0, duration: 800, weakMagnitude: 0.6, strongMagnitude: 1 }).catch(() => {});
  }

  function checkDrift(index: number) {
    // the deadline is set by the polling loop on its next frame
    driftRef.current.set(index, { until: 0, max: [] });
    setDrift((prev) => ({ ...prev, [index]: { measuring: true, sticks: [] } }));
  }

  if (!supported) return <Notice tone="err">{t.unsupported}</Notice>;

  return (
    <div className="flex flex-col gap-4">
      {pads.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <Gamepad2 className="size-14 animate-pulse text-accent" strokeWidth={1.5} aria-hidden />
          <p className="text-lg font-semibold text-fg">{t.waiting}</p>
          <p className="max-w-md text-sm text-fg-3">{t.waitingSub}</p>
        </div>
      ) : (
        pads.map((p) => (
          <GamepadCard key={p.index} locale={locale} pad={p} drift={drift[p.index]} onRumble={() => rumble(p.index)} onDrift={() => checkDrift(p.index)} />
        ))
      )}
    </div>
  );
}
