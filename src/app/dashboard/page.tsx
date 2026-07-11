import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserProjects, type ProjectCard } from "@/lib/data";
import {
  deleteProjectAction,
  togglePinAction,
  toggleVisibilityAction,
} from "@/app/actions/projects";
import { ToastForm } from "@/components/ToastForm";
import {
  ClockIcon,
  GlobeIcon,
  GridIcon,
  LockIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "admin";
  const projects = await getUserProjects(user.id);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Your projects</h1>
          <p className="text-muted text-sm mt-1">
            {isAdmin
              ? "Toggle which projects are visible to everyone."
              : "Keep projects private, or make them public for review."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/profile" className="btn btn-ghost px-4 py-2.5">
            <UsersIcon className="text-base" />
            Edit profile
          </Link>
          <Link href="/dashboard/new" className="btn btn-primary px-4 py-2.5">
            <PlusIcon className="text-base" />
            New project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass rounded-2xl text-center py-20 px-6">
          <div className="text-white/15 text-5xl flex justify-center mb-3">
            <GridIcon />
          </div>
          <p className="text-muted">You haven&apos;t added any projects yet.</p>
          <Link
            href="/dashboard/new"
            className="btn btn-primary px-5 py-2.5 mt-5"
          >
            <PlusIcon className="text-base" />
            Add your first project
          </Link>
        </div>
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

function StatusBadge({
  project,
  isAdmin,
}: {
  project: ProjectCard;
  isAdmin: boolean;
}) {
  const cls =
    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border";

  if (isAdmin) {
    return project.isPublic ? (
      <span className={`${cls} bg-success/15 text-success border-success/30`}>
        <GlobeIcon className="text-[0.7rem]" /> Public
      </span>
    ) : (
      <span className={`${cls} bg-white/5 text-muted border-border`}>
        <LockIcon className="text-[0.7rem]" /> Hidden
      </span>
    );
  }

  switch (project.submissionStatus) {
    case "approved":
      return (
        <span className={`${cls} bg-success/15 text-success border-success/30`}>
          <GlobeIcon className="text-[0.7rem]" /> Public
        </span>
      );
    case "pending":
      return (
        <span className={`${cls} bg-warning/15 text-warning border-warning/30`}>
          <ClockIcon className="text-[0.7rem]" /> Public · pending review
        </span>
      );
    case "rejected":
      return (
        <span className={`${cls} bg-danger/15 text-danger border-danger/30`}>
          <XIcon className="text-[0.7rem]" /> Rejected
        </span>
      );
    default:
      return (
        <span className={`${cls} bg-white/5 text-muted border-border`}>
          <LockIcon className="text-[0.7rem]" /> Private
        </span>
      );
  }
}

function DashboardRow({
  project,
  isAdmin,
}: {
  project: ProjectCard;
  isAdmin: boolean;
}) {
  return (
    <li className="glass rounded-2xl p-4 flex items-center gap-4 flex-wrap transition-colors hover:border-accent/40">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/project/${project.id}`}
            className="font-display font-semibold hover:text-accent transition-colors cursor-pointer"
          >
            {project.title}
          </Link>
          <StatusBadge project={project} isAdmin={isAdmin} />
          {project.categoryName && (
            <span className="text-xs text-muted">· {project.categoryName}</span>
          )}
        </div>
        {project.submissionStatus === "rejected" && project.reviewerNote && (
          <p className="text-xs text-danger mt-1.5">
            Reviewer: {project.reviewerNote}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ToastForm
          action={togglePinAction}
          successMessage={
            project.isPinned ? "Project unpinned." : "Project pinned to your profile."
          }
        >
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className={`btn btn-ghost px-3 py-1.5 text-sm ${project.isPinned ? "text-accent" : ""}`}
            aria-pressed={project.isPinned}
            aria-label={project.isPinned ? "Unpin project" : "Pin project"}
          >
            <PinIcon className="text-sm" />
            <span className="hidden sm:inline">
              {project.isPinned ? "Unpin" : "Pin"}
            </span>
          </button>
        </ToastForm>
        {isAdmin && (
          <ToastForm
            action={toggleVisibilityAction}
            successMessage={project.isPublic ? "Project hidden." : "Project made public."}
          >
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="btn btn-ghost px-3 py-1.5 text-sm">
              {project.isPublic ? (
                <>
                  <LockIcon className="text-sm" /> Hide
                </>
              ) : (
                <>
                  <GlobeIcon className="text-sm" /> Make public
                </>
              )}
            </button>
          </ToastForm>
        )}
        <Link
          href={`/dashboard/${project.id}/edit`}
          className="btn btn-ghost px-3 py-1.5 text-sm"
          aria-label="Edit project"
        >
          <PencilIcon className="text-sm" />
          <span className="hidden sm:inline">Edit</span>
        </Link>
        <ToastForm action={deleteProjectAction} successMessage="Project deleted.">
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className="btn btn-danger px-3 py-1.5 text-sm"
            aria-label="Delete project"
          >
            <TrashIcon className="text-sm" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </ToastForm>
      </div>
    </li>
  );
}
