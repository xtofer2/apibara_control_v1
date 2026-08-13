"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-stone-950">
        No pudimos completar esta operación
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
        Vuelve a intentarlo. Si el problema continúa, comunica el código de
        referencia al responsable del sistema.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-stone-500">
          Referencia: {error.digest}
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset} size="lg">
        Intentar nuevamente
      </Button>
    </section>
  );
}
