/**
 * Tool families: small groups of tools people switch between ("timer → stopwatch → alarm"). A tool page shows its
 * family as a row of tabs above the tool. A tool belongs to the first family that lists it. Keep families short
 * (≤ 8) and made of real neighbours — this is navigation, not a catalogue.
 */
export const FAMILIES: string[][] = [
  ["timer", "stopwatch", "alarm-clock", "pomodoro-timer", "interval-timer", "chess-clock", "countdown"],
  ["online-clock", "flip-clock", "analog-clock", "night-clock", "time", "world-clock", "learn-to-tell-time"],
  ["scoreboard", "counter", "draw-lots"],
  ["spin-the-wheel", "random-number-generator", "coin-flip", "dice-roller", "yes-or-no", "random-picker", "random-team-generator", "rock-paper-scissors"],
  ["white-screen", "black-screen", "flashing-light", "mirror", "monitor-test", "stuck-pixel-fix", "burn-in-test", "dead-pixel-test"],
  ["microphone-test", "webcam-test", "speaker-test", "keyboard-test", "mouse-test", "touch-screen-test", "refresh-rate-test", "gamepad-test"],
  ["merge-pdf", "split-pdf", "organize-pdf", "delete-pdf-pages", "extract-pdf-pages", "rotate-pdf", "reverse-pdf", "remove-blank-pages-pdf"],
  ["add-text-to-pdf", "sign-pdf", "fill-pdf-form", "watermark-pdf", "add-page-numbers-to-pdf", "crop-pdf", "flip-pdf"],
  ["jpg-to-pdf", "pdf-to-jpg", "image-to-pdf", "pdf-to-image", "png-to-pdf", "pdf-to-png", "pdf-to-text"],
  ["compress-pdf", "protect-pdf", "unlock-pdf", "grayscale-pdf", "invert-pdf", "resize-pdf", "n-up-pdf", "edit-pdf-metadata"],
  ["compress-image", "resize-image", "crop-image", "image-converter", "rotate-image", "flip-image", "crop-image-circle"],
  ["passport-photo", "id-card-copy", "change-dpi"],
  ["add-text-to-image", "add-watermark", "blur-part-of-image", "photo-filters", "add-border-to-image", "round-image-corners", "make-image-square", "photo-collage"],
  ["compress-video", "video-converter", "trim-video", "video-to-gif", "merge-videos", "resize-video", "rotate-video", "change-video-speed"],
  ["audio-converter", "trim-audio", "merge-audio", "increase-audio-volume", "change-audio-speed", "reverse-audio", "voice-recorder"],
  ["tone-generator", "noise-generator", "metronome", "tuner", "tap-bpm", "decibel-meter", "speaker-cleaner"],
  ["word-counter", "case-converter", "text-cleaner", "remove-extra-spaces", "find-and-replace", "remove-duplicate-lines", "sort-lines", "text-compare"],
  ["password-generator", "password-strength-checker", "encrypt-file", "encrypt-text"],
  ["qr-code-generator", "qr-code-scanner", "barcode-generator", "barcode-scanner"],
  ["base64-encode", "base64-decode", "url-encode", "url-decode", "html-encode", "html-decode"],
  ["age-calculator", "days-between-dates", "add-days-to-date", "day-of-the-week", "time-calculator", "work-hours-calculator", "unix-timestamp"],
  ["percentage-calculator", "fraction-calculator", "scientific-calculator", "rounding-calculator", "proportion-calculator", "ratio-calculator", "average-calculator"],
  ["loan-calculator", "mortgage-calculator", "deposit-calculator", "compound-interest-calculator", "vat-calculator", "discount-calculator", "tip-calculator"],
  ["bmi-calculator", "calorie-calculator", "ideal-weight-calculator", "body-fat-calculator", "water-intake-calculator", "sleep-calculator", "macro-calculator"],
  ["notes", "todo-list"],
  ["what-is-my-browser", "what-is-my-os", "what-is-my-device", "screen-resolution", "viewport-size", "what-is-my-timezone", "system-info"],
  ["create-zip", "unzip", "file-type-checker", "batch-rename-files", "split-file", "join-files"],
];

const BY_SLUG = new Map<string, string[]>();
for (const f of FAMILIES) for (const s of f) if (!BY_SLUG.has(s)) BY_SLUG.set(s, f);

/** The family of a top-level tool slug, if it has one. */
export const familyOf = (slug: string): string[] | undefined => BY_SLUG.get(slug);
