"use client";

import { useParams } from "next/navigation";
import { NotFoundClient } from "@/site/not-found-client";

/** Client-side navigation to a missing page (full requests are answered by /[locale]/404 via the proxy). */
export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  return <NotFoundClient locale={params?.locale === "en" ? "en" : "ru"} />;
}
