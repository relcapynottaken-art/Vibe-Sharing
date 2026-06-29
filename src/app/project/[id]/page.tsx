import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/lib/data";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  ImageIcon,
  UsersIcon,
} from "@/components/icons";

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
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors w-fit cursor-pointer"
      >
        <ArrowLeftIcon className="text-base" />
        Back to explore
      </Link>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="aspect-[16/9] bg-white/5">
          {project.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/15 text-6xl">
              <ImageIcon />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {project.categoryName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-strong/15 text-accent border border-accent-strong/30">
                {project.categoryName}
              </span>
            )}
            {project.authorRole === "user" && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent-2/15 text-accent-2 border border-accent-2/30">
                <UsersIcon className="text-[0.7rem]" />
                Community
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{project.title}</h1>
          <p className="text-muted mt-1.5">by @{project.authorName}</p>
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary px-5 py-3"
        >
          Open project
          <ExternalLinkIcon className="text-base" />
        </a>
      </div>

      {project.description && (
        <div className="glass rounded-2xl p-6">
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {project.description}
          </p>
        </div>
      )}
    </article>
  );
}
