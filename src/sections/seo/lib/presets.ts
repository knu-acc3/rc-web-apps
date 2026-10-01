/* robots.txt presets. Rules only; the Sitemap line and AI-crawler groups are added by the generator. */

export type Preset = "basic" | "wordpress" | "bitrix" | "opencart" | "joomla" | "modx" | "disallowAll";

const PRESETS: Record<Preset, string[]> = {
  basic: ["User-agent: *", "Disallow:"],
  wordpress: ["User-agent: *", "Disallow: /wp-admin/", "Allow: /wp-admin/admin-ajax.php", "Disallow: /wp-login.php", "Disallow: /?s=", "Disallow: /search/", "Disallow: /*?replytocom=", "Disallow: /trackback/"],
  bitrix: [
    "User-agent: *",
    "Disallow: /bitrix/",
    "Disallow: /cgi-bin/",
    "Disallow: /personal/",
    "Disallow: /auth/",
    "Disallow: /search/",
    "Disallow: /*?print=",
    "Disallow: /*&print=",
    "Disallow: /*register=",
    "Disallow: /*forgot_password=",
    "Disallow: /*change_password=",
    "Disallow: /*login=",
    "Disallow: /*logout=",
    "Disallow: /*backurl=",
    "Disallow: /*back_url=",
    "Disallow: /*BACKURL=",
    "Disallow: /*BACK_URL=",
    "Disallow: /*action=ADD2BASKET",
    "Disallow: /*action=BUY",
    "Disallow: /*ADD_TO_COMPARE_LIST",
    "Disallow: /*DELETE_FROM_COMPARE_LIST",
    "Allow: /bitrix/components/",
    "Allow: /bitrix/cache/",
    "Allow: /bitrix/js/",
    "Allow: /bitrix/templates/",
    "Allow: /bitrix/panel/",
    "Allow: /upload/",
  ],
  opencart: [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /system",
    "Disallow: /*route=account/",
    "Disallow: /*route=affiliate/",
    "Disallow: /*route=checkout/",
    "Disallow: /*route=product/search",
    "Disallow: /*?sort=",
    "Disallow: /*&sort=",
    "Disallow: /*?order=",
    "Disallow: /*&order=",
    "Disallow: /*?limit=",
    "Disallow: /*&limit=",
    "Disallow: /*?filter_name=",
    "Disallow: /*&filter_name=",
    "Disallow: /*?tracking=",
    "Disallow: /*&tracking=",
  ],
  joomla: [
    "User-agent: *",
    "Disallow: /administrator/",
    "Disallow: /api/",
    "Disallow: /bin/",
    "Disallow: /cache/",
    "Disallow: /cli/",
    "Disallow: /components/",
    "Disallow: /includes/",
    "Disallow: /installation/",
    "Disallow: /language/",
    "Disallow: /layouts/",
    "Disallow: /libraries/",
    "Disallow: /logs/",
    "Disallow: /modules/",
    "Disallow: /plugins/",
    "Disallow: /tmp/",
  ],
  modx: ["User-agent: *", "Disallow: /manager/", "Disallow: /core/", "Disallow: /connectors/", "Disallow: /assets/components/", "Disallow: /index.php", "Disallow: /*?"],
  disallowAll: ["User-agent: *", "Disallow: /"],
};

/** Crawlers that collect data for AI models or AI answers, with the company behind each. */
export const AI_BOTS: [string, string][] = [
  ["GPTBot", "OpenAI"],
  ["ChatGPT-User", "OpenAI"],
  ["OAI-SearchBot", "OpenAI"],
  ["ClaudeBot", "Anthropic"],
  ["anthropic-ai", "Anthropic"],
  ["Google-Extended", "Google"],
  ["Applebot-Extended", "Apple"],
  ["PerplexityBot", "Perplexity"],
  ["CCBot", "Common Crawl"],
  ["Bytespider", "ByteDance"],
  ["Meta-ExternalAgent", "Meta"],
];

interface RobotsOptions {
  preset: Preset;
  sitemap: string;
  blockAi: boolean;
  extra: string;
}

export function buildRobots(o: RobotsOptions): string {
  const lines = [...PRESETS[o.preset]];
  const extra = o.extra
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => (/^(allow|disallow)\s*:/i.test(p) ? p.replace(/^(\w+)\s*:\s*/, (_, k: string) => `${k[0].toUpperCase()}${k.slice(1).toLowerCase()}: `) : `Disallow: ${p.startsWith("/") || p.startsWith("*") ? p : `/${p}`}`));
  if (extra.length) {
    // An explicit empty Disallow allows everything; drop it when rules are added.
    const i = lines.indexOf("Disallow:");
    if (i >= 0) lines.splice(i, 1);
    if (o.preset !== "disallowAll") lines.push(...extra);
  }
  if (o.blockAi && o.preset !== "disallowAll") {
    lines.push("");
    for (const [bot] of AI_BOTS) lines.push(`User-agent: ${bot}`);
    lines.push("Disallow: /");
  }
  if (o.sitemap.trim()) lines.push("", `Sitemap: ${o.sitemap.trim()}`);
  return `${lines.join("\n")}\n`;
}
