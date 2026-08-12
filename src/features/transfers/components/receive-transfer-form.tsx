"use client";

import { LoaderCircle, PackageCheck } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialTransferActionState } from "@/features/transfers/action-state";
import { receiveTransferAction } from "@/features/transfers/actions";
import type { TransferHistoryRow, TransferOpenShift, TransferProduct } from "@/features/transfers/types";

type Props = { transfer: TransferHistoryRow; destinationShift: TransferOpenShift; products: TransferProduct[] };

export function ReceiveTransferForm({ transfer, destinationShift, products }: Props) {
  const [state, formAction, pending] = useActionState(receiveTransferAction, initialTransferActionState);
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <form action={formAction} className="mt-4 space-y-4 border-t border-blue-200 pt-4">
      <input name="transfer_id" type="hidden" value={transfer.id} />
      <input name="destination_work_shift_id" type="hidden" value={destinationShift.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        {transfer.items.map((item) => {
          const product = productsById.get(item.product_id);
          return (
            <label className="rounded-xl bg-white p-3 text-sm" key={item.product_id}>
              <span className="flex justify-between gap-2"><span className="font-medium text-stone-900">{product?.name ?? "Producto"}</span><span className="text-stone-500">Enviado: {item.sent_quantity}</span></span>
              <span className="mt-2 block text-xs text-stone-500">Cantidad recibida</span>
              <input aria-label={`Cantidad recibida de ${product?.name ?? "producto"}`} className="mt-1 h-10 w-full rounded-xl border border-stone-200 px-3" defaultValue={item.sent_quantity} min="0" name={`received.${item.product_id}`} required step={product?.unit_type === "UNIT" ? "1" : "0.001"} type="number" />
            </label>
          );
        })}
      </div>
      <label className="block space-y-2 text-sm font-medium text-stone-700">
        Observación de recepción
        <textarea className="min-h-20 w-full rounded-xl border border-stone-200 bg-white px-3 py-2" maxLength={500} name="reception_notes" placeholder="Obligatoria si alguna cantidad es diferente" />
      </label>
      {state.message ? <p className={state.status === "error" ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
      <Button className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-700" disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <PackageCheck aria-hidden="true" />} Confirmar recepción
      </Button>
    </form>
  );
}
