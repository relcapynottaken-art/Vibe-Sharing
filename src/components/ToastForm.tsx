"use client";

import { useActionState } from "react";
import { useActionToast } from "@/lib/use-action-toast";

type ActionResult = { error?: string };
type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export function ToastForm({
  action,
  successMessage,
  className,
  children,
}: {
  action: Action;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    action,
    {},
  );
  useActionToast(state, !state.error ? successMessage : undefined);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}
