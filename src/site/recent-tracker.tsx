"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/recent";

export function RecentTracker({ path, title, locale }: { path: string[]; title: string; locale: string }) {
  useEffect(() => {
    pushRecent({ path, title, locale });
  }, [path, title, locale]);
  return null;
}
