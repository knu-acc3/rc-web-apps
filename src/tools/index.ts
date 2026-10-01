import type { SectionDef } from "@/registry/types";
import { aboutSection } from "../site/about/section";
import { convertSection } from "./convert/convert/section";
import { pdfSection } from "./files/pdf/section";
import { imageSection } from "./files/image/section";
import { videoSection } from "./files/video/section";
import { audioSection } from "./files/audio/section";
import { fileSection } from "./files/file/section";
import { textSection } from "./text/text/section";
import { fontsSection } from "./text/fonts/section";
import { notesSection } from "./text/notes/section";
import { emojiSection } from "./symbols/emoji/section";
import { symbolsSection } from "./symbols/symbols/section";
import { kaomojiSection } from "./symbols/kaomoji/section";
import { timeSection } from "./time/time/section";
import { timerSection } from "./time/timer/section";
import { countdownSection } from "./time/countdown/section";
import { calendarSection } from "./time/calendar/section";
import { dateSection } from "./time/date/section";
import { calcSection } from "./calc/calc/section";
import { financeSection } from "./calc/finance/section";
import { healthSection } from "./calc/health/section";
import { numbersSection } from "./convert/numbers/section";
import { sizesSection } from "./convert/sizes/section";
import { actualSizeSection } from "./convert/actual-size/section";
import { randomSection } from "./random/random/section";
import { scoreSection } from "./random/score/section";
import { colorSection } from "./design/color/section";
import { cssSection } from "./design/css/section";
import { codeSection } from "./dev/code/section";
import { dataSection } from "./dev/data/section";
import { regexSection } from "./dev/regex/section";
import { cronSection } from "./dev/cron/section";
import { encodeSection } from "./dev/encode/section";
import { hashSection } from "./dev/hash/section";
import { uuidSection } from "./dev/uuid/section";
import { devSection } from "./dev/dev/section";
import { httpStatusSection } from "./dev/http-status/section";
import { mimeSection } from "./dev/mime/section";
import { portSection } from "./dev/port/section";
import { passwordSection } from "./web/password/section";
import { qrSection } from "./web/qr/section";
import { validateSection } from "./web/validate/section";
import { networkSection } from "./web/network/section";
import { seoSection } from "./web/seo/section";
import { testSection } from "./device/test/section";
import { screenSection } from "./device/screen/section";
import { whatIsMySection } from "./device/what-is-my/section";

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
  scoreSection,
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
