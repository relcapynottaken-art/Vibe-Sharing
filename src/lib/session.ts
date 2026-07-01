import { SignJWT, jwtVerify } from "jose";

// Edge-safe session helpers (no node-only imports). Used by both server
// actions and proxy.ts. The token is a signed JWT, so the role claim is
// tamper-proof and proxy.ts can use it for a fast, DB-free redirect decision.
//
// The JWT signature only proves who issued the token and that it hasn't
// expired — it does NOT prove the session is still active (a copied token
// keeps working until expiry even after logout). Every claim also carries a
// random `sid`; lib/auth.ts's getCurrentUser() looks that sid up against the
// `sessions` table to do the authoritative, revocable check before any real
// authorization decision is made.

export const SESSION_COOKIE = "vibe_session";

export type Role = "admin" | "user";
export type SessionUser = { id: number; username: string; role: Role; sid: string };

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is not set (must be a long random string)");
  }
  return new TextEncoder().encode(s);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role, sid: user.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role === "admin" ? "admin" : "user";
    const sid = typeof payload.sid === "string" ? payload.sid : "";
    if (!sid) return null;
    return {
      id: Number(payload.sub),
      username: String(payload.username),
      role,
      sid,
    };
  } catch {
    return null;
  }
}
