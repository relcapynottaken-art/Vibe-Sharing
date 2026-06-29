"use client";

import { useActionState, useState } from "react";
import type { ProjectState } from "@/app/actions/projects";
import type { Category, Project } from "@/db/schema";

type Action = (prev: ProjectState, formData: FormData) => Promise<ProjectState>;

export function ProjectForm({
  action,
  categories,
  project,
  isAdmin,
}: {
  action: Action;
  categories: Category[];
  project?: Project;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState<ProjectState, FormData>(
    action,
    {},
  );
  const editing = Boolean(project);

  // For non-admins, default existing projects to whatever they already are
  // (anything not "none" means they went public), and new projects to private.
  const initialVisibility: "private" | "public" =
    project && project.submissionStatus !== "none" ? "public" : "private";
  const [visibility, setVisibility] = useState<"private" | "public">(
    initialVisibility,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {project && <input type="hidden" name="id" value={project.id} />}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Title *</span>
        <input
          name="title"
          required
          defaultValue={project?.title}
          placeholder="My awesome vibecoded app"
          className="rounded-lg bg-surface border border-border px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Project URL *</span>
        <input
          name="url"
          type="url"
          required
          defaultValue={project?.url}
          placeholder="https://my-project.vercel.app"
          className="rounded-lg bg-surface border border-border px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Screenshot image URL</span>
        <input
          name="imageUrl"
          type="url"
          defaultValue={project?.imageUrl ?? ""}
          placeholder="https://…/screenshot.png"
          className="rounded-lg bg-surface border border-border px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Category</span>
        <select
          name="categoryId"
          defaultValue={project?.categoryId ?? ""}
          className="rounded-lg bg-surface border border-border px-3 py-2 outline-none focus:border-accent"
        >
          <option value="">— none —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={project?.description}
          placeholder="What is it? What makes it cool?"
          className="rounded-lg bg-surface border border-border px-3 py-2 outline-none focus:border-accent resize-y"
        />
      </label>

      {!isAdmin && (
        <fieldset className="flex flex-col gap-2">
          <span className="text-muted text-sm">Visibility</span>
          <input type="hidden" name="visibility" value={visibility} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                visibility === "private"
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:bg-surface-2"
              }`}
            >
              <span className="font-medium">Private</span>
              <span className="block text-xs text-muted">
                Only you. Not shared, no review.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                visibility === "public"
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:bg-surface-2"
              }`}
            >
              <span className="font-medium">Public</span>
              <span className="block text-xs text-muted">
                Reviewed by the admin before it shows.
              </span>
            </button>
          </div>
        </fieldset>
      )}

      {state.error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-white font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending
          ? "Saving…"
          : editing
            ? "Save changes"
            : isAdmin
              ? "Add project"
              : visibility === "public"
                ? "Submit for review"
                : "Save project"}
      </button>
    </form>
  );
}
