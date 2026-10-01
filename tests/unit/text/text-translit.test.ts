import { describe, expect, it } from "vitest";
import { detectLang, reverseTransliterate, slugify, transliterate } from "@/tools/text/text/lib/translit";

describe("translit: ICAO Doc 9303 (Russian passports since 2013)", () => {
  const t = (s: string) => transliterate(s, "icao", { lang: "ru" });
  it("reference names", () => {
    expect(t("Щукин")).toBe("Shchukin");
    expect(t("ЩУКИН")).toBe("SHCHUKIN");
    expect(t("Наталья")).toBe("Natalia");
    expect(t("Юлия")).toBe("Iuliia");
    expect(t("Подъячев")).toBe("Podieiachev");
    expect(t("Ёлкин")).toBe("Elkin");
    expect(t("Хрущёв")).toBe("Khrushchev");
    expect(t("Цой Виктор")).toBe("Tsoi Viktor");
    expect(t("ЮЛИЯ ЦОЙ")).toBe("IULIIA TSOI");
    expect(t("Щ")).toBe("Shch");
  });
});

describe("translit: GOST 7.79-2000 System A (ISO 9)", () => {
  const t = (s: string) => transliterate(s, "gost-a", { lang: "ru" });
  it("one letter to one letter", () => {
    expect(t("Щукин")).toBe("Ŝukin");
    expect(t("Ёлкин")).toBe("Ëlkin");
    expect(t("Съезд")).toBe("Sʺezd");
    expect(t("Юрьев")).toBe("Ûrʹev");
    expect(t("Чайковский")).toBe("Čajkovskij");
    expect(t("Эхо")).toBe("Èho");
  });
  it("is reversible", () => {
    const src = "Съешь же ещё этих мягких французских булок, да выпей чаю. ЩУКА Эхо Юрьев";
    expect(reverseTransliterate(t(src), "gost-a")).toBe(src);
  });
  it("Ukrainian letters", () => {
    expect(transliterate("Київ Ґанок Єва", "gost-a", { lang: "uk" })).toBe("Kiïv G̀anok Êva");
  });
});

describe("translit: GOST 7.79-2000 System B", () => {
  const t = (s: string) => transliterate(s, "gost-b", { lang: "ru" });
  it("digraphs and the ц rule", () => {
    expect(t("Щукин")).toBe("Shhukin");
    expect(t("ЩУКИН")).toBe("SHHUKIN");
    expect(t("Цирк")).toBe("Cirk");
    expect(t("Цапля")).toBe("Czaplya");
    expect(t("Лицей")).toBe("Licej");
    expect(t("Цыган")).toBe("Cy`gan");
    expect(t("Съезд")).toBe("S``ezd");
    expect(t("Хрущёв")).toBe("Xrushhyov");
    expect(t("отец")).toBe("otecz");
    expect(t("Эхо")).toBe("E`xo");
  });
  it("is reversible", () => {
    const src = "Цапля и цирк, съезд, Хрущёв, лицей, отец, Эхо, объём";
    expect(reverseTransliterate(t(src), "gost-b")).toBe(src);
  });
});

describe("translit: BGN/PCGN 1947", () => {
  const t = (s: string) => transliterate(s, "bgn", { lang: "ru" });
  it("ye / yë after vowels, soft and hard signs and at word start", () => {
    expect(t("Ельцин")).toBe("Yel’tsin");
    expect(t("ЕЛЬЦИН")).toBe("YEL’TSIN");
    expect(t("Королёв")).toBe("Korolëv");
    expect(t("Юрьев")).toBe("Yur’yev");
    expect(t("Подъезд")).toBe("Pod”yezd");
    expect(t("Щукин")).toBe("Shchukin");
    expect(t("Ёлкино")).toBe("Yëlkino");
  });
});

describe("translit: scientific", () => {
  const t = (s: string) => transliterate(s, "scientific", { lang: "ru" });
  it("reference", () => {
    expect(t("Щукин")).toBe("Ščukin");
    expect(t("Хрущёв")).toBe("Xruščëv");
    expect(t("Юрьев")).toBe("Jur′ev");
    expect(t("Съезд")).toBe("S″ezd");
  });
  it("reverse", () => {
    expect(reverseTransliterate("Ščukin, Xruščëv", "scientific")).toBe("Щукин, Хрущёв");
  });
});

describe("translit: Ukrainian national system 2010", () => {
  const t = (s: string) => transliterate(s, "ukrainian-2010", { lang: "uk" });
  it("examples from the resolution", () => {
    expect(t("Алушта")).toBe("Alushta");
    expect(t("Борщагівка")).toBe("Borshchahivka");
    expect(t("Згорани")).toBe("Zghorany");
    expect(t("Розгон")).toBe("Rozghon");
    expect(t("Єнакієве")).toBe("Yenakiieve");
    expect(t("Їжакевич")).toBe("Yizhakevych");
    expect(t("Кадиївка")).toBe("Kadyivka");
    expect(t("Йосипівка")).toBe("Yosypivka");
    expect(t("Стрий")).toBe("Stryi");
    expect(t("Юрій")).toBe("Yurii");
    expect(t("Знам'янка")).toBe("Znamianka");
    expect(t("Короп'є")).toBe("Koropie");
    expect(t("Київ")).toBe("Kyiv");
    expect(t("Гадяч")).toBe("Hadiach");
  });
});

describe("translit: Kazakh Latin 2021", () => {
  const t = (s: string) => transliterate(s, "kazakh-2021", { lang: "kk" });
  it("Kazakh letters", () => {
    expect(t("Қазақстан")).toBe("Qazaqstan");
    expect(t("Өскемен")).toBe("Öskemen");
    expect(t("Ақтөбе")).toBe("Aqtöbe");
    expect(t("Шымкент")).toBe("Şymkent");
    expect(t("Жезқазған")).toBe("Jezqazğan");
    expect(t("Ұлытау")).toBe("Ūlytau");
    expect(t("Іле")).toBe("Ile");
    expect(t("Ислам")).toBe("İslam");
    expect(t("ИІ")).toBe("İI");
  });
  it("reverse", () => {
    expect(reverseTransliterate("Qazaqstan Öskemen Aqtöbe Jezqazğan", "kazakh-2021")).toBe("Қазақстан Өскемен Ақтөбе Жезқазған");
  });
});

describe("translit: informal", () => {
  it("forward and reverse", () => {
    expect(transliterate("Привет, как дела? Щука", "informal", { lang: "ru" })).toBe("Privet, kak dela? Schuka");
    expect(reverseTransliterate("Privet, kak dela? Moy drug zhivet v Moskve", "informal")).toBe("Привет, как дела? Мой друг живет в Москве");
    expect(reverseTransliterate("shchuka i yozh", "informal")).toBe("щука и ёж");
  });
});

describe("translit: language detection and fallbacks", () => {
  it("detects", () => {
    expect(detectLang("Қазақстан")).toBe("kk");
    expect(detectLang("Київ")).toBe("uk");
    expect(detectLang("Москва")).toBe("ru");
  });
  it("never drops Kazakh letters in ASCII standards", () => {
    expect(transliterate("Қазақстан", "icao")).toBe("Qazaqstan");
    expect(transliterate("Өскемен", "gost-b")).toBe("Oskemen");
  });
});

describe("translit: slug", () => {
  it("builds URL slugs for Russian, Kazakh and Ukrainian", () => {
    expect(slugify("Қазақстан")).toBe("qazaqstan");
    expect(slugify("Привет, мир!")).toBe("privet-mir");
    expect(slugify("Как выбрать ноутбук в 2025 году: 10 советов")).toBe("kak-vybrat-noutbuk-v-2025-godu-10-sovetov");
    expect(slugify("Київ і Львів")).toBe("kyiv-i-lviv");
    expect(slugify("Щукин & сыновья")).toBe("shchukin-and-synovya");
    expect(slugify("Crème brûlée — Straße")).toBe("creme-brulee-strasse");
    expect(slugify("Ёжик в тумане", { separator: "_" })).toBe("yozhik_v_tumane");
    expect(slugify("один два три четыре", { maxLength: 12 })).toBe("odin-dva-tri");
  });
});
