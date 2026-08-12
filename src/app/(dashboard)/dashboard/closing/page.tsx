import { Calculator, CheckCircle2, Clock3, MapPin } from "lucide-react";
import type { Metadata } from "next";

import { requirePermission } from "@/features/auth/server/require-permission";
import { CloseShiftForm } from "@/features/closing/components/close-shift-form";
import { getClosingDashboard } from "@/features/closing/server/closing-service";

export const metadata: Metadata = { title: "Cierre de turno" };

const dateTime = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });
const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default async function ClosingPage() {
  await requirePermission("closing.operate");
  const dashboard = await getClosingDashboard();

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600"><CheckCircle2 aria-hidden="true" className="size-4" /> Fin de jornada</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Cierre de turno</h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">Confirma el inventario físico final y los pagos separados en efectivo y Yape. Después del cierre no se aceptan operaciones ordinarias.</p>
      </section>

      <CloseShiftForm openShifts={dashboard.openShifts} products={dashboard.products} />

      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold text-stone-950">Cierres recientes</h2><p className="mt-1 text-sm text-stone-500">Tu historial de cierres; gerencia puede revisar todos.</p></div>
        {dashboard.closings.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-7 text-center text-sm text-stone-500">Todavía no hay cierres visibles.</div> : (
          <div className="grid gap-4">
            {dashboard.closings.map((closing) => {
              const total = closing.payments.reduce((sum, payment) => sum + payment.amount, 0);
              return (
                <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={closing.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="flex items-center gap-2 font-semibold text-stone-950"><MapPin aria-hidden="true" className="size-4" />{closing.shift?.location?.name ?? "Sede registrada"}</p><p className="mt-2 flex items-center gap-2 text-sm text-stone-500"><Clock3 aria-hidden="true" className="size-4" />{dateTime.format(new Date(closing.created_at))} · {closing.creator?.full_name ?? "Usuario registrado"}</p></div>
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right"><p className="flex items-center gap-1 text-xs text-emerald-700"><Calculator aria-hidden="true" className="size-3" /> Total calculado</p><p className="mt-1 font-semibold text-emerald-950">{money.format(total)}</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">{closing.payments.map((payment) => <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-700" key={payment.method?.code ?? payment.amount}>{payment.method?.name ?? "Pago"}: {money.format(payment.amount)}</span>)}</div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
