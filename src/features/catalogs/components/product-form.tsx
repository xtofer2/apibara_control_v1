"use client";

import { LoaderCircle, PackagePlus, Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialCatalogActionState } from "@/features/catalogs/action-state";
import {
  createProductAction,
  updateProductAction,
} from "@/features/catalogs/actions";
import type { Product } from "@/features/catalogs/types";

import { FieldError, FormFeedback } from "./form-feedback";

const inputClassName =
  "h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

export function ProductForm({ product }: { product?: Product }) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialCatalogActionState,
  );
  const prefix = product ? `product-${product.id}` : "product-new";

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <PackagePlus aria-hidden="true" className="size-4" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-950">
            {product ? "Editar producto" : "Nuevo producto"}
          </h3>
          <p className="text-xs text-stone-500">
            {product ? product.code : "Agrega un producto al catálogo"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700" htmlFor={`${prefix}-name`}>
            Nombre
          </label>
          <input
            aria-describedby={`${prefix}-name-error`}
            className={inputClassName}
            defaultValue={product?.name}
            id={`${prefix}-name`}
            name="name"
            placeholder="Nombre del producto"
            required
          />
          <FieldError errors={state.fieldErrors?.name} id={`${prefix}-name-error`} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700" htmlFor={`${prefix}-code`}>
            Código
          </label>
          <input
            aria-describedby={`${prefix}-code-error`}
            autoCapitalize="characters"
            className={inputClassName}
            defaultValue={product?.code}
            id={`${prefix}-code`}
            name="code"
            placeholder="PRODUCT_CODE"
            required
          />
          <FieldError errors={state.fieldErrors?.code} id={`${prefix}-code-error`} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700" htmlFor={`${prefix}-unit`}>
            Unidad
          </label>
          <select
            className={inputClassName}
            defaultValue={product?.unit_type ?? "UNIT"}
            id={`${prefix}-unit`}
            name="unit_type"
          >
            <option value="UNIT">Unidad</option>
            <option value="LITER">Litro</option>
          </select>
          <FieldError errors={state.fieldErrors?.unit_type} id={`${prefix}-unit-error`} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700" htmlFor={`${prefix}-order`}>
            Orden
          </label>
          <input
            aria-describedby={`${prefix}-order-error`}
            className={inputClassName}
            defaultValue={product?.display_order ?? 0}
            id={`${prefix}-order`}
            min="0"
            name="display_order"
            required
            type="number"
          />
          <FieldError errors={state.fieldErrors?.display_order} id={`${prefix}-order-error`} />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-stone-700">
        <input
          className="size-4 rounded border-stone-300 accent-orange-600"
          defaultChecked={product?.active ?? true}
          name="active"
          type="checkbox"
        />
        Producto activo
      </label>

      <FormFeedback state={state} />

      <Button className="h-10 bg-orange-600 text-white hover:bg-orange-700" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {product ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}
