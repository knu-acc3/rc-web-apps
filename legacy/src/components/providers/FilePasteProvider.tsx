"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { extractClipboardFiles } from "@/src/lib/file-conversion/clipboard";
import {
  fileMatchesAccept,
  isExtendedImageFile,
} from "@/src/lib/file-conversion/formats";
import { normalizeImageForBrowser } from "@/src/lib/file-conversion/image-engine";
import { useLanguage } from "@/src/i18n/LanguageContext";

function getFileInputs(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(
      "main input[type=file]:not(:disabled)",
    ),
  );
}

function findPasteTarget(): HTMLInputElement | null {
  const inputs = getFileInputs();
  return (
    inputs.find((input) => input.dataset.filePasteActive === "true") ??
    inputs.find((input) => input.dataset.filePasteTarget === "true") ??
    inputs[0] ??
    null
  );
}

function dispatchFiles(input: HTMLInputElement, files: File[]) {
  const selected = input.multiple ? files : files.slice(0, 1);
  const transfer = new DataTransfer();
  selected.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function FilePasteProvider() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  useEffect(() => {
    let activeTarget: HTMLInputElement | null = null;

    const registerActiveTarget = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "file") return;
      if (!target.closest("main") || target.disabled) return;
      activeTarget?.removeAttribute("data-file-paste-active");
      activeTarget = target;
      activeTarget.dataset.filePasteActive = "true";
    };

    const handlePaste = (event: ClipboardEvent) => {
      const pastedFiles = extractClipboardFiles(event.clipboardData);
      if (pastedFiles.length === 0) return;

      const target = findPasteTarget();
      if (!target) return;

      event.preventDefault();
      void (async () => {
        const accept = target.accept;
        const raw = target.dataset.filePasteRaw === "true";
        const accepted: File[] = [];
        const rejected: File[] = [];

        for (const file of pastedFiles) {
          if (fileMatchesAccept(file, accept)) {
            accepted.push(file);
            continue;
          }

          const targetAcceptsImages = accept
            .split(",")
            .some((token) => token.trim().toLowerCase().startsWith("image/"));
          if (!raw && targetAcceptsImages && isExtendedImageFile(file)) {
            try {
              accepted.push(await normalizeImageForBrowser(file));
            } catch {
              rejected.push(file);
            }
            continue;
          }
          rejected.push(file);
        }

        if (accepted.length > 0) dispatchFiles(target, accepted);
        if (rejected.length > 0) {
          const names = rejected.slice(0, 3).map((file) => file.name || file.type || "file").join(", ");
          toast.error(
            isEn
              ? `Unsupported for this tool: ${names}`
              : `Этот инструмент не поддерживает: ${names}`,
          );
        }
        if (accepted.length > 0) {
          toast.success(
            isEn
              ? `${accepted.length} file(s) pasted`
              : `Вставлено файлов: ${accepted.length}`,
          );
        }
      })();
    };

    document.addEventListener("click", registerActiveTarget, true);
    document.addEventListener("focusin", registerActiveTarget, true);
    document.addEventListener("change", registerActiveTarget, true);
    document.addEventListener("paste", handlePaste);
    return () => {
      activeTarget?.removeAttribute("data-file-paste-active");
      document.removeEventListener("click", registerActiveTarget, true);
      document.removeEventListener("focusin", registerActiveTarget, true);
      document.removeEventListener("change", registerActiveTarget, true);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isEn]);

  return null;
}
