import { CreditCard, MapPin, PackageSearch, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { hasPermission } from "@/features/auth/config/permissions";
import { requirePermission } from "@/features/auth/server/require-permission";
import { LocationForm } from "@/features/catalogs/components/location-form";
import { ProductForm } from "@/features/catalogs/components/product-form";
import { getCatalogSnapshot } from "@/features/catalogs/server/catalog-service";

export const metadata: Metadata = {
  title: "Catálogos",
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          : "rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500"
      }
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export default async function CatalogsPage() {
  const profile = await requirePermission("catalogs.read");
  const { locations, paymentMethods, products } = await getCatalogSnapshot();
  const canManage = hasPermission(profile.role, "catalogs.manage");

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <PackageSearch aria-hidden="true" className="size-4" />
          Catálogos operativos
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Sedes, productos y pagos
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          Estos datos provienen de PostgreSQL y serán utilizados por los formularios operativos de las siguientes fases.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sedes", count: locations.length, icon: MapPin },
          { label: "Productos", count: products.length, icon: PackageSearch },
          {
            label: "Métodos de pago",
            count: paymentMethods.length,
            icon: CreditCard,
          },
        ].map(({ label, count, icon: Icon }) => (
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={label}>
            <Icon aria-hidden="true" className="size-5 text-orange-600" />
            <p className="mt-4 text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-950">{count}</p>
          </article>
        ))}
      </section>

      {canManage ? (
        <section className="rounded-3xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-orange-600" />
            <div>
              <h2 className="font-semibold text-stone-950">Configuración administrativa</h2>
              <p className="mt-1 text-sm text-stone-600">
                Los cambios se validan nuevamente en servidor y mediante RLS.
              </p>
            </div>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <LocationForm />
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <ProductForm />
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Sedes</h2>
          <p className="mt-1 text-sm text-stone-500">Ubicaciones disponibles para la operación diaria.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={location.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-stone-950">{location.name}</p>
                  <p className="mt-1 font-mono text-xs text-stone-500">{location.code}</p>
                </div>
                <StatusBadge active={location.active} />
              </div>
              {canManage ? (
                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-orange-700">Editar sede</summary>
                  <div className="mt-5">
                    <LocationForm location={location} />
                  </div>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Productos</h2>
          <p className="mt-1 text-sm text-stone-500">Catálogo ordenado que alimentará inventarios, transferencias y cierres.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Orden</th>
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold">Unidad</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  {canManage ? <th className="px-5 py-3 font-semibold">Acción</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((product) => (
                  <tr className="align-top" key={product.id}>
                    <td className="px-5 py-4 font-medium text-stone-500">{product.display_order}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-950">{product.name}</p>
                      <p className="mt-1 font-mono text-xs text-stone-500">{product.code}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {product.unit_type === "UNIT" ? "Unidad" : "Litro"}
                    </td>
                    <td className="px-5 py-4"><StatusBadge active={product.active} /></td>
                    {canManage ? (
                      <td className="px-5 py-4">
                        <details>
                          <summary className="cursor-pointer font-medium text-orange-700">Editar</summary>
                          <div className="mt-5 min-w-[520px] rounded-2xl border border-stone-200 bg-stone-50 p-5">
                            <ProductForm product={product} />
                          </div>
                        </details>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Métodos de pago</h2>
          <p className="mt-1 text-sm text-stone-500">Catálogo V1 de solo lectura para los cierres.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {paymentMethods.map((method) => (
            <article className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={method.id}>
              <div>
                <p className="font-semibold text-stone-950">{method.name}</p>
                <p className="mt-1 font-mono text-xs text-stone-500">{method.code}</p>
              </div>
              <StatusBadge active={method.active} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
