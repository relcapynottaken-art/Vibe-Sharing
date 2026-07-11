import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getProjectFeedback } from "@/lib/data";
import { deleteFeedbackAction } from "@/app/actions/feedback";
import { FeedbackForm } from "@/components/FeedbackForm";
import { ToastForm } from "@/components/ToastForm";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  ImageIcon,
  MessageIcon,
  TrashIcon,
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

  const feedbackItems = isPublic ? await getProjectFeedback(projectId) : [];
  const alreadyGaveFeedback = Boolean(
    viewer && feedbackItems.some((f) => f.authorId === viewer.id),
  );
  const canGiveFeedback = Boolean(
    isPublic && viewer && viewer.id !== project.authorId && !alreadyGaveFeedback,
  );

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
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted border border-border">
              {project.projectType === "claude_artifact"
                ? "Claude Artifact"
                : "Website"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                project.pricing === "paid"
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-success/15 text-success border-success/30"
              }`}
            >
              {project.pricing === "paid" ? "Paid" : "Free"}
            </span>
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

      {isPublic && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageIcon className="text-base text-muted" />
            Feedback
            <span className="text-xs font-normal text-muted bg-white/5 border border-border rounded-full px-2 py-0.5">
              {feedbackItems.length}
            </span>
          </h2>

          {canGiveFeedback && <FeedbackForm projectId={project.id} />}
          {!viewer && (
            <p className="text-sm text-muted">
              <Link href="/login" className="text-accent hover:text-accent-2">
                Log in
              </Link>{" "}
              to leave feedback.
            </p>
          )}

          {feedbackItems.length === 0 ? (
            <p className="text-sm text-muted">No feedback yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {feedbackItems.map((f) => (
                <li key={f.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/u/${f.authorName}`}
                        className="text-sm font-medium hover:text-accent transition-colors"
                      >
                        @{f.authorName}
                      </Link>
                      <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap leading-relaxed">
                        {f.body}
                      </p>
                    </div>
                    {viewer &&
                      (viewer.role === "admin" || viewer.id === f.authorId) && (
                        <ToastForm
                          action={deleteFeedbackAction}
                          successMessage="Feedback removed."
                        >
                          <input type="hidden" name="id" value={f.id} />
                          <button
                            type="submit"
                            aria-label="Delete feedback"
                            className="grid place-items-center w-7 h-7 rounded-full text-muted hover:bg-danger/15 hover:text-danger transition-colors cursor-pointer"
                          >
                            <TrashIcon className="text-sm" />
                          </button>
                        </ToastForm>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
