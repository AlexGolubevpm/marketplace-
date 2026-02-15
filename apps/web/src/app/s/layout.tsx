"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSession, clearSession, type UserSession } from "@/lib/auth";
import { ClipboardList, Send, User, LogOut } from "lucide-react";
import { BrandedLogo, useBranding } from "@/components/cngo-logo";

const navItems = [
  { href: "/s/requests", label: "Заявки", icon: ClipboardList },
  { href: "/s/offers", label: "Офферы", icon: Send },
  { href: "/s/profile", label: "Профиль", icon: User },
];

export default function CarrierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState<UserSession | null>(null);
  const [checked, setChecked] = useState(false);
  const branding = useBranding();

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "carrier") {
      router.replace("/auth/carrier");
      return;
    }
    setSessionState(s);
    setChecked(true);
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 md:pb-0">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandedLogo className="h-10 w-10" />
            <span className="font-semibold hidden sm:block">{branding.logo_text || "Carrier"}</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <span className="text-sm text-white/30 hidden sm:block">{session.name}</span>
            )}
            <button onClick={handleLogout} className="text-white/30 hover:text-white/60 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 text-[10px] transition-colors py-1 px-3", isActive ? "text-indigo-400" : "text-white/30")}>
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
