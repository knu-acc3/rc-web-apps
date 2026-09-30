'use client';

import { useCallback, useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  FileText,
  FloppyDisk,
  Trash,
  X,
} from '@phosphor-icons/react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { PdfDropzone, PdfPreview } from '@/src/components/ui/pdf-dropzone';
import {
  downloadPdfBlob,
  formatFileSize,
  readFileAsArrayBuffer,
} from '@/src/utils/pdfHelpers';

interface MetadataFields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

interface DocumentDetails {
  producer: string;
  createdAt: Date | null;
  modifiedAt: Date | null;
}

const EMPTY_METADATA: MetadataFields = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
  creator: '',
};

const EMPTY_DETAILS: DocumentDetails = {
  producer: '',
  createdAt: null,
  modifiedAt: null,
};

function readDate(read: () => Date | undefined): Date | null {
  try {
    return read() ?? null;
  } catch {
    return null;
  }
}

function formatDate(value: Date | null, isEn: boolean): string {
  if (!value || Number.isNaN(value.getTime())) return isEn ? 'Not specified' : 'Не указана';
  return new Intl.DateTimeFormat(isEn ? 'en-US' : 'ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default function PdfMetadata() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [metadata, setMetadata] = useState<MetadataFields>(EMPTY_METADATA);
  const [details, setDetails] = useState<DocumentDetails>(EMPTY_DETAILS);
  const [outputName, setOutputName] = useState('metadata_edited');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = useCallback(() => {
    setFile(null);
    setPdfData(null);
    setPageCount(0);
    setMetadata(EMPTY_METADATA);
    setDetails(EMPTY_DETAILS);
    setOutputName('metadata_edited');
    setProcessing(false);
    setError('');
    setSuccess('');
  }, []);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;

    setFile(nextFile);
    setPdfData(null);
    setPageCount(0);
    setMetadata(EMPTY_METADATA);
    setDetails(EMPTY_DETAILS);
    setOutputName(`${nextFile.name.replace(/\.pdf$/i, '')}_metadata`);
    setError('');
    setSuccess('');

    try {
      const buffer = await readFileAsArrayBuffer(nextFile);
      const document = await PDFDocument.load(buffer);
      setMetadata({
        title: document.getTitle() ?? '',
        author: document.getAuthor() ?? '',
        subject: document.getSubject() ?? '',
        keywords: document.getKeywords() ?? '',
        creator: document.getCreator() ?? '',
      });
      setDetails({
        producer: document.getProducer() ?? '',
        createdAt: readDate(() => document.getCreationDate()),
        modifiedAt: readDate(() => document.getModificationDate()),
      });
      setPageCount(document.getPageCount());
      setPdfData(buffer);
    } catch (caughtError) {
      const encrypted = caughtError instanceof Error && /encrypt|password/i.test(caughtError.message);
      setFile(null);
      setPdfData(null);
      setError(encrypted
        ? isEn
          ? 'Password-protected PDFs cannot be edited in the browser.'
          : 'PDF с паролем нельзя изменить в браузере.'
        : isEn
          ? 'The PDF could not be opened.'
          : 'Не удалось открыть PDF.');
    }
  }, [isEn]);

  const updateField = useCallback((field: keyof MetadataFields, value: string) => {
    setMetadata((current) => ({ ...current, [field]: value }));
    setSuccess('');
  }, []);

  const clearFields = useCallback(() => {
    setMetadata((current) => ({ ...EMPTY_METADATA, creator: current.creator }));
    setSuccess('');
  }, []);

  const saveMetadata = useCallback(async () => {
    if (!pdfData || !file) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const document = await PDFDocument.load(pdfData);
      document.setTitle(metadata.title.trim());
      document.setAuthor(metadata.author.trim());
      document.setSubject(metadata.subject.trim());
      document.setKeywords(metadata.keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean));
      document.setCreator(metadata.creator.trim());
      document.setModificationDate(new Date());

      const bytes = await document.save();
      const baseName = (outputName.trim() || `${file.name.replace(/\.pdf$/i, '')}_metadata`)
        .replace(/\.pdf$/i, '');
      downloadPdfBlob(bytes, `${baseName}.pdf`);
      setSuccess(isEn ? 'PDF metadata saved and downloaded.' : 'Метаданные сохранены, PDF скачан.');
    } catch {
      setError(isEn ? 'The PDF could not be saved.' : 'Не удалось сохранить PDF.');
    } finally {
      setProcessing(false);
    }
  }, [file, isEn, metadata, outputName, pdfData]);

  const fields: Array<{
    key: 'title' | 'author' | 'subject' | 'keywords';
    labelEn: string;
    labelRu: string;
    placeholderEn: string;
    placeholderRu: string;
  }> = [
    {
      key: 'title',
      labelEn: 'Title',
      labelRu: 'Название',
      placeholderEn: 'Document title',
      placeholderRu: 'Название документа',
    },
    {
      key: 'author',
      labelEn: 'Author',
      labelRu: 'Автор',
      placeholderEn: 'Author name',
      placeholderRu: 'Имя автора',
    },
    {
      key: 'subject',
      labelEn: 'Subject',
      labelRu: 'Тема',
      placeholderEn: 'What this document is about',
      placeholderRu: 'О чём этот документ',
    },
    {
      key: 'keywords',
      labelEn: 'Keywords',
      labelRu: 'Ключевые слова',
      placeholderEn: 'invoice, design, report',
      placeholderRu: 'счёт, дизайн, отчёт',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {!file ? (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={100}
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

      {file && !pdfData && !error ? (
        <Card role="status" className="mt-4 p-4 text-sm text-[var(--color-text-muted)]">
          {isEn ? 'Opening PDF…' : 'Открываем PDF…'}
        </Card>
      ) : null}

      {file && pdfData ? (
        <div className="mt-4 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <FileText size={26} className="shrink-0 text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold" title={file.name}>{file.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(file.size, isEn)} · {pageCount} {isEn ? (pageCount === 1 ? 'page' : 'pages') : 'стр.'}
                </div>
              </div>
              <Button variant="outline" size="sm" className="min-h-11 min-w-11" onClick={reset}>
                <ArrowCounterClockwise size={17} />
                <span className="hidden sm:inline">{isEn ? 'New file' : 'Другой файл'}</span>
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="font-semibold">{isEn ? 'Document information' : 'Информация о документе'}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? 'Edit the four fields people and search systems use most often.'
                  : 'Измените четыре поля, которые чаще всего видят люди и поисковые системы.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className={field.key === 'subject' || field.key === 'keywords' ? 'sm:col-span-2' : ''}>
                  <Label htmlFor={`metadata-${field.key}`}>{isEn ? field.labelEn : field.labelRu}</Label>
                  <Input
                    id={`metadata-${field.key}`}
                    className="mt-1.5 h-12 text-base"
                    value={metadata[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    placeholder={isEn ? field.placeholderEn : field.placeholderRu}
                  />
                  {field.key === 'keywords' ? (
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? 'Separate keywords with commas.' : 'Разделяйте ключевые слова запятыми.'}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-start">
              <Button size="lg" className="h-11 w-full sm:w-auto min-w-[220px] px-6 shadow-sm" onClick={saveMetadata} disabled={processing}>
                <FloppyDisk size={20} weight="fill" />
                {processing
                  ? isEn ? 'Saving…' : 'Сохранение…'
                  : isEn ? 'Save and download PDF' : 'Сохранить и скачать PDF'}
              </Button>
            </div>
          </Card>

          <AdvancedSettings
            title={isEn ? 'More details and preview' : 'Дополнительные данные и просмотр'}
            description={isEn ? 'Creator, filename, original dates and PDF preview' : 'Программа-создатель, имя файла, исходные даты и просмотр PDF'}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="metadata-creator">{isEn ? 'Creator application' : 'Программа-создатель'}</Label>
                <Input
                  id="metadata-creator"
                  className="mt-1.5 h-11"
                  value={metadata.creator}
                  onChange={(event) => updateField('creator', event.target.value)}
                  placeholder={isEn ? 'Application or organization' : 'Приложение или организация'}
                />
              </div>

              <div>
                <Label htmlFor="metadata-output">{isEn ? 'Output filename' : 'Имя результата'}</Label>
                <Input
                  id="metadata-output"
                  className="mt-1.5 h-11"
                  value={outputName}
                  onChange={(event) => setOutputName(event.target.value)}
                />
              </div>

              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)]">{isEn ? 'Created' : 'Создан'}</div>
                    <div>{formatDate(details.createdAt, isEn)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)]">{isEn ? 'Last modified' : 'Изменён'}</div>
                    <div>{formatDate(details.modifiedAt, isEn)}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-[var(--color-text-muted)]">{isEn ? 'Producer' : 'PDF-производитель'}</div>
                    <div className="break-words">{details.producer || (isEn ? 'Not specified' : 'Не указан')}</div>
                  </div>
                </div>
              </div>

              <Button type="button" variant="outline" className="min-h-11" onClick={clearFields}>
                <Trash size={18} /> {isEn ? 'Clear the four main fields' : 'Очистить четыре основных поля'}
              </Button>

              <div>
                <div className="mb-2 text-sm font-medium">{isEn ? 'PDF preview' : 'Просмотр PDF'}</div>
                <PdfPreview pdfData={pdfData} maxHeight={480} />
              </div>
            </div>
          </AdvancedSettings>

          {success ? (
            <div role="status" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] p-3 text-sm text-[var(--color-success)]">
              <CheckCircle size={20} weight="fill" /> {success}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
