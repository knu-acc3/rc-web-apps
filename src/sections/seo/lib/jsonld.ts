/* Schema.org JSON-LD builders for the rich-result types Google documents. Pure functions. */

export type SchemaType = "article" | "product" | "faq" | "organization" | "localBusiness" | "breadcrumbs" | "event" | "recipe" | "person" | "video" | "jobPosting" | "softwareApp";

export const SCHEMA_TYPES: SchemaType[] = ["article", "product", "faq", "organization", "localBusiness", "breadcrumbs", "event", "recipe", "person", "video", "jobPosting", "softwareApp"];

export type F = Record<string, string>;
type Obj = Record<string, unknown>;

const S = "https://schema.org";

const v = (f: F, k: string) => (f[k] ?? "").trim();
const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Drop empty strings, empty arrays and objects that only contain "@type". */
export function clean<T>(x: T): T {
  if (Array.isArray(x)) return x.map(clean).filter((y) => !isEmpty(y)) as T;
  if (x && typeof x === "object") {
    const out: Obj = {};
    for (const [k, val] of Object.entries(x as Obj)) {
      const c = clean(val);
      if (!isEmpty(c)) out[k] = c;
    }
    return (Object.keys(out).every((k) => k === "@type" || k === "@context") ? {} : out) as T;
  }
  return x;
}

function isEmpty(x: unknown): boolean {
  if (x === undefined || x === null || x === "") return true;
  if (Array.isArray(x)) return x.length === 0;
  if (typeof x === "object") return Object.keys(x as Obj).length === 0;
  return false;
}

/** "1 500,50" → "1500.50"; returns "" for non-numbers. */
export function money(s: string): string {
  const t = s.replace(/[\s ]/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(t) ? t : "";
}

/** Minutes → ISO 8601 duration ("90" → "PT1H30M"); also accepts "1:30" (h:mm) for recipes, "m:ss" for video. */
export function isoDuration(s: string, colon: "hm" | "ms" = "hm"): string {
  const t = s.trim();
  if (!t) return "";
  let secs: number;
  const m = t.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (m) secs = m[3] !== undefined ? +m[1] * 3600 + +m[2] * 60 + +m[3] : colon === "hm" ? +m[1] * 3600 + +m[2] * 60 : +m[1] * 60 + +m[2];
  else if (/^\d+$/.test(t)) secs = +t * 60;
  else return "";
  const h = Math.floor(secs / 3600);
  const mi = Math.floor((secs % 3600) / 60);
  const se = secs % 60;
  const d = `${h ? `${h}H` : ""}${mi ? `${mi}M` : ""}${se ? `${se}S` : ""}`;
  return `PT${d || "0M"}`;
}

/** Attach a UTC offset to a datetime-local value: "2026-10-15T19:00" + "+05:00". */
export function withOffset(dt: string, offset: string): string {
  if (!dt) return "";
  if (/T\d{2}:\d{2}$/.test(dt)) return `${dt}:00${offset}`;
  return dt;
}

const DAYS: Record<string, string> = { mo: "Monday", tu: "Tuesday", we: "Wednesday", th: "Thursday", fr: "Friday", sa: "Saturday", su: "Sunday", пн: "Monday", вт: "Tuesday", ср: "Wednesday", чт: "Thursday", пт: "Friday", сб: "Saturday", вс: "Sunday" };
const ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "Mo-Fr 09:00-18:00" / "Пн-Пт 9:00-18:00" / "Sa,Su 10:00-16:00" → OpeningHoursSpecification. */
export function openingHours(text: string): Obj[] {
  const out: Obj[] = [];
  for (const l of lines(text)) {
    const m = l.match(/^([A-Za-zА-Яа-я,\s–—-]+?)\s+(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})$/);
    if (!m) continue;
    const days: string[] = [];
    for (const part of m[1].split(",")) {
      const [a, b] = part
        .trim()
        .toLowerCase()
        .split(/\s*[-–—]\s*/);
      const from = DAYS[a];
      const to = b ? DAYS[b] : from;
      if (!from || !to) continue;
      const i = ORDER.indexOf(from);
      const j = ORDER.indexOf(to);
      for (let k = i; ; k = (k + 1) % 7) {
        days.push(ORDER[k]);
        if (k === j) break;
      }
    }
    if (!days.length) continue;
    const t = (x: string) => x.replace(".", ":").padStart(5, "0");
    out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: t(m[2]), closes: t(m[3]) });
  }
  return out;
}

/** "Name | https://…" per line. */
export function pairsOf(text: string): [string, string][] {
  return lines(text).map((l) => {
    const [a, ...b] = l.split("|");
    return [a.trim(), b.join("|").trim()];
  });
}

/** Blocks of "question\nanswer…" separated by blank lines. */
export function faqPairs(text: string): [string, string][] {
  return text
    .split(/\n\s*\n/)
    .map((b) => lines(b))
    .filter((b) => b.length >= 2)
    .map((b) => [b[0], b.slice(1).join(" ")]);
}

function address(f: F): Obj {
  return { "@type": "PostalAddress", streetAddress: v(f, "street"), addressLocality: v(f, "city"), addressRegion: v(f, "region"), postalCode: v(f, "zip"), addressCountry: v(f, "country").toUpperCase() };
}

function coords(s: string): Obj {
  const m = s.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  return m ? { "@type": "GeoCoordinates", latitude: Number(m[1]), longitude: Number(m[2]) } : {};
}

const availability = (a: string) => (a ? `${S}/${a}` : "");

export function buildSchema(type: SchemaType, f: F, offset = "+00:00"): Obj {
  const ctx = { "@context": S };
  switch (type) {
    case "article":
      return clean({
        ...ctx,
        "@type": v(f, "kind") || "Article",
        headline: v(f, "headline"),
        description: v(f, "description"),
        image: lines(f.image ?? ""),
        author: v(f, "author") ? [{ "@type": v(f, "authorType") || "Person", name: v(f, "author"), url: v(f, "authorUrl") }] : [],
        publisher: { "@type": "Organization", name: v(f, "publisher"), logo: { "@type": "ImageObject", url: v(f, "logo") } },
        datePublished: withOffset(v(f, "published"), offset),
        dateModified: withOffset(v(f, "modified"), offset),
        mainEntityOfPage: v(f, "url") ? { "@type": "WebPage", "@id": v(f, "url") } : "",
      });
    case "product": {
      const price = money(v(f, "price"));
      return clean({
        ...ctx,
        "@type": "Product",
        name: v(f, "name"),
        image: lines(f.image ?? ""),
        description: v(f, "description"),
        sku: v(f, "sku"),
        gtin: v(f, "gtin"),
        brand: v(f, "brand") ? { "@type": "Brand", name: v(f, "brand") } : "",
        offers: price
          ? {
              "@type": "Offer",
              url: v(f, "url"),
              price,
              priceCurrency: v(f, "currency") || "RUB",
              availability: availability(v(f, "availability") || "InStock"),
              itemCondition: availability(v(f, "condition")),
              priceValidUntil: v(f, "validUntil"),
            }
          : "",
        aggregateRating:
          v(f, "rating") && v(f, "reviews")
            ? { "@type": "AggregateRating", ratingValue: money(v(f, "rating")) || v(f, "rating"), reviewCount: v(f, "reviews").replace(/\D/g, "") }
            : "",
      });
    }
    case "faq":
      return clean({
        ...ctx,
        "@type": "FAQPage",
        mainEntity: faqPairs(f.qa ?? "").map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      });
    case "organization":
      return clean({
        ...ctx,
        "@type": v(f, "kind") || "Organization",
        name: v(f, "name"),
        url: v(f, "url"),
        logo: v(f, "logo"),
        description: v(f, "description"),
        email: v(f, "email"),
        telephone: v(f, "phone"),
        sameAs: lines(f.sameAs ?? ""),
      });
    case "localBusiness":
      return clean({
        ...ctx,
        "@type": v(f, "kind") || "LocalBusiness",
        name: v(f, "name"),
        image: lines(f.image ?? ""),
        url: v(f, "url"),
        telephone: v(f, "phone"),
        priceRange: v(f, "priceRange"),
        address: address(f),
        geo: coords(v(f, "geo")),
        openingHoursSpecification: openingHours(f.hours ?? ""),
      });
    case "breadcrumbs":
      return clean({
        ...ctx,
        "@type": "BreadcrumbList",
        itemListElement: pairsOf(f.items ?? "").map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
      });
    case "event": {
      const mode = v(f, "mode") || "OfflineEventAttendanceMode";
      const place = { "@type": "Place", name: v(f, "place"), address: address(f) };
      const online = { "@type": "VirtualLocation", url: v(f, "onlineUrl") };
      return clean({
        ...ctx,
        "@type": "Event",
        name: v(f, "name"),
        description: v(f, "description"),
        image: lines(f.image ?? ""),
        startDate: withOffset(v(f, "start"), offset),
        endDate: withOffset(v(f, "end"), offset),
        eventAttendanceMode: `${S}/${mode}`,
        eventStatus: `${S}/${v(f, "status") || "EventScheduled"}`,
        location: mode === "OnlineEventAttendanceMode" ? online : mode === "MixedEventAttendanceMode" ? [place, online] : place,
        organizer: v(f, "organizer") ? { "@type": "Organization", name: v(f, "organizer"), url: v(f, "organizerUrl") } : "",
        offers: money(v(f, "price")) ? { "@type": "Offer", price: money(v(f, "price")), priceCurrency: v(f, "currency") || "RUB", url: v(f, "ticketUrl"), availability: `${S}/InStock`, validFrom: withOffset(v(f, "salesStart"), offset) } : "",
      });
    }
    case "recipe": {
      const prep = isoDuration(v(f, "prep"));
      const cook = isoDuration(v(f, "cook"));
      const toMin = (d: string) => {
        const m = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?/);
        return m ? (+(m[1] ?? 0)) * 60 + +(m[2] ?? 0) : 0;
      };
      const total = prep || cook ? isoDuration(String(toMin(prep) + toMin(cook))) : "";
      return clean({
        ...ctx,
        "@type": "Recipe",
        name: v(f, "name"),
        image: lines(f.image ?? ""),
        description: v(f, "description"),
        author: v(f, "author") ? { "@type": "Person", name: v(f, "author") } : "",
        prepTime: prep,
        cookTime: cook,
        totalTime: total,
        recipeYield: v(f, "yield"),
        recipeCategory: v(f, "category"),
        recipeCuisine: v(f, "cuisine"),
        nutrition: v(f, "calories") ? { "@type": "NutritionInformation", calories: `${v(f, "calories").replace(/\D/g, "")} calories` } : "",
        recipeIngredient: lines(f.ingredients ?? ""),
        recipeInstructions: lines(f.steps ?? "").map((t) => ({ "@type": "HowToStep", text: t })),
      });
    }
    case "person":
      return clean({
        ...ctx,
        "@type": "Person",
        name: v(f, "name"),
        url: v(f, "url"),
        image: v(f, "image"),
        jobTitle: v(f, "jobTitle"),
        worksFor: v(f, "worksFor") ? { "@type": "Organization", name: v(f, "worksFor") } : "",
        sameAs: lines(f.sameAs ?? ""),
      });
    case "video":
      return clean({
        ...ctx,
        "@type": "VideoObject",
        name: v(f, "name"),
        description: v(f, "description"),
        thumbnailUrl: lines(f.thumbnail ?? ""),
        uploadDate: withOffset(v(f, "uploaded"), offset),
        duration: isoDuration(v(f, "duration"), "ms"),
        contentUrl: v(f, "contentUrl"),
        embedUrl: v(f, "embedUrl"),
      });
    case "jobPosting": {
      const min = money(v(f, "salaryMin"));
      const max = money(v(f, "salaryMax"));
      const remote = f.remote === "true";
      return clean({
        ...ctx,
        "@type": "JobPosting",
        title: v(f, "title"),
        description: v(f, "description"),
        datePosted: v(f, "posted"),
        validThrough: v(f, "validThrough") ? withOffset(`${v(f, "validThrough")}T23:59`, offset) : "",
        employmentType: v(f, "employment"),
        hiringOrganization: { "@type": "Organization", name: v(f, "org"), sameAs: v(f, "orgUrl"), logo: v(f, "orgLogo") },
        jobLocationType: remote ? "TELECOMMUTE" : "",
        applicantLocationRequirements: remote && v(f, "country") ? { "@type": "Country", name: v(f, "country").toUpperCase() } : "",
        jobLocation: remote ? "" : { "@type": "Place", address: address(f) },
        baseSalary:
          min || max
            ? { "@type": "MonetaryAmount", currency: v(f, "currency") || "RUB", value: { "@type": "QuantitativeValue", ...(min && max ? { minValue: Number(min), maxValue: Number(max) } : { value: Number(min || max) }), unitText: v(f, "unit") || "MONTH" } }
            : "",
      });
    }
    case "softwareApp":
      return clean({
        ...ctx,
        "@type": "SoftwareApplication",
        name: v(f, "name"),
        operatingSystem: v(f, "os"),
        applicationCategory: v(f, "category"),
        url: v(f, "url"),
        offers: { "@type": "Offer", price: money(v(f, "price")) || (v(f, "name") ? "0" : ""), priceCurrency: v(f, "currency") || "RUB" },
        aggregateRating: v(f, "rating") && v(f, "ratingCount") ? { "@type": "AggregateRating", ratingValue: money(v(f, "rating")) || v(f, "rating"), ratingCount: v(f, "ratingCount").replace(/\D/g, "") } : "",
      });
  }
}

/** Required properties per Google's rich-result documentation. */
export const REQUIRED: Record<SchemaType, string[][]> = {
  article: [["headline"]],
  product: [["name"], ["price", "rating"]],
  faq: [["qa"]],
  organization: [["name"]],
  localBusiness: [["name"], ["street"], ["city"]],
  breadcrumbs: [["items"]],
  event: [["name"], ["start"], ["place", "onlineUrl"]],
  recipe: [["name"], ["image"]],
  person: [["name"]],
  video: [["name"], ["thumbnail"], ["uploaded"]],
  jobPosting: [["title"], ["description"], ["posted"], ["org"], ["city", "remote"]],
  softwareApp: [["name"], ["price", "rating"]],
};

/** Keys (or alternatives) that are required but empty. */
export function missing(type: SchemaType, f: F): string[][] {
  return REQUIRED[type].filter((alts) => !alts.some((k) => v(f, k) && v(f, k) !== "false"));
}

/** Serialise as a script tag; "</" is escaped so text can't close the script element. */
export function scriptTag(obj: Obj): string {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/<\//g, "<\\/")}\n</script>`;
}
