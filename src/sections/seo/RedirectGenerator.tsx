"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { htaccess, nextjs, nginx, parsePairs, redirectIssues, type Code, type Server } from "./lib/redirects";
import { Issues, Output } from "./ui";

const SAMPLE = `/old-page /new-page
/blog/2019/post.html /blog/post
/catalog.php?id=15 /catalog/laptops/`;

const T = {
  ru: {
    input: "Старый и новый адрес через пробел — по паре на строку",
    hint: "Можно вставить полные ссылки; стрелки → и => тоже подходят",
    server: "Сервер",
    code: "Код",
    codes: { 301: "301 — навсегда", 302: "302 — временно", 308: "308 — навсегда", 307: "307 — временно" } as Record<Code, string>,
    bad: (n: number) => `Строка ${n}: нужно ровно два адреса`,
    issue: { chain: "цепочка редиректов — ведите сразу на конечный адрес", loop: "петля: адреса перенаправляют друг на друга", duplicate: "этот адрес уже перенаправляется выше", self: "адрес перенаправляет сам на себя" },
    line: (n: number) => `Строка ${n}: `,
    file: { htaccess: ".htaccess (Apache)", nginx: "nginx.conf", nextjs: "next.config.js" } as Record<Server, string>,
    where: {
      htaccess: "Вставьте правила в .htaccess в корне сайта, выше правил CMS. Нужен модуль mod_rewrite.",
      nginx: "Блок map — в секцию http, условие if — в секцию server нужного сайта. После правки: nginx -t и перезагрузка.",
      nextjs: "Добавьте массив в next.config.js. Next.js выполняет эти редиректы до обработки страниц.",
    } as Record<Server, string>,
  },
  en: {
    input: "Old and new URL separated by a space — one pair per line",
    hint: "Full URLs work too; arrows → and => are accepted",
    server: "Server",
    code: "Status",
    codes: { 301: "301 — permanent", 302: "302 — temporary", 308: "308 — permanent", 307: "307 — temporary" } as Record<Code, string>,
    bad: (n: number) => `Line ${n}: expected exactly two URLs`,
    issue: { chain: "redirect chain — point straight to the final URL", loop: "loop: URLs redirect to each other", duplicate: "this URL is already redirected above", self: "the URL redirects to itself" },
    line: (n: number) => `Line ${n}: `,
    file: { htaccess: ".htaccess (Apache)", nginx: "nginx.conf", nextjs: "next.config.js" } as Record<Server, string>,
    where: {
      htaccess: "Put the rules in the .htaccess at the site root, above your CMS rules. Requires mod_rewrite.",
      nginx: "The map block goes in the http context, the if block in the site's server block. Then run nginx -t and reload.",
      nextjs: "Add the array to next.config.js. Next.js runs these redirects before rendering pages.",
    } as Record<Server, string>,
  },
} as const;

export default function RedirectGenerator({ locale, server: initial = "htaccess" }: { locale: Locale; server?: Server }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(SAMPLE);
  const [server, setServer] = useState<Server>(initial);
  const [code, setCode] = useState<Code>(301);

  const { pairs, bad } = parsePairs(text);
  const out = pairs.length ? (server === "htaccess" ? htaccess(pairs, code) : server === "nginx" ? nginx(pairs, code) : nextjs(pairs, code)) : "";
  const problems = [...bad.map(t.bad), ...redirectIssues(pairs).map((i) => t.line(i.line) + t.issue[i.kind])];

  return (
    <div className="flex flex-col gap-5">
      <Field label={t.input} htmlFor={`${id}-i`} hint={t.hint}>
        <Textarea id={`${id}-i`} value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-mono text-sm" spellCheck={false} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<Server>
          label={t.server}
          value={server}
          onChange={setServer}
          options={[
            { value: "htaccess", label: ".htaccess" },
            { value: "nginx", label: "nginx" },
            { value: "nextjs", label: "Next.js" },
          ]}
        />
        <Segmented<"301" | "302" | "308" | "307">
          label={t.code}
          value={String(code) as "301"}
          onChange={(v) => setCode(Number(v) as Code)}
          options={([301, 302, 308, 307] as const).map((c) => ({ value: String(c) as "301", label: String(c), title: t.codes[c] }))}
        />
      </div>
      <div aria-live="polite">
        <Issues items={problems} />
      </div>
      <Output locale={locale} value={out} title={t.file[server]} rows={12} />
      <p className="text-sm text-fg-3">{t.where[server]}</p>
    </div>
  );
}
