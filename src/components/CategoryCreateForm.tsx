"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createCategoryAction,
  type CategoryState,
} from "@/app/actions/admin";

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState<CategoryState, FormData>(
    createCategoryAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          required
          placeholder="New category name"
          className="flex-1 rounded-lg bg-surface border border-border px-3 py-2 outline-none focus:border-accent text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
