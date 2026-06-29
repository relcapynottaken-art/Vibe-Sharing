import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserProjects, type ProjectCard } from "@/lib/data";
import {
  deleteProjectAction,
  toggleVisibilityAction,
} from "@/app/actions/projects";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "admin";
  const projects = await getUserProjects(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Your projects</h1>
          <p className="text-muted text-sm">
            {isAdmin
              ? "Toggle which projects are visible to everyone."
              : "Keep projects private, or make them public for review."}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          + New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted text-center py-16 border border-dashed border-border rounded-2xl">
          You haven&apos;t added any projects yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => (
            <DashboardRow key={p.id} project={p} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ project, isAdmin }: { project: ProjectCard; isAdmin: boolean }) {
  if (isAdmin) {
    return project.isPublic ? (
      <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
        Public
      </span>
    ) : (
      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border">
        Hidden
      </span>
    );
  }
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-danger/15 text-danger border-danger/30",
    none: "bg-surface-2 text-muted border-border",
  };
  const label: Record<string, string> = {
    pending: "Public · pending review",
    approved: "Public",
    rejected: "Rejected",
    none: "Private",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${map[project.submissionStatus]}`}
    >
      {label[project.submissionStatus]}
    </span>
  );
}

function DashboardRow({
  project,
  isAdmin,
}: {
  project: ProjectCard;
  isAdmin: boolean;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/project/${project.id}`}
            className="font-semibold hover:text-accent transition-colors"
          >
            {project.title}
          </Link>
          <StatusBadge project={project} isAdmin={isAdmin} />
          {project.categoryName && (
            <span className="text-xs text-muted">· {project.categoryName}</span>
          )}
        </div>
        {project.submissionStatus === "rejected" && project.reviewerNote && (
          <p className="text-xs text-danger mt-1">
            Reviewer: {project.reviewerNote}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <form action={toggleVisibilityAction}>
            <input type="hidden" name="id" value={project.id} />
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface-2 transition-colors"
            >
              {project.isPublic ? "Hide" : "Make public"}
            </button>
          </form>
        )}
        <Link
          href={`/dashboard/${project.id}/edit`}
          className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface-2 transition-colors"
        >
          Edit
        </Link>
        <form action={deleteProjectAction}>
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded-lg border border-danger/40 text-danger hover:bg-danger/10 transition-colors"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
