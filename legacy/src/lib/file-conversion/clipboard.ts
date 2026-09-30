export function extractClipboardFiles(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files.length > 0 ? files : Array.from(data.files ?? []);
}

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input:not([type=file]), textarea, [contenteditable=true], [role=textbox]"));
}

export function shouldHandleFilePaste(event: ClipboardEvent): boolean {
  const files = extractClipboardFiles(event.clipboardData);
  if (files.length === 0) return false;
  // A clipboard containing actual files is intentional even if focus happens
  // to be inside a text field. Text-only clipboard content is never touched.
  return true;
}

