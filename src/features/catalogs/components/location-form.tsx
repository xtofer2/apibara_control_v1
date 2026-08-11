"use client";

import { LoaderCircle, MapPin, Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialCatalogActionState } from "@/features/catalogs/action-state";
import {
  createLocationAction,
  updateLocationAction,
} from "@/features/catalogs/actions";
import type { Location } from "@/features/catalogs/types";

import { FieldError, FormFeedback } from "./form-feedback";

const inputClassName =
  "h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

export function LocationForm({ location }: { location?: Location }) {
  const action = location
    ? updateLocationAction.bind(null, location.id)
    : createLocationAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialCatalogActionState,
  );
  const prefix = location ? `location-${location.id}` : "location-new";

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <MapPin aria-hidden="true" className="size-4" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-950">
            {location ? "Editar sede" : "Nueva sede"}
          </h3>
          <p className="text-xs text-stone-500">
            {location ? location.code : "Agrega una ubicación operativa"}
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
            defaultValue={location?.name}
            id={`${prefix}-name`}
            name="name"
            placeholder="Av. Principal"
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
            defaultValue={location?.code}
            id={`${prefix}-code`}
            name="code"
            placeholder="PRINCIPAL"
            required
          />
          <FieldError errors={state.fieldErrors?.code} id={`${prefix}-code-error`} />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-stone-700">
        <input
          className="size-4 rounded border-stone-300 accent-orange-600"
          defaultChecked={location?.active ?? true}
          name="active"
          type="checkbox"
        />
        Sede activa
      </label>

      <FormFeedback state={state} />

      <Button className="h-10 bg-orange-600 text-white hover:bg-orange-700" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {location ? "Guardar cambios" : "Crear sede"}
      </Button>
    </form>
  );
}
