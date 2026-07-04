"use client";

import { useActionState, useState } from "react";
import type { ProfileState } from "@/app/actions/profile";
import type { User } from "@/db/schema";
import { useActionToast } from "@/lib/use-action-toast";

type Action = (prev: ProfileState, formData: FormData) => Promise<ProfileState>;

export function ProfileForm({
  action,
  profile,
}: {
  action: Action;
  profile: User;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    action,
    {},
  );
  const [bio, setBio] = useState(profile.bio ?? "");
  useActionToast(state, state.success ? "Profile saved." : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Display name</span>
        <input
          name="displayName"
          defaultValue={profile.displayName ?? ""}
          placeholder={`@${profile.username}`}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted flex items-center justify-between">
          Bio
          <span className="text-xs">{bio.length}/280</span>
        </span>
        <textarea
          name="bio"
          rows={3}
          maxLength={280}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="What do you build?"
          className="input resize-y"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Avatar image URL</span>
        <input
          name="avatarUrl"
          type="url"
          defaultValue={profile.avatarUrl ?? ""}
          placeholder="https://…/avatar.png"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Website URL</span>
        <input
          name="websiteUrl"
          type="url"
          defaultValue={profile.websiteUrl ?? ""}
          placeholder="https://your-site.com"
          className="input"
        />
      </label>

      {state.error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary py-3">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
