import {
  AlertTriangle,
  FileClock,
  Filter,
  Settings2,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";

import { auditActionLabels, auditActionOptions } from "@/features/audit/config/events";
import { auditFilterSchema } from "@/features/audit/schemas/audit";
import { getAuditDashboard } from "@/features/audit/server/audit-service";
import type { AuditRow } from "@/features/audit/types";
import { requirePermission } from "@/features/auth/server/require-permission";
import { formatLimaTime, getLimaDate } from "@/features/attendance/lib/date-time";

export const metadata: Metadata = { title: "Auditoría" };

type AuditPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    action?: string | string[];
    user_id?: string | string[];
  }>;
};

function singleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function snapshotObject(value: AuditRow["new_data"]) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function eventContext(row: AuditRow) {
  const snapshot = snapshotObject(row.new_data);
  const origin = typeof snapshot.origin_location_name === "string"
    ? snapshot.origin_location_name
    : null;
  const destination = typeof snapshot.destination_location_name === "string"
    ? snapshot.destination_location_name
    : null;
  const location = typeof snapshot.location_name === "string"
    ? snapshot.location_name
    : null;

  if (origin && destination) {
    return `${origin} → ${destination}`;
  }

  if (location) {
    return location;
  }

  return row.entity_id ? `Entidad ${row.entity_id.slice(0, 8)}` : "Evento de sistema";
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requirePermission("audit.read");
  const rawSearchParams = await searchParams;
  const parsedFilters = auditFilterSchema.safeParse({
    date: singleValue(rawSearchParams.date) ?? getLimaDate(),
    action: singleValue(rawSearchParams.action),
    user_id: singleValue(rawSearchParams.user_id),
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : { date: getLimaDate(), action: undefined, user_id: undefined };
  const dashboard = await getAuditDashboard(filters);
  const discrepancyCount = dashboard.rows.filter(
    (row) => row.action === "TRANSFER_RECEIVED_WITH_DIFFERENCES",
  ).length;
  const adjustmentCount = dashboard.rows.filter(
    (row) => row.action.startsWith("INVENTORY_ADJUSTMENT"),
  ).length;
  const administrativeCount = dashboard.rows.filter(
    (row) => row.action === "ADMIN_UPDATE",
  ).length;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <FileClock aria-hidden="true" className="size-4" />
          Historial inmutable
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Auditoría operativa</h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">Consulta quién realizó cada operación crítica, cuándo ocurrió y qué datos quedaron confirmados. El historial no admite edición ni eliminación desde la aplicación.</p>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
        <form className="grid gap-4 md:grid-cols-4" method="get">
          <label className="space-y-1.5 text-sm font-medium text-stone-700">Fecha
            <input className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal" defaultValue={filters.date} name="date" type="date" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-stone-700">Acción
            <select className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal" defaultValue={filters.action ?? ""} name="action">
              <option value="">Todas</option>
              {auditActionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-stone-700">Responsable
            <select className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal" defaultValue={filters.user_id ?? ""} name="user_id">
              <option value="">Todos</option>
              {dashboard.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}
            </select>
          </label>
          <button className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800" type="submit"><Filter aria-hidden="true" className="size-4" /> Filtrar</button>
        </form>
        {!parsedFilters.success ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Los filtros recibidos no eran válidos y se restablecieron.</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AuditMetric icon={FileClock} label="Eventos" value={dashboard.rows.length} />
        <AuditMetric icon={AlertTriangle} label="Con diferencias" value={discrepancyCount} />
        <AuditMetric icon={SlidersHorizontal} label="Ajustes" value={adjustmentCount} />
        <AuditMetric icon={Settings2} label="Administrativos" value={administrativeCount} />
      </section>

      <section className="space-y-3">
        {dashboard.rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center"><FileClock aria-hidden="true" className="mx-auto size-8 text-stone-400" /><h2 className="mt-4 font-semibold text-stone-950">Sin eventos registrados</h2><p className="mt-2 text-sm text-stone-500">No hay operaciones críticas para los filtros seleccionados.</p></div>
        ) : dashboard.rows.map((row) => <AuditEvent key={row.id} row={row} />)}
      </section>
    </div>
  );
}

type IconComponent = typeof FileClock;

function AuditMetric({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: number }) {
  return <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><Icon aria-hidden="true" className="size-5 text-orange-600" /><p className="mt-4 text-sm text-stone-500">{label}</p><p className="mt-1 text-xl font-semibold text-stone-950">{value}</p></article>;
}

function AuditEvent({ row }: { row: AuditRow }) {
  const isAlert = row.action === "TRANSFER_RECEIVED_WITH_DIFFERENCES";

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isAlert ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-700"}`}>{auditActionLabels[row.action] ?? row.action}</span>
            <span className="text-sm font-medium text-stone-950">{eventContext(row)}</span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-stone-500"><UserRound aria-hidden="true" className="size-4" />{row.actor?.full_name ?? "Sistema"} · {formatLimaTime(row.created_at)}</p>
        </div>
        <details className="sm:text-right">
          <summary className="cursor-pointer text-sm font-medium text-orange-700">Ver evidencia</summary>
          <pre className="mt-3 max-h-72 max-w-full overflow-auto rounded-xl bg-stone-950 p-4 text-left text-xs leading-5 text-stone-200 sm:max-w-xl">{JSON.stringify({ before: row.old_data, after: row.new_data }, null, 2)}</pre>
        </details>
      </div>
    </article>
  );
}
