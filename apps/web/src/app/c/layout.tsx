"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClipboardList, PlusCircle, Archive, User, LogOut } from "lucide-react";

const navItems = [
  { href: "/c/requests", label: "Мои заявки", icon: ClipboardList },
  { href: "/c/requests/new", label: "Создать", icon: PlusCircle },
  { href: "/c/archive", label: "Архив", icon: Archive },
  { href: "/c/profile", label: "Профиль", icon: User },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-lg hidden sm:block">Cargo Market</span>
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
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link href="/" className="text-white/30 hover:text-white/60 transition-colors">
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/c/requests/new" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs transition-colors",
                  isActive ? "text-cyan-400" : "text-white/30"
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
