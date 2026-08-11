import type { CatalogActionState } from "@/features/catalogs/action-state";

export function FieldError({
  errors,
  id,
}: {
  errors?: string[];
  id: string;
}) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p className="text-sm text-red-600" id={id}>
      {errors[0]}
    </p>
  );
}

export function FormFeedback({ state }: { state: CatalogActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          : "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
      }
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
