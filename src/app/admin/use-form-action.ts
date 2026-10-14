"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Igual que `useActionState`, pero envía el formulario desde `onSubmit`.
 * Así React no vacía los campos al terminar la acción, y si hay un error
 * de validación la persona no pierde lo que escribió.
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
