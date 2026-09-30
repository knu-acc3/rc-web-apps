'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Check, ShieldCheck, Lightning, Monitor, Cpu, Globe } from '@phosphor-icons/react';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { writeClipboardText } from '@/src/utils/clipboard';

export interface DiagnosticHeroProps {
  slug: string;
  locale?: string;
}

export function DiagnosticHero({ slug, locale = 'ru' }: DiagnosticHeroProps) {
  const isEn = locale === 'en';

  // 1. IP & WebRTC states
  const [ip, setIp] = useState<string>('Detecting…');
  const [ipType, setIpType] = useState<string>('IPv4');
  const [webrtcLeak, setWebrtcLeak] = useState<string | null>(null);
  const [webrtcTesting, setWebrtcTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // 2. Screen & Refresh Rate states
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [cssWidth, setCssWidth] = useState(0);
  const [cssHeight, setCssHeight] = useState(0);
  const [dpr, setDpr] = useState(1);
  const [refreshRate, setRefreshRate] = useState<number | null>(null);

  // 3. Battery states
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState<boolean | null>(null);
  const [batterySupported, setBatterySupported] = useState(true);

  // 4. GPU states
  const [gpuVendor, setGpuVendor] = useState<string>('');
  const [gpuRenderer, setGpuRenderer] = useState<string>('');
  const [maxTextureSize, setMaxTextureSize] = useState<number>(0);
  const [webglVersion, setWebglVersion] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ── IP & WebRTC Diagnostics ──
    if (slug === 'ip' || slug === 'ipv4' || slug === 'ipv6' || slug === 'webrtc') {
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          setIp(data.ip);
          setIpType(data.ip.includes(':') ? 'IPv6' : 'IPv4');
        })
        .catch(() => {
          setIp('127.0.0.1 (Offline/Private)');
        });

      // WebRTC Leak detection via Google STUN
      if ('RTCPeerConnection' in window) {
        setWebrtcTesting(true);
        try {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          });
          pc.createDataChannel('');
          pc.createOffer().then((offer) => pc.setLocalDescription(offer));

          pc.onicecandidate = (event) => {
            if (!event || !event.candidate) return;
            const candidate = event.candidate.candidate;
            const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/i.exec(candidate);
            if (ipMatch) {
              setWebrtcLeak(ipMatch[1]);
              setWebrtcTesting(false);
            }
          };

          setTimeout(() => {
            setWebrtcTesting(false);
            pc.close();
          }, 3500);
        } catch {
          setWebrtcTesting(false);
        }
      }
    }

    // ── Screen Resolution & Refresh Rate ──
    if (slug === 'screen-resolution' || slug === 'screen') {
      setScreenWidth(window.screen.width);
      setScreenHeight(window.screen.height);
      setCssWidth(window.innerWidth);
      setCssHeight(window.innerHeight);
      setDpr(window.devicePixelRatio || 1);

      // Measure monitor refresh rate via requestAnimationFrame
      let frameCount = 0;
      const startTime = performance.now();
      const measure = (time: number) => {
        frameCount++;
        if (time - startTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (time - startTime));
          setRefreshRate(fps);
        } else {
          requestAnimationFrame(measure);
        }
      };
      requestAnimationFrame(measure);
    }

    // ── Battery Status API ──
    if (slug === 'battery') {
      interface BatteryManagerLike {
        level: number;
        charging: boolean;
        addEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void;
      }
      interface NavigatorWithBattery extends Navigator {
        getBattery?: () => Promise<BatteryManagerLike>;
      }
      const nav = navigator as NavigatorWithBattery;
      if (typeof nav.getBattery === 'function') {
        nav.getBattery().then((battery) => {
          setBatteryLevel(Math.round(battery.level * 100));
          setCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
          battery.addEventListener('chargingchange', () => {
            setCharging(battery.charging);
          });
        }).catch(() => {
          setBatterySupported(false);
        });
      } else {
        setBatterySupported(false);
      }
    }

    // ── GPU & WebGL Detection ──
    if (slug === 'gpu' || slug === 'webgl') {
      try {
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2');
        const gl = gl2 || canvas.getContext('webgl');
        if (gl) {
          setWebglVersion(gl2 ? 'WebGL 2.0' : 'WebGL 1.0');
          setMaxTextureSize(gl.getParameter(gl.MAX_TEXTURE_SIZE));

          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            setGpuVendor(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Generic');
            setGpuRenderer(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Generic GPU');
          } else {
            setGpuVendor('Standard WebGL Provider');
            setGpuRenderer('Standard Hardware Accelerator');
          }
        }
      } catch {
        // ignore
      }
    }
  }, [slug]);

  const handleCopy = async (text: string) => {
    if (await writeClipboardText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // 1. IP HERO
  if (slug === 'ip' || slug === 'ipv4' || slug === 'ipv6' || slug === 'webrtc') {
    return (
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] border-2 border-[var(--color-primary)]/30 shadow-lg text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Globe size={36} weight="duotone" />
          </div>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {isEn ? 'Your Public IP Address' : 'Ваш публичный IP-адрес'}
        </div>
        <div className="my-2 font-mono text-3xl sm:text-5xl font-black text-[var(--color-text)] tracking-tight break-all">
          {ip}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            {ipType}
          </span>
          <Button
            size="sm"
            onClick={() => handleCopy(ip)}
            className="gap-1.5 text-xs font-semibold"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? (isEn ? 'Copied!' : 'Скопировано!') : (isEn ? 'Copy IP' : 'Скопировать IP')}
          </Button>
        </div>

        {/* WebRTC Leak Status */}
        <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-4 text-xs">
          <div className="font-semibold text-[var(--color-text-muted)] mb-1">
            {isEn ? 'WebRTC STUN Leak Check:' : 'Проверка утечки WebRTC (STUN):'}
          </div>
          {webrtcTesting ? (
            <span className="text-muted-foreground animate-pulse">
              {isEn ? 'Testing STUN candidate leak…' : 'Проверяем утечку локального IP…'}
            </span>
          ) : webrtcLeak ? (
            <span className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck size={16} />
              {isEn ? `Reflexive Candidate: ${webrtcLeak}` : `Рефлексивный кандидат: ${webrtcLeak}`}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isEn ? 'No WebRTC leak detected' : 'Утечек WebRTC не обнаружено'}
            </span>
          )}
        </div>
      </Card>
    );
  }

  // 2. SCREEN RESOLUTION HERO
  if (slug === 'screen-resolution' || slug === 'screen') {
    const physicalWidth = Math.round(screenWidth * dpr);
    const physicalHeight = Math.round(screenHeight * dpr);

    return (
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] border-2 border-[var(--color-primary)]/30 shadow-lg text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Monitor size={36} weight="duotone" />
          </div>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {isEn ? 'Screen Resolution (CSS / Matrix)' : 'Разрешение экрана (CSS / Матрица)'}
        </div>
        <div className="my-2 font-mono text-3xl sm:text-5xl font-black text-[var(--color-text)] tracking-tight">
          {screenWidth} × {screenHeight}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {isEn ? 'Physical Matrix Pixels:' : 'Физические пиксели матрицы:'}{' '}
          <strong className="text-[var(--color-text)]">{physicalWidth} × {physicalHeight} px</strong>
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-[var(--color-border-subtle)] pt-4 text-left">
          <div className="rounded-xl border bg-card p-3">
            <div className="text-[11px] text-muted-foreground">DPR (Device Pixel Ratio)</div>
            <div className="text-lg font-bold font-mono text-primary">{dpr}x</div>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <div className="text-[11px] text-muted-foreground">CSS Viewport Size</div>
            <div className="text-lg font-bold font-mono text-primary">{cssWidth} × {cssHeight}</div>
          </div>
          <div className="rounded-xl border bg-card p-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-muted-foreground">Refresh Rate (Hz)</div>
            <div className="text-lg font-bold font-mono text-primary">
              {refreshRate ? `${refreshRate} Hz` : 'Measuring…'}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 3. BATTERY HERO
  if (slug === 'battery') {
    return (
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] border-2 border-[var(--color-primary)]/30 shadow-lg text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Lightning size={36} weight="duotone" />
          </div>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {isEn ? 'Battery Status' : 'Состояние батареи'}
        </div>

        {batterySupported && batteryLevel !== null ? (
          <>
            <div className="my-2 font-mono text-4xl sm:text-6xl font-black text-[var(--color-text)] tracking-tight">
              {batteryLevel}%
            </div>
            <div className="w-full max-w-xs mx-auto h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden my-3">
              <div
                className={`h-full transition-all ${
                  batteryLevel > 20 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary">
              {charging ? '⚡ ' + (isEn ? 'Charging' : 'Заряжается') : '🔋 ' + (isEn ? 'Discharging (Battery)' : 'Работает от батареи')}
            </div>
          </>
        ) : (
          <div className="py-6 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? 'Battery Status API is not available on desktop browsers or restricted by privacy settings.'
              : 'Battery Status API недоступен на вашем устройстве или ограничен настройками конфиденциальности.'}
          </div>
        )}
      </Card>
    );
  }

  // 4. GPU HERO
  if (slug === 'gpu' || slug === 'webgl') {
    return (
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] border-2 border-[var(--color-primary)]/30 shadow-lg text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Cpu size={36} weight="duotone" />
          </div>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {isEn ? 'Graphics Processor (GPU)' : 'Видеокарта (GPU)'}
        </div>
        <div className="my-2 text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {gpuRenderer || (isEn ? 'Detecting GPU…' : 'Определение видеокарты…')}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {gpuVendor} · {webglVersion}
        </p>

        <div className="mt-6 flex justify-center gap-4 border-t border-[var(--color-border-subtle)] pt-4 text-xs font-mono">
          <div className="rounded-lg border bg-card px-4 py-2">
            <span className="text-muted-foreground block text-[10px]">Max Texture Size</span>
            <strong className="text-primary text-sm">{maxTextureSize} × {maxTextureSize}</strong>
          </div>
          <div className="rounded-lg border bg-card px-4 py-2">
            <span className="text-muted-foreground block text-[10px]">API Context</span>
            <strong className="text-primary text-sm">{webglVersion || 'WebGL'}</strong>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
