/// <reference lib="webworker" />
// Bundled pdf.js worker: importing the module registers its message handler on `self`,
// so it always matches the installed pdfjs-dist version.
import "pdfjs-dist/legacy/build/pdf.worker.mjs";
