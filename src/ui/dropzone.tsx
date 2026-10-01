"use client";

import { Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Phones can't drag files: "Перетащите файлы сюда или нажмите, чтобы выбрать" → "Нажмите, чтобы выбрать файлы". */
export function touchTitle(title: string): string | null {
  const ru = title.match(/^Перетащите (.+?)(?: сюда| в поле)?(?:, вставьте Ctrl\+V)? или нажмите(?:, чтобы (?:выбрать|добавить))?(.*)$/);
  if (ru) return `Нажмите, чтобы выбрать ${ru[1]}${ru[2]}`;
  const en = title.match(/^Drop (.+?)(?: here)?(?:, paste [^,]+?)?,? or click to (?:choose|select|browse|add)(.*)$/);
  if (en) return `Tap to choose ${en[1]}${en[2]}`;
  return null;
}

/** Phones have no Ctrl+V: drop the sentences about pasting. */
export function touchHint(hint: string): string | null {
  if (!/(Ctrl|Cmd|⌘)\s*\+\s*V/i.test(hint)) return null;
  return hint.replace(/[^.]*(Ctrl|Cmd|⌘)\s*\+\s*V[^.]*\.?\s*/gi, "").trim();
}

/**
 * File drop area. Accepts drag & drop, click-to-browse and Ctrl+V paste
 * (paste is handled only by the dropzone that currently has focus or, if none
 * does, by the first dropzone on the page).
 */
export function Dropzone({
  onFiles,
  accept,
  multiple = false,
  title,
  hint,
  className,
  compact = false,
  disabled = false,
  children,
  locale,
  action,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title: ReactNode;
  hint?: ReactNode;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  /** Language of the button inside the zone (guessed from the title when omitted). */
  locale?: "ru" | "en";
  /** Text of the button inside the zone instead of "Выбрать файл(ы)" / "Добавить ещё" (e.g. "Другой файл"). */
  action?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const id = useId();

  const emit = useCallback(
    (list: FileList | File[] | null | undefined) => {
      if (!list || disabled) return;
      const files = Array.from(list).filter((f) => matchesAccept(f, accept));
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [accept, disabled, multiple, onFiles],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const zones = document.querySelectorAll("[data-dropzone]");
      const active = document.activeElement?.closest("[data-dropzone]");
      const owner = active ?? zones[0];
      if (owner !== rootRef.current) return;
      e.preventDefault();
      emit(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [emit]);

  return (
    <div
      ref={rootRef}
      data-dropzone
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-labelledby={`${id}-title`}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        emit(e.dataTransfer.files);
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed text-center transition-[border-color,background-color,transform] duration-200",
        compact ? "min-h-24 px-4 py-4" : "min-h-48 px-5 py-8",
        over ? "scale-[1.01] border-accent bg-accent-soft" : "border-outline/60 bg-surface hover:border-accent hover:bg-accent-soft/40",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {/* Looks like the button it is: the whole zone opens the file picker (it is the control, so this is a span). */}
      <span
        aria-hidden
        className={cn(
          "btn btn-filled pointer-events-none transition-transform duration-200 group-hover:-translate-y-0.5",
          compact ? "h-10 px-5 text-[0.9375rem] [--btn-r:1.25rem]" : "h-12 px-6 text-base [--btn-r:1.5rem] [&_svg]:size-5",
          over && "scale-105",
        )}
      >
        <Upload aria-hidden />
        {action ?? CHOOSE[locale ?? lang(title)][compact ? "more" : multiple ? "many" : "one"]}
      </span>
      <span id={`${id}-title`} className={cn("font-semibold text-fg", compact ? "text-[0.9375rem]" : "text-base")}>
        {typeof title === "string" && touchTitle(title) ? (
          <>
            <span className="pointer-coarse:hidden">{title}</span>
            <span className="hidden pointer-coarse:inline">{touchTitle(title)}</span>
          </>
        ) : (
          title
        )}
      </span>
      {hint &&
        (typeof hint === "string" && touchHint(hint) !== null ? (
          <>
            <span className="max-w-md text-sm text-fg-3 pointer-coarse:hidden">{hint}</span>
            {touchHint(hint) && <span className="hidden max-w-md text-sm text-fg-3 pointer-coarse:inline">{touchHint(hint)}</span>}
          </>
        ) : (
          <span className="max-w-md text-sm text-fg-3">{hint}</span>
        ))}
      {children}
      {/* Hidden (not sr-only): the zone itself is the control; .click() still opens the picker. */}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const CHOOSE = {
  ru: { one: "Выбрать файл", many: "Выбрать файлы", more: "Добавить ещё" },
  en: { one: "Choose file", many: "Choose files", more: "Add more" },
} as const;
/** Without a `locale` prop the title tells the language. */
const lang = (title: ReactNode): "ru" | "en" => (typeof title === "string" && /[а-яё]/i.test(title) ? "ru" : typeof title === "string" ? "en" : "ru");

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const rules = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((r) => {
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
    return type === r;
  });
}
