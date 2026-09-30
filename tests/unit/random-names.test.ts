import { describe, expect, it } from "vitest";
import { NAME_LISTS, feminineSurname, formatName, kkPatronymic, randomName, ruPatronymic, toLatin } from "@/sections/random/lib/names";

describe("name lists", () => {
  for (const lang of ["ru", "en", "kk"] as const) {
    for (const list of ["male", "female", "surnames"] as const) {
      it(`${lang} ${list}: at least 100 unique entries`, () => {
        const a = NAME_LISTS[lang][list] as readonly string[];
        expect(a.length).toBeGreaterThanOrEqual(100);
        expect(new Set(a).size).toBe(a.length);
        for (const n of a) expect(n).toMatch(lang === "en" ? /^[A-Z][a-z]+$/ : /^[А-ЯЁ][а-яё]+$/);
      });
    }
  }

  it("list sizes read correctly in the Russian page texts («N фамилий», «N женских имён»)", () => {
    // The descriptions interpolate the counts before genitive-plural nouns, so every count must take the "many" form.
    const rules = new Intl.PluralRules("ru-RU");
    for (const lang of ["ru", "en", "kk"] as const)
      for (const list of ["male", "female", "surnames"] as const) expect(rules.select(NAME_LISTS[lang][list].length), `${lang} ${list}`).toBe("many");
  });

  it("given names are not listed for both genders", () => {
    for (const lang of ["ru", "en", "kk"] as const) {
      const male = new Set<string>(NAME_LISTS[lang].male);
      for (const f of NAME_LISTS[lang].female) expect(male.has(f), `${lang}: ${f}`).toBe(false);
    }
  });
});

describe("feminine surnames", () => {
  it.each([
    ["Иванов", "Иванова"],
    ["Соловьёв", "Соловьёва"],
    ["Ильин", "Ильина"],
    ["Вишневский", "Вишневская"],
    ["Высоцкий", "Высоцкая"],
    ["Донской", "Донская"],
    ["Шевченко", "Шевченко"],
    ["Черных", "Черных"],
    ["Нурланов", "Нурланова"],
    ["Жумабаев", "Жумабаева"],
    ["Мусин", "Мусина"],
    ["Толеуов", "Толеуова"],
  ])("%s → %s", (m, f) => expect(feminineSurname(m)).toBe(f));
});

describe("patronymics", () => {
  it.each([
    ["Иван", "Иванович", "Ивановна"],
    ["Сергей", "Сергеевич", "Сергеевна"],
    ["Николай", "Николаевич", "Николаевна"],
    ["Юрий", "Юрьевич", "Юрьевна"],
    ["Василий", "Васильевич", "Васильевна"],
    ["Дмитрий", "Дмитриевич", "Дмитриевна"],
    ["Игорь", "Игоревич", "Игоревна"],
    ["Лев", "Львович", "Львовна"],
    ["Павел", "Павлович", "Павловна"],
    ["Пётр", "Петрович", "Петровна"],
    ["Михаил", "Михайлович", "Михайловна"],
    ["Илья", "Ильич", "Ильинична"],
    ["Никита", "Никитич", "Никитична"],
    ["Нурлан", "Нурланович", "Нурлановна"],
    ["Абай", "Абаевич", "Абаевна"],
    ["Куаныш", "Куанышевич", "Куанышевна"],
  ])("%s → %s / %s", (father, m, f) => {
    expect(ruPatronymic(father, "male")).toBe(m);
    expect(ruPatronymic(father, "female")).toBe(f);
  });

  it("every Russian and Kazakh male name yields a patronymic ending in -ич / -на", () => {
    for (const n of [...NAME_LISTS.ru.male, ...NAME_LISTS.kk.male]) {
      expect(ruPatronymic(n, "male")).toMatch(/(ович|евич|ьич|ич)$/);
      expect(ruPatronymic(n, "female")).toMatch(/(овна|евна|ична|инична)$/);
    }
  });

  it("Kazakh -ұлы / -қызы", () => {
    expect(kkPatronymic("Нурлан", "male")).toBe("Нурланұлы");
    expect(kkPatronymic("Нурлан", "female")).toBe("Нурланқызы");
  });
});

describe("random names", () => {
  it("female full names use the feminine surname form", () => {
    for (let i = 0; i < 200; i++) {
      const p = randomName("ru", "female", "full");
      expect(NAME_LISTS.ru.female as readonly string[]).toContain(p.first);
      const base = (NAME_LISTS.ru.surnames as readonly string[]).find((s) => feminineSurname(s) === p.last);
      expect(base).toBeDefined();
    }
  });

  it("ФИО is surname, given name, patronymic", () => {
    const p = randomName("ru", "male", "fio");
    expect(formatName(p).split(" ")).toHaveLength(3);
    expect(formatName(p).startsWith(p.last!)).toBe(true);
    const k = randomName("kk", "female", "fio", "uly");
    expect(k.patronymic).toMatch(/қызы$/);
  });

  it("English names never get a patronymic", () => {
    expect(randomName("en", "male", "fio").patronymic).toBeUndefined();
  });
});

describe("Latin transliteration", () => {
  it.each([
    ["Бауыржан", "Bauyrzhan"],
    ["Дмитрий", "Dmitry"],
    ["Сергей", "Sergey"],
    ["Юлия", "Yulia"],
    ["Пётр", "Pyotr"],
    ["Айгерим", "Aigerim"],
    ["Нурланұлы", "Nurlanuly"],
    ["Щербаков Фёдор", "Shcherbakov Fyodor"],
  ])("%s → %s", (c, l) => expect(toLatin(c)).toBe(l));
});
