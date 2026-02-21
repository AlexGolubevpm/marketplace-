"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

interface AnalyticsConfig {
  yandex_metrika_id?: string;
  google_analytics_id?: string;
  google_search_console_code?: string;
  yandex_webmaster_code?: string;
  custom_head_code?: string;
}

/**
 * Client component that fetches analytics config from the content API
 * and injects Yandex Metrika, Google Analytics, and verification codes.
 */
export function AnalyticsScripts() {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);

  useEffect(() => {
    fetch("/api/analytics-config")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  if (!config) return null;

  return (
    <>
      {/* Yandex Metrika */}
      {config.yandex_metrika_id && (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${config.yandex_metrika_id}, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true
            });
          `}
        </Script>
      )}

      {/* Google Analytics */}
      {config.google_analytics_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${config.google_analytics_id}');
            `}
          </Script>
        </>
      )}

      {/* Google Search Console verification */}
      {config.google_search_console_code && (
        <meta name="google-site-verification" content={config.google_search_console_code} />
      )}

      {/* Yandex Webmaster verification */}
      {config.yandex_webmaster_code && (
        <meta name="yandex-verification" content={config.yandex_webmaster_code} />
      )}
    </>
  );
}
