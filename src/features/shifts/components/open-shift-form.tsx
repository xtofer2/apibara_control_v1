"use client";

import { Banknote, Boxes, CalendarDays, LoaderCircle, MapPin, Play } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialShiftActionState } from "@/features/shifts/action-state";
import { openShiftAction } from "@/features/shifts/actions";
import type { ShiftLocation, ShiftProduct } from "@/features/shifts/types";

type OpenShiftFormProps = {
  availableLocations: ShiftLocation[];
  canChooseOperationalDate: boolean;
  defaultOperationalDate: string;
  products: ShiftProduct[];
};

export function OpenShiftForm({
  availableLocations,
  canChooseOperationalDate,
  defaultOperationalDate,
  products,
}: OpenShiftFormProps) {
  const [state, formAction, pending] = useActionState(
    openShiftAction,
    initialShiftActionState,
  );

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <Play aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Abrir turno operativo</h2>
          <p className="mt-1 text-sm text-stone-500">
            Confirma la sede, el efectivo físico y el conteo inicial completo.
          </p>
        </div>
      </div>

      {availableLocations.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
          Todas las sedes activas ya tienen un turno abierto.
        </p>
      ) : (
        <form action={formAction} className="mt-7 space-y-7">
          <div className={`grid gap-5 sm:grid-cols-2 ${canChooseOperationalDate ? "lg:grid-cols-3" : ""}`}>
            <label className="space-y-2 text-sm font-medium text-stone-700">
              <span className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4" /> Sede
              </span>
              <select
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-stone-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                defaultValue=""
                name="location_id"
                required
              >
                <option disabled value="">Selecciona una sede</option>
                {availableLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} · {location.code}
                  </option>
                ))}
              </select>
            </label>

            {canChooseOperationalDate ? (
              <label className="space-y-2 text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4" /> Fecha operativa
                </span>
                <input
                  className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-stone-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                  defaultValue={defaultOperationalDate}
                  name="operational_date"
                  required
                  type="date"
                />
                <span className="block text-xs font-normal text-stone-500">
                  Uso administrativo. La hora real se registra en servidor.
                </span>
              </label>
            ) : null}

            <label className="space-y-2 text-sm font-medium text-stone-700">
              <span className="flex items-center gap-2">
                <Banknote aria-hidden="true" className="size-4" /> Efectivo inicial (S/)
              </span>
              <input
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-stone-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                inputMode="decimal"
                min="0"
                name="cash_opening"
                placeholder="0.00"
                required
                step="0.01"
                type="number"
              />
            </label>
          </div>

          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Boxes aria-hidden="true" className="size-4" /> Inventario de apertura
            </legend>
            <p className="mt-1 text-sm text-stone-500">
              Incluye incluso los productos cuyo conteo inicial sea cero.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4"
                  key={product.id}
                >
                  <span>
                    <span className="block text-sm font-medium text-stone-950">{product.name}</span>
                    <span className="mt-1 block text-xs text-stone-500">
                      {product.unit_type === "UNIT" ? "Unidades" : "Litros"}
                    </span>
                  </span>
                  <input
                    aria-label={`Cantidad de ${product.name}`}
                    className="h-10 w-28 rounded-xl border border-stone-200 px-3 text-right text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    min="0"
                    name={`quantity.${product.id}`}
                    placeholder="0"
                    required
                    step={product.unit_type === "UNIT" ? "1" : "0.001"}
                    type="number"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {state.message ? (
            <p
              className={state.status === "error"
                ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          ) : null}

          <Button
            className="h-11 bg-orange-600 px-5 text-white hover:bg-orange-700"
            disabled={pending || products.length === 0}
            type="submit"
          >
            {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Play aria-hidden="true" />}
            Confirmar apertura
          </Button>
        </form>
      )}
    </section>
  );
}
