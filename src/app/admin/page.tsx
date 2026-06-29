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

export default async function AdminPage() {
  await requireAdmin();
  const [pending, categories] = await Promise.all([
    getPendingSubmissions(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted text-sm">
          Review community submissions and manage categories.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          Review queue{" "}
          <span className="text-muted font-normal">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted text-center py-12 border border-dashed border-border rounded-2xl">
            Nothing waiting for review. 🎉
          </p>
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
              className="flex items-center gap-2 rounded-full border border-border bg-surface pl-3 pr-1 py-1 text-sm"
            >
              {c.name}
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${c.name}`}
                  className="w-6 h-6 rounded-full hover:bg-danger/15 text-muted hover:text-danger transition-colors"
                >
                  ×
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
    <li className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/project/${project.id}`}
            className="font-semibold hover:text-accent transition-colors"
          >
            {project.title}
          </Link>
          <p className="text-sm text-muted">
            by @{project.authorName}
            {project.categoryName && <> · {project.categoryName}</>}
          </p>
          {project.description && (
            <p className="text-sm text-foreground/80 mt-1">
              {project.description}
            </p>
          )}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            {project.url} ↗
          </a>
        </div>
      </div>

      <form
        action={reviewSubmissionAction}
        className="flex items-center gap-2 flex-wrap border-t border-border/60 pt-3"
      >
        <input type="hidden" name="id" value={project.id} />
        <input
          name="note"
          placeholder="Optional note to the author"
          className="flex-1 min-w-[180px] rounded-lg bg-surface-2 border border-border px-3 py-1.5 outline-none focus:border-accent text-sm"
        />
        <button
          type="submit"
          name="decision"
          value="approved"
          className="px-4 py-1.5 rounded-lg bg-success text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          className="px-4 py-1.5 rounded-lg border border-danger/40 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
        >
          Reject
        </button>
      </form>
    </li>
  );
}
