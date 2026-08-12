"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { initialTransferActionState } from "@/features/transfers/action-state";
import { sendTransferAction } from "@/features/transfers/actions";
import type { TransferLocation, TransferOpenShift, TransferProduct } from "@/features/transfers/types";

type Props = {
  locations: TransferLocation[];
  openShifts: TransferOpenShift[];
  products: TransferProduct[];
};

export function SendTransferForm({ locations, openShifts, products }: Props) {
  const [state, formAction, pending] = useActionState(sendTransferAction, initialTransferActionState);
  const [originShiftId, setOriginShiftId] = useState(openShifts[0]?.id ?? "");
  const originLocationId = openShifts.find((shift) => shift.id === originShiftId)?.location_id;
  const destinations = locations.filter((location) => location.id !== originLocationId);

  if (openShifts.length === 0) {
    return <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-7 text-center text-sm text-stone-500">No hay turnos abiertos desde los que se pueda enviar.</p>;
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-stone-950">Enviar productos</h2>
      <p className="mt-1 text-sm text-stone-500">El envío descuenta del cálculo del turno origen al confirmarse.</p>
      <form action={formAction} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Turno de origen
            <select className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3" name="origin_work_shift_id" onChange={(event) => setOriginShiftId(event.target.value)} value={originShiftId}>
              {openShifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.location?.name ?? "Sede registrada"}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Sede destino
            <select className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3" defaultValue="" name="destination_location_id" required>
              <option disabled value="">Selecciona el destino</option>
              {destinations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-stone-900">Cantidades enviadas</legend>
          <p className="mt-1 text-sm text-stone-500">Deja vacío cualquier producto que no forme parte del envío.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4" key={product.id}>
                <span><span className="block text-sm font-medium text-stone-950">{product.name}</span><span className="text-xs text-stone-500">{product.unit_type === "UNIT" ? "Unidades" : "Litros"}</span></span>
                <input aria-label={`Cantidad enviada de ${product.name}`} className="h-10 w-28 rounded-xl border border-stone-200 px-3 text-right" min="0" name={`sent.${product.id}`} step={product.unit_type === "UNIT" ? "1" : "0.001"} type="number" />
              </label>
            ))}
          </div>
        </fieldset>
        {state.message ? <p className={state.status === "error" ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
        <Button className="h-11 bg-orange-600 px-5 text-white hover:bg-orange-700" disabled={pending || destinations.length === 0} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />} Confirmar envío
        </Button>
      </form>
    </section>
  );
}
