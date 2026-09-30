import assert from "node:assert/strict";
import { it } from "vitest";

import {
  defaultNameLocale,
  generateUniqueNames,
  type RandomIndex,
} from "../../src/tools/generators/randomNameGenerator";

const chooseFirst: RandomIndex = () => 0;

it("Russian female names use feminine surnames", () => {
  const results = generateUniqueNames(
    { locale: "ru", gender: "female", includeSurname: true, count: 20 },
    chooseFirst,
  );

  assert.equal(results.length, 20);
  assert.ok(results.every((result) => result.gender === "female"));
  assert.ok(
    results.every((result) => {
      const surname = result.name.split(" ").at(-1) ?? "";
      return surname.endsWith("а");
    }),
  );
});

it("generation samples without replacement", () => {
  const results = generateUniqueNames(
    { locale: "en", gender: "male", includeSurname: false, count: 20 },
    chooseFirst,
  );

  assert.equal(new Set(results.map((result) => result.name)).size, 20);
});

it("mixed batches stay balanced even with a degenerate random source", () => {
  const results = generateUniqueNames(
    { locale: "en", gender: "any", includeSurname: false, count: 20 },
    chooseFirst,
  );
  const female = results.filter((result) => result.gender === "female").length;
  const male = results.length - female;

  assert.ok(Math.abs(female - male) <= 1);
});

for (const locale of ["en", "ru", "es"] as const) {
  it(`${locale} batch uses every surname family at most once`, () => {
    const results = generateUniqueNames(
      { locale, gender: "female", includeSurname: true, count: 20 },
      chooseFirst,
    );
    const surnames = results.map((result) => result.name.split(" ").at(-1));

    assert.equal(new Set(surnames).size, 20);
  });
}

it("injected random source makes output deterministic", () => {
  const sequence = [2, 1, 0, 3];
  const makeRandomIndex = (): RandomIndex => {
    let cursor = 0;
    return (length) => sequence[cursor++ % sequence.length] % length;
  };
  const options = {
    locale: "es" as const,
    gender: "any" as const,
    includeSurname: true,
    count: 12,
  };

  assert.deepEqual(
    generateUniqueNames(options, makeRandomIndex()),
    generateUniqueNames(options, makeRandomIndex()),
  );
});

it("name style follows the interface locale by default", () => {
  assert.equal(defaultNameLocale("ru"), "ru");
  assert.equal(defaultNameLocale("en"), "en");
  assert.equal(defaultNameLocale("unknown"), "en");
});

it("invalid random sources are rejected", () => {
  assert.throws(
    () =>
      generateUniqueNames(
        { locale: "en", gender: "female", includeSurname: false, count: 1 },
        (length) => length,
      ),
    /invalid value/,
  );
});

it.each([0, 21, 1.5])("rejects out-of-contract count %s", (count) => {
  assert.throws(
    () =>
      generateUniqueNames(
        { locale: "en", gender: "any", includeSurname: false, count },
        chooseFirst,
      ),
    /1 to 20/,
  );
});
