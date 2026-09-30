'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckCircle, ClipboardText, WarningCircle } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { writeClipboardText } from '@/src/utils/clipboard';
import { cn } from '@/src/lib/cn';

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

interface DecodeResult {
  value: DecodedJwt | null;
  error: string;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new TextDecoder().decode(bytes);
}

function decodeJwt(token: string): DecodeResult {
  const trimmed = token.trim();
  if (!trimmed) return { value: null, error: '' };
  const parts = trimmed.split('.');
  if (parts.length !== 3) return { value: null, error: 'FORMAT' };
  try {
    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!header || typeof header !== 'object' || Array.isArray(header) || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { value: null, error: 'OBJECTS' };
    }
    return { value: { header, payload, signature: parts[2] }, error: '' };
  } catch {
    return { value: null, error: 'DECODE' };
  }
}

function formatTimestamp(value: unknown, isEn: boolean): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(isEn ? 'en-US' : 'ru-RU', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
}

export default function JwtDecoder() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const decoded = useMemo(() => decodeJwt(token), [token]);
  const headerJson = decoded.value ? JSON.stringify(decoded.value.header, null, 2) : '';
  const payloadJson = decoded.value ? JSON.stringify(decoded.value.payload, null, 2) : '';
  const timestampClaims = decoded.value ? (['iat', 'nbf', 'exp'] as const).flatMap((claim) => {
    const formatted = formatTimestamp(decoded.value?.payload[claim], isEn);
    return formatted ? [{ claim, formatted }] : [];
  }) : [];

  const [currentTime] = useState(() => Date.now());
  const expValue = decoded.value?.payload.exp;
  const isExpired = typeof expValue === 'number' && expValue * 1000 < currentTime;

  const copyPayload = useCallback(async () => {
    if (!payloadJson) return;
    if (await writeClipboardText(payloadJson)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [payloadJson]);

  const errorText = decoded.error === 'FORMAT'
    ? isEn ? 'A JWT must contain three dot-separated parts.' : 'JWT должен состоять из трёх частей, разделённых точками.'
    : decoded.error === 'OBJECTS'
      ? isEn ? 'JWT header and payload must decode to JSON objects.' : 'Заголовок и payload JWT должны быть JSON-объектами.'
      : decoded.error
        ? isEn ? 'The token contains invalid Base64URL or JSON.' : 'Токен содержит некорректный Base64URL или JSON.'
        : '';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="jwt-token">JWT</Label>
        <Textarea
          id="jwt-token"
          className="mt-1.5 min-h-36 break-all font-mono text-sm"
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
            setCopied(false);
          }}
          placeholder={isEn ? 'Paste header.payload.signature' : 'Вставьте header.payload.signature'}
          spellCheck={false}
          autoCapitalize="none"
          autoFocus
        />
        {errorText ? <div role="alert" className="mt-2 text-sm text-[var(--color-danger)]">{errorText}</div> : null}
      </Card>

      {decoded.value ? (
        <>
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <WarningCircle size={22} weight="fill" className="shrink-0" />
            <div>
              <div className="font-semibold">{isEn ? 'Decoded only — signature not verified' : 'Только декодирование — подпись не проверена'}</div>
              <div className="mt-0.5">{isEn ? 'Treat all claims as untrusted until a trusted backend verifies the signature and expected issuer/audience.' : 'Не доверяйте claims, пока доверенный сервер не проверит подпись, issuer и audience.'}</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-[var(--color-border)] px-4 py-3 font-semibold">{isEn ? 'Header' : 'Заголовок'}</div>
              <pre id="jwt-header" className="max-h-80 overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-sm">{headerJson}</pre>
            </Card>
            <Card className="overflow-hidden border-[var(--color-primary)]/25">
              <div className="border-b border-[var(--color-border)] px-4 py-3 font-semibold">Payload</div>
              <pre id="jwt-payload" className="max-h-96 min-h-40 overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-sm">{payloadJson}</pre>
            </Card>
          </div>

          <div className="flex justify-start">
            <Button size="lg" className="h-11 w-full sm:w-auto min-w-[220px] px-6 shadow-sm" onClick={copyPayload}>
              {copied ? <CheckCircle size={20} weight="fill" /> : <ClipboardText size={20} />}
              {copied ? (isEn ? 'Payload copied' : 'Payload скопирован') : (isEn ? 'Copy payload JSON' : 'Копировать JSON payload')}
            </Button>
          </div>

          <AdvancedSettings title={isEn ? 'Claims and raw signature' : 'Claims и исходная подпись'} description={isEn ? 'Readable timestamps and the unverified signature segment' : 'Понятные даты и непроверенный сегмент подписи'}>
            <div className="space-y-4">
              {timestampClaims.length > 0 ? (
                timestampClaims.map(({ claim, formatted }) => (
                  <div key={claim} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                      <div className="flex items-center justify-between gap-1 font-mono text-xs text-[var(--color-text-muted)]">
                        <span>{claim}</span>
                        {claim === 'exp' ? (
                          <div
                            role="status"
                            aria-live="polite"
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                              isExpired
                                ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isExpired ? "bg-red-500" : "bg-green-500",
                              )}
                            />
                            {isExpired
                              ? isEn
                                ? "Expired"
                                : "Истёк"
                              : isEn
                                ? "Active"
                                : "Действителен"}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm">{formatted}</div>
                    </div>
                  ))
              ) : <div className="text-sm text-[var(--color-text-muted)]">{isEn ? 'No numeric iat, nbf or exp claims.' : 'Нет числовых claims iat, nbf или exp.'}</div>}
              <div>
                <div className="mb-1 text-sm font-medium">{isEn ? 'Signature segment (not verified)' : 'Сегмент подписи (не проверен)'}</div>
                <code className="block break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-xs">{decoded.value.signature || (isEn ? '(empty)' : '(пусто)')}</code>
              </div>
            </div>
          </AdvancedSettings>
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-[var(--color-text-muted)]">{isEn ? 'Decoded header and payload will appear here.' : 'Здесь появятся декодированные header и payload.'}</Card>
      )}
    </div>
  );
}
