/**
 * Unit tests for admin session HMAC signing/verification.
 * These run without DB.
 */
import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

// Replicate the functions from admin-auth route.ts to test them in isolation
const SESSION_SECRET = "test-secret-for-vitest";

function signAdminSession(data: {
  id: string;
  email: string;
  role: string;
}): string {
  const payload = `${data.id}:${data.email}:${data.role}`;
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function verifyAdminSession(
  data: { id: string; email: string; role: string },
  signature: string
): boolean {
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${data.id}:${data.email}:${data.role}`)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

describe("admin session HMAC", () => {
  const session = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@cargo.local",
    full_name: "Admin",
    role: "super_admin",
  };

  it("generates a valid hex signature", () => {
    const sig = signAdminSession(session);
    expect(sig).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
  });

  it("verifies a valid signature", () => {
    const sig = signAdminSession(session);
    expect(verifyAdminSession(session, sig)).toBe(true);
  });

  it("rejects a tampered session (changed role)", () => {
    const sig = signAdminSession(session);
    const tampered = { ...session, role: "analyst" };
    expect(verifyAdminSession(tampered, sig)).toBe(false);
  });

  it("rejects a tampered session (changed id)", () => {
    const sig = signAdminSession(session);
    const tampered = {
      ...session,
      id: "00000000-0000-0000-0000-000000000001",
    };
    expect(verifyAdminSession(tampered, sig)).toBe(false);
  });

  it("rejects a tampered session (changed email)", () => {
    const sig = signAdminSession(session);
    const tampered = { ...session, email: "hacker@evil.com" };
    expect(verifyAdminSession(tampered, sig)).toBe(false);
  });

  it("rejects a completely wrong signature", () => {
    expect(verifyAdminSession(session, "deadbeef")).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifyAdminSession(session, "")).toBe(false);
  });

  it("produces different signatures for different sessions", () => {
    const sig1 = signAdminSession(session);
    const sig2 = signAdminSession({ ...session, role: "content_manager" });
    expect(sig1).not.toBe(sig2);
  });
});
