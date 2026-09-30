"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/** Hide catalogue entries that don't match; returns true when nothing matches. */
function apply(q: string): boolean {
  const words = q.trim().toLowerCase().replace(/ё/g, "е").split(/\s+/).filter(Boolean);
  let shown = 0;
  document.querySelectorAll<HTMLElement>("[data-cat-item]").forEach((el) => {
    const hit = words.every((w) => el.dataset.catItem!.includes(w));
    el.hidden = !hit;
    if (hit) shown++;
  });
  document.querySelectorAll<HTMLElement>("[data-cat-group]").forEach((g) => {
    g.hidden = words.length > 0 && !g.querySelector("[data-cat-item]:not([hidden])");
  });
  return words.length > 0 && shown === 0;
}

/** Instant filter over the server-rendered catalogue (the list itself works without JavaScript). */
export function CatalogFilter({ label, placeholder, empty }: { label: string; placeholder: string; empty: string }) {
  const [q, setQ] = useState("");
  const [none, setNone] = useState(false);
  const change = (v: string) => {
    setQ(v);
    setNone(apply(v));
  };
  // The search form submits here as ?q=… when JavaScript was not ready.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the query string is only readable after mount
    if (initial) change(initial);
  }, []);
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{label}</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-3" aria-hidden />
        <input type="search" value={q} onChange={(e) => change(e.target.value)} placeholder={placeholder} autoComplete="off" className="control h-12 pl-12 text-base" />
      </label>
      {none && <p className="mt-4 text-fg-2">{empty}</p>}
    </div>
  );
}
