export type NameLocale = "en" | "ru" | "es";
export type NameGender = "any" | "female" | "male";
export type ResolvedGender = Exclude<NameGender, "any">;

export interface GeneratedName {
  name: string;
  locale: NameLocale;
  gender: ResolvedGender;
}

interface NamePack {
  female: readonly string[];
  male: readonly string[];
  surnames:
    | readonly string[]
    | Record<ResolvedGender, readonly string[]>;
}

export type RandomIndex = (length: number) => number;

function isGenderedSurnamePack(
  surnames: NamePack["surnames"],
): surnames is Record<ResolvedGender, readonly string[]> {
  return !Array.isArray(surnames);
}

const NAME_PACKS: Record<NameLocale, NamePack> = {
  en: {
    female: [
      "Ava",
      "Clara",
      "Elena",
      "Iris",
      "June",
      "Maya",
      "Nora",
      "Sophie",
      "Alice",
      "Amelia",
      "Chloe",
      "Diana",
      "Evelyn",
      "Grace",
      "Hazel",
      "Lucy",
      "Naomi",
      "Olivia",
      "Ruby",
      "Violet",
    ],
    male: [
      "Adrian",
      "Elliot",
      "Felix",
      "Hugo",
      "Julian",
      "Leo",
      "Milo",
      "Theo",
      "Arthur",
      "Caleb",
      "Daniel",
      "Ethan",
      "Finn",
      "Henry",
      "Isaac",
      "Lucas",
      "Noah",
      "Oscar",
      "Samuel",
      "Victor",
    ],
    surnames: [
      "Bennett",
      "Carter",
      "Ellis",
      "Foster",
      "Hayes",
      "Morgan",
      "Parker",
      "Reed",
      "Adams",
      "Brooks",
      "Clark",
      "Davis",
      "Evans",
      "Gray",
      "Hill",
      "Kelly",
      "Lewis",
      "Morris",
      "Price",
      "Ward",
    ],
  },
  ru: {
    female: [
      "Алина",
      "Вера",
      "Дарья",
      "Ирина",
      "Лидия",
      "Марина",
      "Нина",
      "Софья",
      "Анна",
      "Валерия",
      "Екатерина",
      "Елена",
      "Ксения",
      "Любовь",
      "Надежда",
      "Ольга",
      "Полина",
      "Светлана",
      "Татьяна",
      "Юлия",
    ],
    male: [
      "Антон",
      "Виктор",
      "Денис",
      "Илья",
      "Максим",
      "Никита",
      "Роман",
      "Фёдор",
      "Александр",
      "Алексей",
      "Андрей",
      "Борис",
      "Дмитрий",
      "Евгений",
      "Кирилл",
      "Михаил",
      "Олег",
      "Павел",
      "Сергей",
      "Юрий",
    ],
    surnames: {
      female: [
        "Белова",
        "Волкова",
        "Громова",
        "Ковалёва",
        "Лебедева",
        "Орлова",
        "Соколова",
        "Тихонова",
        "Алексеева",
        "Баранова",
        "Васильева",
        "Виноградова",
        "Зайцева",
        "Козлова",
        "Кузнецова",
        "Морозова",
        "Новикова",
        "Павлова",
        "Смирнова",
        "Фёдорова",
      ],
      male: [
        "Белов",
        "Волков",
        "Громов",
        "Ковалёв",
        "Лебедев",
        "Орлов",
        "Соколов",
        "Тихонов",
        "Алексеев",
        "Баранов",
        "Васильев",
        "Виноградов",
        "Зайцев",
        "Козлов",
        "Кузнецов",
        "Морозов",
        "Новиков",
        "Павлов",
        "Смирнов",
        "Фёдоров",
      ],
    },
  },
  es: {
    female: [
      "Alba",
      "Carmen",
      "Elena",
      "Inés",
      "Lucía",
      "Marta",
      "Noelia",
      "Sofía",
      "Adriana",
      "Alicia",
      "Beatriz",
      "Carla",
      "Daniela",
      "Eva",
      "Isabel",
      "Laura",
      "Marina",
      "Natalia",
      "Paula",
      "Valeria",
    ],
    male: [
      "Álvaro",
      "Diego",
      "Hugo",
      "Javier",
      "Leo",
      "Mateo",
      "Pablo",
      "Sergio",
      "Alejandro",
      "Bruno",
      "Carlos",
      "Daniel",
      "Eduardo",
      "Fernando",
      "Gabriel",
      "Iván",
      "Lucas",
      "Marco",
      "Nicolás",
      "Raúl",
    ],
    surnames: [
      "Castro",
      "Delgado",
      "Iglesias",
      "Molina",
      "Navarro",
      "Ortega",
      "Ramos",
      "Vega",
      "Alonso",
      "Blanco",
      "Cabrera",
      "Cano",
      "Domínguez",
      "Flores",
      "García",
      "Herrera",
      "León",
      "Marín",
      "Romero",
      "Santos",
    ],
  },
};

export function defaultNameLocale(interfaceLocale: string): NameLocale {
  return interfaceLocale === "ru" ? "ru" : "en";
}

export function secureRandomIndex(length: number): number {
  if (!Number.isSafeInteger(length) || length < 1) {
    throw new RangeError("Random selection length must be a positive integer.");
  }

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    return Math.floor(Math.random() * length);
  }

  const range = 0x1_0000_0000;
  const limit = range - (range % length);
  const buffer = new Uint32Array(1);
  do {
    cryptoApi.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % length;
}

function sampleWithoutReplacement<T>(
  source: readonly T[],
  count: number,
  randomIndex: RandomIndex,
): T[] {
  if (count > source.length) {
    throw new RangeError(
      `Requested ${count} values, but only ${source.length} unique values are available.`,
    );
  }

  const values = [...source];
  for (let index = 0; index < count; index += 1) {
    const remaining = values.length - index;
    const offset = randomIndex(remaining);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= remaining) {
      throw new RangeError("Random index source returned an invalid value.");
    }
    const selectedIndex = index + offset;
    [values[index], values[selectedIndex]] = [
      values[selectedIndex],
      values[index],
    ];
  }
  return values.slice(0, count);
}

function buildGenderDeck(
  gender: NameGender,
  count: number,
  randomIndex: RandomIndex,
): ResolvedGender[] {
  if (gender !== "any") return Array.from({ length: count }, () => gender);

  const smallerQuota = Math.floor(count / 2);
  const extraGender: ResolvedGender =
    count % 2 === 0
      ? "female"
      : randomIndex(2) === 0
        ? "female"
        : "male";
  const femaleCount = smallerQuota + (count % 2 === 1 && extraGender === "female" ? 1 : 0);
  const maleCount = count - femaleCount;
  const deck: ResolvedGender[] = [
    ...Array.from({ length: femaleCount }, () => "female" as const),
    ...Array.from({ length: maleCount }, () => "male" as const),
  ];
  return sampleWithoutReplacement(deck, deck.length, randomIndex);
}

export function generateUniqueNames(
  options: {
    locale: NameLocale;
    gender: NameGender;
    includeSurname: boolean;
    count: number;
  },
  randomIndex: RandomIndex = secureRandomIndex,
): GeneratedName[] {
  if (
    !Number.isSafeInteger(options.count) ||
    options.count < 1 ||
    options.count > 20
  ) {
    throw new RangeError("Name count must be an integer from 1 to 20.");
  }

  const pack = NAME_PACKS[options.locale];
  const genders = buildGenderDeck(options.gender, options.count, randomIndex);
  const genderCounts = {
    female: genders.filter((gender) => gender === "female").length,
    male: genders.filter((gender) => gender === "male").length,
  };
  const firstNameDecks: Record<ResolvedGender, string[]> = {
    female: sampleWithoutReplacement(
      pack.female,
      genderCounts.female,
      randomIndex,
    ),
    male: sampleWithoutReplacement(pack.male, genderCounts.male, randomIndex),
  };
  const surnames = pack.surnames;
  const surnameFamilies: readonly Record<ResolvedGender, string>[] =
    isGenderedSurnamePack(surnames)
      ? (() => {
          if (surnames.male.length !== surnames.female.length) {
            throw new Error(
              "Gendered surname packs must contain matching families.",
            );
          }
          return surnames.female.map((female, index) => ({
            female,
            male: surnames.male[index],
          }));
        })()
      : surnames.map((surname) => ({
          female: surname,
          male: surname,
        }));
  const surnameFamilyDeck = options.includeSurname
    ? sampleWithoutReplacement(
        surnameFamilies,
        options.count,
        randomIndex,
      )
    : [];
  const nextFirstName = { female: 0, male: 0 };

  return genders.map((resolvedGender, index) => {
    const firstName =
      firstNameDecks[resolvedGender][nextFirstName[resolvedGender]++];
    if (!options.includeSurname) {
      return { name: firstName, locale: options.locale, gender: resolvedGender };
    }

    const surname = surnameFamilyDeck[index][resolvedGender];
    return {
      name: `${firstName} ${surname}`,
      locale: options.locale,
      gender: resolvedGender,
    };
  });
}
