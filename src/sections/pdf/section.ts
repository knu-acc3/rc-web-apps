import { defineToolSection } from "@/registry/tool-section";
import { docToPdfTool, heicToPdfTool, imageToPdfTool, jpgToPdfTool, pdfToImageTool, pdfToJpgTool, pdfToPngTool, pdfToWebpTool, pngToPdfTool, toTextTool, webpToPdfTool } from "./content/convert";
import { compressTool, formTool, metadataTool, nupTool, pageNumbersTool, protectTool, signTool, unlockTool, watermarkTool } from "./content/edit";
import { deleteTool, extractTool, mergeTool, organizeTool, rotateTool, splitTool } from "./content/pages";

export const pdfSection = defineToolSection({
  id: "pdf",
  name: { ru: "PDF", en: "PDF" },
  description: {
    ru: "Объединение, разделение, сжатие, поворот и конвертация PDF прямо в браузере",
    en: "Merge, split, compress, rotate and convert PDF files right in your browser",
  },
  // "PDF онлайн" is itself a common query, so the group gets a landing page.
  title: { ru: "PDF онлайн — объединить, сжать, разделить PDF", en: "PDF online — merge, compress and split PDF files" },
  h1: { ru: "PDF онлайн", en: "PDF online" },
  hubDescription: {
    ru: "Работа с PDF в браузере: объединить, разделить, сжать, повернуть, перевести в JPG и обратно, водяной знак, номера страниц, пароль. Файлы не загружаются.",
    en: "Work with PDF in your browser: merge, split, compress, rotate, convert to and from JPG, watermark, page numbers, passwords. Files are never uploaded.",
  },
  icon: "FileText",
  hue: 0,
  category: "files",
  order: 1,
  tools: [
    docToPdfTool,
    mergeTool,
    splitTool,
    compressTool,
    rotateTool,
    organizeTool,
    deleteTool,
    extractTool,
    jpgToPdfTool,
    pdfToJpgTool,
    imageToPdfTool,
    pngToPdfTool,
    heicToPdfTool,
    webpToPdfTool,
    pdfToImageTool,
    pdfToPngTool,
    pdfToWebpTool,
    toTextTool,
    watermarkTool,
    pageNumbersTool,
    signTool,
    formTool,
    nupTool,
    metadataTool,
    protectTool,
    unlockTool,
  ],
  hubBlocks: (l) => [
    {
      type: "text",
      title: l === "ru" ? "Почему здесь" : "Why here",
      paragraphs:
        l === "ru"
          ? [
              "Все инструменты работают прямо в браузере: PDF не загружается на сервер, поэтому договоры, сканы паспортов и медицинские справки остаются только у вас. Тяжёлая работа идёт в фоновом потоке, и страница не зависает даже на документах в сотни страниц.",
              "Никаких водяных знаков, регистрации и лимитов на число файлов. Страницы копируются без пересжатия, а там, где качество меняется (сжатие картинок, перевод страниц в изображения), это прямо написано.",
            ]
          : [
              "Every tool runs right in your browser: the PDF is never uploaded, so contracts, passport scans and medical records stay with you. Heavy work runs in a background thread, so the page stays responsive even with documents of hundreds of pages.",
              "No watermarks, no sign-up and no limits on the number of files. Pages are copied without re-compression, and wherever quality does change (image compression, pages to images) it says so plainly.",
            ],
    },
  ],
});
