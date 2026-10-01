import { describe, expect, it } from "vitest";
import { encode } from "uqr";
import {
  accountKeyOk,
  appStorePayload,
  epcErrors,
  epcPayload,
  escapeMeta,
  eventPayload,
  foldLine,
  geoPayload,
  gostErrors,
  gostPayload,
  kopecks,
  mailtoPayload,
  mecardPayload,
  parsePayload,
  smsPayload,
  vcardPayload,
  whatsappPayload,
  wifiPayload,
} from "@/sections/qr/lib/payloads";
import { contrastCheck, detectMode, encodeQr, logoBox, modulesPath, moduleScale, qrSvg } from "@/sections/qr/lib/qr";
import { detectDelimiter, parseCsv, uniqueNames } from "@/sections/qr/lib/csv";
import { buildPayload, parseCoords } from "@/sections/qr/lib/build";

describe("Wi-Fi", () => {
  it("escapes \\ ; , : and \"", () => {
    expect(escapeMeta('a\\b;c,d:e"f')).toBe('a\\\\b\\;c\\,d\\:e\\"f');
    expect(wifiPayload({ ssid: 'My;Net,"5G"', password: "p:a\\ss", security: "WPA" })).toBe('WIFI:T:WPA;S:My\\;Net\\,\\"5G\\";P:p\\:a\\\\ss;;');
    expect(wifiPayload({ ssid: "Guest", security: "nopass", hidden: true })).toBe("WIFI:T:nopass;S:Guest;H:true;;");
  });
  it("round-trips through the parser", () => {
    const p = parsePayload(wifiPayload({ ssid: "Кафе;1", password: "a,b", security: "WPA" }));
    expect(p.kind).toBe("wifi");
    expect(p.fields).toContainEqual(["S", "Кафе;1"]);
    expect(p.fields).toContainEqual(["P", "a,b"]);
  });
});

describe("vCard 3.0 and MECARD", () => {
  it("builds vCard with CRLF and escaping", () => {
    const v = vcardPayload({ firstName: "Иван", lastName: "Петров", org: "ТОО «Ромашка», Алматы", phone: "+7 701 234 56 78", email: "ivan@example.kz", note: "Line1\nLine2; ok" });
    expect(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\nN:Петров;Иван;;;\r\nFN:Иван Петров\r\n")).toBe(true);
    expect(v).toContain("ORG:ТОО «Ромашка»\\, Алматы");
    expect(v).toContain("TEL;TYPE=CELL:+7 701 234 56 78");
    expect(v).toContain("NOTE:Line1\\nLine2\\; ok");
    expect(v.endsWith("END:VCARD")).toBe(true);
    expect(v.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
  it("folds long lines without breaking UTF-8", () => {
    const long = `NOTE:${"Щ".repeat(60)}`;
    const folded = foldLine(long);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
    for (const l of folded.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });
  it("builds MECARD", () => {
    expect(mecardPayload({ firstName: "Ivan", lastName: "Petrov", phone: "+77012345678", email: "i@x.kz" })).toBe("MECARD:N:Petrov,Ivan;TEL:+77012345678;EMAIL:i@x.kz;;");
    expect(mecardPayload({ firstName: "A:B" })).toBe("MECARD:N:A\\:B;;");
  });
});

describe("messages, links, geo, events", () => {
  it("mailto, SMS, WhatsApp, app stores", () => {
    expect(mailtoPayload({ to: "a@b.kz", subject: "Привет", body: "Как дела?" })).toBe("mailto:a@b.kz?subject=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82&body=%D0%9A%D0%B0%D0%BA%20%D0%B4%D0%B5%D0%BB%D0%B0%3F");
    expect(smsPayload({ phone: "+7 (701) 234-56-78", message: "Hi" })).toBe("SMSTO:+77012345678:Hi");
    expect(smsPayload({ phone: "+77012345678", message: "Hi there", format: "uri" })).toBe("sms:+77012345678?body=Hi%20there");
    expect(whatsappPayload({ phone: "+7 701 234 56 78", message: "Здравствуйте" })).toBe("https://wa.me/77012345678?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5");
    expect(appStorePayload({ store: "apple", id: "id284882215" })).toBe("https://apps.apple.com/app/id284882215");
    expect(appStorePayload({ store: "google", id: "com.whatsapp" })).toBe("https://play.google.com/store/apps/details?id=com.whatsapp");
  });
  it("geo and iCalendar", () => {
    expect(geoPayload(43.238949, 76.889709)).toBe("geo:43.238949,76.889709");
    const e = eventPayload({ title: "Встреча, офис; 3 этаж", start: "2026-10-15T19:00", end: "2026-10-15T20:30", location: "Алматы" });
    expect(e).toBe("BEGIN:VEVENT\r\nSUMMARY:Встреча\\, офис\\; 3 этаж\r\nDTSTART:20261015T190000\r\nDTEND:20261015T203000\r\nLOCATION:Алматы\r\nEND:VEVENT");
    expect(eventPayload({ title: "Отпуск", start: "2026-07-01", end: "2026-07-15", allDay: true })).toContain("DTSTART;VALUE=DATE:20260701");
  });
});

describe("payments", () => {
  it("ГОСТ Р 56042-2014 ST00012", () => {
    const p = { Name: "ООО «Ромашка»", PersonalAcc: "40702810000000000001", BankName: "ПАО СБЕРБАНК", BIC: "044525225", CorrespAcc: "30101810400000000225", PayeeINN: "7707083893", sum: "1500,50", Purpose: "Оплата по счёту №15" };
    expect(gostPayload(p)).toBe("ST00012|Name=ООО «Ромашка»|PersonalAcc=40702810000000000001|BankName=ПАО СБЕРБАНК|BIC=044525225|CorrespAcc=30101810400000000225|PayeeINN=7707083893|Sum=150050|Purpose=Оплата по счёту №15");
    expect(gostErrors(p)).toEqual([]);
    expect(gostErrors({ ...p, Purpose: "a|b" })).toContain("pipe");
    expect(gostErrors({ ...p, BIC: "12345" })).toContain("BIC");
    expect(kopecks("10")).toBe(1000);
    expect(kopecks("0.5")).toBe(50);
    expect(kopecks("1,234.5")).toBeNull();
  });
  it("account control key (Sberbank correspondent account 30101810400000000225 / BIC 044525225)", () => {
    expect(accountKeyOk("044525225", "30101810400000000225", true)).toBe(true);
    expect(accountKeyOk("044525225", "30101810500000000225", true)).toBe(false);
  });
  it("EPC SEPA credit transfer", () => {
    const p = { name: "Red Cross", iban: "DE89 3704 0044 0532 0130 00", bic: "COBADEFFXXX", amount: "12.3", text: "Donation" };
    expect(epcPayload(p)).toBe("BCD\n002\n1\nSCT\nCOBADEFFXXX\nRed Cross\nDE89370400440532013000\nEUR12.30\n\n\nDonation");
    expect(epcErrors(p)).toEqual([]);
    expect(epcErrors({ ...p, reference: "RF18539007547034" })).toContain("both");
    expect(epcErrors({ ...p, amount: "0" })).toContain("amount");
  });
});

describe("parsing scanned payloads", () => {
  it.each([
    ["https://example.kz/path", "url"],
    ["BEGIN:VCARD\r\nVERSION:3.0\r\nFN:A\r\nEND:VCARD", "vcard"],
    ["MECARD:N:A;;", "mecard"],
    ["mailto:a@b.kz", "email"],
    ["SMSTO:+7701:hi", "sms"],
    ["tel:+77012345678", "tel"],
    ["geo:43.2,76.9", "geo"],
    ["ST00012|Name=A|PersonalAcc=1", "gost"],
    ["BCD\n002\n1\nSCT\n\nName\nDE89370400440532013000", "epc"],
    ["just text", "text"],
  ])("%s → %s", (t, kind) => {
    expect(parsePayload(t).kind).toBe(kind);
  });
});

describe("uqr capacity", () => {
  it("encodes 3000 characters beyond version 10 without truncation", () => {
    const text = "HELLO WORLD 123 ".repeat(200).slice(0, 3000);
    const qr = encode(text, { ecc: "L", border: 0 });
    expect(qr.version).toBeGreaterThan(10);
    expect(qr.size).toBe(qr.version * 4 + 17);
  });
  it("encodes long UTF-8 (Cyrillic) text in byte mode", () => {
    const text = "Съешь же ещё этих мягких французских булок. ".repeat(40).slice(0, 1400);
    expect(new TextEncoder().encode(text).length).toBeGreaterThan(2000);
    const qr = encode(text, { ecc: "L", border: 0 });
    expect(qr.version).toBeGreaterThan(30);
  });
  it("throws instead of truncating when the data doesn't fit", () => {
    expect(() => encode("x".repeat(4000), { ecc: "H", border: 0 })).toThrow();
    expect(encodeQr(encode, "x".repeat(4000), "H")).toBeNull();
  });
});

describe("form payload assembly", () => {
  it("parses coordinates in several notations", () => {
    expect(parseCoords("43.238949, 76.889709")).toEqual([43.238949, 76.889709]);
    expect(parseCoords("43,238949; 76,889709")).toEqual([43.238949, 76.889709]);
    expect(parseCoords("https://www.google.com/maps/@43.2389,76.8897,15z")).toEqual([43.2389, 76.8897]);
    const dms = parseCoords(`43°14'20.2"N 76°53'22.9"E`)!;
    expect(dms[0]).toBeCloseTo(43.23894, 4);
    expect(dms[1]).toBeCloseTo(76.88969, 4);
    expect(parseCoords(`33°52'S 151°12'E`)![0]).toBeCloseTo(-33.8667, 3);
    expect(parseCoords("95, 10")).toBeNull();
  });
  it("builds links for each type", () => {
    expect(buildPayload("url", { url: "example.kz/a" }, "ru")).toMatchObject({ payload: "https://example.kz/a", issues: [{ level: "warn" }] });
    expect(buildPayload("geo", { coords: "43.2389, 76.8897", format: "yandex" }, "en").payload).toBe("https://yandex.ru/maps/?pt=76.8897,43.2389&z=16&l=map");
    expect(buildPayload("app", { store: "apple", id: "https://apps.apple.com/kz/app/kaspi-kz/id1195076505" }, "en").payload).toBe("https://apps.apple.com/app/id1195076505");
    expect(buildPayload("app", { store: "google", id: "https://play.google.com/store/apps/details?id=kz.kaspi.mobile&hl=ru" }, "en").payload).toBe("https://play.google.com/store/apps/details?id=kz.kaspi.mobile");
    expect(buildPayload("telegram", { username: "@durov" }, "en").payload).toBe("https://t.me/durov");
    expect(buildPayload("telegram", { username: "ab" }, "en").issues[0].level).toBe("error");
    expect(buildPayload("whatsapp", { phone: "87012345678" }, "ru").issues.map((i) => i.level)).toEqual(["warn"]);
    expect(buildPayload("wifi", { ssid: "Home", password: "short", security: "WPA" }, "en").issues.map((i) => i.level)).toEqual(["warn"]);
    expect(buildPayload("text", {}, "en").payload).toBeNull();
  });
});

describe("rendering helpers and CSV", () => {
  it("detects the densest mode", () => {
    expect(detectMode("0123456789")).toBe("numeric");
    expect(detectMode("HTTPS://EXAMPLE.KZ/A")).toBe("alphanumeric");
    expect(detectMode("https://example.kz")).toBe("byte");
  });
  it("builds SVG with a 4-module quiet zone and crisp edges", () => {
    const m = encodeQr(encode, "hello", "M")!;
    expect(m.size).toBe(21);
    const svg = qrSvg(m, { fg: "#000000", bg: "#ffffff" });
    expect(svg).toContain('viewBox="0 0 29 29"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(modulesPath(m).startsWith("M4 4h7")).toBe(true); // finder pattern top row
  });
  it("keeps whole-pixel modules and a centered logo ≤ 20%", () => {
    expect(moduleScale(25, 512)).toBe(15);
    expect(moduleScale(177, 100)).toBe(1);
    const b = logoBox(25);
    expect(b.side).toBeLessThanOrEqual(Math.ceil(25 * 0.2) + 1);
    expect(b.x * 2 + b.side).toBe(25 + 8);
  });
  it("requires dark modules on a light background", () => {
    expect(contrastCheck("#000", "#fff").issue).toBeNull();
    expect(contrastCheck("#ffffff", "#000000").issue).toBe("inverted");
    expect(contrastCheck("#999999", "#ffffff").issue).toBe("low");
    expect(contrastCheck("red", "#fff").issue).toBe("invalid");
  });
  it("parses CSV with quotes, BOM and ; delimiter", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(parseCsv('﻿name;url\n"A; B";"https://x.kz/?a=1,2"\n\n"say ""hi""";x\r\n')).toEqual([
      ["name", "url"],
      ["A; B", "https://x.kz/?a=1,2"],
      ['say "hi"', "x"],
    ]);
    expect(uniqueNames(["a", "A", "a", "a-2"])).toEqual(["a", "A-2", "a-3", "a-2-2"]);
  });
});
