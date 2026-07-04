import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserPublicProfile } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { GridIcon, LinkIcon, ShieldIcon } from "@/components/icons";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const viewerIsAdmin = viewer?.role === "admin";
  const result = await getUserPublicProfile(username, { viewerIsAdmin });
  if (!result) notFound();
  const { profile, projects } = result;

  const initial = (profile.displayName || profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.username}
            className="w-20 h-20 rounded-full object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full shrink-0 grid place-items-center text-2xl font-display font-semibold text-white bg-gradient-to-br from-accent-strong to-accent-2">
            {initial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {profile.displayName || `@${profile.username}`}
            </h1>
            {profile.role === "admin" && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent-2/15 text-accent-2 border border-accent-2/30">
                <ShieldIcon className="text-[0.7rem]" />
                Admin
              </span>
            )}
          </div>
          {profile.displayName && (
            <p className="text-muted text-sm mt-0.5">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-foreground/90 mt-3 leading-relaxed">
              {profile.bio}
            </p>
          )}
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-2 transition-colors mt-3 cursor-pointer"
            >
              <LinkIcon className="text-sm" />
              {profile.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">
          {projects.length > 0
            ? `${viewerIsAdmin ? "Projects" : "Public projects"} (${projects.length})`
            : viewerIsAdmin
              ? "Projects"
              : "Public projects"}
        </h2>
        {projects.length === 0 ? (
          <div className="glass rounded-2xl text-center py-16 px-6">
            <div className="text-white/15 text-5xl flex justify-center mb-3">
              <GridIcon />
            </div>
            <p className="text-muted">
              {viewerIsAdmin ? "No projects yet." : "No public projects yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
