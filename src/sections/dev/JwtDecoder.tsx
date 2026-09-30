"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { base64ToBytes, utf8Encode } from "@/sections/code/kit/bytes";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useHydrated, useNow } from "@/sections/code/kit/hooks";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { Badge, Notice, Panel } from "@/ui/panel";
import { ASYM_ALGS, asymVerify, hasSubtle, HMAC_ALGS, hmacVerify, parseJwt, parseKey, timeStatus, TIME_CLAIMS, type ParseError } from "./jwt";
import { relTime } from "./reltime";

const T = {
  ru: {
    token: "Токен JWT",
    placeholder: "eyJhbGciOi… (можно с «Bearer »)",
    header: "Заголовок",
    payload: "Данные (payload)",
    claims: "Поля",
    claim: "Поле",
    value: "Значение",
    meaning: "Значение поля",
    sig: "Подпись",
    sigUnchecked: "не проверена",
    sigOk: "подпись верна",
    sigBad: "подпись неверна",
    sigNone: "alg: none — токен не подписан!",
    expired: (r: string) => `истёк ${r}`,
    valid: (r: string) => `действует, истекает ${r}`,
    noExp: "без срока действия (exp)",
    nbfFuture: (r: string) => `ещё не действует — начнёт ${r}`,
    iatFuture: "iat в будущем — проверьте часы сервера",
    verify: "Проверить подпись",
    secret: "Секретный ключ",
    secretEnc: "Ключ как",
    text: "текст",
    b64: "Base64url",
    key: "Открытый ключ: PEM (PUBLIC KEY, RSA PUBLIC KEY, CERTIFICATE) или JWK / JWKS",
    skew: "Допуск часов",
    noSubtle: "Проверка RSA и ECDSA использует WebCrypto — он доступен только по HTTPS или на localhost.",
    unsupported: (a: string) => `Алгоритм ${a} не поддерживается`,
    keyErr: { pem: "Не удалось прочитать PEM", "unsupported-pem": "Этот тип PEM не поддерживается — нужен PUBLIC KEY, RSA PUBLIC KEY или CERTIFICATE", jwk: "Неверный JSON в JWK", "no-kid": "В JWKS нет ключа с таким kid" },
    errors: { empty: "", parts: "JWT состоит из трёх частей, разделённых точками", jwe: "Это зашифрованный JWE (5 частей) — без ключа расшифровки его содержимое не прочитать", "header-b64": "Заголовок — не Base64url", "header-json": "Заголовок — не JSON-объект", "payload-b64": "Payload — не Base64url", "payload-json": "Payload — не JSON" } as Record<ParseError, string>,
    local: "по местному времени",
  },
  en: {
    token: "JWT token",
    placeholder: "eyJhbGciOi… (a “Bearer ” prefix is fine)",
    header: "Header",
    payload: "Payload",
    claims: "Claims",
    claim: "Claim",
    value: "Value",
    meaning: "Meaning",
    sig: "Signature",
    sigUnchecked: "not verified",
    sigOk: "signature valid",
    sigBad: "signature invalid",
    sigNone: "alg: none — the token is unsigned!",
    expired: (r: string) => `expired ${r}`,
    valid: (r: string) => `valid, expires ${r}`,
    noExp: "no expiry (exp)",
    nbfFuture: (r: string) => `not valid yet — starts ${r}`,
    iatFuture: "iat is in the future — check the server clock",
    verify: "Verify signature",
    secret: "Secret key",
    secretEnc: "Key as",
    text: "text",
    b64: "Base64url",
    key: "Public key: PEM (PUBLIC KEY, RSA PUBLIC KEY, CERTIFICATE) or JWK / JWKS",
    skew: "Clock skew",
    noSubtle: "RSA and ECDSA verification uses WebCrypto, which is only available over HTTPS or on localhost.",
    unsupported: (a: string) => `Algorithm ${a} is not supported`,
    keyErr: { pem: "Couldn't read the PEM", "unsupported-pem": "This PEM type isn't supported — use PUBLIC KEY, RSA PUBLIC KEY or CERTIFICATE", jwk: "Invalid JSON in JWK", "no-kid": "No key with this kid in the JWKS" },
    errors: { empty: "", parts: "A JWT has three dot-separated parts", jwe: "This is an encrypted JWE (5 parts) — it can't be read without the decryption key", "header-b64": "The header isn't Base64url", "header-json": "The header isn't a JSON object", "payload-b64": "The payload isn't Base64url", "payload-json": "The payload isn't JSON" } as Record<ParseError, string>,
    local: "local time",
  },
} as const;

const CLAIMS: Record<string, { ru: string; en: string }> = {
  iss: { ru: "издатель токена", en: "issuer" },
  sub: { ru: "субъект — чаще всего ID пользователя", en: "subject — usually the user ID" },
  aud: { ru: "получатель, для которого выпущен токен", en: "audience the token is intended for" },
  exp: { ru: "срок действия", en: "expiration time" },
  nbf: { ru: "начало действия", en: "not valid before" },
  iat: { ru: "время выпуска", en: "issued at" },
  jti: { ru: "уникальный ID токена", en: "unique token ID" },
  auth_time: { ru: "время входа пользователя", en: "time of authentication" },
  nonce: { ru: "одноразовое значение OpenID Connect", en: "OpenID Connect nonce" },
  azp: { ru: "клиент, которому выдан токен", en: "authorized party" },
  scope: { ru: "права доступа", en: "granted scopes" },
  name: { ru: "имя", en: "full name" },
  email: { ru: "e-mail", en: "e-mail" },
  roles: { ru: "роли", en: "roles" },
  sid: { ru: "ID сессии", en: "session ID" },
  alg: { ru: "алгоритм подписи", en: "signature algorithm" },
  typ: { ru: "тип токена", en: "token type" },
  kid: { ru: "ID ключа для проверки подписи", en: "ID of the verification key" },
  cty: { ru: "тип содержимого", en: "content type" },
};

type SigState = "unchecked" | "ok" | "bad" | "none" | { error: string };

export default function JwtDecoder({ locale, sample }: { locale: Locale; sample: string }) {
  const t = T[locale];
  const id = useId();
  const [token, setToken] = useState(sample);
  const [secret, setSecret] = useState("");
  const [secretEnc, setSecretEnc] = useState<"text" | "b64">("text");
  const [keyText, setKeyText] = useState("");
  const [skew, setSkew] = useState(0);
  const [asym, setAsym] = useState<{ key: string; state: SigState } | null>(null);
  const now = useNow();
  const hydrated = useHydrated();
  const canSubtle = !hydrated || hasSubtle();

  const parsed = useMemo(() => parseJwt(token), [token]);
  const jwt = parsed.ok ? parsed.jwt : null;
  const alg = jwt?.alg ?? "";
  const isHmac = (HMAC_ALGS as readonly string[]).includes(alg);
  const isAsym = (ASYM_ALGS as readonly string[]).includes(alg);

  let sig: SigState = "unchecked";
  if (jwt && alg.toLowerCase() === "none") sig = "none";
  else if (jwt && isHmac && secret) {
    try {
      const key = secretEnc === "text" ? utf8Encode(secret) : base64ToBytes(secret);
      sig = hmacVerify(alg as (typeof HMAC_ALGS)[number], jwt.signingInput, jwt.signature, key) ? "ok" : "bad";
    } catch {
      sig = "bad";
    }
  }
  const asymKey = jwt && isAsym && keyText.trim() ? `${jwt.raw}|${keyText}` : null;
  useEffect(() => {
    if (!asymKey || !jwt || !hasSubtle()) return;
    const k = parseKey(keyText, typeof jwt.header.kid === "string" ? jwt.header.kid : undefined);
    let alive = true;
    const done = (state: SigState) => alive && setAsym({ key: asymKey, state });
    if (k.kind === "error") {
      Promise.resolve().then(() => done({ error: t.keyErr[k.error] }));
    } else {
      asymVerify(alg as (typeof ASYM_ALGS)[number], jwt.signingInput, jwt.signature, k).then(
        (ok) => done(ok ? "ok" : "bad"),
        (e) => done({ error: e instanceof Error ? e.message : String(e) }),
      );
    }
    return () => {
      alive = false;
    };
  }, [asymKey, jwt, keyText, alg, t.keyErr]);
  if (isAsym && asymKey && asym?.key === asymKey) sig = asym.state;

  const nowSec = now === null ? null : Math.floor(now / 1000);
  const ts = jwt && nowSec !== null ? timeStatus(jwt.payload, nowSec, skew) : {};
  const payload = (jwt?.payload && typeof jwt.payload === "object" ? jwt.payload : {}) as Record<string, unknown>;
  const rel = (sec: number) => (nowSec === null ? "" : relTime(locale, sec - nowSec));

  const sigBadge =
    sig === "ok" ? <Badge tone="ok">{t.sigOk}</Badge> : sig === "bad" ? <Badge tone="err">{t.sigBad}</Badge> : sig === "none" ? <Badge tone="err">{t.sigNone}</Badge> : typeof sig === "object" ? <Badge tone="err">{sig.error}</Badge> : <Badge>{`${t.sig}: ${t.sigUnchecked}`}</Badge>;

  const claimRows = jwt ? [...Object.entries(jwt.header).map(([k, v]) => ["header", k, v] as const), ...Object.entries(payload).map(([k, v]) => ["payload", k, v] as const)] : [];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <CodeEditor id={`${id}-t`} locale={locale} label={t.token} value={token} onChange={setToken} placeholder={t.placeholder} rows={4} wrap invalid={!parsed.ok && parsed.error !== "empty"} />
        {!parsed.ok && parsed.error !== "empty" && (
          <Notice tone="err" className="mt-3">
            {t.errors[parsed.error]}
          </Notice>
        )}
        {jwt && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {alg && <Badge tone="accent">{alg}</Badge>}
            {sigBadge}
            {nowSec !== null && typeof payload.exp === "number" && <Badge tone={ts.exp === "expired" ? "err" : "ok"}>{ts.exp === "expired" ? t.expired(rel(payload.exp)) : t.valid(rel(payload.exp))}</Badge>}
            {typeof payload.exp !== "number" && <Badge tone="warn">{t.noExp}</Badge>}
            {ts.nbf === "future" && typeof payload.nbf === "number" && <Badge tone="warn">{t.nbfFuture(rel(payload.nbf))}</Badge>}
            {ts.iat === "future" && <Badge tone="warn">{t.iatFuture}</Badge>}
          </div>
        )}

        {jwt && (isHmac || isAsym) && (
          <details className="mt-4 rounded-[10px] border border-line" open={!!secret || !!keyText}>
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-fg-2">{t.verify}</summary>
            <div className="flex flex-col gap-3 border-t border-line p-3">
              {isHmac ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_9rem] sm:items-end">
                  <Field label={t.secret} htmlFor={`${id}-s`}>
                    <Input id={`${id}-s`} value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
                  </Field>
                  <Select aria-label={t.secretEnc} value={secretEnc} onChange={(e) => setSecretEnc(e.target.value as "text" | "b64")}>
                    <option value="text">{t.text}</option>
                    <option value="b64">{t.b64}</option>
                  </Select>
                </div>
              ) : canSubtle ? (
                <Field label={t.key} htmlFor={`${id}-k`}>
                  <Textarea id={`${id}-k`} value={keyText} onChange={(e) => setKeyText(e.target.value)} rows={5} placeholder="-----BEGIN PUBLIC KEY-----" />
                </Field>
              ) : (
                <Notice tone="warn">{t.noSubtle}</Notice>
              )}
              <label className="flex items-center gap-2 text-sm text-fg-2">
                {t.skew}
                <Select value={String(skew)} size="sm" className="w-28" onChange={(e) => setSkew(Number(e.target.value))}>
                  {[0, 30, 60, 300].map((s) => (
                    <option key={s} value={s}>
                      {s} s
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </details>
        )}
      </Panel>

      {jwt && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [t.header, jwt.headerJson],
            [t.payload, jwt.payloadJson],
          ].map(([title, json]) => (
            <div key={title} className="min-w-0 overflow-hidden rounded-[12px] border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                <span className="text-sm font-semibold text-fg">{title}</span>
                <CopyButton value={json} size="icon-sm" variant="ghost" />
              </div>
              <pre className="max-h-80 overflow-auto px-3 py-2 font-mono text-[13px] whitespace-pre-wrap break-all text-fg">{json}</pre>
            </div>
          ))}
        </div>
      )}

      {claimRows.length > 0 && (
        <div tabIndex={0} className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.claim}</th>
                <th scope="col">{t.value}</th>
                <th scope="col">{t.meaning}</th>
              </tr>
            </thead>
            <tbody>
              {claimRows.map(([part, k, v]) => {
                const isTime = part === "payload" && TIME_CLAIMS.includes(k) && typeof v === "number";
                return (
                  <tr key={`${part}.${k}`}>
                    <td className="font-mono text-[13px]">{k}</td>
                    <td className="max-w-[18rem] text-[13px] break-all">
                      <span className="font-mono">{typeof v === "string" ? v : JSON.stringify(v)}</span>
                      {isTime && (
                        <span className="block text-fg-3">
                          {new Date((v as number) * 1000).toISOString().replace(".000Z", "Z")}
                          {nowSec !== null && ` · ${rel(v as number)}`}
                        </span>
                      )}
                    </td>
                    <td className="text-[13px] text-fg-2">{CLAIMS[k]?.[locale] ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
