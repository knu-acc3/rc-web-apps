"use client";

import { ChevronDown } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Notice } from "@/ui/panel";
import type { MediaStatus } from "../lib/media";

type Kind = "camera" | "microphone";

const RU_DAT: Record<Kind, string> = { camera: "камере", microphone: "микрофону" };
const RU_ACC: Record<Kind, string> = { camera: "камеру", microphone: "микрофон" };

const T = {
  ru: {
    title: (k: Kind) => `Как разрешить доступ к ${RU_DAT[k]}`,
    steps: (k: Kind) => {
      const n = k === "camera" ? "Камера" : "Микрофон";
      return [
        `Chrome, Edge, Яндекс Браузер: нажмите на значок слева от адреса сайта → «Настройки сайтов» (или «Разрешения») → «${n}» → «Разрешить». Затем обновите страницу.`,
        `Firefox: нажмите на значок ${k === "camera" ? "камеры" : "микрофона"} или замка в адресной строке и снимите блокировку, затем обновите страницу.`,
        `Safari на Mac: меню Safari → «Настройки для этого веб-сайта» → «${n}» → «Разрешить».`,
        `iPhone и iPad: «Настройки» → Safari → «${n}» → «Спросить» или «Разрешить». Android (Chrome): значок слева от адреса → «Разрешения» → «${n}».`,
        `Если браузер не спрашивает разрешения, проверьте системные настройки. Windows: «Параметры» → «Конфиденциальность и защита» → «${n}» — разрешите доступ приложениям и браузеру. macOS: «Системные настройки» → «Конфиденциальность и безопасность» → «${n}».`,
      ];
    },
    status: {
      denied: (k: Kind) => `Доступ к ${RU_DAT[k]} запрещён. Разрешите его в настройках сайта (инструкция ниже) и нажмите кнопку ещё раз.`,
      notfound: (k: Kind) => (k === "camera" ? "Камера не найдена. Подключите её или проверьте, не отключена ли она в системе." : "Микрофон не найден. Подключите его или проверьте, не отключён ли он в системе."),
      busy: (k: Kind) => `Не удалось запустить ${RU_ACC[k]}: устройство занято другой программой (Zoom, Teams, OBS, Discord) или неисправно. Закройте её и попробуйте снова.`,
      unsupported: (k: Kind) => `Браузер не даёт доступ к ${RU_DAT[k]} на этой странице. Нужен современный браузер и защищённое соединение (HTTPS).`,
      ended: (k: Kind) => (k === "camera" ? "Камера отключилась. Проверьте подключение и запустите тест снова." : "Микрофон отключился. Проверьте подключение и запустите тест снова."),
      error: (_k: Kind) => "Не удалось получить доступ к устройству. Попробуйте ещё раз или перезапустите браузер.",
    },
  },
  en: {
    title: (k: Kind) => `How to allow ${k} access`,
    steps: (k: Kind) => {
      const n = k === "camera" ? "Camera" : "Microphone";
      return [
        `Chrome and Edge: click the icon to the left of the address → Site settings (or Permissions) → ${n} → Allow. Then reload the page.`,
        `Firefox: click the ${k} or padlock icon in the address bar, remove the block and reload the page.`,
        `Safari on Mac: Safari menu → Settings for This Website → ${n} → Allow.`,
        `iPhone and iPad: Settings → Safari → ${n} → Ask or Allow. Android (Chrome): icon left of the address → Permissions → ${n}.`,
        `If the browser never asks, check the operating system. Windows: Settings → Privacy & security → ${n} — allow access for apps and your browser. macOS: System Settings → Privacy & Security → ${n}.`,
      ];
    },
    status: {
      denied: (k: Kind) => `Access to the ${k} is blocked. Allow it in the site settings (see below) and press the button again.`,
      notfound: (k: Kind) => `No ${k} found. Plug one in or check that it isn't disabled in the system.`,
      busy: (k: Kind) => `The ${k} could not start: it is used by another app (Zoom, Teams, OBS, Discord) or has a hardware problem. Close the other app and try again.`,
      unsupported: (k: Kind) => `The browser doesn't allow ${k} access on this page. A modern browser and a secure (HTTPS) connection are required.`,
      ended: (k: Kind) => `The ${k} was disconnected. Check the connection and start the test again.`,
      error: (_k: Kind) => "Couldn't access the device. Try again or restart the browser.",
    },
  },
} as const;

export function PermissionHelp({ locale, kind, open = false }: { locale: Locale; kind: Kind; open?: boolean }) {
  const t = T[locale];
  return (
    <details className="group rounded-[0.625rem] border border-line bg-surface" open={open}>
      <summary className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-fg">
        {t.title(kind)}
        <ChevronDown className="size-4 shrink-0 text-fg-3 transition-transform duration-150 group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="flex list-disc flex-col gap-1.5 px-4 pb-4 pl-8 text-sm leading-relaxed text-fg-2">
        {t.steps(kind).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </details>
  );
}

/** Explains a failed/finished media request. Renders nothing for idle/live states. */
export function MediaStatusNotice({ locale, kind, status }: { locale: Locale; kind: Kind; status: MediaStatus }) {
  if (status === "idle" || status === "live" || status === "requesting") return null;
  const msg = T[locale].status[status](kind);
  return (
    <Notice tone={status === "ended" ? "warn" : "err"} className="leading-relaxed">
      {msg}
    </Notice>
  );
}
