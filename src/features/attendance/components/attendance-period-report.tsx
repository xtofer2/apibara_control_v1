import { BarChart3, CalendarRange, Clock3, Filter, MapPin } from "lucide-react";

import {
  formatAttendanceDuration,
  formatLimaDate,
  formatLimaTime,
} from "@/features/attendance/lib/date-time";
import { summarizeAttendancePeriod } from "@/features/attendance/lib/period-summary";
import type {
  AttendancePeriodFilters,
  AttendanceReportFilters,
} from "@/features/attendance/schemas/attendance";
import type { AttendancePeriodRow } from "@/features/attendance/types";

type AttendancePeriodReportProps = {
  dailyFilters: AttendanceReportFilters;
  employees: Array<{ id: string; full_name: string }>;
  filters: AttendancePeriodFilters;
  filtersValid: boolean;
  rows: AttendancePeriodRow[] | null;
};

const locationStyles = [
  { cell: "border-orange-600 bg-orange-600 text-white", dot: "bg-orange-600" },
  { cell: "border-blue-600 bg-blue-600 text-white", dot: "bg-blue-600" },
  { cell: "border-emerald-600 bg-emerald-600 text-white", dot: "bg-emerald-600" },
  { cell: "border-violet-600 bg-violet-600 text-white", dot: "bg-violet-600" },
];

const weekdayFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "short",
});

function formatWeekday(value: string) {
  return weekdayFormatter
    .format(new Date(`${value}T12:00:00-05:00`))
    .replace(".", "");
}

export function AttendancePeriodReport({
  dailyFilters,
  employees,
  filters,
  filtersValid,
  rows,
}: AttendancePeriodReportProps) {
  const summary = rows ? summarizeAttendancePeriod(rows) : null;
  const employeeName = employees.find(
    (employee) => employee.id === filters.period_user_id,
  )?.full_name;
  const styleByLocation = new Map(
    summary?.locations.map((location, index) => [
      location.id,
      locationStyles[index % locationStyles.length],
    ]),
  );

  return (
    <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CalendarRange aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Reporte de asistencia por período
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Revisa los días registrados y sin registro de un empleado entre dos fechas.
          </p>
        </div>
      </div>

      <form className="grid gap-4 rounded-2xl bg-stone-50 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]" method="get">
        <input name="date" type="hidden" value={dailyFilters.date} />
        {dailyFilters.location_id ? (
          <input name="location_id" type="hidden" value={dailyFilters.location_id} />
        ) : null}
        {dailyFilters.user_id ? (
          <input name="user_id" type="hidden" value={dailyFilters.user_id} />
        ) : null}
        <label className="space-y-1.5 text-sm font-medium text-stone-700">
          Empleado
          <select
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
            defaultValue={filters.period_user_id ?? ""}
            name="period_user_id"
            required
          >
            <option disabled value="">Selecciona un empleado</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-stone-700">
          Desde
          <input
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
            defaultValue={filters.period_from}
            name="period_from"
            required
            type="date"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-stone-700">
          Hasta
          <input
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
            defaultValue={filters.period_to}
            name="period_to"
            required
            type="date"
          />
        </label>
        <button
          className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-medium text-white hover:bg-stone-800"
          type="submit"
        >
          <Filter aria-hidden="true" className="size-4" />
          Generar reporte
        </button>
      </form>

      {!filtersValid ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          El empleado o el intervalo no es válido. El período máximo permitido es de 366 días.
        </p>
      ) : null}

      {rows === null ? (
        <div className="rounded-2xl border border-dashed border-stone-300 px-5 py-10 text-center text-sm text-stone-500">
          Selecciona un empleado y genera el reporte.
        </div>
      ) : (
        <>
          <div>
            <p className="font-semibold text-stone-950">{employeeName ?? "Empleado"}</p>
            <p className="mt-1 text-sm text-stone-500">
              {formatLimaDate(filters.period_from)} – {formatLimaDate(filters.period_to)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Días del intervalo</p>
              <p className="mt-1 text-2xl font-semibold text-stone-950">{summary?.calendarDays ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Con asistencia</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary?.attendanceDays ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Sin registro</p>
              <p className="mt-1 text-2xl font-semibold text-stone-600">{summary?.missingDays ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs text-stone-500">Sedes visitadas</p>
              <p className="mt-1 text-2xl font-semibold text-blue-700">{summary?.locations.length ?? 0}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-stone-950">Asistencia diaria</h3>
                <p className="mt-1 text-xs text-stone-500">Cada cuadro representa un día calendario.</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-600">
                {summary?.locations.map((location) => (
                  <span className="inline-flex items-center gap-1.5" key={location.id}>
                    <span className={`size-2.5 rounded-sm ${styleByLocation.get(location.id)?.dot}`} />
                    {location.name} · {location.days} d
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-stone-200" />
                  Sin registro
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10">
              {rows.map((row) => {
                const style = row.location_id
                  ? styleByLocation.get(row.location_id)?.cell
                  : "border-stone-200 bg-stone-100 text-stone-500";

                return (
                  <div
                    className={`flex min-h-16 flex-col items-center justify-center rounded-xl border px-1 text-center ${style}`}
                    key={row.work_date}
                    title={row.location_name ?? "Sin registro"}
                  >
                    <span className="text-[11px] capitalize opacity-80">{formatWeekday(row.work_date)}</span>
                    <span className="text-base font-semibold">{row.work_date.slice(-2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Sede</th>
                    <th className="px-4 py-3 font-semibold">Entrada</th>
                    <th className="px-4 py-3 font-semibold">Salida</th>
                    <th className="px-4 py-3 font-semibold">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((row) => (
                    <tr key={row.work_date}>
                      <td className="px-4 py-4 font-medium text-stone-950">{formatLimaDate(row.work_date)}</td>
                      <td className="px-4 py-4">
                        <span className={row.attendance_id ? "text-emerald-700" : "text-stone-500"}>
                          {row.attendance_id ? "Con asistencia" : "Sin registro"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-stone-600">
                        {row.location_name ? (
                          <span className="inline-flex items-center gap-2">
                            <MapPin aria-hidden="true" className="size-4" />
                            {row.location_name}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-4 text-stone-600">{row.check_in_at ? formatLimaTime(row.check_in_at) : "—"}</td>
                      <td className="px-4 py-4 text-stone-600">{row.check_out_at ? formatLimaTime(row.check_out_at) : row.check_in_at ? "En curso" : "—"}</td>
                      <td className="px-4 py-4 font-medium text-stone-900">
                        {row.check_in_at ? (
                          <span className="inline-flex items-center gap-2">
                            <Clock3 aria-hidden="true" className="size-4" />
                            {formatAttendanceDuration(row.check_in_at, row.check_out_at)}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            <BarChart3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            “Sin registro” no equivale a falta mientras el sistema no tenga días laborales programados.
          </p>
        </>
      )}
    </section>
  );
}
