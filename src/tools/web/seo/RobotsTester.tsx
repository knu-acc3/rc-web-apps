"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { isAllowed, parseRobots } from "./lib/robots";
import { lintText } from "./content/robots-text";
import { Issues } from "./ui/kit";

const AGENTS = ["Googlebot", "Googlebot-Image", "Googlebot-News", "Bingbot", "YandexBot", "YandexImages", "GPTBot", "ClaudeBot", "*"];

const SAMPLE = `User-agent: *
Disallow: /admin/
Disallow: /*?sort=
Allow: /admin/public/

User-agent: Googlebot
Disallow: /tmp/

Sitemap: https://example.com/sitemap.xml
`;

const T = {
  ru: {
    robots: "Содержимое robots.txt",
    url: "Адрес или путь для проверки",
    agent: "Робот",
    other: "Другой…",
    custom: "Имя робота",
    allowed: "Разрешено",
    blocked: "Запрещено",
    byRule: (line: number, rule: string) => `Решает правило в строке ${line}: ${rule}`,
    noRule: "Ни одно правило не подходит — по умолчанию обход разрешён",
    group: (a: string) => (a === "*" ? "Действует группа User-agent: *" : `Действует группа User-agent: ${a}`),
    noGroup: "Для этого робота нет группы и нет группы * — всё разрешено",
    robotsTxt: "Сам robots.txt всегда доступен роботам",
    lint: "Замечания к файлу",
    how: "Google выбирает самое длинное совпавшее правило; при равной длине побеждает Allow.",
  },
  en: {
    robots: "robots.txt contents",
    url: "URL or path to test",
    agent: "Crawler",
    other: "Other…",
    custom: "Crawler name",
    allowed: "Allowed",
    blocked: "Blocked",
    byRule: (line: number, rule: string) => `Decided by line ${line}: ${rule}`,
    noRule: "No rule matches — crawling is allowed by default",
    group: (a: string) => (a === "*" ? "Group used: User-agent: *" : `Group used: User-agent: ${a}`),
    noGroup: "No group for this crawler and no * group — everything is allowed",
    robotsTxt: "robots.txt itself is always accessible to crawlers",
    lint: "Notes on the file",
    how: "Google picks the longest matching rule; on a tie, Allow wins.",
  },
} as const;

export default function RobotsTester({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(SAMPLE);
  const [url, setUrl] = useState("https://example.com/admin/users?sort=name");
  const [agent, setAgent] = useState("Googlebot");
  const [custom, setCustom] = useState("");

  const robots = parseRobots(text);
  const ua = agent === "other" ? custom.trim() || "*" : agent;
  const v = isAllowed(robots, ua, url);
  const lines = text.split(/\r\n|\r|\n/);
  const isRobots = /\/robots\.txt$/.test(url.trim().split("?")[0]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12.5rem]">
        <Field label={t.url} htmlFor={`${id}-u`}>
          <Input id={`${id}-u`} value={url} onChange={(e) => setUrl(e.target.value)} size="lg" className="font-mono" inputMode="url" spellCheck={false} autoComplete="off" />
        </Field>
        <Field label={t.agent} htmlFor={`${id}-a`}>
          <Select id={`${id}-a`} value={agent} onChange={(e) => setAgent(e.target.value)} size="lg">
            {AGENTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value="other">{t.other}</option>
          </Select>
        </Field>
      </div>
      {agent === "other" && (
        <Field label={t.custom} htmlFor={`${id}-c`}>
          <Input id={`${id}-c`} value={custom} onChange={(e) => setCustom(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" placeholder="MyCrawler" />
        </Field>
      )}

      <div aria-live="polite" className={cn("rounded-[0.75rem] px-4 py-4 sm:px-5", v.allowed ? "bg-ok-soft" : "bg-err-soft")}>
        <div className={cn("flex items-center gap-2 text-2xl font-semibold", v.allowed ? "text-ok" : "text-err")}>
          {v.allowed ? <CircleCheck className="size-7" aria-hidden /> : <CircleX className="size-7" aria-hidden />}
          {v.allowed ? t.allowed : t.blocked}
        </div>
        <div className="mt-2 flex flex-col gap-0.5 text-[0.9375rem] text-fg-2">
          {isRobots ? (
            <span>{t.robotsTxt}</span>
          ) : (
            <>
              <span>{v.agent ? t.group(v.agent) : t.noGroup}</span>
              <span className="font-mono text-sm break-all">{v.rule ? t.byRule(v.rule.line, lines[v.rule.line - 1]?.trim() ?? "") : t.noRule}</span>
            </>
          )}
        </div>
      </div>

      <Field label={t.robots} htmlFor={`${id}-r`} hint={t.how}>
        <Textarea id={`${id}-r`} value={text} onChange={(e) => setText(e.target.value)} rows={12} className="font-mono text-sm" spellCheck={false} />
      </Field>

      {robots.lint.length > 0 && <Issues items={robots.lint.map((l) => lintText(locale, l))} />}
    </div>
  );
}
