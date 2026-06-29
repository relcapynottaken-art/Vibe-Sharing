"use client";

import { useActionState } from "react";
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

      {!isAdmin && !editing && (
        <p className="text-xs text-muted bg-surface-2 border border-border rounded-lg px-3 py-2">
          Your project will be sent to the admin for review. Once approved it
          appears in the Community section.
        </p>
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
              : "Submit for review"}
      </button>
    </form>
  );
}
