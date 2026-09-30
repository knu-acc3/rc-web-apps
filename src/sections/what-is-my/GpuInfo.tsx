"use client";

import { formatNumber } from "@/i18n/format";
import type { ToolProps } from "../types";
import { parseRenderer } from "./lib/ua";
import { nav, useDetected, type GpuAdapterInfoLike } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, Stack, YesNo } from "./ui";

const T = {
  ru: {
    label: "Ваша видеокарта (GPU)",
    model: "Модель",
    vendor: "Производитель",
    api: "Графический API браузера",
    renderer: "Строка WebGL RENDERER",
    webgl: "WebGL",
    texture: "Макс. размер текстуры",
    webgpu: "WebGPU",
    adapter: "Адаптер WebGPU",
    fallback: "Программный адаптер WebGPU",
    hidden: "Скрыта браузером",
    noWebgl: "WebGL недоступен",
    software:
      "Браузер рисует графику программно (SwiftShader, llvmpipe или Microsoft Basic Render). Скорее всего, аппаратное ускорение выключено в настройках браузера или драйвер видеокарты не установлен.",
    approx: "Браузер обобщил название модели («or similar»): Firefox показывает похожую модель из того же семейства, а не точную.",
    masked: "Браузер скрывает модель видеокарты от сайтов. Safari всегда пишет «Apple GPU»; точную модель смотрите в системе.",
  },
  en: {
    label: "Your graphics card (GPU)",
    model: "Model",
    vendor: "Vendor",
    api: "Browser graphics API",
    renderer: "WebGL RENDERER string",
    webgl: "WebGL",
    texture: "Max texture size",
    webgpu: "WebGPU",
    adapter: "WebGPU adapter",
    fallback: "Software WebGPU adapter",
    hidden: "Hidden by the browser",
    noWebgl: "WebGL unavailable",
    software:
      "The browser renders graphics in software (SwiftShader, llvmpipe or Microsoft Basic Render). Hardware acceleration is probably off in the browser settings, or the GPU driver is missing.",
    approx: "The browser generalised the model name (“or similar”): Firefox reports a similar model from the same family, not the exact one.",
    masked: "The browser hides the GPU model from websites. Safari always says “Apple GPU”; check the exact model in your OS.",
  },
} as const;

interface GpuData {
  webgl: { version: 1 | 2; renderer: string | null; vendor: string | null; maxTexture: number | null } | null;
  webgpu: boolean;
  adapter: GpuAdapterInfoLike | null;
  fallback: boolean | null;
}

const GENERIC = /^(WebKit WebGL|WebKit|Mozilla|Google Inc\.?)$/i;

async function detectGpu(): Promise<GpuData> {
  let webgl: GpuData["webgl"] = null;
  try {
    const canvas = document.createElement("canvas");
    let version: 1 | 2 = 2;
    let gl = canvas.getContext("webgl2") as WebGLRenderingContext | null;
    if (!gl) {
      version = 1;
      gl = canvas.getContext("webgl");
    }
    if (gl) {
      let renderer = String(gl.getParameter(gl.RENDERER) ?? "");
      let vendor = String(gl.getParameter(gl.VENDOR) ?? "");
      // Chromium & Safari keep the real name behind the debug extension; Firefox returns it directly.
      if (!renderer || GENERIC.test(renderer)) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (ext) {
          renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? renderer);
          vendor = String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? vendor);
        }
      }
      const maxTexture = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || null;
      webgl = { version, renderer: renderer || null, vendor: vendor || null, maxTexture };
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    /* WebGL blocked */
  }
  const gpu = nav().gpu;
  let adapter: GpuAdapterInfoLike | null = null;
  let fallback: boolean | null = null;
  if (gpu) {
    try {
      const a = await gpu.requestAdapter();
      if (a) {
        const info = a.info ?? (await a.requestAdapterInfo?.());
        adapter = info ? { vendor: info.vendor, architecture: info.architecture, device: info.device, description: info.description } : null;
        fallback = typeof a.isFallbackAdapter === "boolean" ? a.isFallbackAdapter : null;
      }
    } catch {
      /* adapter request failed */
    }
  }
  return { webgl, webgpu: !!gpu, adapter, fallback };
}

export default function GpuInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const d = useDetected(detectGpu);
  const raw = d?.webgl?.renderer ?? null;
  const parsed = raw && !GENERIC.test(raw) ? parseRenderer(raw) : null;
  const masked = !!parsed && /^Apple GPU$/i.test(parsed.model);
  const adapterText = d?.adapter ? [d.adapter.vendor, d.adapter.architecture, d.adapter.description].filter(Boolean).join(" · ") || "—" : null;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={d ? (parsed?.model ?? (d.webgl ? t.hidden : t.noWebgl)) : null}
        sub={parsed ? [parsed.vendor, parsed.backend].filter(Boolean).join(" · ") || undefined : undefined}
        copy={raw ?? undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.model, v: d ? (parsed?.model ?? t.hidden) : null },
          { k: t.vendor, v: d ? (parsed?.vendor ?? d.webgl?.vendor ?? c.unknown) : null },
          { k: t.api, v: d ? (parsed?.backend ?? c.unknown) : null },
          { k: t.renderer, v: d ? (raw ?? "—") : null, mono: true },
          { k: t.webgl, v: d ? (d.webgl ? `WebGL ${d.webgl.version}` : c.notSupported) : null },
          ...(d?.webgl?.maxTexture ? [{ k: t.texture, v: `${formatNumber(locale, d.webgl.maxTexture)} px` }] : []),
          { k: t.webgpu, v: d ? <YesNo locale={locale} value={d.webgpu} yes={c.supported} no={c.notSupported} /> : null },
          ...(adapterText ? [{ k: t.adapter, v: adapterText }] : []),
          ...(d?.fallback !== null && d?.fallback !== undefined ? [{ k: t.fallback, v: <YesNo locale={locale} value={d.fallback} /> }] : []),
        ]}
      />
      {parsed?.software ? <Hint tone="warn">{t.software}</Hint> : null}
      {parsed?.approximate ? <Hint>{t.approx}</Hint> : null}
      {masked || (d?.webgl && !parsed) ? <Hint>{t.masked}</Hint> : null}
    </Stack>
  );
}
