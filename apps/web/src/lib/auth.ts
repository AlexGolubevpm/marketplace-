"use client";

export interface UserSession {
  user_id: string;      // DB UUID
  tg_id: string;        // Telegram ID (may be empty for email users)
  name: string;
  username: string;
  role: "customer" | "carrier";
  logged_in: boolean;
  login_at: string;
}

const STORAGE_KEY_CUSTOMER = "cargo_session_customer";
const STORAGE_KEY_CARRIER = "cargo_session_carrier";

function keyForRole(role: "customer" | "carrier"): string {
  return role === "customer" ? STORAGE_KEY_CUSTOMER : STORAGE_KEY_CARRIER;
}

/** Get session for a specific role, or auto-detect from both keys */
export function getSession(role?: "customer" | "carrier"): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    if (role) {
      const raw = localStorage.getItem(keyForRole(role));
      if (!raw) return null;
      const session = JSON.parse(raw) as UserSession;
      if (!session.logged_in) return null;
      return session;
    }
    // Auto-detect: try both keys
    for (const key of [STORAGE_KEY_CUSTOMER, STORAGE_KEY_CARRIER]) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const session = JSON.parse(raw) as UserSession;
        if (session.logged_in) return session;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession): void {
  localStorage.setItem(keyForRole(session.role), JSON.stringify(session));
}

export function clearSession(role?: "customer" | "carrier"): void {
  if (role) {
    localStorage.removeItem(keyForRole(role));
  } else {
    localStorage.removeItem(STORAGE_KEY_CUSTOMER);
    localStorage.removeItem(STORAGE_KEY_CARRIER);
  }
}
