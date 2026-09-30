/* zxcvbn-ts setup shared by the Web Worker and unit tests. Heavy: import only in a worker or test. */
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as en from "@zxcvbn-ts/language-en";

/** Common passwords of Russian-speaking users (typed in Latin, translit or Cyrillic) that aren't in the English lists. */
export const RU_PASSWORDS = [
  "qwerty", "ytrewq", "qwertyuiop", "asdfgh", "zxcvbn", "zaq12wsx", "1q2w3e4r", "1q2w3e", "1qaz2wsx", "q1w2e3r4", "parol", "parol123", "privet", "privet123", "lubov", "lyubov", "lublu", "iloveyou",
  "natasha", "masha", "sasha", "dasha", "katya", "olga", "marina", "svetlana", "tatyana", "irina", "elena", "andrey", "sergey", "dmitry", "aleksandr", "maksim", "ivan", "vladimir",
  "kotik", "zaika", "solnyshko", "rybka", "medved", "spartak", "zenit", "cska", "dinamo", "moskva", "rossiya", "russia", "kazakhstan", "almaty", "astana", "qazaqstan",
  "пароль", "привет", "любовь", "солнышко", "котик", "зайка", "йцукен", "йцукенг", "йцукенгшщзхъ", "фывапролджэ", "ячсмитьбю", "фыва", "олдж", "наташа", "маша", "саша",
];

const RU_TRANSLATIONS = {
  warnings: {
    straightRow: "Ряд клавиш подряд легко подобрать.",
    keyPattern: "Короткие узоры на клавиатуре легко подобрать.",
    simpleRepeat: "Повторы вроде «ааа» легко подобрать.",
    extendedRepeat: "Повторяющиеся фрагменты вроде «абвабвабв» легко подобрать.",
    sequences: "Последовательности вроде «abc» или «6543» легко подобрать.",
    recentYears: "Недавние годы легко подобрать.",
    dates: "Даты легко подобрать.",
    topTen: "Это один из самых популярных паролей.",
    topHundred: "Это очень популярный пароль.",
    common: "Это распространённый пароль.",
    similarToCommon: "Это похоже на распространённый пароль.",
    wordByItself: "Отдельные слова легко подобрать.",
    namesByThemselves: "Отдельные имена и фамилии легко подобрать.",
    commonNames: "Распространённые имена и фамилии легко подобрать.",
    userInputs: "В пароле не должно быть личных данных или данных этой страницы.",
    pwned: "Этот пароль уже утекал в интернет.",
  },
  suggestions: {
    l33t: "Не заменяйте буквы похожими символами: «@» вместо «a» подбирается так же легко.",
    reverseWords: "Не пишите распространённые слова задом наперёд.",
    allUppercase: "Делайте заглавными только некоторые буквы, а не все.",
    capitalization: "Заглавная буква не только в начале слова.",
    dates: "Не используйте даты, связанные с вами.",
    recentYears: "Не используйте недавние годы.",
    associatedYears: "Не используйте годы, связанные с вами.",
    sequences: "Избегайте последовательностей символов.",
    repeated: "Избегайте повторяющихся слов и символов.",
    longerKeyboardPattern: "Используйте более длинные узоры и меняйте направление.",
    anotherWord: "Добавьте ещё слова, и пореже.",
    useWords: "Используйте несколько слов, но не популярные фразы.",
    noNeed: "Надёжный пароль можно составить и без символов, цифр и заглавных букв.",
    pwned: "Если вы используете этот пароль где-то ещё, смените его.",
  },
  timeEstimation: {
    ltSecond: "меньше секунды",
    second: "{base} секунда",
    seconds: "{base} секунд",
    minute: "{base} минута",
    minutes: "{base} минут",
    hour: "{base} час",
    hours: "{base} часов",
    day: "{base} день",
    days: "{base} дней",
    month: "{base} месяц",
    months: "{base} месяцев",
    year: "{base} год",
    years: "{base} лет",
    centuries: "века",
  },
};

export type StrengthLocale = "ru" | "en";

const cache = new Map<StrengthLocale, ZxcvbnFactory>();

export function getZxcvbn(locale: StrengthLocale): ZxcvbnFactory {
  let z = cache.get(locale);
  if (!z) {
    z = new ZxcvbnFactory({
      translations: locale === "ru" ? RU_TRANSLATIONS : en.translations,
      graphs: common.adjacencyGraphs,
      dictionary: { ...common.dictionary, ...en.dictionary, "passwords-ru": RU_PASSWORDS },
    });
    cache.set(locale, z);
  }
  return z;
}

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  guessesLog10: number;
  seconds: { onlineThrottled: number; online: number; offlineSlow: number; offlineFast: number };
  warning: string | null;
  suggestions: string[];
}

export function checkStrength(password: string, locale: StrengthLocale): StrengthResult {
  const r = getZxcvbn(locale).check(password.slice(0, 256));
  return {
    score: r.score as StrengthResult["score"],
    guessesLog10: r.guessesLog10,
    seconds: {
      onlineThrottled: r.crackTimes.onlineThrottlingXPerHour.seconds,
      online: r.crackTimes.onlineNoThrottlingXPerSecond.seconds,
      offlineSlow: r.crackTimes.offlineSlowHashingXPerSecond.seconds,
      offlineFast: r.crackTimes.offlineFastHashingXPerSecond.seconds,
    },
    warning: r.feedback.warning,
    suggestions: r.feedback.suggestions,
  };
}
