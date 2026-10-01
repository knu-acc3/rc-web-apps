import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "qr/generator": () => import("./QrGenerator"),
  "qr/scanner": () => import("./QrScanner"),
  "qr/barcode": () => import("./BarcodeGenerator"),
  "qr/check-digit": () => import("./CheckDigitCalculator"),
};
