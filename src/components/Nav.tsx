import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { GridIcon, LogOutIcon, ShieldIcon, SparkIcon } from "@/components/icons";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 pt-4">
      <nav className="surface-strong rounded-2xl w-full max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-semibold text-lg tracking-tight px-2"
        >
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-accent-strong to-accent-2 text-white text-base">
            <SparkIcon />
          </span>
          <span>
            <span className="gradient-text">Vibe</span>Share
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-foreground/[0.04] transition-colors cursor-pointer"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-foreground/[0.04] transition-colors cursor-pointer"
              >
                <GridIcon className="text-base" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-accent-2 hover:bg-foreground/[0.04] transition-colors cursor-pointer"
                >
                  <ShieldIcon className="text-base" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <span className="hidden md:inline text-muted px-1">
                @{user.username}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn btn-ghost px-3 py-1.5 text-sm"
                  aria-label="Log out"
                >
                  <LogOutIcon className="text-base" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-foreground/[0.04] transition-colors cursor-pointer"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary px-4 py-1.5 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
