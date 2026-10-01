"use client";

import { Download, Eye, EyeOff, FileLock2, FileText, LockOpen, RotateCcw, Shuffle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ProgressBar } from "@/tools/files/video/ui/Progress";
import { CryptError, decrypt, decryptText, encrypt, encryptText, isEncrypted, passwordBits } from "./lib/crypt";

const T = {
  ru: {
    mode: "Действие",
    enc: "Зашифровать",
    dec: "Расшифровать",
    drop: "Перетащите файл сюда или нажмите, чтобы выбрать",
    dropHint: "Любой файл. Он не покидает ваше устройство.",
    password: "Пароль",
    repeat: "Повторите пароль",
    show: "Показать пароль",
    hide: "Скрыть пароль",
    generate: "Придумать пароль",
    mismatch: "Пароли не совпадают",
    strength: (bits: number) => (bits < 40 ? "Слабый пароль — его можно подобрать" : bits < 70 ? "Средний пароль" : "Надёжный пароль"),
    forget: "Запишите пароль: без него файл не расшифровать — ни нам, ни кому-либо ещё.",
    forgetText: "Запишите пароль: без него текст не расшифровать — ни нам, ни кому-либо ещё.",
    goEnc: "Зашифровать файл",
    goDec: "Расшифровать файл",
    goEncText: "Зашифровать текст",
    goDecText: "Расшифровать текст",
    working: "Шифруем…",
    workingDec: "Расшифровываем…",
    done: "Готово",
    download: "Скачать",
    another: "Другой файл",
    textIn: "Текст",
    textInPh: "Сообщение, которое нужно спрятать",
    cipherIn: "Зашифрованный текст",
    cipherPh: "Вставьте зашифрованный текст",
    result: "Результат",
    copy: "Копировать",
    copied: "Скопировано",
    detected: "Это зашифрованный файл — введите пароль, чтобы расшифровать его.",
    errors: {
      "bad-password": "Неверный пароль.",
      corrupt: "Файл повреждён или изменён после шифрования — расшифровать его нельзя.",
      "not-encrypted": "Это не файл, зашифрованный на этой странице.",
      unsupported: "Браузер не поддерживает шифрование. Обновите его или откройте страницу в Chrome, Safari или Firefox.",
    },
  },
  en: {
    mode: "Action",
    enc: "Encrypt",
    dec: "Decrypt",
    drop: "Drop a file here or click to choose",
    dropHint: "Any file. It never leaves your device.",
    password: "Password",
    repeat: "Repeat the password",
    show: "Show password",
    hide: "Hide password",
    generate: "Suggest a password",
    mismatch: "Passwords don't match",
    strength: (bits: number) => (bits < 40 ? "Weak — it could be guessed" : bits < 70 ? "Fair password" : "Strong password"),
    forget: "Write the password down: without it nobody — including us — can decrypt the file.",
    forgetText: "Write the password down: without it nobody — including us — can decrypt the text.",
    goEnc: "Encrypt file",
    goDec: "Decrypt file",
    goEncText: "Encrypt text",
    goDecText: "Decrypt text",
    working: "Encrypting…",
    workingDec: "Decrypting…",
    done: "Done",
    download: "Download",
    another: "Another file",
    textIn: "Text",
    textInPh: "The message to hide",
    cipherIn: "Encrypted text",
    cipherPh: "Paste the encrypted text",
    result: "Result",
    copy: "Copy",
    copied: "Copied",
    detected: "This file is encrypted — enter the password to decrypt it.",
    errors: {
      "bad-password": "Wrong password.",
      corrupt: "The file is damaged or was changed after encryption — it can't be decrypted.",
      "not-encrypted": "This isn't a file encrypted on this page.",
      unsupported: "Your browser can't encrypt. Update it or open the page in Chrome, Safari or Firefox.",
    },
  },
} as const;

/** Random words from the password generator's lists (~10 bits each) plus a number: about 70 bits of entropy. */
async function suggest(locale: Locale): Promise<string> {
  const list = locale === "ru" ? (await import("@/tools/web/password/data/words-ru")).WORDS_RU : (await import("@/tools/web/password/data/words-en")).WORDS_EN;
  const n = Math.ceil(60 / Math.log2(list.length));
  const r = crypto.getRandomValues(new Uint32Array(n + 1));
  // Modulo bias is negligible here: the lists are a few thousand words and the values 32-bit.
  const words = Array.from(r.slice(0, n), (x) => list[x % list.length]);
  return `${words.join("-")}-${10 + (r[n] % 90)}`;
}

export default function EncryptFile({ locale, kind = "file" }: { locale: Locale; kind?: "file" | "text" }) {
  const t = T[locale];
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ blob?: Blob; name?: string; text?: string } | null>(null);

  const bits = passwordBits(pw);
  const needRepeat = mode === "enc" && !visible;
  const ready = (kind === "file" ? !!file : !!text.trim()) && pw.length > 0 && (!needRepeat || pw === pw2);

  const reset = () => {
    setOut(null);
    setError("");
  };
  const pick = async (f: File) => {
    reset();
    setFile(f);
    const head = new Uint8Array(await f.slice(0, 64).arrayBuffer());
    setMode(isEncrypted(head) ? "dec" : "enc");
  };
  const fail = (e: unknown) => setError(e instanceof CryptError ? t.errors[e.code] : String((e as Error)?.message ?? e));

  async function run() {
    reset();
    setBusy(0);
    try {
      if (kind === "text") {
        setOut({ text: mode === "enc" ? await encryptText(text, pw) : await decryptText(text, pw) });
      } else if (file) {
        if (mode === "enc") {
          const blob = await encrypt(file, pw, { name: file.name, type: file.type, size: file.size }, (p) => setBusy(p));
          setOut({ blob, name: `${file.name}.enc` });
        } else {
          const r = await decrypt(file, pw, (p) => setBusy(p));
          setOut({ blob: r.blob, name: r.meta.name || file.name.replace(/\.enc$/i, "") });
        }
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  const strengthTone = bits < 40 ? "text-err" : bits < 70 ? "text-warn" : "text-ok";
  const action = kind === "text" ? (mode === "enc" ? t.goEncText : t.goDecText) : mode === "enc" ? t.goEnc : t.goDec;

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label={t.mode}
        value={mode}
        size="lg"
        onChange={(v) => {
          setMode(v);
          reset();
        }}
        options={[
          { value: "enc", label: t.enc, icon: <FileLock2 className="size-4 shrink-0" aria-hidden /> },
          { value: "dec", label: t.dec, icon: <LockOpen className="size-4 shrink-0" aria-hidden /> },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          {kind === "file" ? (
            file ? (
              <Panel className="flex items-center gap-3 p-4 sm:p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] bg-accent-container text-on-accent-container">
                  <FileText className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-fg" title={file.name}>
                    {file.name}
                  </div>
                  <div className="tabular text-sm text-fg-3">{formatBytes(locale, file.size)}</div>
                </div>
                <Button
                  size="sm"
                  variant="tonal"
                  onClick={() => {
                    setFile(null);
                    reset();
                  }}
                >
                  <RotateCcw aria-hidden />
                  <span className="max-[22rem]:sr-only">{t.another}</span>
                </Button>
              </Panel>
            ) : (
              <Dropzone onFiles={(fs) => fs[0] && pick(fs[0])} locale={locale} title={t.drop} hint={t.dropHint} />
            )
          ) : (
            <Field label={mode === "enc" ? t.textIn : t.cipherIn} htmlFor="crypt-text">
              <Textarea
                id="crypt-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  reset();
                }}
                placeholder={mode === "enc" ? t.textInPh : t.cipherPh}
                className="min-h-40 font-sans text-[0.9375rem] lg:min-h-56"
              />
            </Field>
          )}
          {kind === "file" && file && mode === "dec" && !out && !error && <Notice>{t.detected}</Notice>}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
            <Field
              label={t.password}
              htmlFor="crypt-pw"
              hint={mode === "enc" && pw ? <span className={strengthTone}>{t.strength(bits)}</span> : undefined}
              aside={
                mode === "enc" ? (
                  <Button
                    variant="text"
                    size="sm"
                    className="-my-2 -mr-3"
                    onClick={async () => {
                      const p = await suggest(locale);
                      setPw(p);
                      setPw2(p);
                      setVisible(true);
                      reset();
                    }}
                  >
                    <Shuffle aria-hidden />
                    {t.generate}
                  </Button>
                ) : undefined
              }
            >
              <div className="relative">
                <Input
                  id="crypt-pw"
                  type={visible ? "text" : "password"}
                  autoComplete={mode === "enc" ? "new-password" : "current-password"}
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    reset();
                  }}
                  className="w-full pr-12"
                />
                <IconButton size="sm" label={visible ? t.hide : t.show} icon={visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />} onClick={() => setVisible((v) => !v)} selected={visible} className="absolute right-1 top-1/2 -translate-y-1/2" />
              </div>
            </Field>
            {needRepeat && (
              <Field label={t.repeat} htmlFor="crypt-pw2" error={pw2 && pw !== pw2 ? t.mismatch : undefined}>
                <Input id="crypt-pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              </Field>
            )}
            {mode === "enc" && (
              <p className="-mt-1 flex items-start gap-2 text-[0.8125rem] text-fg-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                {kind === "text" ? t.forgetText : t.forget}
              </p>
            )}
            {busy === null ? (
              <Button size="xl" variant="filled" fullWidth disabled={!ready} onClick={run}>
                {mode === "enc" ? <FileLock2 aria-hidden /> : <LockOpen aria-hidden />}
                <span className="truncate">{action}</span>
              </Button>
            ) : (
              <div className="flex flex-col gap-2 rounded-[1rem] bg-surface-2 px-4 py-3">
                <span className="text-sm font-medium text-fg-2">{mode === "enc" ? t.working : t.workingDec}</span>
                {kind === "file" && <ProgressBar value={Math.max(0.03, busy)} label={mode === "enc" ? t.working : t.workingDec} className="bg-surface!" />}
              </div>
            )}
            {error && <Notice tone="err">{error}</Notice>}
          </Panel>

          {out?.blob && out.name && (
            <Panel className="flex flex-col gap-4 p-4 motion-safe:animate-[menu-in_260ms_var(--ease-emph)] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                  <ShieldCheck className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1" aria-live="polite">
                  <div className="truncate font-semibold text-fg" title={out.name}>
                    {out.name}
                  </div>
                  <div className="tabular text-sm text-fg-3">{formatBytes(locale, out.blob.size)}</div>
                </div>
              </div>
              <Button variant="filled" size="xl" fullWidth onClick={() => downloadBlob(out.blob!, out.name!)}>
                <Download aria-hidden />
                {t.download}
              </Button>
            </Panel>
          )}
          {out?.text !== undefined && (
            <Panel className="flex flex-col gap-3 p-4 motion-safe:animate-[menu-in_260ms_var(--ease-emph)] sm:p-5">
              <Field label={t.result} htmlFor="crypt-out">
                <Textarea id="crypt-out" readOnly value={out.text} className="min-h-28 font-mono text-sm" />
              </Field>
              <CopyButton value={out.text} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" className="h-14! w-full text-lg! [--btn-r:1.75rem]! [&_svg]:size-6!" />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
