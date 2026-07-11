"use client";

import { useActionState, useState } from "react";
import type { ProjectState } from "@/app/actions/projects";
import type { Category, Project } from "@/db/schema";
import { GlobeIcon, LockIcon } from "@/components/icons";

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

  // New projects default to Public so a submission actually reaches the review
  // queue. When editing, reflect the project's current state (anything other
  // than "none" means it has been made public).
  const initialVisibility: "private" | "public" = project
    ? project.submissionStatus !== "none"
      ? "public"
      : "private"
    : "public";
  const [visibility, setVisibility] = useState<"private" | "public">(
    initialVisibility,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {project && <input type="hidden" name="id" value={project.id} />}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Title *</span>
        <input
          name="title"
          required
          defaultValue={project?.title}
          placeholder="My awesome vibecoded app"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Project URL *</span>
        <input
          name="url"
          type="url"
          required
          defaultValue={project?.url}
          placeholder="https://my-project.vercel.app"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Screenshot image URL (https) *</span>
        <input
          name="imageUrl"
          type="url"
          required
          pattern="https://.*"
          defaultValue={project?.imageUrl ?? ""}
          placeholder="https://…/screenshot.png"
          className="input"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Type *</span>
          <select
            name="projectType"
            required
            defaultValue={project?.projectType ?? "website"}
            className="input cursor-pointer"
          >
            <option value="website">Website</option>
            <option value="claude_artifact">Claude Artifact</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Access *</span>
          <select
            name="pricing"
            required
            defaultValue={project?.pricing ?? "free"}
            className="input cursor-pointer"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Category</span>
        <select
          name="categoryId"
          defaultValue={project?.categoryId ?? ""}
          className="input cursor-pointer"
        >
          <option value="">— none —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={project?.description}
          placeholder="What is it? What makes it cool?"
          className="input resize-y"
        />
      </label>

      {!isAdmin && (
        <fieldset className="flex flex-col gap-2">
          <span className="text-muted text-sm">Visibility</span>
          <input type="hidden" name="visibility" value={visibility} />
          <div className="grid grid-cols-2 gap-3">
            <VisibilityOption
              active={visibility === "private"}
              onClick={() => setVisibility("private")}
              icon={<LockIcon />}
              title="Private"
              desc="Only you. Not shared, no review."
            />
            <VisibilityOption
              active={visibility === "public"}
              onClick={() => setVisibility("public")}
              icon={<GlobeIcon />}
              title="Public"
              desc="Reviewed by the admin before it shows."
            />
          </div>
        </fieldset>
      )}

      {state.error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary py-3">
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

function VisibilityOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left rounded-xl border p-3 transition-all cursor-pointer ${
        active
          ? "border-accent-strong bg-accent-strong/10 shadow-lg shadow-accent-strong/10"
          : "border-border bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <span
        className={`flex items-center gap-2 font-medium ${active ? "text-accent" : "text-foreground"}`}
      >
        <span className="text-base">{icon}</span>
        {title}
      </span>
      <span className="block text-xs text-muted mt-1">{desc}</span>
    </button>
  );
}
