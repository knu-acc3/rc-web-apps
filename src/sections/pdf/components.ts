import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "pdf/merge": () => import("./MergeTool"),
  "pdf/split": () => import("./SplitTool"),
  "pdf/pages": () => import("./PagesTool"),
  "pdf/compress": () => import("./CompressTool"),
  "pdf/images-to-pdf": () => import("./ImagesToPdfTool"),
  "pdf/to-images": () => import("./PdfToImagesTool"),
  "pdf/watermark": () => import("./WatermarkTool"),
  "pdf/page-numbers": () => import("./PageNumbersTool"),
  "pdf/sign": () => import("./SignTool"),
  "pdf/form": () => import("./FormTool"),
  "pdf/nup": () => import("./NupTool"),
  "pdf/metadata": () => import("./MetadataTool"),
  "pdf/to-text": () => import("./ToTextTool"),
  "pdf/protect": () => import("./ProtectTool"),
  "pdf/unlock": () => import("./UnlockTool"),
  "pdf/doc-to-pdf": () => import("./DocToPdfTool"),
};
