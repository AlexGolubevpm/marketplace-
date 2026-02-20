"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setSession } from "@/lib/auth";

// This page receives OAuth session data via query params from the server callback,
// stores it in localStorage, and redirects to the dashboard.
function OAuthSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const userId = params.get("user_id");
    const name = params.get("name") ?? "";
    const role = params.get("role") as "customer" | "carrier" | null;

    if (!userId || !role) {
      router.replace("/auth/customer?error=oauth_failed");
      return;
    }

    setSession({
      user_id: userId,
      tg_id: "",
      name,
      username: "",
      role,
      logged_in: true,
      login_at: new Date().toISOString(),
    });

    router.replace(role === "customer" ? "/c/requests" : "/carrier/dashboard");
  }, [params, router]);

  return <p className="text-white/40">Выполняем вход...</p>;
}

export default function OAuthSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <Suspense fallback={<p className="text-white/40">Загрузка...</p>}>
        <OAuthSuccessContent />
      </Suspense>
    </div>
  );
}
