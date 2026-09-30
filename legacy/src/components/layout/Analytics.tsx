'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { hasAnalyticsConsent } from './CookieConsent';

import { siteConfig } from '@/src/config/site.config';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    ym?: (...args: unknown[]) => void;
  }
}

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

function useAnalyticsConsent() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('ut_analytics_consent_changed', onChange);
      return () =>
        window.removeEventListener('ut_analytics_consent_changed', onChange);
    },
    hasAnalyticsConsent,
    () => false,
  );
}

export function ConsentAwareVercelAnalytics() {
  const allowed = useAnalyticsConsent();
  if (process.env.NODE_ENV !== 'production' || !siteConfig.features.enableAnalytics) {
    return null;
  }
  return allowed ? <VercelAnalytics /> : null;
}

export function WebVitalsReporter() {
  useReportWebVitals(metric => {
    if (process.env.NODE_ENV !== 'production' || !siteConfig.features.enableAnalytics) return;
    if (!hasAnalyticsConsent()) return;
    const value = Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value);
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', metric.name, {
        value,
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
      });
    }
    if (typeof window.ym === 'function' && YM_ID) {
      window.ym(Number(YM_ID), 'params', { webvitals: { [metric.name]: value } });
    }
  });
  return null;
}

export function YandexMetrika() {
  const allowed = useAnalyticsConsent();

  useEffect(() => {
    if (allowed || !YM_ID) return;
    if (typeof window.ym === 'function') {
      window.ym(Number(YM_ID), 'destruct');
    }
    document.getElementById('yandex-metrika-loader')?.remove();
  }, [allowed]);

  if (process.env.NODE_ENV !== 'production' || !siteConfig.features.enableAnalytics) {
    return null;
  }
  if (!allowed || !YM_ID) return null;
  return (
    <>
      <script
        id="yandex-metrika"
        async
        dangerouslySetInnerHTML={{
          __html: `
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.id="yandex-metrika-loader",k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${YM_ID}, "init", { defer: true, clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false });
          `.trim(),
        }}
      />
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- analytics tracking pixel must stay a raw img in noscript. */}
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (typeof window.ym === 'function' && YM_ID) {
    window.ym(Number(YM_ID), 'reachGoal', name, params);
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
