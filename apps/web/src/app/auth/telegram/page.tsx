"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { setSession } from "@/lib/auth";

function TelegramAuthInner() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tgId = params.get("tg_id");
    const name = params.get("name");
    const username = params.get("username");
    const role = (params.get("role") || "customer") as "customer" | "carrier";
    const userId = params.get("user_id");

    if (tgId) {
      const resolveAndSave = async () => {
        let dbUserId = userId || "";

        // Resolve tg_id to DB UUID if user_id not provided
        if (!dbUserId) {
          try {
            const res = await fetch(`/api/auth/resolve?tg_id=${tgId}&role=${role}`);
            if (res.ok) {
              const data = await res.json();
              dbUserId = data.user_id || "";
            }
          } catch {}
        }

        setSession({
          user_id: dbUserId,
          tg_id: tgId,
          name: name || "Пользователь",
          username: username || "",
          role,
          logged_in: true,
          login_at: new Date().toISOString(),
        });

        if (role === "carrier") {
          router.replace("/s/requests");
        } else {
          router.replace("/c/requests");
        }
      };

      resolveAndSave();
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
