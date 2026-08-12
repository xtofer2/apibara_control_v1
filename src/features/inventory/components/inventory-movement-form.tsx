"use client";

import { Boxes, ClipboardPlus, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { hasPermission } from "@/features/auth/config/permissions";
import type { AppRole } from "@/features/auth/config/navigation";
import { initialInventoryActionState } from "@/features/inventory/action-state";
import { createInventoryMovementAction } from "@/features/inventory/actions";
import { movementLabels, wasteReasonLabels } from "@/features/inventory/config";
import type {
  InventoryMovementType,
  InventoryOpenShift,
  InventoryProduct,
} from "@/features/inventory/types";

type Props = {
  openShifts: InventoryOpenShift[];
  products: InventoryProduct[];
  role: AppRole;
};

export function InventoryMovementForm({ openShifts, products, role }: Props) {
  const [state, formAction, pending] = useActionState(
    createInventoryMovementAction,
    initialInventoryActionState,
  );
  const [movementType, setMovementType] = useState<InventoryMovementType>("ENTRY");
  const [reason, setReason] = useState("");
  const canAdjust = hasPermission(role, "inventory.adjustment");
  const needsReason = movementType !== "ENTRY";
  const needsNotes = movementType.startsWith("ADJUSTMENT_") ||
    (movementType === "WASTE" && reason === "OTHER");

  async function submitAction(formData: FormData) {
    await formAction(formData);
    setMovementType("ENTRY");
    setReason("");
  }

  if (openShifts.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <Boxes aria-hidden="true" className="mx-auto size-8 text-stone-400" />
        <h2 className="mt-3 font-semibold text-stone-950">No hay turnos abiertos</h2>
        <p className="mt-1 text-sm text-stone-500">Abre un turno con su inventario inicial antes de registrar movimientos.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <ClipboardPlus aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Nuevo movimiento</h2>
          <p className="mt-1 text-sm text-stone-500">Registra cantidades positivas; el tipo determina su efecto en inventario.</p>
        </div>
      </div>

      <form action={submitAction} className="mt-7 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Turno abierto
            <select className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3" name="work_shift_id" required>
              {openShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>{shift.location?.name ?? "Sede registrada"}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Tipo de movimiento
            <select
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3"
              name="movement_type"
              onChange={(event) => { setMovementType(event.target.value as InventoryMovementType); setReason(""); }}
              value={movementType}
            >
              <option value="ENTRY">{movementLabels.ENTRY}</option>
              <option value="WASTE">{movementLabels.WASTE}</option>
              {canAdjust ? <option value="ADJUSTMENT_POSITIVE">{movementLabels.ADJUSTMENT_POSITIVE}</option> : null}
              {canAdjust ? <option value="ADJUSTMENT_NEGATIVE">{movementLabels.ADJUSTMENT_NEGATIVE}</option> : null}
            </select>
          </label>
        </div>

        {needsReason ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-stone-700">
              Motivo
              {movementType === "WASTE" ? (
                <select
                  className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3"
                  name="reason"
                  onChange={(event) => setReason(event.target.value)}
                  required
                  value={reason}
                >
                  <option value="">Selecciona un motivo</option>
                  {Object.entries(wasteReasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              ) : (
                <input className="h-11 w-full rounded-xl border border-stone-200 px-3" maxLength={100} name="reason" placeholder="Ej. Corrección de conteo" required />
              )}
            </label>
            <label className="space-y-2 text-sm font-medium text-stone-700">
              Observación {needsNotes ? "(obligatoria)" : "(opcional)"}
              <textarea className="min-h-24 w-full rounded-xl border border-stone-200 px-3 py-2" maxLength={500} name="notes" required={needsNotes} />
            </label>
          </div>
        ) : (
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            Observación (opcional)
            <textarea className="min-h-20 w-full rounded-xl border border-stone-200 px-3 py-2" maxLength={500} name="notes" />
          </label>
        )}

        <fieldset>
          <legend className="text-sm font-semibold text-stone-900">Productos y cantidades</legend>
          <p className="mt-1 text-sm text-stone-500">Deja vacío cualquier producto que no forme parte del movimiento.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4" key={product.id}>
                <span>
                  <span className="block text-sm font-medium text-stone-950">{product.name}</span>
                  <span className="mt-1 block text-xs text-stone-500">{product.unit_type === "UNIT" ? "Unidades" : "Litros"}</span>
                </span>
                <input
                  aria-label={`Cantidad de ${product.name}`}
                  className="h-10 w-28 rounded-xl border border-stone-200 px-3 text-right text-sm"
                  min="0"
                  name={`quantity.${product.id}`}
                  step={product.unit_type === "UNIT" ? "1" : "0.001"}
                  type="number"
                />
              </label>
            ))}
          </div>
        </fieldset>

        {state.message ? (
          <p className={state.status === "error" ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"} role={state.status === "error" ? "alert" : "status"}>
            {state.message}
          </p>
        ) : null}

        <Button className="h-11 bg-orange-600 px-5 text-white hover:bg-orange-700" disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <ClipboardPlus aria-hidden="true" />}
          Registrar movimiento
        </Button>
      </form>
    </section>
  );
}
