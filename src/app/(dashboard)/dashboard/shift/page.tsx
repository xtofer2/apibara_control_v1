import { Banknote, Boxes, Clock3, MapPin } from "lucide-react";
import type { Metadata } from "next";

import { requirePermission } from "@/features/auth/server/require-permission";
import { OpenShiftForm } from "@/features/shifts/components/open-shift-form";
import {
  formatCash,
  formatQuantity,
  formatShiftDate,
  formatShiftDateTime,
  getLimaShiftDate,
} from "@/features/shifts/lib/date-time";
import { getShiftDashboard } from "@/features/shifts/server/shift-service";

export const metadata: Metadata = { title: "Turno operativo" };

export default async function ShiftPage() {
  const profile = await requirePermission("shifts.operate");
  const dashboard = await getShiftDashboard();
  const openByLocation = new Map(dashboard.openShifts.map((shift) => [shift.location_id, shift]));
  const availableLocations = dashboard.locations.filter((location) => !openByLocation.has(location.id));
  const productsById = new Map(dashboard.products.map((product) => [product.id, product]));

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <Clock3 aria-hidden="true" className="size-4" /> Operación diaria
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Turnos y apertura
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          Cada sede admite un solo turno abierto. La apertura queda confirmada con hora de servidor y no puede editarse silenciosamente.
        </p>
      </section>

      <OpenShiftForm
        availableLocations={availableLocations}
        canChooseOperationalDate={profile.role === "ADMIN"}
        defaultOperationalDate={getLimaShiftDate()}
        products={dashboard.products}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Turnos abiertos</h2>
          <p className="mt-1 text-sm text-stone-500">Estado operativo actual de las sedes activas.</p>
        </div>

        {dashboard.openShifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            No hay turnos operativos abiertos.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {dashboard.openShifts.map((shift) => {
              const location = dashboard.locations.find((item) => item.id === shift.location_id);
              return (
                <article className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6" key={shift.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <span className="size-2 rounded-full bg-emerald-500" /> Turno abierto
                      </p>
                      <h3 className="mt-3 flex items-center gap-2 text-xl font-semibold text-stone-950">
                        <MapPin aria-hidden="true" className="size-5" /> {location?.name ?? "Sede registrada"}
                      </h3>
                      <p className="mt-2 text-sm text-stone-600">
                        Fecha operativa: {formatShiftDate(shift.operational_date)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Registrado en servidor: {formatShiftDateTime(shift.opened_at)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                      <p className="flex items-center gap-1 text-xs text-stone-500"><Banknote aria-hidden="true" className="size-3" /> Efectivo inicial</p>
                      <p className="mt-1 font-semibold text-stone-950">{formatCash(shift.opening?.cash_opening ?? 0)}</p>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-emerald-200 pt-5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                      <Boxes aria-hidden="true" className="size-4" /> Conteo inicial
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(shift.opening?.items ?? []).map((item) => {
                        const product = productsById.get(item.product_id);
                        return (
                          <div className="flex justify-between gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm" key={item.product_id}>
                            <span className="text-stone-600">{product?.name ?? "Producto registrado"}</span>
                            <span className="font-semibold text-stone-950">
                              {formatQuantity(item.quantity, product?.unit_type ?? "UNIT")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
