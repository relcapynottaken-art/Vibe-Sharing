import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 backdrop-blur bg-background/70">
      <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="gradient-text">Vibe</span>Share
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
              >
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors text-accent-2"
                >
                  Admin
                </Link>
              )}
              <span className="hidden sm:inline text-muted">
                @{user.username}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-2 transition-colors"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
