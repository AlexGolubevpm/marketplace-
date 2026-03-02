"use client";

import Link from "next/link";
import { CngoLogo, useBranding } from "@/components/cngo-logo";

export default function ProductSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logo_url, logo_text } = useBranding();

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CngoLogo
              className="h-[48px] w-auto"
              logoUrl={logo_url || undefined}
            />
            {logo_text && (
              <span className="text-gray-900 font-bold text-lg tracking-tight">
                {logo_text}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/knowledge"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
            >
              База знаний
            </Link>
            <Link
              href="/auth/customer"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      </nav>
      <main className="pt-16 min-h-screen bg-gray-50">{children}</main>
    </>
  );
}
