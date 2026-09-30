'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  ClipboardText,
  Download,
  Drop,
  FileText,
  Fingerprint,
  LockKey,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { PDFDocument, degrees } from 'pdf-lib';
import { encryptPdf } from '@/src/lib/pdf/pdfEncryptor';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { PdfDropzone } from '@/src/components/ui/pdf-dropzone';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';
import {
  downloadPdfBlob,
  formatFileSize,
  readFileAsArrayBuffer,
} from '@/src/utils/pdfHelpers';

interface TextStamp {
  bytes: Uint8Array;
  aspect: number;
}

type VerificationState = 'idle' | 'invalid' | 'match' | 'mismatch';

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function extractChecksum(value: string): string | null {
  const match = value.trim().match(/(?:^|\s)([a-f\d]{64})(?=\s|$)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function uint8ArrayToArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG encoding failed'));
        return;
      }
      blob.arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, 'image/png');
  });
}

async function createUnicodeTextStamp(text: string, color: string): Promise<TextStamp> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  const fontFamily = 'Arial, "Helvetica Neue", sans-serif';
  let fontSize = 112;
  context.font = `700 ${fontSize}px ${fontFamily}`;
  const firstWidth = context.measureText(text).width + 112;
  if (firstWidth > 3900) fontSize = Math.max(38, fontSize * (3900 / firstWidth));

  context.font = `700 ${fontSize}px ${fontFamily}`;
  canvas.width = Math.max(240, Math.ceil(context.measureText(text).width + 112));
  canvas.height = Math.ceil(fontSize * 1.65);

  const drawingContext = canvas.getContext('2d');
  if (!drawingContext) throw new Error('Canvas is unavailable');
  drawingContext.clearRect(0, 0, canvas.width, canvas.height);
  drawingContext.font = `700 ${fontSize}px ${fontFamily}`;
  drawingContext.fillStyle = /^#[\da-f]{6}$/i.test(color.trim()) ? color.trim() : '#dc2626';
  drawingContext.textAlign = 'center';
  drawingContext.textBaseline = 'middle';
  drawingContext.fillText(text, canvas.width / 2, canvas.height / 2);

  return {
    bytes: await canvasToPng(canvas),
    aspect: canvas.width / canvas.height,
  };
}

function centeredOrigin(
  pageWidth: number,
  pageHeight: number,
  imageWidth: number,
  imageHeight: number,
  angleDegrees: number,
): { x: number; y: number } {
  const angle = angleDegrees * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const xs = [0, imageWidth * cosine, -imageHeight * sine, imageWidth * cosine - imageHeight * sine];
  const ys = [0, imageWidth * sine, imageHeight * cosine, imageWidth * sine + imageHeight * cosine];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: pageWidth / 2 - (minX + maxX) / 2,
    y: pageHeight / 2 - (minY + maxY) / 2,
  };
}

export default function ProtectPdf() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const uploadIdRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [checksum, setChecksum] = useState('');
  const [expectedChecksum, setExpectedChecksum] = useState('');
  const [hashing, setHashing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [error, setError] = useState('');

  // Cryptographic Password Protection
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowModifying, setAllowModifying] = useState(false);
  const [encryptProcessing, setEncryptProcessing] = useState(false);
  const [encryptSuccess, setEncryptSuccess] = useState('');

  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#dc2626');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.18);
  const [watermarkProcessing, setWatermarkProcessing] = useState(false);
  const [watermarkSuccess, setWatermarkSuccess] = useState('');
  const [watermarkedChecksum, setWatermarkedChecksum] = useState('');

  const reset = useCallback(() => {
    uploadIdRef.current += 1;
    setFile(null);
    setPdfData(null);
    setChecksum('');
    setExpectedChecksum('');
    setHashing(false);
    setCopyFeedback('');
    setError('');
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setEncryptProcessing(false);
    setEncryptSuccess('');
    setWatermarkText('');
    setWatermarkColor('#dc2626');
    setWatermarkOpacity(0.18);
    setWatermarkProcessing(false);
    setWatermarkSuccess('');
    setWatermarkedChecksum('');
  }, []);

  const handleEncryptPdf = useCallback(async () => {
    if (!pdfData || !file) return;
    if (!userPassword && !ownerPassword) {
      setError(isEn ? 'Please enter a password to protect the PDF.' : 'Пожалуйста, введите пароль для защиты PDF.');
      return;
    }
    if (userPassword && confirmPassword && userPassword !== confirmPassword) {
      setError(isEn ? 'Passwords do not match.' : 'Пароли не совпадают.');
      return;
    }
    setEncryptProcessing(true);
    setError('');
    setEncryptSuccess('');
    try {
      const rawBytes = new Uint8Array(pdfData);
      const protectedBytes = await encryptPdf(rawBytes, {
        userPassword,
        ownerPassword: ownerPassword || userPassword,
        allowPrinting,
        allowCopying,
        allowModifying,
      });
      const filename = `${file.name.replace(/\.pdf$/i, '')}_protected.pdf`;
      downloadPdfBlob(protectedBytes, filename);
      setEncryptSuccess(isEn ? 'Protected PDF successfully created and downloaded.' : 'Защищённый PDF успешно создан и скачан.');
    } catch {
      setError(isEn ? 'Failed to encrypt PDF.' : 'Не удалось зашифровать PDF.');
    } finally {
      setEncryptProcessing(false);
    }
  }, [pdfData, file, userPassword, confirmPassword, ownerPassword, allowPrinting, allowCopying, allowModifying, isEn]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;
    const uploadId = uploadIdRef.current + 1;
    uploadIdRef.current = uploadId;

    setFile(nextFile);
    setPdfData(null);
    setChecksum('');
    setExpectedChecksum('');
    setCopyFeedback('');
    setError('');
    setHashing(true);
    setWatermarkSuccess('');
    setWatermarkedChecksum('');

    try {
      const buffer = await readFileAsArrayBuffer(nextFile);
      if (uploadIdRef.current !== uploadId) return;
      setPdfData(buffer);
      const hash = await sha256Hex(buffer);
      if (uploadIdRef.current !== uploadId) return;
      setChecksum(hash);
    } catch {
      if (uploadIdRef.current !== uploadId) return;
      setFile(null);
      setPdfData(null);
      setError(isEn ? 'The file checksum could not be calculated.' : 'Не удалось вычислить контрольную сумму файла.');
    } finally {
      if (uploadIdRef.current === uploadId) setHashing(false);
    }
  }, [isEn]);

  const verificationState = useMemo<VerificationState>(() => {
    if (!expectedChecksum.trim() || !checksum) return 'idle';
    const expected = extractChecksum(expectedChecksum);
    if (!expected) return 'invalid';
    return expected === checksum ? 'match' : 'mismatch';
  }, [checksum, expectedChecksum]);

  const copyChecksum = useCallback(async () => {
    if (!checksum) return;
    const copied = await writeClipboardText(checksum);
    setCopyFeedback(copied
      ? isEn ? 'Copied' : 'Скопировано'
      : isEn ? 'Could not copy' : 'Не удалось скопировать');
  }, [checksum, isEn]);

  const downloadChecksum = useCallback(() => {
    if (!checksum || !file) return;
    const content = `${checksum}  ${file.name}\n`;
    downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), `${file.name}.sha256`);
  }, [checksum, file]);

  const addWatermark = useCallback(async () => {
    if (!pdfData || !file || !watermarkText.trim()) return;
    setWatermarkProcessing(true);
    setWatermarkSuccess('');
    setWatermarkedChecksum('');
    setError('');

    try {
      const document = await PDFDocument.load(pdfData);
      const stamp = await createUnicodeTextStamp(watermarkText.trim(), watermarkColor);
      const image = await document.embedPng(stamp.bytes);

      document.getPages().forEach((page) => {
        const { width: pageWidth, height: pageHeight } = page.getSize();
        let imageWidth = pageWidth * 0.72;
        let imageHeight = imageWidth / stamp.aspect;
        if (imageHeight > pageHeight * 0.32) {
          imageHeight = pageHeight * 0.32;
          imageWidth = imageHeight * stamp.aspect;
        }
        const origin = centeredOrigin(pageWidth, pageHeight, imageWidth, imageHeight, -35);
        page.drawImage(image, {
          ...origin,
          width: imageWidth,
          height: imageHeight,
          opacity: watermarkOpacity,
          rotate: degrees(-35),
        });
      });

      document.setModificationDate(new Date());
      const bytes = await document.save();
      const filename = `${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`;
      downloadPdfBlob(bytes, filename);
      const generatedHash = await sha256Hex(uint8ArrayToArrayBuffer(bytes));
      setWatermarkedChecksum(generatedHash);
      setWatermarkSuccess(isEn
        ? 'Watermarked copy downloaded. It has its own checksum.'
        : 'Копия с водяным знаком скачана. У неё новая контрольная сумма.');
    } catch {
      setError(isEn
        ? 'This PDF cannot be watermarked in the browser. It may be encrypted or unsupported.'
        : 'Этот PDF нельзя снабдить водяным знаком в браузере. Возможно, он зашифрован или не поддерживается.');
    } finally {
      setWatermarkProcessing(false);
    }
  }, [file, isEn, pdfData, watermarkColor, watermarkOpacity, watermarkText]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {!file ? (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={150}
          label="Перетащите PDF или нажмите для загрузки"
          labelEn="Drag & drop a PDF or click to upload"
        />
      ) : null}

      {error ? (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="min-h-11 min-w-11"
            onClick={() => setError('')}
            aria-label={isEn ? 'Dismiss' : 'Закрыть'}
          >
            <X size={18} className="mx-auto" />
          </button>
        </div>
      ) : null}

      {file ? (
        <div className="mt-4 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <FileText size={26} className="shrink-0 text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold" title={file.name}>{file.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.size, isEn)}</div>
              </div>
              <Button variant="outline" size="sm" className="min-h-11 min-w-11" onClick={reset}>
                <ArrowCounterClockwise size={17} />
                <span className="hidden sm:inline">{isEn ? 'New file' : 'Другой файл'}</span>
              </Button>
            </div>
          </Card>

          <Card className="border-[var(--color-primary)]/40 p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <LockKey size={24} weight="bold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text)]">
                  {isEn ? 'Password Protection (Standard Security Handler)' : 'Защита паролем (Standard Security Handler)'}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? 'Encrypt the PDF document with standard 128-bit security. Opening or modifying will require the password.'
                    : 'Зашифруйте документ PDF по стандарту ISO 32000-1. Для открытия файла потребуется указанный пароль.'}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pdf-user-pwd">{isEn ? 'User password (to open)' : 'Пароль для открытия файла'}</Label>
                <Input
                  id="pdf-user-pwd"
                  type="password"
                  value={userPassword}
                  onChange={(e) => {
                    setUserPassword(e.target.value);
                    setEncryptSuccess('');
                  }}
                  placeholder={isEn ? 'Enter password' : 'Придумайте пароль'}
                  className="mt-1.5 h-11 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="pdf-confirm-pwd">{isEn ? 'Confirm password' : 'Подтвердите пароль'}</Label>
                <Input
                  id="pdf-confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setEncryptSuccess('');
                  }}
                  placeholder={isEn ? 'Repeat password' : 'Повторите пароль'}
                  className="mt-1.5 h-11 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-[var(--color-border-subtle)] pt-3">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {isEn ? 'Permissions' : 'Разрешения документа'}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                  />
                  <span>{isEn ? 'Allow printing' : 'Разрешить печать'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={allowCopying}
                    onChange={(e) => setAllowCopying(e.target.checked)}
                  />
                  <span>{isEn ? 'Allow copying' : 'Разрешить копирование'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--color-primary)]"
                    checked={allowModifying}
                    onChange={(e) => setAllowModifying(e.target.checked)}
                  />
                  <span>{isEn ? 'Allow editing' : 'Разрешить изменение'}</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                className="tool-primary-action min-h-12 w-full"
                onClick={handleEncryptPdf}
                disabled={encryptProcessing || !userPassword}
              >
                <LockKey size={20} weight="bold" />
                {encryptProcessing
                  ? isEn ? 'Encrypting PDF…' : 'Шифрование PDF…'
                  : isEn ? 'Protect & Download Encrypted PDF' : 'Защитить и скачать зашифрованный PDF'}
              </Button>
            </div>

            {encryptSuccess && (
              <div role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm font-semibold text-[var(--color-success)]">
                <CheckCircle size={18} weight="fill" />
                <span>{encryptSuccess}</span>
              </div>
            )}
          </Card>

          <Card className="border-[var(--color-primary)]/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Fingerprint size={24} weight="bold" />
              </div>
              <div>
                <h2 className="font-semibold">{isEn ? 'SHA-256 file fingerprint' : 'Контрольная сумма SHA-256'}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? 'Use it to confirm that another PDF is byte-for-byte identical. This does not encrypt or restrict access to the file.'
                    : 'Она помогает подтвердить, что другой PDF полностью совпадает по байтам. Это не шифрует файл и не ограничивает доступ к нему.'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
              {hashing ? (
                <div role="status" className="min-h-12 animate-pulse py-3 text-sm text-[var(--color-text-muted)]">
                  {isEn ? 'Calculating checksum…' : 'Вычисляем контрольную сумму…'}
                </div>
              ) : (
                <code className="block break-all font-mono text-sm leading-relaxed text-[var(--color-text)]">{checksum}</code>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" className="min-h-12" onClick={copyChecksum} disabled={!checksum}>
                <ClipboardText size={19} /> {copyFeedback || (isEn ? 'Copy' : 'Копировать')}
              </Button>
              <Button variant="outline" className="min-h-12" onClick={downloadChecksum} disabled={!checksum}>
                <Download size={19} weight="bold" /> {isEn ? 'Download .sha256' : 'Скачать .sha256'}
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <Label htmlFor="expected-checksum">{isEn ? 'Verify against a known checksum' : 'Сравнить с известной суммой'}</Label>
            <Input
              id="expected-checksum"
              className="mt-1.5 h-12 font-mono text-sm"
              value={expectedChecksum}
              onChange={(event) => setExpectedChecksum(event.target.value)}
              placeholder={isEn ? 'Paste a SHA-256 hash or .sha256 line' : 'Вставьте SHA-256 или строку из .sha256'}
              spellCheck={false}
              autoCapitalize="none"
            />

            <div className="mt-3 min-h-11" aria-live="polite">
              {verificationState === 'idle' ? (
                <div className="text-sm text-[var(--color-text-muted)]">
                  {isEn ? 'Paste the expected value to compare automatically.' : 'Вставьте ожидаемое значение — сравнение начнётся автоматически.'}
                </div>
              ) : null}
              {verificationState === 'invalid' ? (
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <Warning size={20} weight="fill" />
                  {isEn ? 'Enter a valid 64-character SHA-256 value.' : 'Введите корректное значение SHA-256 из 64 символов.'}
                </div>
              ) : null}
              {verificationState === 'match' ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
                  <CheckCircle size={20} weight="fill" />
                  {isEn ? 'Match — the files are byte-for-byte identical.' : 'Совпадает — файлы полностью идентичны по байтам.'}
                </div>
              ) : null}
              {verificationState === 'mismatch' ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-danger)]">
                  <XCircle size={20} weight="fill" />
                  {isEn ? 'Does not match — the file contents differ.' : 'Не совпадает — содержимое файлов отличается.'}
                </div>
              ) : null}
            </div>
          </Card>

          {pdfData ? (
            <AdvancedSettings
              title={isEn ? 'Optional visible watermark' : 'Необязательный водяной знак'}
              description={isEn ? 'Adds a visible mark to a downloaded copy; it does not restrict access' : 'Добавляет видимую отметку в копию, но не ограничивает доступ'}
            >
              <div className="space-y-4">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? 'The text is placed diagonally on every page. Cyrillic and other Unicode text are embedded as a transparent image.'
                    : 'Текст будет размещён по диагонали на каждой странице. Кириллица и другой Unicode встраиваются как прозрачное изображение.'}
                </div>

                <div>
                  <Label htmlFor="verification-watermark">{isEn ? 'Watermark text' : 'Текст водяного знака'}</Label>
                  <Input
                    id="verification-watermark"
                    className="mt-1.5 h-12 text-base"
                    value={watermarkText}
                    maxLength={64}
                    onChange={(event) => {
                      setWatermarkText(event.target.value);
                      setWatermarkSuccess('');
                      setWatermarkedChecksum('');
                    }}
                    placeholder={isEn ? 'Enter visible text' : 'Введите видимый текст'}
                  />
                </div>

                <div>
                  <Label>{isEn ? 'Color' : 'Цвет'}</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      className="h-11 w-16 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent p-1"
                      value={/^#[\da-f]{6}$/i.test(watermarkColor) ? watermarkColor : '#dc2626'}
                      onChange={(event) => setWatermarkColor(event.target.value)}
                      aria-label={isEn ? 'Watermark color' : 'Цвет водяного знака'}
                    />
                    <Input
                      className="h-11 max-w-36 font-mono"
                      value={watermarkColor}
                      onChange={(event) => setWatermarkColor(event.target.value)}
                      aria-label={isEn ? 'Hex color' : 'Цвет в HEX'}
                    />
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="font-medium">{isEn ? 'Opacity' : 'Прозрачность'}: {Math.round(watermarkOpacity * 100)}%</span>
                  <input
                    className="mt-2 min-h-11 w-full accent-[var(--color-primary)]"
                    type="range"
                    min={0.05}
                    max={0.55}
                    step={0.05}
                    value={watermarkOpacity}
                    onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
                  />
                </label>

                <Button
                  type="button"
                  className="min-h-12 w-full"
                  onClick={addWatermark}
                  disabled={watermarkProcessing || !watermarkText.trim()}
                >
                  <Drop size={20} weight="fill" />
                  {watermarkProcessing
                    ? isEn ? 'Creating copy…' : 'Создание копии…'
                    : isEn ? 'Add watermark and download' : 'Добавить знак и скачать'}
                </Button>

                {watermarkSuccess ? (
                  <div role="status" className="text-sm text-[var(--color-success)]">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle size={19} weight="fill" /> {watermarkSuccess}
                    </div>
                    {watermarkedChecksum ? (
                      <code className="mt-2 block break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2 font-mono text-xs text-[var(--color-text)]">
                        {watermarkedChecksum}
                      </code>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </AdvancedSettings>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
