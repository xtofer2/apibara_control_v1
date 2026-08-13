import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-5">
      <section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-orange-700">Error 404</p>
        <h1 className="mt-3 text-2xl font-semibold text-stone-950">
          Esta página no existe
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Revisa la dirección o vuelve al panel de Apibara Control.
        </p>
        <Link className={buttonVariants({ className: "mt-6", size: "lg" })} href="/dashboard">
          Volver al panel
        </Link>
      </section>
    </main>
  );
}
