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
  FileEdit,
  MessageSquare,
} from "lucide-react";
import { BrandedLogo, useBranding } from "@/components/cngo-logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Заявки", icon: ClipboardList },
  { href: "/offers", label: "Офферы", icon: DollarSign },
  { href: "/orders", label: "Заказы", icon: Package },
  { href: "/carriers", label: "Карго", icon: Truck },
  { href: "/customers", label: "Клиенты", icon: Users },
  { href: "/chats", label: "Чаты", icon: MessageSquare },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/knowledge", label: "База знаний", icon: BookOpen },
  { href: "/content", label: "Контент лендинга", icon: FileEdit },
  { href: "/settings", label: "Настройки", icon: Settings },
];

function AdminSidebarHeader({ collapsed }: { collapsed: boolean }) {
  const { logo_url, logo_text } = useBranding();
  return (
    <div className="flex h-20 items-center gap-2 border-b border-gray-200 px-4">
      {logo_url ? (
        <img src={logo_url} alt="Logo" className="h-[72px] w-auto shrink-0 object-contain" />
      ) : (
        <div className="h-[72px] w-auto shrink-0" />
      )}
      {!collapsed && <span className="font-semibold text-gray-900">{logo_text || "Admin"}</span>}
    </div>
  );
}

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <aside className={cn("flex flex-col border-r border-gray-200 bg-white transition-all duration-200", collapsed ? "w-16" : "w-60")}>
        <AdminSidebarHeader collapsed={collapsed} />

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 mb-0.5 text-sm font-medium transition-colors",
                  isActive ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-2 space-y-1">
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Выйти</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
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
