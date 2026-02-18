"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CngoLogo } from "@/components/cngo-logo";
import { useBranding } from "@/components/cngo-logo";

type SessionInfo = { name: string; role: string; href: string } | null;

function useSession(): SessionInfo {
  const [session, setSession] = useState<SessionInfo>(null);
  useEffect(() => {
    try {
      for (const key of ["cargo_session_customer", "cargo_session_carrier"]) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.logged_in) {
            setSession({ name: s.name || s.username || "User", role: s.role, href: s.role === "carrier" ? "/s/requests" : "/c/requests" });
            return;
          }
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem("cargo_admin_session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.logged_in) {
          setSession({ name: s.login || "Admin", role: "admin", href: "/admin/dashboard" });
          return;
        }
      }
    } catch {}
  }, []);
  return session;
}

function KnowledgeHeader() {
  const { logo_url, logo_text } = useBranding();
  const session = useSession();
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <CngoLogo className="h-[72px] w-auto" logoUrl={logo_url || undefined} />
          {logo_text && <span className="text-gray-900 font-bold text-lg tracking-tight">{logo_text}</span>}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#delivery" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Доставка</Link>
          <Link href="/#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Как работает</Link>
          <Link href="/#why-us" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Преимущества</Link>
          <Link href="/knowledge" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">База знаний</Link>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden sm:block text-sm text-gray-500">{session.name}</span>
              <Link href={session.href}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors">
                Кабинет
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/carrier" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
                Вход для карго
              </Link>
              <Link href="/auth/customer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors">
                Войти
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function KnowledgeFooter() {
  const { logo_url, logo_text } = useBranding();
  return (
    <footer className="py-10 px-6 border-t border-gray-100 mt-16">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <CngoLogo className="h-[72px] w-auto" logoUrl={logo_url || undefined} />
          {logo_text && <span className="text-gray-900 font-bold text-lg tracking-tight">{logo_text}</span>}
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/knowledge" className="hover:text-gray-900 transition-colors">База знаний</Link>
          <Link href="/auth/customer" className="hover:text-gray-900 transition-colors">Вход для клиентов</Link>
          <Link href="/auth/carrier" className="hover:text-gray-900 transition-colors">Вход для карго</Link>
        </div>
        <p className="text-sm text-gray-300">&copy; {new Date().getFullYear()} {logo_text}</p>
      </div>
    </footer>
  );
}

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KnowledgeHeader />
      <main className="pt-20 min-h-screen">
        {children}
      </main>
      <KnowledgeFooter />
    </>
  );
}
