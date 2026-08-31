import {
  Banknote,
  BarChart3,
  CalendarDays,
  Filter,
  MapPin,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";

import { requirePermission } from "@/features/auth/server/require-permission";
import {
  formatLimaDate,
  formatLimaTime,
  getLimaDate,
} from "@/features/attendance/lib/date-time";
import { MonthlyBusinessReport } from "@/features/reports/components/monthly-business-report";
import {
  monthlyReportFilterSchema,
  reportFilterSchema,
  type MonthlyReportFilters,
} from "@/features/reports/schemas/report";
import {
  getAdminMonthlyBusinessReport,
  getManagementReport,
} from "@/features/reports/server/report-service";
import type { ReconciliationRow } from "@/features/reports/types";

export const metadata: Metadata = { title: "Reportes" };

type ReportsPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    location_id?: string | string[];
    month?: string | string[];
    monthly_location_id?: string | string[];
    user_id?: string | string[];
  }>;
};

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
const decimal = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 });

function singleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatQuantity(value: number, unitType: ReconciliationRow["unit_type"]) {
  return `${decimal.format(value)} ${unitType === "UNIT" ? "unid." : "L"}`;
}

function groupByShift(rows: ReconciliationRow[]) {
  const groups = new Map<string, ReconciliationRow[]>();

  for (const row of rows) {
    const current = groups.get(row.work_shift_id) ?? [];
    current.push(row);
    groups.set(row.work_shift_id, current);
  }

  return Array.from(groups.values());
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const profile = await requirePermission("reports.read");
  const rawSearchParams = await searchParams;
  const currentLimaMonth = getLimaDate().slice(0, 7);
  const parsedFilters = reportFilterSchema.safeParse({
    date: singleValue(rawSearchParams.date) ?? getLimaDate(),
    location_id: singleValue(rawSearchParams.location_id),
    user_id: singleValue(rawSearchParams.user_id),
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : { date: getLimaDate(), location_id: undefined, user_id: undefined };
  const parsedMonthlyFilters = monthlyReportFilterSchema.safeParse({
    month: singleValue(rawSearchParams.month) ?? currentLimaMonth,
    monthly_location_id: singleValue(rawSearchParams.monthly_location_id),
  });
  const monthlyFiltersAreValid = parsedMonthlyFilters.success
    && parsedMonthlyFilters.data.month <= currentLimaMonth;
  const monthlyFilters: MonthlyReportFilters = monthlyFiltersAreValid
    ? parsedMonthlyFilters.data
    : { month: currentLimaMonth, monthly_location_id: undefined };
  const [report, monthlyReport] = await Promise.all([
    getManagementReport(filters),
    profile.role === "ADMIN"
      ? getAdminMonthlyBusinessReport(monthlyFilters)
      : Promise.resolve(null),
  ]);
  const shifts = groupByShift(report.rows);
  const totals = shifts.reduce(
    (summary, shiftRows) => ({
      cash: summary.cash + shiftRows[0].cash_amount,
      yape: summary.yape + shiftRows[0].yape_amount,
      closing: summary.closing + shiftRows[0].closing_total,
    }),
    { cash: 0, yape: 0, closing: 0 },
  );

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <BarChart3 aria-hidden="true" className="size-4" />
          Conciliación gerencial
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Ventas calculadas
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          Revisa turnos cerrados, inventario conciliado y pagos. Las ventas se calculan desde los movimientos operativos y no se almacenan como registros independientes.
        </p>
      </section>

      {profile.role === "ADMIN" && monthlyReport ? (
        <>
          <MonthlyBusinessReport
            currentLimaMonth={currentLimaMonth}
            dailyFilters={filters}
            filters={monthlyFilters}
            locations={report.locations}
            report={monthlyReport}
          />
          {!monthlyFiltersAreValid ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              El mes o local recibido no era válido y el análisis mensual se restableció al periodo actual.
            </p>
          ) : null}
        </>
      ) : null}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
        <form className="grid gap-4 md:grid-cols-4" method="get">
          {profile.role === "ADMIN" ? (
            <>
              <input name="month" type="hidden" value={monthlyFilters.month} />
              {monthlyFilters.monthly_location_id ? <input name="monthly_location_id" type="hidden" value={monthlyFilters.monthly_location_id} /> : null}
            </>
          ) : null}
          <label className="space-y-1.5 text-sm font-medium text-stone-700">
            Fecha operativa
            <input className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal" defaultValue={filters.date} name="date" type="date" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-stone-700">
            Sede
            <select className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal" defaultValue={filters.location_id ?? ""} name="location_id">
              <option value="">Todas</option>
              {report.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-stone-700">
            Participación de empleado
            <select className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal" defaultValue={filters.user_id ?? ""} name="user_id">
              <option value="">Todos</option>
              {report.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}
            </select>
          </label>
          <button className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800" type="submit">
            <Filter aria-hidden="true" className="size-4" /> Filtrar
          </button>
        </form>
        {!parsedFilters.success ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">Los filtros recibidos no eran válidos y se restablecieron.</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Turnos cerrados" value={String(shifts.length)} />
        <SummaryCard icon={Banknote} label="Efectivo" value={money.format(totals.cash)} />
        <SummaryCard icon={Smartphone} label="Yape" value={money.format(totals.yape)} />
        <SummaryCard icon={BarChart3} label="Total de cierre" value={money.format(totals.closing)} />
      </section>

      {shifts.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <BarChart3 aria-hidden="true" className="mx-auto size-8 text-stone-400" />
          <h2 className="mt-4 font-semibold text-stone-950">Sin turnos cerrados</h2>
          <p className="mt-2 text-sm text-stone-500">No hay conciliaciones para los filtros seleccionados.</p>
        </section>
      ) : (
        <section className="space-y-6">
          {shifts.map((shiftRows) => <ShiftReport key={shiftRows[0].work_shift_id} rows={shiftRows} />)}
        </section>
      )}

      <aside className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>Un resultado negativo indica una diferencia que debe revisarse; no se corrige ni bloquea automáticamente para preservar la trazabilidad operativa.</p>
      </aside>
    </div>
  );
}

type IconComponent = typeof BarChart3;

function SummaryCard({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <Icon aria-hidden="true" className="size-5 text-orange-600" />
      <p className="mt-4 text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-950">{value}</p>
    </article>
  );
}

function ShiftReport({ rows }: { rows: ReconciliationRow[] }) {
  const shift = rows[0];

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <header className="flex flex-col gap-5 border-b border-stone-200 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-stone-950"><MapPin aria-hidden="true" className="size-5 text-orange-600" />{shift.location_name}</h2>
          <p className="mt-2 text-sm text-stone-500">{formatLimaDate(shift.operational_date)} · {formatLimaTime(shift.opened_at)}–{formatLimaTime(shift.closed_at)}</p>
          <p className="mt-1 text-sm text-stone-500">Apertura: {shift.opened_by_name} · Cierre: {shift.closed_by_name}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">CASH {money.format(shift.cash_amount)}</span>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-800">YAPE {money.format(shift.yape_amount)}</span>
          <span className="rounded-full bg-stone-950 px-3 py-1.5 font-semibold text-white">TOTAL {money.format(shift.closing_total)}</span>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Apertura</th>
              <th className="px-4 py-3 font-semibold">Entradas</th>
              <th className="px-4 py-3 font-semibold">Recibido</th>
              <th className="px-4 py-3 font-semibold">Ajuste +</th>
              <th className="px-4 py-3 font-semibold">Enviado</th>
              <th className="px-4 py-3 font-semibold">Merma</th>
              <th className="px-4 py-3 font-semibold">Ajuste −</th>
              <th className="px-4 py-3 font-semibold">Cierre</th>
              <th className="px-4 py-3 font-semibold">Venta calculada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr key={row.product_id}>
                <td className="px-4 py-4 font-medium text-stone-950">{row.product_name}</td>
                <QuantityCell row={row} value={row.opening_quantity} />
                <QuantityCell row={row} value={row.entry_quantity} />
                <QuantityCell row={row} value={row.received_transfer_quantity} />
                <QuantityCell row={row} value={row.positive_adjustment_quantity} />
                <QuantityCell row={row} value={row.sent_transfer_quantity} />
                <QuantityCell row={row} value={row.waste_quantity} />
                <QuantityCell row={row} value={row.negative_adjustment_quantity} />
                <QuantityCell row={row} value={row.closing_quantity} />
                <td className={`px-4 py-4 font-semibold ${row.calculated_sales < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatQuantity(row.calculated_sales, row.unit_type)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function QuantityCell({ row, value }: { row: ReconciliationRow; value: number }) {
  return <td className="px-4 py-4 text-stone-600">{formatQuantity(value, row.unit_type)}</td>;
}
