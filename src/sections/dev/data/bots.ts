/** Crawler / automation detection by User-Agent string (UA strings can be spoofed). */

export type BotKind = "search" | "social" | "seo" | "ai" | "headless" | "http" | "monitor";

interface BotRule {
  name: string;
  re: RegExp;
  kind: BotKind;
}

const RULES: BotRule[] = [
  { name: "Googlebot", re: /Googlebot(?:-Image|-Video|-News)?\//i, kind: "search" },
  { name: "Google-InspectionTool", re: /Google-InspectionTool/i, kind: "search" },
  { name: "AdsBot-Google", re: /AdsBot-Google/i, kind: "search" },
  { name: "Google-Extended / GoogleOther", re: /GoogleOther|Google-Extended/i, kind: "ai" },
  { name: "Bingbot", re: /bingbot|BingPreview/i, kind: "search" },
  { name: "YandexBot", re: /YandexBot/i, kind: "search" },
  { name: "YandexImages", re: /YandexImages/i, kind: "search" },
  { name: "YandexMobileBot", re: /YandexMobileBot/i, kind: "search" },
  { name: "Yandex (other bot)", re: /Yandex(?:Accessibility|AdNet|Blogs|Calendar|Direct|Favicons|Fotki|Market|Media|Metrika|News|Pagechecker|Renderer|Screenshot|Sitelinks|Spravbot|Turbo|Verticals|Video|Webmaster|Additional)\w*/i, kind: "search" },
  { name: "Mail.Ru", re: /Mail\.RU_Bot/i, kind: "search" },
  { name: "Baiduspider", re: /Baiduspider/i, kind: "search" },
  { name: "DuckDuckBot", re: /DuckDuckBot|DuckAssistBot/i, kind: "search" },
  { name: "Applebot", re: /Applebot/i, kind: "search" },
  { name: "Sogou", re: /Sogou web spider/i, kind: "search" },
  { name: "Yahoo! Slurp", re: /Yahoo! Slurp/i, kind: "search" },
  { name: "SeznamBot", re: /SeznamBot/i, kind: "search" },
  { name: "PetalBot", re: /PetalBot/i, kind: "search" },
  { name: "facebookexternalhit", re: /facebookexternalhit|facebookcatalog|meta-externalagent/i, kind: "social" },
  { name: "Twitterbot", re: /Twitterbot/i, kind: "social" },
  { name: "LinkedInBot", re: /LinkedInBot/i, kind: "social" },
  { name: "TelegramBot", re: /TelegramBot/i, kind: "social" },
  { name: "WhatsApp", re: /WhatsApp\//i, kind: "social" },
  { name: "Slackbot", re: /Slackbot|Slack-ImgProxy/i, kind: "social" },
  { name: "Discordbot", re: /Discordbot/i, kind: "social" },
  { name: "Pinterestbot", re: /Pinterestbot/i, kind: "social" },
  { name: "vkShare", re: /vkShare/i, kind: "social" },
  { name: "AhrefsBot", re: /AhrefsBot|AhrefsSiteAudit/i, kind: "seo" },
  { name: "SemrushBot", re: /SemrushBot|SiteAuditBot/i, kind: "seo" },
  { name: "MJ12bot", re: /MJ12bot/i, kind: "seo" },
  { name: "DotBot", re: /DotBot/i, kind: "seo" },
  { name: "Screaming Frog", re: /Screaming Frog SEO Spider/i, kind: "seo" },
  { name: "GPTBot", re: /GPTBot/i, kind: "ai" },
  { name: "ChatGPT-User / OAI-SearchBot", re: /ChatGPT-User|OAI-SearchBot/i, kind: "ai" },
  { name: "ClaudeBot", re: /ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai/i, kind: "ai" },
  { name: "PerplexityBot", re: /PerplexityBot|Perplexity-User/i, kind: "ai" },
  { name: "CCBot", re: /CCBot/i, kind: "ai" },
  { name: "Bytespider", re: /Bytespider/i, kind: "ai" },
  { name: "Amazonbot", re: /Amazonbot/i, kind: "ai" },
  { name: "HeadlessChrome", re: /HeadlessChrome/i, kind: "headless" },
  { name: "PhantomJS", re: /PhantomJS/i, kind: "headless" },
  { name: "Puppeteer / Playwright", re: /Puppeteer|Playwright/i, kind: "headless" },
  { name: "Lighthouse", re: /Chrome-Lighthouse/i, kind: "monitor" },
  { name: "UptimeRobot", re: /UptimeRobot/i, kind: "monitor" },
  { name: "Pingdom", re: /Pingdom/i, kind: "monitor" },
  { name: "curl", re: /^curl\//i, kind: "http" },
  { name: "Wget", re: /^Wget\//i, kind: "http" },
  { name: "python-requests", re: /python-requests|python-urllib|aiohttp|httpx/i, kind: "http" },
  { name: "Go-http-client", re: /Go-http-client/i, kind: "http" },
  { name: "okhttp", re: /^okhttp\//i, kind: "http" },
  { name: "axios", re: /^axios\//i, kind: "http" },
  { name: "node-fetch / undici", re: /node-fetch|undici/i, kind: "http" },
  { name: "Postman", re: /PostmanRuntime/i, kind: "http" },
  { name: "Java HttpClient", re: /^Java\/|Apache-HttpClient/i, kind: "http" },
];

export function detectBot(ua: string): { name: string; kind: BotKind } | null {
  for (const r of RULES) if (r.re.test(ua)) return { name: r.name, kind: r.kind };
  if (/\b(bot|crawler|spider|crawling|scraper)\b/i.test(ua)) return { name: "bot", kind: "search" };
  return null;
}
