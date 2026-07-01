"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/actions/auth";
import { SparkIcon } from "@/components/icons";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  action,
  mode,
}: {
  action: Action;
  mode: "login" | "signup";
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  const isSignup = mode === "signup";

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="surface-strong rounded-3xl p-8">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-strong to-accent-2 text-white text-xl mb-5">
          <SparkIcon />
        </div>
        <h1 className="text-2xl font-bold mb-1">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted text-sm mb-6">
          {isSignup
            ? "Sign up to submit and showcase your projects."
            : "Log in to manage your projects."}
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Username</span>
            <input
              name="username"
              autoComplete="username"
              required
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Password</span>
            <input
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              className="input"
            />
          </label>

          {state.error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary py-3 mt-1"
          >
            {pending
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>
      </div>

      <p className="text-sm text-muted mt-5 text-center">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-2 transition-colors cursor-pointer">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-accent hover:text-accent-2 transition-colors cursor-pointer">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
