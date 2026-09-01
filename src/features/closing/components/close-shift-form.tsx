"use client";

import { Banknote, CalendarDays, CheckCircle2, LoaderCircle, Smartphone } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { initialClosingActionState } from "@/features/closing/action-state";
import { closeShiftAction } from "@/features/closing/actions";
import type { ClosingOpenShift, ClosingProduct } from "@/features/closing/types";

type Props = {
  canChooseOperationalDate: boolean;
  currentLimaDate: string;
  openShifts: ClosingOpenShift[];
  products: ClosingProduct[];
};

export function CloseShiftForm({
  canChooseOperationalDate,
  currentLimaDate,
  openShifts,
  products,
}: Props) {
  const [state, formAction, pending] = useActionState(closeShiftAction, initialClosingActionState);
  const [selectedShiftId, setSelectedShiftId] = useState(openShifts[0]?.id ?? "");
  const [operationalDate, setOperationalDate] = useState(
    openShifts[0]?.operational_date ?? currentLimaDate,
  );

  if (openShifts.length === 0) {
    return <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">No hay turnos abiertos para cerrar.</div>;
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-stone-950">Confirmar cierre</h2>
      <p className="mt-1 text-sm text-stone-500">Esta operación es definitiva. Verifica el conteo físico y ambos medios de pago.</p>
      <form action={formAction} className="mt-7 space-y-7">
        <div className={`grid gap-4 ${canChooseOperationalDate ? "sm:grid-cols-2" : ""}`}>
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            Turno abierto
            <select
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3"
              name="work_shift_id"
              onChange={(event) => {
                const nextShift = openShifts.find((shift) => shift.id === event.target.value);
                setSelectedShiftId(event.target.value);
                setOperationalDate(nextShift?.operational_date ?? currentLimaDate);
              }}
              required
              value={selectedShiftId}
            >
              {openShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.location?.name ?? "Sede registrada"} · {shift.operational_date}
                </option>
              ))}
            </select>
          </label>

          {canChooseOperationalDate ? (
            <label className="block space-y-2 text-sm font-medium text-stone-700">
              <span className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-4" /> Fecha operativa
              </span>
              <input
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3"
                max={currentLimaDate}
                name="operational_date"
                onChange={(event) => setOperationalDate(event.target.value)}
                required
                type="date"
                value={operationalDate}
              />
              <span className="block text-xs font-normal text-stone-500">
                Define la jornada reportada. La hora real del cierre queda registrada en servidor.
              </span>
            </label>
          ) : null}
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-stone-900">Conteo físico final</legend>
          <p className="mt-1 text-sm text-stone-500">Todos los productos activos deben incluirse, incluso con cantidad cero.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4" key={product.id}>
                <span><span className="block text-sm font-medium text-stone-950">{product.name}</span><span className="text-xs text-stone-500">{product.unit_type === "UNIT" ? "Unidades" : "Litros"}</span></span>
                <input aria-label={`Cantidad final de ${product.name}`} className="h-10 w-28 rounded-xl border border-stone-200 px-3 text-right" min="0" name={`closing.${product.id}`} required step={product.unit_type === "UNIT" ? "1" : "0.001"} type="number" />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-stone-900">Pagos del cierre</legend>
          <p className="mt-1 text-sm text-stone-500">El total se calculará sumando efectivo y Yape; no se almacena un total redundante.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-stone-700">
              <span className="flex items-center gap-2"><Banknote aria-hidden="true" className="size-4" /> Efectivo (S/)</span>
              <input className="h-11 w-full rounded-xl border border-stone-200 px-3" min="0" name="cash_amount" placeholder="0.00" required step="0.01" type="number" />
            </label>
            <label className="space-y-2 text-sm font-medium text-stone-700">
              <span className="flex items-center gap-2"><Smartphone aria-hidden="true" className="size-4" /> Yape (S/)</span>
              <input className="h-11 w-full rounded-xl border border-stone-200 px-3" min="0" name="yape_amount" placeholder="0.00" required step="0.01" type="number" />
            </label>
          </div>
        </fieldset>
        {state.message ? <p className={state.status === "error" ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
        <Button className="h-11 bg-stone-950 px-5 text-white hover:bg-stone-800" disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <CheckCircle2 aria-hidden="true" />} Cerrar turno definitivamente
        </Button>
      </form>
    </section>
  );
}
