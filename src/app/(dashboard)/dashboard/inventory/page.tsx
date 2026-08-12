import { Boxes, Clock3, MapPin, UserRound } from "lucide-react";
import type { Metadata } from "next";

import { requirePermission } from "@/features/auth/server/require-permission";
import { InventoryMovementForm } from "@/features/inventory/components/inventory-movement-form";
import { movementLabels, wasteReasonLabels } from "@/features/inventory/config";
import { getInventoryDashboard } from "@/features/inventory/server/inventory-service";

export const metadata: Metadata = { title: "Inventario" };

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export default async function InventoryPage() {
  const profile = await requirePermission("inventory.entry");
  const dashboard = await getInventoryDashboard();
  const productsById = new Map(dashboard.products.map((product) => [product.id, product]));

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <Boxes aria-hidden="true" className="size-4" /> Control operativo
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Movimientos de inventario
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          Registra entradas, mermas y correcciones autorizadas dentro de un turno abierto. Cada movimiento conserva autor, hora y detalle de productos.
        </p>
      </section>

      <InventoryMovementForm
        openShifts={dashboard.openShifts}
        products={dashboard.products}
        role={profile.role}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Historial reciente</h2>
          <p className="mt-1 text-sm text-stone-500">
            Los empleados ven sus movimientos; gerencia puede revisar todos.
          </p>
        </div>
        {dashboard.movements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            Todavía no hay movimientos visibles para tu cuenta.
          </div>
        ) : (
          <div className="grid gap-4">
            {dashboard.movements.map((movement) => (
              <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={movement.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{movementLabels[movement.movement_type]}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                      <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{movement.shift?.location?.name ?? "Sede registrada"}</span>
                      <span className="inline-flex items-center gap-1.5"><UserRound aria-hidden="true" className="size-4" />{movement.creator?.full_name ?? "Usuario registrado"}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-4" />{timeFormatter.format(new Date(movement.created_at))}</span>
                    </div>
                    {movement.reason ? (
                      <p className="mt-3 text-sm text-stone-600">
                        Motivo: {wasteReasonLabels[movement.reason] ?? movement.reason}
                        {movement.notes ? ` · ${movement.notes}` : ""}
                      </p>
                    ) : movement.notes ? <p className="mt-3 text-sm text-stone-600">{movement.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:max-w-md sm:justify-end">
                    {movement.items.map((item) => {
                      const product = productsById.get(item.product_id);
                      return (
                        <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-700" key={item.product_id}>
                          {product?.name ?? "Producto"}: {item.quantity}{product?.unit_type === "LITER" ? " L" : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
