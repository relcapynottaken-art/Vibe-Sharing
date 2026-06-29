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
          className="input flex-1 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary px-4 py-2 text-sm"
        >
          Add
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
