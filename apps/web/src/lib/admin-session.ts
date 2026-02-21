import { createHmac } from "crypto";

const SESSION_SECRET = process.env.JWT_SECRET;
if (!SESSION_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Admin session signing will be insecure.");
}
const SECRET = SESSION_SECRET || "dev-only-insecure-secret";

/** Create HMAC-SHA256 signature of session payload. */
export function signAdminSession(data: {
  id: string;
  email: string;
  role: string;
}): string {
  const payload = `${data.id}:${data.email}:${data.role}`;
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

/** Verify HMAC signature (constant-time comparison). */
export function verifyAdminSession(
  data: { id: string; email: string; role: string },
  signature: string
): boolean {
  const expected = createHmac("sha256", SECRET)
    .update(`${data.id}:${data.email}:${data.role}`)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
