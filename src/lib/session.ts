import { SignJWT, jwtVerify } from "jose";

// Edge-safe session helpers (no node-only imports). Used by both server
// actions and middleware. Token is a signed JWT — the role claim is therefore
// tamper-proof, so middleware can authorize from it without a DB hit.

export const SESSION_COOKIE = "vibe_session";

export type Role = "admin" | "user";
export type SessionUser = { id: number; username: string; role: Role };

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is not set (must be a long random string)");
  }
  return new TextEncoder().encode(s);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
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
    return {
      id: Number(payload.sub),
      username: String(payload.username),
      role,
    };
  } catch {
    return null;
  }
}
