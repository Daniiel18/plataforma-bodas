"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Like `useActionState`, but submits the form from `onSubmit`, so React does
 * not reset the fields when the action finishes and a validation error never
 * wipes what the person typed.
 */
export function useFormAction<State>(
  action: (prev: Awaited<State>, formData: FormData) => State | Promise<State>,
  initialState: Awaited<State>,
) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, initialState);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return [state, onSubmit, pending] as const;
}
