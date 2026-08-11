import { CircleX } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Acceso no disponible",
};

type AccountUnavailablePageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AccountUnavailablePage({
  searchParams,
}: AccountUnavailablePageProps) {
  const { reason } = await searchParams;
  const isInactive = reason === "inactive";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <CircleX aria-hidden="true" className="size-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950">
          Acceso no disponible
        </h1>
        <p className="mt-3 leading-7 text-stone-600">
          {isInactive
            ? "Tu cuenta se encuentra inactiva. Contacta a un administrador para recuperar el acceso."
            : "No encontramos un perfil operativo válido para esta cuenta. Contacta a un administrador."}
        </p>
        <form action={logoutAction} className="mt-8">
          <Button className="h-11 w-full" type="submit" variant="outline">
            Cerrar sesión
          </Button>
        </form>
      </section>
    </main>
  );
}
