import { ArrowRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { roleLabels } from "@/features/auth/config/navigation";
import { requireCurrentProfile } from "@/features/auth/server/require-current-profile";

export const metadata: Metadata = {
  title: "Inicio",
};

export default async function DashboardPage() {
  const profile = await requireCurrentProfile();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-orange-600">Panel operativo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Hola, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-600">
          Tu acceso está activo. Los módulos operativos se habilitarán de forma
          incremental en las siguientes fases.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BadgeCheck aria-hidden="true" className="size-5" />
          </div>
          <p className="mt-5 text-sm text-stone-500">Estado de cuenta</p>
          <p className="mt-1 font-semibold text-stone-950">Activa</p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <p className="mt-5 text-sm text-stone-500">Rol asignado</p>
          <p className="mt-1 font-semibold text-stone-950">
            {roleLabels[profile.role]}
          </p>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <MapPin aria-hidden="true" className="size-5" />
          </div>
          <p className="mt-5 text-sm text-stone-500">Sede operativa</p>
          <p className="mt-1 font-semibold text-stone-950">Por seleccionar</p>
        </article>
      </section>

      <section className="rounded-3xl bg-stone-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-300">Próxima fase</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Ventas calculadas y reportes
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-stone-400">
              Gerencia podrá revisar ventas calculadas, conciliaciones de
              inventario y totales de pagos por fecha y sede.
            </p>
          </div>
          <ArrowRight aria-hidden="true" className="size-6 text-orange-300" />
        </div>
      </section>
    </div>
  );
}
