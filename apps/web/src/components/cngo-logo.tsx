"use client";

import { trpc } from "@/trpc/client";

/**
 * Shared hook to get branding (logo_url, logo_text) from the content system.
 * Caches for 5 minutes. Returns empty strings while loading (no flash).
 */
export function useBranding() {
  const { data } = trpc.content.getPublished.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const branding = data?.branding || {};
  return {
    logo_url: (branding as any).logo_url || "",
    logo_text: (branding as any).logo_text || "",
    favicon_url: (branding as any).favicon_url || "",
  };
}

/**
 * Logo component. Pass logoUrl to render the image.
 * No hardcoded SVG fallback — renders empty placeholder if no logoUrl.
 */
export function CngoLogo({ className = "h-[72px] w-auto", logoUrl }: { className?: string; logoUrl?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" className={`${className} object-contain`} />;
  }
  return <div className={className} />;
}

/**
 * Self-contained logo that auto-fetches branding from DB. Use in layouts.
 */
export function BrandedLogo({ className = "h-[72px] w-auto" }: { className?: string }) {
  const { logo_url } = useBranding();
  if (!logo_url) return <div className={className} />;
  return <img src={logo_url} alt="Logo" className={`${className} object-contain`} />;
}
