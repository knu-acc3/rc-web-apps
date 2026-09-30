"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input } from "@/ui/field";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

const T = {
  ru: {
    password: "Пароль для открытия",
    confirm: "Повторите пароль",
    show: "Показать пароль",
    hide: "Скрыть пароль",
    mismatch: "Пароли не совпадают",
    short: "Слишком короткий пароль — возьмите хотя бы 6 символов",
    allow: "Разрешить тем, кто знает пароль:",
    print: "печать",
    copy: "копирование текста",
    edit: "изменение и сборку страниц",
    annotate: "комментарии и заполнение форм",
    owner: "Пароль владельца (снимает ограничения; необязательно)",
    ownerHint: "Если оставить пустым, будет создан случайный — ограничения тогда не снять, но файл всегда откроется паролем выше.",
    go: "Защитить PDF",
    done: "Шифрование AES-256. Проверено: файл открывается только с паролем. Сохраните пароль — восстановить его нельзя.",
  },
  en: {
    password: "Password to open",
    confirm: "Repeat the password",
    show: "Show password",
    hide: "Hide password",
    mismatch: "Passwords don't match",
    short: "Too short — use at least 6 characters",
    allow: "Allow people who know the password to:",
    print: "print",
    copy: "copy text",
    edit: "edit and assemble pages",
    annotate: "comment and fill forms",
    owner: "Owner password (lifts restrictions; optional)",
    ownerHint: "Leave empty to generate a random one — restrictions then can't be lifted, but the file always opens with the password above.",
    go: "Protect PDF",
    done: "AES-256 encryption. Verified: the file opens only with the password. Keep the password safe — it can't be recovered.",
  },
} as const;

/** 24 random characters from crypto.getRandomValues (rejection sampling avoids bias). */
function randomPassword(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const limit = 256 - (256 % abc.length);
  let out = "";
  const buf = new Uint8Array(64);
  while (out.length < 24) {
    crypto.getRandomValues(buf);
    for (const b of buf) if (b < limit && out.length < 24) out += abc[b % abc.length];
  }
  return out;
}

export default function ProtectTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [owner, setOwner] = useState("");
  const [show, setShow] = useState(false);
  const [perm, setPerm] = useState({ print: true, copy: false, edit: false, annotate: false });
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;

  const error = pw && pw.length < 6 ? t.short : pw2 && pw !== pw2 ? t.mismatch : null;
  const valid = pw.length >= 6 && pw === pw2;

  async function protect() {
    if (!file || !valid) return;
    setResult(null);
    const out = await job.start((ctx) =>
      workerJob(
        {
          type: "protect",
          source: { bytes: file.bytes!.slice(0), password: file.password },
          options: { userPassword: pw, ownerPassword: owner || randomPassword(), allowPrinting: perm.print, allowCopying: perm.copy, allowModifying: perm.edit, allowAnnotating: perm.annotate },
        },
        ctx,
      ),
    );
    if (out) setResult([{ name: `${baseName(file.name)}-protected.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const eye = (
    <Button size="icon-sm" variant="ghost" onClick={() => setShow((s) => !s)} aria-label={show ? t.hide : t.show} title={show ? t.hide : t.show}>
      {show ? <EyeOff /> : <Eye />}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Field label={t.password} htmlFor={`${id}-p`} aside={eye}>
              <Input id={`${id}-p`} size="lg" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={!!error && pw.length < 6} />
            </Field>
            <Field label={t.confirm} htmlFor={`${id}-c`} error={error}>
              <Input id={`${id}-c`} size="lg" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-invalid={!!pw2 && pw !== pw2} />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-fg-2">{t.allow}</p>
            <OptionsRow className="gap-x-6!">
              {(["print", "copy", "edit", "annotate"] as const).map((k) => (
                <Checkbox key={k} label={t[k]} checked={perm[k]} onChange={(e) => setPerm((p) => ({ ...p, [k]: e.target.checked }))} />
              ))}
            </OptionsRow>
          </div>
          <Field label={t.owner} htmlFor={`${id}-o`} hint={t.ownerHint} className="max-w-md">
            <Input id={`${id}-o`} type={show ? "text" : "password"} autoComplete="new-password" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
          <PrimaryButton disabled={!valid || job.running} onClick={protect}>
            <Lock aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              notice={t.done}
              onReset={() => {
                setResult(null);
                setPw("");
                setPw2("");
                setOwner("");
                pdf.clear();
                job.reset();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
