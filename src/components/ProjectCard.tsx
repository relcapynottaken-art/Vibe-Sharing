import Link from "next/link";
import type { ProjectCard as ProjectCardData } from "@/lib/data";
import { ExternalLinkIcon, ImageIcon, UsersIcon } from "@/components/icons";

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <div className="group glass rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-accent/50 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent-strong/10">
      <Link
        href={`/project/${project.id}`}
        className="block relative cursor-pointer"
      >
        <div className="aspect-[16/10] bg-white/5 overflow-hidden">
          {project.imageUrl ? (
            // Arbitrary user-supplied URLs — plain img, not next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/15 text-5xl">
              <ImageIcon />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white">
            View details
            <ExternalLinkIcon className="text-sm" />
          </span>
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
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

        <Link href={`/project/${project.id}`} className="cursor-pointer">
          <h3 className="font-display font-semibold leading-tight group-hover:text-accent transition-colors">
            {project.title}
          </h3>
        </Link>

        {project.description && (
          <p className="text-sm text-muted line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted border-t border-border">
          <span className="pt-2">by @{project.authorName}</span>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pt-2 inline-flex items-center gap-1 text-accent hover:text-accent-2 transition-colors cursor-pointer"
          >
            Open
            <ExternalLinkIcon className="text-sm" />
          </a>
        </div>
      </div>
    </div>
  );
}
