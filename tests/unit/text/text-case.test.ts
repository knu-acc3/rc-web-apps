import { describe, expect, it } from "vitest";
import { convertCase, splitWords, toSentenceCase, toTitleCase } from "@/tools/text/text/lib/case";

describe("case: word splitting", () => {
  it("splits camelCase humps and acronyms", () => {
    expect(splitWords("XMLHttpRequest")).toEqual(["XML", "Http", "Request"]);
    expect(splitWords("getHTTPResponseCode")).toEqual(["get", "HTTP", "Response", "Code"]);
    expect(splitWords("version2Update")).toEqual(["version2", "Update"]);
  });
  it("splits on any delimiter", () => {
    expect(splitWords("hello,_world")).toEqual(["hello", "world"]);
    expect(splitWords("  foo--bar__baz.qux  ")).toEqual(["foo", "bar", "baz", "qux"]);
    expect(splitWords("don't stop")).toEqual(["dont", "stop"]);
  });
  it("handles Cyrillic and Kazakh", () => {
    expect(splitWords("приветМир")).toEqual(["привет", "Мир"]);
    expect(splitWords("Қазақ тілі")).toEqual(["Қазақ", "тілі"]);
  });
});

describe("case: conversions", () => {
  const s = "XMLHttpRequest hello,_world";
  it("programmer cases", () => {
    expect(convertCase(s, "camel")).toBe("xmlHttpRequestHelloWorld");
    expect(convertCase(s, "pascal")).toBe("XmlHttpRequestHelloWorld");
    expect(convertCase(s, "snake")).toBe("xml_http_request_hello_world");
    expect(convertCase(s, "kebab")).toBe("xml-http-request-hello-world");
    expect(convertCase(s, "constant")).toBe("XML_HTTP_REQUEST_HELLO_WORLD");
    expect(convertCase(s, "dot")).toBe("xml.http.request.hello.world");
    expect(convertCase("привет мир", "camel")).toBe("приветМир");
    expect(convertCase("Привет, Мир!", "snake")).toBe("привет_мир");
  });
  it("programmer cases convert each line separately", () => {
    expect(convertCase("first name\nlast name", "snake")).toBe("first_name\nlast_name");
  });
  it("upper / lower / inverse / alternating", () => {
    expect(convertCase("Привет, World", "upper")).toBe("ПРИВЕТ, WORLD");
    expect(convertCase("Привет, World", "lower")).toBe("привет, world");
    expect(convertCase("Привет, World", "inverse")).toBe("пРИВЕТ, wORLD");
    expect(convertCase("hello world", "alternating")).toBe("hElLo WoRlD");
    expect(convertCase("ёлка", "upper")).toBe("ЁЛКА");
  });
  it("title case keeps acronyms and apostrophes", () => {
    expect(toTitleCase("nasa launches a new rocket")).toBe("Nasa Launches A New Rocket");
    expect(toTitleCase("NASA launches a new rocket")).toBe("NASA Launches A New Rocket");
    expect(toTitleCase("the lord of the rings", { smallWords: true })).toBe("The Lord of the Rings");
    expect(toTitleCase("don't stop", {})).toBe("Don't Stop");
    expect(toTitleCase("новости США и мира")).toBe("Новости США И Мира");
    expect(toTitleCase("well-known fact")).toBe("Well-Known Fact");
  });
  it("title case of all-caps text does not keep everything", () => {
    expect(toTitleCase("HELLO WORLD FROM KAZAKHSTAN")).toBe("Hello World From Kazakhstan");
  });
  it("sentence case", () => {
    expect(toSentenceCase("привет. КАК ДЕЛА? хорошо!")).toBe("Привет. Как дела? Хорошо!");
    expect(toSentenceCase("i think NASA is great. i'm sure")).toBe("I think NASA is great. I'm sure");
    expect(toSentenceCase("«кавычки» в начале")).toBe("«Кавычки» в начале");
    expect(toSentenceCase("первая строка\nвторая строка")).toBe("Первая строка\nВторая строка");
  });
});
