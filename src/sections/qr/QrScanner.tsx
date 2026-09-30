"use client";

import { Camera, CameraOff, ExternalLink, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { parsePayload, type PayloadKind } from "./payloads";
import { formatName, nativeDetector, zxingDetector, type Detect, type Detected } from "./scan";

type Mode = "camera" | "image";
type CamError = "insecure" | "denied" | "notfound" | "busy" | "load" | "other";

const T = {
  ru: {
    mode: "Источник",
    camera: "Камера",
    image: "Картинка",
    start: "Включить камеру",
    stop: "Остановить",
    again: "Сканировать ещё",
    starting: "Запуск камеры…",
    aim: "Наведите камеру на код",
    drop: "Перетащите фото или скриншот с кодом",
    dropHint: "Можно вставить из буфера обмена: Ctrl+V",
    reading: "Ищем код на изображении…",
    none: "Код не найден. Возьмите снимок крупнее и резче: код должен занимать заметную часть кадра и попадать целиком.",
    camErr: {
      insecure: "Камера доступна только на защищённой странице (HTTPS) в современном браузере. Загрузите фото кода.",
      denied: "Доступ к камере запрещён. Разрешите его в настройках сайта в браузере или загрузите фото кода.",
      notfound: "Камера не найдена. Загрузите фото или скриншот кода.",
      busy: "Камера занята другим приложением. Закройте его и попробуйте снова.",
      load: "Не удалось загрузить модуль распознавания. Обновите страницу.",
      other: "Не удалось включить камеру. Попробуйте загрузить фото кода.",
    } as Record<CamError, string>,
    copy: "Копировать",
    copied: "Скопировано",
    open: "Открыть",
    domain: "Проверьте адрес перед переходом:",
    details: "Содержимое",
    kind: {
      url: "Ссылка",
      wifi: "Сеть Wi-Fi",
      vcard: "Контакт (vCard)",
      mecard: "Контакт (MECARD)",
      email: "Email",
      sms: "SMS",
      tel: "Телефон",
      geo: "Координаты",
      event: "Событие",
      gost: "Платёж по ГОСТ Р 56042",
      epc: "Платёж SEPA (EPC)",
      text: "Текст",
    } as Record<PayloadKind, string>,
    field: { S: "Сеть", P: "Пароль", T: "Шифрование", H: "Скрытая сеть", FN: "Имя", N: "Имя", TEL: "Телефон", EMAIL: "Email", ORG: "Компания", TITLE: "Должность", URL: "Сайт", ADR: "Адрес", NOTE: "Заметка", TO: "Кому", TEXT: "Текст", LAT: "Широта", LON: "Долгота", SUMMARY: "Название", DTSTART: "Начало", DTEND: "Окончание", LOCATION: "Место", DESCRIPTION: "Описание", Name: "Получатель", PersonalAcc: "Счёт", BankName: "Банк", BIC: "БИК", CorrespAcc: "Корр. счёт", PayeeINN: "ИНН", KPP: "КПП", Sum: "Сумма", Purpose: "Назначение", IBAN: "IBAN", Amount: "Сумма", Reference: "Ссылка", Text: "Назначение", Info: "Комментарий" } as Record<string, string>,
    rub: (k: string) => `${formatNumber("ru", Number(k) / 100, { minimumFractionDigits: 2 })} ₽`,
    privacy: "Распознавание идёт на вашем устройстве — изображение с камеры никуда не отправляется.",
  },
  en: {
    mode: "Source",
    camera: "Camera",
    image: "Image",
    start: "Start camera",
    stop: "Stop",
    again: "Scan again",
    starting: "Starting the camera…",
    aim: "Point the camera at the code",
    drop: "Drop a photo or screenshot with a code",
    dropHint: "You can also paste from the clipboard: Ctrl+V",
    reading: "Looking for a code in the image…",
    none: "No code found. Take a closer, sharper shot: the code should fill a good part of the frame and be fully visible.",
    camErr: {
      insecure: "The camera only works on a secure (HTTPS) page in a modern browser. Upload a photo of the code instead.",
      denied: "Camera access was blocked. Allow it in the browser's site settings or upload a photo of the code.",
      notfound: "No camera found. Upload a photo or screenshot of the code.",
      busy: "The camera is used by another app. Close it and try again.",
      load: "Couldn't load the recognition module. Reload the page.",
      other: "Couldn't start the camera. Try uploading a photo of the code.",
    } as Record<CamError, string>,
    copy: "Copy",
    copied: "Copied",
    open: "Open",
    domain: "Check the address before opening:",
    details: "Contents",
    kind: {
      url: "Link",
      wifi: "Wi-Fi network",
      vcard: "Contact (vCard)",
      mecard: "Contact (MECARD)",
      email: "Email",
      sms: "SMS",
      tel: "Phone",
      geo: "Coordinates",
      event: "Event",
      gost: "Russian bank payment (GOST R 56042)",
      epc: "SEPA payment (EPC)",
      text: "Text",
    } as Record<PayloadKind, string>,
    field: { S: "Network", P: "Password", T: "Security", H: "Hidden network", FN: "Name", N: "Name", TEL: "Phone", EMAIL: "Email", ORG: "Company", TITLE: "Job title", URL: "Website", ADR: "Address", NOTE: "Note", TO: "To", TEXT: "Text", LAT: "Latitude", LON: "Longitude", SUMMARY: "Title", DTSTART: "Starts", DTEND: "Ends", LOCATION: "Location", DESCRIPTION: "Description", Name: "Payee", PersonalAcc: "Account", BankName: "Bank", BIC: "BIK", CorrespAcc: "Correspondent account", PayeeINN: "INN", KPP: "KPP", Sum: "Amount", Purpose: "Purpose", IBAN: "IBAN", Amount: "Amount", Reference: "Reference", Text: "Remittance", Info: "Note" } as Record<string, string>,
    rub: (k: string) => `${formatNumber("en", Number(k) / 100, { minimumFractionDigits: 2 })} RUB`,
    privacy: "Recognition runs on your device — camera images are never uploaded.",
  },
} as const;

function camErrorOf(e: unknown): CamError {
  const n = (e as { name?: string })?.name ?? "";
  if (n === "NotAllowedError" || n === "SecurityError") return "denied";
  if (n === "NotFoundError" || n === "OverconstrainedError") return "notfound";
  if (n === "NotReadableError" || n === "AbortError") return "busy";
  return "other";
}

async function getDetector(all: boolean): Promise<Detect> {
  return (await nativeDetector(all)) ?? (await zxingDetector(all));
}

export default function QrScanner({ locale, source = "camera", all = false }: { locale: Locale; source?: Mode; all?: boolean }) {
  const t = T[locale];
  const [mode, setMode] = useState<Mode>(source);
  const [cam, setCam] = useState<"off" | "starting" | "on">("off");
  const [camErr, setCamErr] = useState<CamError | null>(null);
  const [img, setImg] = useState<"idle" | "reading" | "none">("idle");
  const [result, setResult] = useState<Detected | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | undefined>(undefined);

  function release() {
    window.clearTimeout(timer.current);
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }

  useEffect(() => release, []);

  function stop() {
    release();
    setCam("off");
  }

  async function start() {
    setResult(null);
    setCamErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamErr("insecure");
      return;
    }
    setCam("starting");
    let detect: Detect;
    try {
      detect = await getDetector(all);
    } catch {
      setCam("off");
      setCamErr("load");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      stream.current = s;
      const v = video.current;
      if (!v) throw new Error("video");
      v.srcObject = s;
      await v.play();
      setCam("on");
    } catch (e) {
      release();
      setCam("off");
      setCamErr(camErrorOf(e));
      return;
    }
    const tick = async () => {
      if (!stream.current) return;
      const v = video.current;
      if (v && v.readyState >= 2) {
        try {
          const r = await detect(v);
          if (r.length && stream.current) {
            release();
            setCam("off");
            setResult(r[0]);
            navigator.vibrate?.(40);
            return;
          }
        } catch {
          // a dropped frame; keep scanning
        }
      }
      timer.current = window.setTimeout(tick, 180);
    };
    void tick();
  }

  async function readImage(file: File) {
    setResult(null);
    setImg("reading");
    try {
      const native = await nativeDetector(all);
      let r = native ? await native(file).catch(() => []) : [];
      if (!r.length) r = await (await zxingDetector(all))(file);
      if (r.length) {
        setResult(r[0]);
        setImg("idle");
      } else setImg("none");
    } catch {
      setImg("none");
    }
  }

  function switchMode(m: Mode) {
    if (m !== "camera") stop();
    setMode(m);
    setResult(null);
    setImg("idle");
  }

  const parsed = result ? parsePayload(result.text) : null;
  const url = parsed?.kind === "url" ? safeUrl(result!.text) : null;

  return (
    <div className="flex flex-col gap-4">
      <Segmented<Mode>
        label={t.mode}
        value={mode}
        onChange={switchMode}
        options={[
          { value: "camera", label: t.camera },
          { value: "image", label: t.image },
        ]}
      />

      {mode === "camera" ? (
        <div className={cn("relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[12px] bg-surface-2", result && cam === "off" && "hidden")}>
          <video ref={video} playsInline muted className={cn("size-full object-cover", cam !== "on" && "invisible")} />
          {cam === "on" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aspect-square w-3/5 max-w-[260px] rounded-[16px] border-[3px] border-white/85 shadow-[0_0_0_9999px_rgb(0_0_0/0.25)]" />
              <span className="absolute bottom-3 rounded-full bg-black/55 px-3 py-1 text-sm text-white">{t.aim}</span>
            </div>
          )}
          {cam !== "on" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Button variant="primary" size="lg" onClick={start} disabled={cam === "starting"}>
                <Camera className="size-5" aria-hidden />
                {cam === "starting" ? t.starting : t.start}
              </Button>
              <p className="max-w-sm text-sm text-fg-3">{t.privacy}</p>
            </div>
          )}
          {cam === "on" && (
            <Button variant="secondary" size="sm" onClick={stop} className="absolute top-3 right-3">
              <CameraOff className="size-4" aria-hidden />
              {t.stop}
            </Button>
          )}
        </div>
      ) : (
        !result && <Dropzone accept="image/*" onFiles={(fs) => fs[0] && readImage(fs[0])} title={t.drop} hint={t.dropHint} disabled={img === "reading"} />
      )}

      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {camErr && <Notice tone="err">{t.camErr[camErr]}</Notice>}
        {img === "reading" && <Notice>{t.reading}</Notice>}
        {img === "none" && <Notice tone="warn">{t.none}</Notice>}
        {result && parsed && (
          <section className="rounded-[12px] border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-fg-3">
              <span className="font-medium text-fg-2">{t.kind[parsed.kind]}</span>
              <span aria-hidden>·</span>
              <span>{formatName(result.format)}</span>
            </div>
            <p className="mt-2 max-h-60 overflow-auto font-mono text-lg break-all whitespace-pre-wrap text-fg select-all">{result.text}</p>
            {url && (
              <p className="mt-2 text-sm text-fg-2">
                {t.domain} <strong className="font-semibold text-fg">{url.host}</strong>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton value={result.text} label={t.copy} copiedLabel={t.copied} variant="primary" showLabel />
              {url && (
                <a href={url.href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-[15px] text-fg hover:border-line-strong hover:bg-surface-2">
                  <ExternalLink className="size-4" aria-hidden />
                  {t.open}
                </a>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setResult(null);
                  setImg("idle");
                  if (mode === "camera") void start();
                }}
              >
                <RotateCcw className="size-4" aria-hidden />
                {t.again}
              </Button>
            </div>
            {parsed.fields.length > 0 && parsed.kind !== "url" && (
              <dl className="mt-4 grid gap-x-8 border-t border-line pt-3 sm:grid-cols-2">
                {parsed.fields.map(([k, v], i) => (
                  <div key={`${k}-${i}`} className="flex min-w-0 flex-col py-1.5">
                    <dt className="text-[13px] text-fg-3">{t.field[k] ?? k}</dt>
                    <dd className="text-[15px] break-all text-fg select-all">{parsed.kind === "gost" && k === "Sum" && /^\d+$/.test(v) ? t.rub(v) : v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function safeUrl(s: string): URL | null {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}
