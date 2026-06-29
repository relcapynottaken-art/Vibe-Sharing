"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { credentialsSchema } from "@/lib/validation";

export type AuthState = { error?: string };

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { username, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    return { error: "That username is taken." };
  }

  const passwordHash = await hashPassword(password);
  // Role is hard-coded to "user" — there is no path to create an admin via signup.
  const [created] = await db
    .insert(users)
    .values({ username, passwordHash, role: "user" })
    .returning({ id: users.id, username: users.username, role: users.role });

  await createSession({
    id: created.id,
    username: created.username,
    role: created.role,
  });
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const generic: AuthState = { error: "Invalid username or password." };

  if (!username || !password) return generic;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  // Always run a hash compare to keep timing roughly constant and avoid
  // leaking whether the username exists.
  if (!user) {
    await verifyPassword(
      password,
      "$2b$12$0000000000000000000000000000000000000000000000000000",
    );
    return generic;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      error: `Too many attempts. Account locked until ${user.lockedUntil.toLocaleTimeString()}.`,
    };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedAttempts + 1;
    const lock = attempts >= MAX_FAILED;
    await db
      .update(users)
      .set({
        failedAttempts: lock ? 0 : attempts,
        lockedUntil: lock
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : null,
      })
      .where(eq(users.id, user.id));
    if (lock) {
      return {
        error: `Too many attempts. Account locked for ${LOCK_MINUTES} minutes.`,
      };
    }
    return generic;
  }

  // Success — reset throttle counters and issue a session.
  await db
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.id, user.id));

  await createSession({
    id: user.id,
    username: user.username,
    role: user.role,
  });
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
