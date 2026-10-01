import type { ComponentMap } from "./types";
import { components as convert } from "./convert/components";
import { components as pdf } from "./pdf/components";
import { components as image } from "./image/components";
import { components as video } from "./video/components";
import { components as audio } from "./audio/components";
import { components as file } from "./file/components";
import { components as text } from "./text/components";
import { components as fonts } from "./fonts/components";
import { components as notes } from "./notes/components";
import { components as emoji } from "./emoji/components";
import { components as symbols } from "./symbols/components";
import { components as kaomoji } from "./kaomoji/components";
import { components as time } from "./time/components";
import { components as timer } from "./timer/components";
import { components as countdown } from "./countdown/components";
import { components as calendar } from "./calendar/components";
import { components as date } from "./date/components";
import { components as calc } from "./calc/components";
import { components as finance } from "./finance/components";
import { components as health } from "./health/components";
import { components as numbers } from "./numbers/components";
import { components as sizes } from "./sizes/components";
import { components as actualSize } from "./actual-size/components";
import { components as random } from "./random/components";
import { components as color } from "./color/components";
import { components as css } from "./css/components";
import { components as code } from "./code/components";
import { components as data } from "./data/components";
import { components as regex } from "./regex/components";
import { components as cron } from "./cron/components";
import { components as encode } from "./encode/components";
import { components as hash } from "./hash/components";
import { components as uuid } from "./uuid/components";
import { components as dev } from "./dev/components";
import { components as httpStatus } from "./http-status/components";
import { components as mime } from "./mime/components";
import { components as port } from "./port/components";
import { components as password } from "./password/components";
import { components as qr } from "./qr/components";
import { components as validate } from "./validate/components";
import { components as network } from "./network/components";
import { components as seo } from "./seo/components";
import { components as test } from "./test/components";
import { components as screen } from "./screen/components";
import { components as whatIsMy } from "./what-is-my/components";

/** Tool component loaders, merged from every section. */
export const COMPONENTS: ComponentMap = {
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
