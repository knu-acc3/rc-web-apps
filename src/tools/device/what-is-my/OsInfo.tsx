"use client";

import type { ToolProps } from "../../types";
import type { BitnessInfo, OsNote } from "./lib/ua";
import { detectUa, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, sourceLabel, Stack } from "./ui/kit";

const T = {
  ru: {
    label: "Ваша операционная система",
    family: "Семейство",
    version: "Версия",
    codename: "Кодовое имя",
    arch: "Архитектура",
    platform: "navigator.platform",
    pv: "Версия платформы (Client Hints)",
    notes: {
      "win-ambiguous":
        "Браузер сообщает «Windows NT 10.0» — так выглядят и Windows 10, и Windows 11. Точную версию покажет команда winver (Win + R → winver) или Chrome/Edge, которые передают версию через Client Hints.",
      "mac-frozen":
        "Safari, Firefox и другие браузеры всегда пишут в User-Agent «Mac OS X 10.15.7», поэтому настоящая версия macOS скрыта. Посмотреть её можно в меню Apple → «Об этом Mac» или открыв страницу в Chrome.",
      "ios-from-safari":
        "С iOS 26 Safari пишет в User-Agent «iOS 18.6», но версия Safari совпадает с версией системы — по ней и определена iOS.",
      "ios-frozen":
        "В iOS 26 и новее User-Agent всегда сообщает 18.6, поэтому версия может быть новее. Точная — в «Настройки → Основные → Об этом устройстве».",
      "android-reduced":
        "Chrome скрывает версию Android в User-Agent (пишет «Android 10; K»), а Client Hints недоступны. Версия — в «Настройки → О телефоне».",
      "ipad-desktop":
        "iPad запрашивает полные версии сайтов и представляется как Mac. Система определена по сенсорному экрану; версия iPadOS — в «Настройки → Основные → Об этом устройстве».",
    } satisfies Record<OsNote, string>,
    bits: (b: BitnessInfo) => (b.os ? `${b.os} бит${b.arch ? `, ${b.arch === "arm" ? "ARM" : "x86"}` : ""}` : "Не сообщается браузером"),
  },
  en: {
    label: "Your operating system",
    family: "Family",
    version: "Version",
    codename: "Codename",
    arch: "Architecture",
    platform: "navigator.platform",
    pv: "Platform version (Client Hints)",
    notes: {
      "win-ambiguous":
        "The browser reports “Windows NT 10.0”, which is the same for Windows 10 and Windows 11. Run winver (Win + R → winver) for the exact version, or open this page in Chrome or Edge — they send it through Client Hints.",
      "mac-frozen":
        "Safari, Firefox and other browsers always report “Mac OS X 10.15.7” in the User-Agent, so the real macOS version is hidden. Check Apple menu → About This Mac, or open this page in Chrome.",
      "ios-from-safari":
        "Since iOS 26 Safari reports “iOS 18.6” in the User-Agent, but Safari's own version matches the OS version, so iOS is detected from it.",
      "ios-frozen":
        "On iOS 26 and later the User-Agent always says 18.6, so your version may be newer. The exact one is in Settings → General → About.",
      "android-reduced":
        "Chrome hides the Android version in the User-Agent (“Android 10; K”) and Client Hints are unavailable. See Settings → About phone.",
      "ipad-desktop":
        "iPad requests desktop websites and presents itself as a Mac. It was recognised by its touch screen; the iPadOS version is in Settings → General → About.",
    } satisfies Record<OsNote, string>,
    bits: (b: BitnessInfo) => (b.os ? `${b.os}-bit${b.arch ? `, ${b.arch === "arm" ? "ARM" : "x86"}` : ""}` : "Not reported by the browser"),
  },
} as const;

export default function OsInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const u = useDetected(detectUa);
  const os = u?.os;
  return (
    <Stack>
      <Hero locale={locale} label={t.label} value={u ? (os?.label ?? c.unknown) : null} copy={os?.label ?? undefined} />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.family, v: u ? (os?.name ?? c.unknown) : null },
          { k: t.version, v: u ? (os?.version ?? c.unknown) : null },
          ...(os?.codename ? [{ k: t.codename, v: os.codename }] : []),
          { k: t.arch, v: u ? t.bits(u.bitness) : null },
          ...(u?.hints?.platformVersion ? [{ k: t.pv, v: u.hints.platformVersion, mono: true }] : []),
          { k: t.platform, v: u ? u.platform || "—" : null, mono: true },
          { k: c.source, v: u ? sourceLabel(c, os?.source ?? null) : null },
        ]}
      />
      {os?.note ? <Hint>{t.notes[os.note]}</Hint> : null}
    </Stack>
  );
}
