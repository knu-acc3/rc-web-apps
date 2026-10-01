"use client";

import { Clock, KeyRound, TimerReset } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { base64ToBytes, utf8Encode } from "@/tools/dev/shared/bytes";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useHydrated } from "@/tools/dev/shared/hooks";
import { Pane } from "@/tools/dev/shared/Pane";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ASYM_ALGS, generateKeyPair, hasSubtle, HMAC_ALGS, parseKey, signJwt, type Alg } from "./lib/jwt";

const T = {
  ru: {
    alg: "Алгоритм",
    payload: "Payload (JSON)",
    secret: "Секретный ключ",
    secretEnc: "Ключ как",
    text: "текст",
    b64: "Base64url",
    privKey: "Закрытый ключ (PEM PRIVATE KEY или JWK)",
    gen: "Создать пару ключей",
    pub: "Открытый ключ для проверки",
    iat: "iat = сейчас",
    exp: "exp = через 1 час",
    token: "Токен",
    badJson: "Payload — не корректный JSON",
    noSubtle: "Подпись RSA и ECDSA использует WebCrypto — он доступен только по HTTPS или на localhost. HS256/384/512 работают везде.",
    none: "alg: none создаёт неподписанный токен — серверы должны его отвергать.",
    weak: "Для HS256 ключ должен быть не короче 32 байт (256 бит).",
  },
  en: {
    alg: "Algorithm",
    payload: "Payload (JSON)",
    secret: "Secret key",
    secretEnc: "Key as",
    text: "text",
    b64: "Base64url",
    privKey: "Private key (PEM PRIVATE KEY or JWK)",
    gen: "Generate a key pair",
    pub: "Public key for verification",
    iat: "iat = now",
    exp: "exp = in 1 hour",
    token: "Token",
    badJson: "The payload isn't valid JSON",
    noSubtle: "RSA and ECDSA signing uses WebCrypto, which is only available over HTTPS or on localhost. HS256/384/512 work everywhere.",
    none: "alg: none produces an unsigned token — servers must reject it.",
    weak: "For HS256 the key should be at least 32 bytes (256 bits).",
  },
} as const;

const ALGS: Alg[] = [...HMAC_ALGS, ...ASYM_ALGS, "none"];

export default function JwtEncoder({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const hydrated = useHydrated();
  const [alg, setAlg] = useState<Alg>("HS256");
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "Алия",\n  "admin": true\n}');
  const [secret, setSecret] = useState("");
  const [secretEnc, setSecretEnc] = useState<"text" | "b64">("text");
  const [priv, setPriv] = useState("");
  const [pub, setPub] = useState("");
  const [out, setOut] = useState<{ key: string; token: string; error?: string } | null>(null);

  const isHmac = (HMAC_ALGS as readonly string[]).includes(alg);
  const isAsym = (ASYM_ALGS as readonly string[]).includes(alg);
  let jsonOk = true;
  try {
    JSON.parse(payload);
  } catch {
    jsonOk = false;
  }
  const jobKey = `${alg}|${payload}|${secretEnc}|${secret}|${priv}`;

  useEffect(() => {
    if (!jsonOk || (isAsym && (!priv.trim() || !hasSubtle()))) return;
    let alive = true;
    const run = async () => {
      const header = { alg, typ: "JWT" };
      const secretBytes = secretEnc === "text" ? utf8Encode(secret) : base64ToBytes(secret);
      return signJwt(header, payload, isAsym ? { key: parseKey(priv) } : { secret: secretBytes });
    };
    run().then(
      (token) => alive && setOut({ key: jobKey, token }),
      (e) => alive && setOut({ key: jobKey, token: "", error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      alive = false;
    };
  }, [jobKey, jsonOk, isAsym, alg, payload, secret, secretEnc, priv]);

  const current = out?.key === jobKey ? out : null;

  const setClaim = (k: string, v: number) => {
    try {
      const o = JSON.parse(payload);
      o[k] = v;
      setPayload(JSON.stringify(o, null, 2));
    } catch {
      /* keep the text as is */
    }
  };

  async function gen() {
    if (!isAsym) return;
    const kp = await generateKeyPair(alg as (typeof ASYM_ALGS)[number]);
    setPriv(kp.privatePem);
    setPub(kp.publicPem);
  }

  const parts = current?.token ? current.token.split(".") : null;

  return (
    <Panel className="flex flex-col gap-5 p-4 sm:p-6">
      <Pane title={t.token} actions={<CopyButton value={current?.token ?? ""} variant="secondary" compact />}>
        <output className="block min-h-20 px-4 py-3 font-mono text-[0.9375rem] leading-relaxed break-all text-fg sm:text-base" aria-live="polite">
          {parts ? (
            <>
              <span className="text-err">{parts[0]}</span>.<span className="text-accent">{parts[1]}</span>.<span className="text-ok">{parts[2]}</span>
            </>
          ) : (
            <span className="text-fg-3">{current?.error ?? "—"}</span>
          )}
        </output>
      </Pane>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <CodeEditor id={`${id}-p`} locale={locale} label={t.payload} value={payload} onChange={setPayload} rows={9} invalid={!jsonOk} describedBy={!jsonOk ? `${id}-pe` : undefined} />
          {!jsonOk && (
            <p id={`${id}-pe`} role="alert" className="text-sm text-err">
              {t.badJson}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outlined" onClick={() => setClaim("iat", Math.floor(Date.now() / 1000))}>
              <Clock aria-hidden />
              {t.iat}
            </Button>
            <Button size="sm" variant="outlined" onClick={() => setClaim("exp", Math.floor(Date.now() / 1000) + 3600)}>
              <TimerReset aria-hidden />
              {t.exp}
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Field label={t.alg} htmlFor={`${id}-a`}>
            <Select id={`${id}-a`} value={alg} onChange={(e) => setAlg(e.target.value as Alg)}>
              {ALGS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
          {isHmac && (
            <Field
              label={t.secret}
              htmlFor={`${id}-s`}
              hint={secretEnc === "text" && utf8Encode(secret).length < 32 ? t.weak : undefined}
              aside={
                <Segmented
                  size="sm"
                  label={t.secretEnc}
                  value={secretEnc}
                  onChange={setSecretEnc}
                  options={[
                    { value: "text", label: t.text },
                    { value: "b64", label: t.b64 },
                  ]}
                />
              }
            >
              <Input id={`${id}-s`} value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
            </Field>
          )}
          {isAsym &&
            (hydrated && !hasSubtle() ? (
              <Notice tone="warn">{t.noSubtle}</Notice>
            ) : (
              <>
                <Field label={t.privKey} htmlFor={`${id}-k`}>
                  <Textarea id={`${id}-k`} value={priv} onChange={(e) => setPriv(e.target.value)} rows={4} placeholder="-----BEGIN PRIVATE KEY-----" />
                </Field>
                <Button variant="tonal" onClick={gen} className="self-start">
                  <KeyRound aria-hidden />
                  {t.gen}
                </Button>
              </>
            ))}
          {alg === "none" && <Notice tone="warn">{t.none}</Notice>}
          {pub && isAsym && (
            <Field label={t.pub} htmlFor={`${id}-pub`}>
              <Textarea id={`${id}-pub`} value={pub} readOnly rows={4} />
            </Field>
          )}
        </div>
      </div>
    </Panel>
  );
}
