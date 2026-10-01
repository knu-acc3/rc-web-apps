import type { SectionDef } from "@/registry/types";
import { aboutSection } from "./about/section";
import { convertSection } from "./convert/section";
import { pdfSection } from "./pdf/section";
import { imageSection } from "./image/section";
import { videoSection } from "./video/section";
import { audioSection } from "./audio/section";
import { fileSection } from "./file/section";
import { textSection } from "./text/section";
import { fontsSection } from "./fonts/section";
import { notesSection } from "./notes/section";
import { emojiSection } from "./emoji/section";
import { symbolsSection } from "./symbols/section";
import { kaomojiSection } from "./kaomoji/section";
import { timeSection } from "./time/section";
import { timerSection } from "./timer/section";
import { countdownSection } from "./countdown/section";
import { calendarSection } from "./calendar/section";
import { dateSection } from "./date/section";
import { calcSection } from "./calc/section";
import { financeSection } from "./finance/section";
import { healthSection } from "./health/section";
import { numbersSection } from "./numbers/section";
import { sizesSection } from "./sizes/section";
import { actualSizeSection } from "./actual-size/section";
import { randomSection } from "./random/section";
import { colorSection } from "./color/section";
import { cssSection } from "./css/section";
import { codeSection } from "./code/section";
import { dataSection } from "./data/section";
import { regexSection } from "./regex/section";
import { cronSection } from "./cron/section";
import { encodeSection } from "./encode/section";
import { hashSection } from "./hash/section";
import { uuidSection } from "./uuid/section";
import { devSection } from "./dev/section";
import { httpStatusSection } from "./http-status/section";
import { mimeSection } from "./mime/section";
import { portSection } from "./port/section";
import { passwordSection } from "./password/section";
import { qrSection } from "./qr/section";
import { validateSection } from "./validate/section";
import { networkSection } from "./network/section";
import { seoSection } from "./seo/section";
import { testSection } from "./test/section";
import { screenSection } from "./screen/section";
import { whatIsMySection } from "./what-is-my/section";

/** All sections of the site. Order inside a home-page category is set by `order`. */
export const SECTIONS: SectionDef[] = [
  convertSection,
  pdfSection,
  imageSection,
  videoSection,
  audioSection,
  fileSection,
  textSection,
  fontsSection,
  notesSection,
  emojiSection,
  symbolsSection,
  kaomojiSection,
  timeSection,
  timerSection,
  countdownSection,
  calendarSection,
  dateSection,
  calcSection,
  financeSection,
  healthSection,
  numbersSection,
  sizesSection,
  actualSizeSection,
  randomSection,
  colorSection,
  cssSection,
  codeSection,
  dataSection,
  regexSection,
  cronSection,
  encodeSection,
  hashSection,
  uuidSection,
  devSection,
  httpStatusSection,
  mimeSection,
  portSection,
  passwordSection,
  qrSection,
  validateSection,
  networkSection,
  seoSection,
  testSection,
  screenSection,
  whatIsMySection,
  aboutSection,
];
