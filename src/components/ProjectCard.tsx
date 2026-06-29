import Link from "next/link";
import type { ProjectCard as ProjectCardData } from "@/lib/data";

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface overflow-hidden flex flex-col hover:border-accent/60 transition-colors">
      <Link href={`/project/${project.id}`} className="block">
        <div className="aspect-[16/10] bg-surface-2 overflow-hidden">
          {project.imageUrl ? (
            // Arbitrary user-supplied URLs — use a plain img, not next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              ✨
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {project.categoryName && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
              {project.categoryName}
            </span>
          )}
          {project.authorRole === "user" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-2/15 text-accent-2 border border-accent-2/30">
              Community
            </span>
          )}
        </div>

        <Link href={`/project/${project.id}`}>
          <h3 className="font-semibold leading-tight hover:text-accent transition-colors">
            {project.title}
          </h3>
        </Link>

        {project.description && (
          <p className="text-sm text-muted line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted">
          <span>by @{project.authorName}</span>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Open ↗
          </a>
        </div>
      </div>
    </div>
  );
}
