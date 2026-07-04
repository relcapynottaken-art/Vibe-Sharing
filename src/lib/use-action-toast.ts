"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Toasts on Server Action state changes, skipping the initial mount so it
// only fires after an actual submission completes.
export function useActionToast(
  state: { error?: string },
  successMessage?: string,
) {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (state.error) toast.error(state.error);
    else if (successMessage) toast.success(successMessage);
  }, [state, successMessage]);
}
