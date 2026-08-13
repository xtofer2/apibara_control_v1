"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-stone-100 p-5 text-stone-950">
        <main className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">Apibara Control</p>
          <h1 className="mt-3 text-2xl font-semibold">
            Ocurrió un error inesperado
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Intenta cargar nuevamente. Si el problema continúa, contacta al
            responsable del sistema.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-stone-500">
              Referencia: {error.digest}
            </p>
          ) : null}
          <button
            className="mt-6 min-h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white"
            onClick={reset}
            type="button"
          >
            Intentar nuevamente
          </button>
        </main>
      </body>
    </html>
  );
}
