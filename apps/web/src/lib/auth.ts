"use client";

export interface UserSession {
  tg_id: string;
  name: string;
  username: string;
  role: "customer" | "carrier";
  logged_in: boolean;
  login_at: string;
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cargo_session");
    if (!raw) return null;
    const session = JSON.parse(raw) as UserSession;
    if (!session.logged_in) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession): void {
  localStorage.setItem("cargo_session", JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem("cargo_session");
}
