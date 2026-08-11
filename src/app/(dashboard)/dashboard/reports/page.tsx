import { BarChart3 } from "lucide-react";

import { requirePermission } from "@/features/auth/server/require-permission";

export default async function ReportsAccessPage() {
  await requirePermission("reports.read");

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <BarChart3 aria-hidden="true" className="size-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950">
        Acceso gerencial verificado
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-stone-600">
        Tu rol permite consultar reportes. El contenido funcional se habilitará en la fase correspondiente.
      </p>
    </section>
  );
}
