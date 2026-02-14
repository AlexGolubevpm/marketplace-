"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClipboardList, Send, User, LogOut, Truck } from "lucide-react";

const navItems = [
  { href: "/s/requests", label: "Заявки", icon: ClipboardList },
  { href: "/s/offers", label: "Мои офферы", icon: Send },
  { href: "/s/profile", label: "Профиль", icon: User },
];

export default function CarrierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">Cargo Carrier</span>
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

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 text-xs transition-colors", isActive ? "text-indigo-400" : "text-white/30")}>
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
