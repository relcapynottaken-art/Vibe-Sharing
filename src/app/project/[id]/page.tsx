import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/lib/data";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  const project = await getProjectById(projectId);
  if (!project) notFound();

  // Visibility gate: public projects are open; otherwise only the owner or an
  // admin may view the detail page.
  const isPublic =
    (project.authorRole === "admin" && project.isPublic) ||
    project.submissionStatus === "approved";
  const viewer = await getCurrentUser();
  const canView =
    isPublic ||
    (viewer && (viewer.role === "admin" || viewer.id === project.authorId));
  if (!canView) notFound();

  return (
    <article className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Back to explore
      </Link>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="aspect-[16/9] bg-surface-2">
          {project.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              ✨
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted mt-1">
            by @{project.authorName}
            {project.categoryName && <> · {project.categoryName}</>}
          </p>
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Open project ↗
        </a>
      </div>

      {project.description && (
        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {project.description}
        </p>
      )}
    </article>
  );
}
