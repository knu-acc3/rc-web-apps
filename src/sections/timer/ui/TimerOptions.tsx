"use client";

import { Bell, BellOff, Play, Settings2, Volume2 } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Select, Switch } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { useStoredJson } from "@/sections/time/lib/storage";
import { schedule, SOUND_IDS, type SoundId } from "../lib/audio";
import { requestNotifications, useNotificationsSupported } from "../lib/notify";

type SoundChoice = SoundId | "off";
interface AlertOptions {
  sound: SoundChoice;
  notify: boolean;
}

const T = {
  ru: {
    sound: "Звук",
    off: "Без звука",
    beep: "Пищалка",
    bell: "Колокол",
    digital: "Будильник",
    soft: "Мягкий",
    test: "Проверить звук",
    notify: "Уведомление",
    denied: "Уведомления запрещены в настройках браузера",
    full: "На весь экран",
    settings: "Звук и уведомления",
  },
  en: {
    sound: "Sound",
    off: "No sound",
    beep: "Beeper",
    bell: "Bell",
    digital: "Alarm clock",
    soft: "Soft",
    test: "Test sound",
    notify: "Notification",
    denied: "Notifications are blocked in the browser settings",
    full: "Full screen",
    settings: "Sound and notifications",
  },
} as const;

const isOpts = (v: unknown): v is AlertOptions =>
  !!v && typeof v === "object" && (SOUND_IDS as string[]).concat("off").includes((v as AlertOptions).sound) && typeof (v as AlertOptions).notify === "boolean";
const DEFAULTS: AlertOptions = { sound: "beep", notify: false };

/** Shared sound + notification preferences for all timers (remembered in the browser). */
export function useAlertOptions(): [AlertOptions, (o: AlertOptions) => void] {
  const [o, set] = useStoredJson<AlertOptions>("timer:alerts:v1", DEFAULTS, isOpts);
  return [o, set];
}

/** One quiet row: sound, notification, full screen. */
/** Sound and notification settings, folded away: the timer itself stays the only thing in focus. */
export function TimerOptions({ locale, options, onChange }: { locale: Locale; options: AlertOptions; onChange: (o: AlertOptions) => void }) {
  const t = T[locale];
  const supported = useNotificationsSupported();
  const [denied, setDenied] = useState(false);
  return (
    <Fold
      title={
        <span className="inline-flex items-center gap-2 text-[0.9375rem]">
          <Settings2 className="size-4 text-fg-3" aria-hidden />
          {t.settings}
        </span>
      }
      hint={`${t[options.sound]}${options.notify ? ` · ${t.notify}` : ""}`}
      bodyClassName="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 text-sm"
    >
      <div className="flex items-center gap-1.5">
        <Volume2 className="size-4 text-fg-3" aria-hidden />
        <Select aria-label={t.sound} size="sm" className="w-36" value={options.sound} onChange={(e) => onChange({ ...options, sound: e.target.value as SoundChoice })}>
          {(["beep", "digital", "bell", "soft", "off"] as SoundChoice[]).map((s) => (
            <option key={s} value={s}>
              {t[s]}
            </option>
          ))}
        </Select>
        <Button variant="ghost" size="icon-sm" aria-label={t.test} title={t.test} disabled={options.sound === "off"} onClick={() => options.sound !== "off" && schedule(options.sound, 0, 1)}>
          <Play aria-hidden />
        </Button>
      </div>
      {supported && (
        <Switch
          label={
            <span className="inline-flex items-center gap-1">
              {options.notify ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
              {t.notify}
            </span>
          }
          checked={options.notify}
          onChange={async (e) => {
            const want = e.target.checked;
            if (!want) return onChange({ ...options, notify: false });
            const ok = await requestNotifications();
            setDenied(!ok);
            onChange({ ...options, notify: ok });
          }}
        />
      )}
      {denied && <span className="text-[0.8125rem] text-warn">{t.denied}</span>}
    </Fold>
  );
}
