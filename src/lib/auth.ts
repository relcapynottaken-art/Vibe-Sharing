import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import {
  SESSION_COOKIE,
  signToken,
  verifyToken,
  type Role,
  type SessionUser,
} from "./session";

const BCRYPT_COST = 12;
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: {
  id: number;
  username: string;
  role: Role;
}): Promise<void> {
  const sid = randomUUID();
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

  // Best-effort tidy-up of this user's stale rows; not required for
  // correctness (getCurrentUser also checks expiresAt).
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, user.id), lt(sessions.expiresAt, new Date())))
    .catch(() => {});

  await db.insert(sessions).values({ userId: user.id, sid, expiresAt });

  const token = await signToken({ ...user, sid });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await verifyToken(token);
  if (user) {
    await db.delete(sessions).where(eq(sessions.sid, user.sid)).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await verifyToken(token);
  if (!user) return null;

  // Authoritative revocation check: the JWT alone only proves it was signed
  // by us and hasn't expired — it doesn't prove the session wasn't logged
  // out. A missing/expired row here means the session is dead even if the
  // JWT itself still validates.
  const [row] = await db
    .select({ expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.sid, user.sid))
    .limit(1);
  if (!row || row.expiresAt.getTime() < Date.now()) return null;

  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");
  return user;
}
