/** System-safe fonts (present on Windows/macOS or with close fallbacks). */
export const FONTS: { id: string; label: string; css: string }[] = [
  { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "trebuchet", label: "Trebuchet MS", css: "'Trebuchet MS', Tahoma, sans-serif" },
  { id: "georgia", label: "Georgia", css: "Georgia, 'Times New Roman', serif" },
  { id: "times", label: "Times New Roman", css: "'Times New Roman', Times, serif" },
  { id: "courier", label: "Courier New", css: "'Courier New', Courier, monospace" },
  { id: "impact", label: "Impact", css: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif" },
  { id: "comic", label: "Comic Sans MS", css: "'Comic Sans MS', 'Comic Neue', cursive" },
  { id: "system", label: "System UI", css: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

export const fontCss = (id: string) => FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css;
