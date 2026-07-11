"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createFeedbackAction,
  type FeedbackState,
} from "@/app/actions/feedback";
import { useActionToast } from "@/lib/use-action-toast";

export function FeedbackForm({ projectId }: { projectId: number }) {
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(
    createFeedbackAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, !state.error ? "Feedback posted." : undefined);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <textarea
        name="body"
        required
        minLength={2}
        maxLength={500}
        rows={3}
        placeholder="What did you think of this project?"
        aria-label="Your feedback"
        className="input resize-y"
      />
      <div className="flex items-center justify-between gap-3">
        {state.error ? (
          <p className="text-xs text-danger">{state.error}</p>
        ) : (
          <span className="text-xs text-muted">One feedback per project.</span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary px-4 py-2 text-sm"
        >
          {pending ? "Posting…" : "Post feedback"}
        </button>
      </div>
    </form>
  );
}
