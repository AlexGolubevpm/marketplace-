"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSession, clearSession, type UserSession } from "@/lib/auth";
import { ClipboardList, PlusCircle, Archive, User, LogOut, BookOpen, MessageSquare } from "lucide-react";
import { BrandedLogo, useBranding } from "@/components/cngo-logo";

const navItems = [
  { href: "/c/requests", label: "Заявки", icon: ClipboardList },
  { href: "/c/requests/new", label: "Создать", icon: PlusCircle },
  { href: "/c/archive", label: "Архив", icon: Archive },
  { href: "/c/chats", label: "Чаты", icon: MessageSquare },
  { href: "/knowledge", label: "База знаний", icon: BookOpen },
  { href: "/c/profile", label: "Профиль", icon: User },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState<UserSession | null>(null);
  const [checked, setChecked] = useState(false);
  const branding = useBranding();

  useEffect(() => {
    const s = getSession("customer");
    if (!s || s.role !== "customer") {
      router.replace("/auth/customer");
      return;
    }
    setSessionState(s);
    setChecked(true);
  }, [router]);

  const handleLogout = () => {
    clearSession("customer");
    router.replace("/");
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandedLogo className="h-[72px] w-auto" />
            <span className="font-semibold text-gray-900 hidden sm:block">{branding.logo_text || ""}</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/c/requests/new" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-red-50 text-red-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
              <span className="text-sm text-gray-400 hidden sm:block">{session.name}</span>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {[navItems[0], navItems[1], navItems[3], navItems[5]].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/c/requests/new" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-[10px] transition-colors py-1 px-3",
                  isActive ? "text-red-500" : "text-gray-400"
                )}
              >
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
