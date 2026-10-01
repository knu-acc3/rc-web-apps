import type { ComponentMap } from "./types";
import { components as about } from "../site/about/components";
import { components as convert } from "./convert/convert/components";
import { components as pdf } from "./files/pdf/components";
import { components as image } from "./files/image/components";
import { components as video } from "./files/video/components";
import { components as audio } from "./files/audio/components";
import { components as file } from "./files/file/components";
import { components as text } from "./text/text/components";
import { components as fonts } from "./text/fonts/components";
import { components as notes } from "./text/notes/components";
import { components as emoji } from "./symbols/emoji/components";
import { components as symbols } from "./symbols/symbols/components";
import { components as kaomoji } from "./symbols/kaomoji/components";
import { components as time } from "./time/time/components";
import { components as timer } from "./time/timer/components";
import { components as countdown } from "./time/countdown/components";
import { components as calendar } from "./time/calendar/components";
import { components as date } from "./time/date/components";
import { components as calc } from "./calc/calc/components";
import { components as finance } from "./calc/finance/components";
import { components as health } from "./calc/health/components";
import { components as numbers } from "./convert/numbers/components";
import { components as sizes } from "./convert/sizes/components";
import { components as actualSize } from "./convert/actual-size/components";
import { components as random } from "./random/random/components";
import { components as score } from "./random/score/components";
import { components as color } from "./design/color/components";
import { components as css } from "./design/css/components";
import { components as code } from "./dev/code/components";
import { components as data } from "./dev/data/components";
import { components as regex } from "./dev/regex/components";
import { components as cron } from "./dev/cron/components";
import { components as encode } from "./dev/encode/components";
import { components as hash } from "./dev/hash/components";
import { components as uuid } from "./dev/uuid/components";
import { components as dev } from "./dev/dev/components";
import { components as httpStatus } from "./dev/http-status/components";
import { components as mime } from "./dev/mime/components";
import { components as port } from "./dev/port/components";
import { components as password } from "./web/password/components";
import { components as qr } from "./web/qr/components";
import { components as validate } from "./web/validate/components";
import { components as network } from "./web/network/components";
import { components as seo } from "./web/seo/components";
import { components as test } from "./device/test/components";
import { components as screen } from "./device/screen/components";
import { components as whatIsMy } from "./device/what-is-my/components";

/** Tool component loaders, merged from every section. */
export const COMPONENTS: ComponentMap = {
  ...about,
  ...convert,
  ...pdf,
  ...image,
  ...video,
  ...audio,
  ...file,
  ...text,
  ...fonts,
  ...notes,
  ...emoji,
  ...symbols,
  ...kaomoji,
  ...time,
  ...timer,
  ...countdown,
  ...calendar,
  ...date,
  ...calc,
  ...finance,
  ...health,
  ...numbers,
  ...sizes,
  ...actualSize,
  ...random,
  ...score,
  ...color,
  ...css,
  ...code,
  ...data,
  ...regex,
  ...cron,
  ...encode,
  ...hash,
  ...uuid,
  ...dev,
  ...httpStatus,
  ...mime,
  ...port,
  ...password,
  ...qr,
  ...validate,
  ...network,
  ...seo,
  ...test,
  ...screen,
  ...whatIsMy,
};
