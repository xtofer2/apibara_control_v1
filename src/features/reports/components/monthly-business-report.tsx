import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarCheck2,
  CalendarX2,
  CircleAlert,
  Filter,
  MapPin,
  PackageOpen,
  Smartphone,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { summarizeMonthlyBusiness } from "@/features/reports/lib/monthly-summary";
import type {
  MonthlyReportFilters,
  ReportFilters,
} from "@/features/reports/schemas/report";
import type {
  MonthlyDailyIncomeRow,
  MonthlyLocationIncomeRow,
  MonthlyProductSalesRow,
} from "@/features/reports/types";

type LocationOption = {
  code: string;
  id: string;
  name: string;
};

type MonthlyBusinessReportProps = {
  currentLimaMonth: string;
  dailyFilters: ReportFilters;
  filters: MonthlyReportFilters;
  locations: LocationOption[];
  report: {
    days: MonthlyDailyIncomeRow[];
    locations: MonthlyLocationIncomeRow[];
    previousDays: MonthlyDailyIncomeRow[];
    products: MonthlyProductSalesRow[];
  };
};

const money = new Intl.NumberFormat("es-PE", {
  currency: "PEN",
  style: "currency",
});
const quantity = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 });
const monthLabel = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const shortDate = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  weekday: "short",
});

function asUtcDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function formatMonth(value: string) {
  const label = monthLabel.format(asUtcDate(`${value}-01`));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDay(value: string) {
  return shortDate.format(asUtcDate(value)).replace(".", "");
}

function formatProductQuantity(row: MonthlyProductSalesRow) {
  return `${quantity.format(row.calculated_sales)} ${row.unit_type === "UNIT" ? "unid." : "L"}`;
}

export function MonthlyBusinessReport({
  currentLimaMonth,
  dailyFilters,
  filters,
  locations,
  report,
}: MonthlyBusinessReportProps) {
  const summary = summarizeMonthlyBusiness({
    currentDays: report.days,
    currentLimaMonth,
    currentMonth: filters.month,
    locations: report.locations,
    previousDays: report.previousDays,
    products: report.products,
  });
  const maximumDailyIncome = Math.max(
    ...report.days.map((day) => day.total_income),
    1,
  );
  const maximumLocationIncome = Math.max(
    ...summary.locations.map((location) => location.total_income),
    1,
  );
  const selectedLocation = locations.find(
    (location) => location.id === filters.monthly_location_id,
  );

  return (
    <section className="space-y-6" aria-labelledby="monthly-report-title">
      <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
              <TrendingUp aria-hidden="true" className="size-4" />
              Inteligencia del negocio · Solo administrador
            </div>
            <h2 id="monthly-report-title" className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
              Resumen mensual
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Ingresos por cierres, comportamiento diario, desempeño por local y cantidades vendidas por producto.
            </p>
          </div>

          <form className="grid gap-3 sm:grid-cols-[minmax(160px,1fr)_minmax(190px,1fr)_auto] xl:min-w-[660px]" method="get">
            <input name="date" type="hidden" value={dailyFilters.date} />
            {dailyFilters.location_id ? <input name="location_id" type="hidden" value={dailyFilters.location_id} /> : null}
            {dailyFilters.user_id ? <input name="user_id" type="hidden" value={dailyFilters.user_id} /> : null}
            <label className="space-y-1.5 text-sm font-medium text-stone-700">
              Mes
              <input
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
                defaultValue={filters.month}
                max={currentLimaMonth}
                name="month"
                type="month"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone-700">
              Local
              <select
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
                defaultValue={filters.monthly_location_id ?? ""}
                name="monthly_location_id"
              >
                <option value="">Todos los locales</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>
            <button className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700" type="submit">
              <Filter aria-hidden="true" className="size-4" /> Analizar
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-stone-950 px-3 py-1.5 font-medium text-white">{formatMonth(filters.month)}</span>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-600">
            {selectedLocation?.name ?? "Todos los locales"}
          </span>
          {filters.month === currentLimaMonth ? (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">Mes en curso · datos hasta hoy</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Banknote} label="Ingresos del periodo" value={money.format(summary.income)} />
        <VariationCard value={summary.variationPercent} />
        <MetricCard icon={BarChart3} label="Promedio por día con cierre" value={money.format(summary.averageIncome)} />
        <MetricCard icon={CalendarCheck2} label="Días con cierre" value={`${summary.daysWithClosing} de ${report.days.length}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-stone-950">Comportamiento por día</h3>
              <p className="mt-1 text-sm text-stone-500">El color y la barra permiten detectar rápidamente días altos, bajos o sin operación.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Mejor día</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Menor venta</span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">Sin operación</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {report.days.map((day) => (
              <DayCard
                day={day}
                isBest={day.operational_date === summary.bestDay?.operational_date}
                isLowest={day.operational_date === summary.lowestDay?.operational_date && summary.daysWithClosing > 1}
                key={day.operational_date}
                maximumIncome={maximumDailyIncome}
              />
            ))}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-stone-950">Origen de los ingresos</h3>
            <p className="mt-1 text-sm text-stone-500">Pagos registrados en los cierres del periodo.</p>
            <div className="mt-5 space-y-4">
              <PaymentRow icon={Banknote} label="Efectivo" total={summary.income} value={summary.cash} />
              <PaymentRow icon={Smartphone} label="Yape" total={summary.income} value={summary.yape} />
            </div>
          </article>

          <article className="rounded-3xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
            <div className="flex items-center gap-2 font-semibold text-stone-950">
              <Sparkles aria-hidden="true" className="size-5 text-orange-600" /> Lectura gerencial
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
              {summary.bestDay ? <li>El mejor día fue <strong>{formatDay(summary.bestDay.operational_date)}</strong>, con {money.format(summary.bestDay.total_income)}.</li> : <li>Aún no existen cierres con ingresos para este periodo.</li>}
              {summary.lowestDay ? <li>El día con menor ingreso entre los cierres fue <strong>{formatDay(summary.lowestDay.operational_date)}</strong>, con {money.format(summary.lowestDay.total_income)}.</li> : null}
              <li>{summary.noOperationDays} días no registran operación y {summary.pendingDays} tienen un turno todavía abierto.</li>
              {summary.zeroIncomeDays > 0 ? <li>{summary.zeroIncomeDays} días tienen cierre con ingreso S/ 0.00; conviene revisar esos cierres.</li> : null}
            </ul>
          </article>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-stone-950">Ingresos por local</h3>
          </div>
          <p className="mt-1 text-sm text-stone-500">Comparación basada en los pagos de cada cierre.</p>
          <div className="mt-5 space-y-5">
            {summary.locations.length > 0 ? summary.locations.map((location, index) => (
              <div key={location.location_id}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-950">{index + 1}. {location.location_name}</p>
                    <p className="text-xs text-stone-500">{location.closed_shift_count} cierres · {location.location_code}</p>
                  </div>
                  <p className="font-semibold text-stone-950">{money.format(location.total_income)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max((location.total_income / maximumLocationIncome) * 100, location.total_income > 0 ? 2 : 0)}%` }} />
                </div>
              </div>
            )) : <EmptyState message="No hay locales con información para este periodo." />}
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <PackageOpen aria-hidden="true" className="size-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-stone-950">Productos vendidos</h3>
          </div>
          <p className="mt-1 text-sm text-stone-500">Cantidades calculadas desde inventario; no representan ingreso monetario por producto.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {summary.products.length > 0 ? summary.products.map((product, index) => (
              <div className={`rounded-2xl border p-4 ${product.calculated_sales < 0 ? "border-red-200 bg-red-50" : "border-stone-200 bg-stone-50"}`} key={product.product_id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-stone-950">{product.product_name}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-stone-500">#{index + 1}</span>
                </div>
                <p className={`mt-3 text-xl font-semibold ${product.calculated_sales < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatProductQuantity(product)}</p>
                <p className="mt-1 text-xs text-stone-500">{product.unit_type === "UNIT" ? "Producto por unidad" : "Producto por litro"}</p>
              </div>
            )) : <EmptyState message="No hay ventas calculadas de productos para este periodo." />}
          </div>
        </article>
      </div>

      <aside className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>Este tablero describe ingresos cobrados, no utilidad. Para calcular margen o ganancia por producto será necesario registrar precios de venta y costos históricos.</p>
      </aside>
    </section>
  );
}

type Icon = typeof BarChart3;

function MetricCard({ icon: IconComponent, label, value }: { icon: Icon; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <IconComponent aria-hidden="true" className="size-5 text-orange-600" />
      <p className="mt-4 text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-950">{value}</p>
    </article>
  );
}

function VariationCard({ value }: { value: number | null }) {
  const IconComponent = value == null ? ArrowRight : value >= 0 ? ArrowUpRight : ArrowDownRight;
  const color = value == null ? "text-stone-500" : value >= 0 ? "text-emerald-700" : "text-red-700";

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <IconComponent aria-hidden="true" className={`size-5 ${color}`} />
      <p className="mt-4 text-sm text-stone-500">Variación vs. mes anterior</p>
      <p className={`mt-1 text-xl font-semibold ${color}`}>{value == null ? "Sin base comparable" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`}</p>
    </article>
  );
}

function DayCard({ day, isBest, isLowest, maximumIncome }: { day: MonthlyDailyIncomeRow; isBest: boolean; isLowest: boolean; maximumIncome: number }) {
  const noOperation = day.closed_shift_count === 0 && day.open_shift_count === 0;
  const pending = day.open_shift_count > 0;
  const stateClass = isBest
    ? "border-emerald-300 bg-emerald-50"
    : isLowest
      ? "border-amber-300 bg-amber-50"
      : pending
        ? "border-blue-200 bg-blue-50"
        : noOperation
          ? "border-stone-200 bg-stone-50"
          : "border-stone-200 bg-white";

  return (
    <div className={`rounded-2xl border p-3 ${stateClass}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium capitalize text-stone-600">{formatDay(day.operational_date)}</p>
        {noOperation ? <CalendarX2 aria-label="Sin operación" className="size-4 text-stone-400" /> : null}
      </div>
      <p className="mt-2 text-sm font-semibold text-stone-950">{money.format(day.total_income)}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${isBest ? "bg-emerald-500" : isLowest ? "bg-amber-500" : "bg-orange-500"}`} style={{ width: `${(day.total_income / maximumIncome) * 100}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-stone-500">{pending ? "Cierre pendiente" : noOperation ? "Sin operación" : `${day.closed_shift_count} cierre${day.closed_shift_count === 1 ? "" : "s"}`}</p>
    </div>
  );
}

function PaymentRow({ icon: IconComponent, label, total, value }: { icon: Icon; label: string; total: number; value: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="flex items-center gap-2 text-stone-600"><IconComponent aria-hidden="true" className="size-4" />{label}</span>
        <strong className="text-stone-950">{money.format(value)}</strong>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-stone-500">{percentage.toFixed(1)}%</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-2xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">{message}</p>;
}
