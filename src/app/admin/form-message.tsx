import type { ActionResult } from "@/lib/types";

/** Shows the error or confirmation returned by a Server Action. */
export function FormMessage({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok) {
    return state.message ? (
      <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
        {state.message}
      </p>
    ) : null;
  }
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </p>
  );
}
