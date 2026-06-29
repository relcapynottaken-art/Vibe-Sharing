import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getCategories,
  getPendingSubmissions,
  type ProjectCard,
} from "@/lib/data";
import {
  deleteCategoryAction,
  reviewSubmissionAction,
} from "@/app/actions/admin";
import { CategoryCreateForm } from "@/components/CategoryCreateForm";
import {
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  ShieldIcon,
  XIcon,
} from "@/components/icons";

export default async function AdminPage() {
  await requireAdmin();
  const [pending, categories] = await Promise.all([
    getPendingSubmissions(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-strong to-accent-2 text-white text-xl">
          <ShieldIcon />
        </span>
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-muted text-sm">
            Review community submissions and manage categories.
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClockIcon className="text-base text-warning" />
          Review queue
          <span className="text-xs font-normal text-muted bg-white/5 border border-border rounded-full px-2 py-0.5">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <div className="glass rounded-2xl text-center py-14 px-6 text-muted">
            Nothing waiting for review. You&apos;re all caught up.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {pending.map((p) => (
              <ReviewItem key={p.id} project={p} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="max-w-md">
          <CategoryCreateForm />
        </div>
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1 rounded-full border border-border bg-white/5 pl-3.5 pr-1 py-1 text-sm"
            >
              {c.name}
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${c.name}`}
                  className="grid place-items-center w-6 h-6 rounded-full text-muted hover:bg-danger/15 hover:text-danger transition-colors cursor-pointer"
                >
                  <XIcon className="text-sm" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReviewItem({ project }: { project: ProjectCard }) {
  return (
    <li className="glass rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link
            href={`/project/${project.id}`}
            className="font-display font-semibold hover:text-accent transition-colors cursor-pointer"
          >
            {project.title}
          </Link>
          <p className="text-sm text-muted">
            by @{project.authorName}
            {project.categoryName && <> · {project.categoryName}</>}
          </p>
          {project.description && (
            <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
              {project.description}
            </p>
          )}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-2 transition-colors mt-1 cursor-pointer break-all"
          >
            {project.url}
            <ExternalLinkIcon className="text-sm shrink-0" />
          </a>
        </div>
      </div>

      <form
        action={reviewSubmissionAction}
        className="flex items-center gap-2 flex-wrap border-t border-border pt-3"
      >
        <input type="hidden" name="id" value={project.id} />
        <input
          name="note"
          placeholder="Optional note to the author"
          className="input flex-1 min-w-[180px] py-1.5"
        />
        <button
          type="submit"
          name="decision"
          value="approved"
          className="btn btn-success px-4 py-1.5 text-sm"
        >
          <CheckIcon className="text-sm" /> Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          className="btn btn-danger px-4 py-1.5 text-sm"
        >
          <XIcon className="text-sm" /> Reject
        </button>
      </form>
    </li>
  );
}
