"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Заявки", icon: ClipboardList },
  { href: "/offers", label: "Офферы", icon: DollarSign },
  { href: "/orders", label: "Заказы", icon: Package },
  { href: "/carriers", label: "Карго", icon: Truck },
  { href: "/customers", label: "Клиенты", icon: Users },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/knowledgebase", label: "База знаний", icon: BookOpen },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cargo_admin_session");
      if (!raw) { router.replace("/auth/admin"); return; }
      const session = JSON.parse(raw);
      if (!session.logged_in) { router.replace("/auth/admin"); return; }
    } catch { router.replace("/auth/admin"); return; }
    setChecked(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("cargo_admin_session");
    router.replace("/auth/admin");
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <aside className={cn("flex flex-col border-r border-white/[0.06] bg-[#0a0a0f] transition-all duration-200", collapsed ? "w-16" : "w-60")}>
        <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 text-white font-bold text-sm">C</div>
          {!collapsed && <span className="font-semibold">Cargo Admin</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 mb-0.5 text-sm font-medium transition-colors",
                  isActive ? "bg-white/[0.08] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white/70")}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-2 space-y-1">
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Выйти</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Свернуть</span></>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
