import { Settings } from "lucide-react";

import { requirePermission } from "@/features/auth/server/require-permission";

export default async function AdminAccessPage() {
  await requirePermission("configuration.manage");

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Settings aria-hidden="true" className="size-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950">
        Acceso administrativo verificado
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">
        Tu rol permite administrar la configuración. Los formularios se habilitarán desde la Fase 6.
      </p>
    </section>
  );
}
