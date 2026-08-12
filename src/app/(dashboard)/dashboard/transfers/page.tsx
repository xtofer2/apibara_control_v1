import { ArrowRight, Clock3, PackageCheck, Truck } from "lucide-react";
import type { Metadata } from "next";

import { requirePermission } from "@/features/auth/server/require-permission";
import { transferStatusLabels } from "@/features/transfers/config";
import { ReceiveTransferForm } from "@/features/transfers/components/receive-transfer-form";
import { SendTransferForm } from "@/features/transfers/components/send-transfer-form";
import { getTransferDashboard } from "@/features/transfers/server/transfer-service";

export const metadata: Metadata = { title: "Transferencias" };

const dateTime = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export default async function TransfersPage() {
  await requirePermission("transfers.operate");
  const dashboard = await getTransferDashboard();
  const destinationShifts = new Map(dashboard.openShifts.map((shift) => [shift.location_id, shift]));
  const incoming = dashboard.transfers.filter((transfer) => transfer.status === "SENT");

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <Truck aria-hidden="true" className="size-4" /> Movimiento entre sedes
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Transferencias</h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          El origen confirma lo enviado y el destino registra las cantidades realmente recibidas. Toda diferencia queda documentada.
        </p>
      </section>

      <SendTransferForm locations={dashboard.locations} openShifts={dashboard.openShifts} products={dashboard.products} />

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-stone-950"><PackageCheck aria-hidden="true" className="size-5" /> Pendientes de recepción</h2>
          <p className="mt-1 text-sm text-stone-500">Se necesita un turno abierto en la sede destino para confirmar.</p>
        </div>
        {incoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-7 text-center text-sm text-stone-500">No hay transferencias en tránsito.</div>
        ) : (
          <div className="grid gap-4">
            {incoming.map((transfer) => {
              const destinationShift = destinationShifts.get(transfer.destination_location_id);
              return (
                <article className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-6" key={transfer.id}>
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-stone-950">
                    <span>{transfer.origin?.name ?? "Origen"}</span><ArrowRight aria-hidden="true" className="size-4 text-blue-500" /><span>{transfer.destination?.name ?? "Destino"}</span>
                  </div>
                  <p className="mt-2 text-sm text-stone-500">Enviada {transfer.sent_at ? dateTime.format(new Date(transfer.sent_at)) : "recientemente"} por {transfer.creator?.full_name ?? "usuario registrado"}</p>
                  {destinationShift ? (
                    <ReceiveTransferForm destinationShift={destinationShift} products={dashboard.products} transfer={transfer} />
                  ) : (
                    <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-blue-800">La sede destino debe abrir su turno antes de recibir.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Historial visible</h2>
          <p className="mt-1 text-sm text-stone-500">Envíos en los que participaste; gerencia puede revisar el historial completo.</p>
        </div>
        <div className="grid gap-3">
          {dashboard.transfers.map((transfer) => (
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={transfer.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 font-medium text-stone-950">{transfer.origin?.name ?? "Origen"}<ArrowRight aria-hidden="true" className="size-4" />{transfer.destination?.name ?? "Destino"}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500"><Clock3 aria-hidden="true" className="size-4" />{transfer.sent_at ? dateTime.format(new Date(transfer.sent_at)) : "Sin envío"}</p>
                  {transfer.reception_notes ? <p className="mt-2 text-sm text-amber-700">Diferencia: {transfer.reception_notes}</p> : null}
                </div>
                <span className={transfer.status === "RECEIVED_WITH_DIFFERENCES" ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800" : transfer.status === "RECEIVED" ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800" : "rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"}>{transferStatusLabels[transfer.status]}</span>
              </div>
            </article>
          ))}
          {dashboard.transfers.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-7 text-center text-sm text-stone-500">Todavía no hay transferencias visibles.</div> : null}
        </div>
      </section>
    </div>
  );
}
