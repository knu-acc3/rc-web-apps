"use client";

import { KeyRound } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { base64ToBytes, utf8Encode } from "@/sections/code/kit/bytes";
import { useHydrated } from "@/sections/code/kit/hooks";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
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

  return (
    <Panel className="p-4 sm:p-6">
      <div className="text-sm font-medium text-fg-2">{t.token}</div>
      <output className="mt-1 block min-h-16 font-mono text-[0.9375rem] break-all text-fg" aria-live="polite">
        {current?.token ? (
          <>
            <span className="text-err">{current.token.split(".")[0]}</span>.<span className="text-accent">{current.token.split(".")[1]}</span>.<span className="text-ok">{current.token.split(".")[2]}</span>
          </>
        ) : (
          <span className="text-fg-3">{current?.error ?? "—"}</span>
        )}
      </output>
      <div className="mt-3">
        <CopyButton value={current?.token ?? ""} size="md" variant="outline" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label={t.payload} htmlFor={`${id}-p`} error={!jsonOk ? t.badJson : undefined}>
          <Textarea id={`${id}-p`} value={payload} onChange={(e) => setPayload(e.target.value)} rows={8} aria-invalid={!jsonOk} />
        </Field>
        <div className="flex flex-col gap-3">
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
            <div className="grid gap-2 sm:grid-cols-[1fr_8rem] sm:items-end">
              <Field label={t.secret} htmlFor={`${id}-s`} hint={secretEnc === "text" && utf8Encode(secret).length < 32 ? t.weak : undefined}>
                <Input id={`${id}-s`} value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
              </Field>
              <Select aria-label={t.secretEnc} value={secretEnc} onChange={(e) => setSecretEnc(e.target.value as "text" | "b64")}>
                <option value="text">{t.text}</option>
                <option value="b64">{t.b64}</option>
              </Select>
            </div>
          )}
          {isAsym &&
            (hydrated && !hasSubtle() ? (
              <Notice tone="warn">{t.noSubtle}</Notice>
            ) : (
              <>
                <Field label={t.privKey} htmlFor={`${id}-k`}>
                  <Textarea id={`${id}-k`} value={priv} onChange={(e) => setPriv(e.target.value)} rows={4} placeholder="-----BEGIN PRIVATE KEY-----" />
                </Field>
                <Button variant="outline" size="sm" onClick={gen} className="self-start">
                  <KeyRound aria-hidden />
                  {t.gen}
                </Button>
              </>
            ))}
          {alg === "none" && <Notice tone="warn">{t.none}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setClaim("iat", Math.floor(Date.now() / 1000))}>
              {t.iat}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setClaim("exp", Math.floor(Date.now() / 1000) + 3600)}>
              {t.exp}
            </Button>
          </div>
        </div>
      </div>
      {pub && isAsym && (
        <Field className="mt-4" label={t.pub} htmlFor={`${id}-pub`}>
          <Textarea id={`${id}-pub`} value={pub} readOnly rows={4} />
        </Field>
      )}
    </Panel>
  );
}
