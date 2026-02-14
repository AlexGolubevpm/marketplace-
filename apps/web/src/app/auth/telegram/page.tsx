"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function TelegramAuthInner() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tgId = params.get("tg_id");
    const name = params.get("name");
    const username = params.get("username");
    const role = params.get("role") || "customer";

    if (tgId) {
      // Store session in localStorage
      const session = {
        tg_id: tgId,
        name: name || "Пользователь",
        username: username || "",
        role,
        logged_in: true,
        login_at: new Date().toISOString(),
      };
      localStorage.setItem("cargo_session", JSON.stringify(session));

      // Redirect to appropriate cabinet
      if (role === "carrier") {
        router.replace("/s/requests");
      } else {
        router.replace("/c/requests");
      }
    } else {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40">Входим в кабинет...</p>
      </div>
    </div>
  );
}

export default function TelegramAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TelegramAuthInner />
    </Suspense>
  );
}
