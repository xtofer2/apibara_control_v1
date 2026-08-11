import { CalendarCheck2, Clock3, Filter, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";

import { hasPermission } from "@/features/auth/config/permissions";
import { requirePermission } from "@/features/auth/server/require-permission";
import { AttendanceControl } from "@/features/attendance/components/attendance-control";
import {
  formatAttendanceDuration,
  formatLimaDate,
  formatLimaTime,
  getLimaDate,
} from "@/features/attendance/lib/date-time";
import { attendanceReportFilterSchema } from "@/features/attendance/schemas/attendance";
import {
  getEmployeeAttendanceDashboard,
  getManagerAttendanceDashboard,
} from "@/features/attendance/server/attendance-service";

export const metadata: Metadata = {
  title: "Asistencia",
};

type AttendancePageProps = {
  searchParams: Promise<{
    date?: string | string[];
    location_id?: string | string[];
    user_id?: string | string[];
  }>;
};

function singleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const profile = await requirePermission("attendance.operate");
  const employeeDashboard = await getEmployeeAttendanceDashboard(profile.id);
  const canReadAll = hasPermission(profile.role, "attendance.read_all");
  const rawSearchParams = await searchParams;
  const parsedFilters = attendanceReportFilterSchema.safeParse({
    date: singleValue(rawSearchParams.date) ?? getLimaDate(),
    location_id: singleValue(rawSearchParams.location_id),
    user_id: singleValue(rawSearchParams.user_id),
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : { date: getLimaDate(), location_id: undefined, user_id: undefined };
  const managerDashboard = canReadAll
    ? await getManagerAttendanceDashboard(filters)
    : null;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <CalendarCheck2 aria-hidden="true" className="size-4" />
          Control de asistencia
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Entrada y salida
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          La asistencia es independiente de los turnos operativos. Todas las horas se registran en servidor con la zona horaria de Lima.
        </p>
      </section>

      <AttendanceControl
        current={
          employeeDashboard.current
            ? {
                checkInLabel: formatLimaTime(
                  employeeDashboard.current.check_in_at,
                ),
                locationName:
                  employeeDashboard.current.location?.name ?? "Sede registrada",
              }
            : null
        }
        locations={employeeDashboard.locations}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Mis registros recientes
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Últimas siete jornadas registradas en tu cuenta.
          </p>
        </div>

        {employeeDashboard.recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            Todavía no tienes registros de asistencia.
          </div>
        ) : (
          <div className="grid gap-3">
            {employeeDashboard.recent.map((attendance) => (
              <article
                className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"
                key={attendance.id}
              >
                <div>
                  <p className="font-medium text-stone-950">
                    {attendance.location?.name ?? "Sede registrada"}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatLimaDate(attendance.work_date)}
                  </p>
                </div>
                <div className="text-sm text-stone-600">
                  {formatLimaTime(attendance.check_in_at)} – {attendance.check_out_at ? formatLimaTime(attendance.check_out_at) : "En curso"}
                </div>
                <div className="text-sm font-semibold text-stone-900">
                  {formatAttendanceDuration(
                    attendance.check_in_at,
                    attendance.check_out_at,
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {managerDashboard ? (
        <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-950">
                Consulta gerencial
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Revisa quién trabajó por fecha, sede o empleado.
              </p>
            </div>
          </div>

          <form className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-4" method="get">
            <label className="space-y-1.5 text-sm font-medium text-stone-700">
              Fecha
              <input
                className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
                defaultValue={filters.date}
                name="date"
                type="date"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone-700">
              Sede
              <select
                className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
                defaultValue={filters.location_id ?? ""}
                name="location_id"
              >
                <option value="">Todas</option>
                {managerDashboard.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone-700">
              Empleado
              <select
                className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 font-normal"
                defaultValue={filters.user_id ?? ""}
                name="user_id"
              >
                <option value="">Todos</option>
                {managerDashboard.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-medium text-white hover:bg-stone-800"
              type="submit"
            >
              <Filter aria-hidden="true" className="size-4" />
              Filtrar
            </button>
          </form>

          {!parsedFilters.success ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              Los filtros recibidos no eran válidos y se restablecieron.
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Empleado</th>
                    <th className="px-4 py-3 font-semibold">Sede</th>
                    <th className="px-4 py-3 font-semibold">Entrada</th>
                    <th className="px-4 py-3 font-semibold">Salida</th>
                    <th className="px-4 py-3 font-semibold">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {managerDashboard.rows.map((attendance) => (
                    <tr key={attendance.id}>
                      <td className="px-4 py-4 font-medium text-stone-950">
                        {attendance.employee_name}
                      </td>
                      <td className="px-4 py-4 text-stone-600">
                        <span className="inline-flex items-center gap-2">
                          <MapPin aria-hidden="true" className="size-4" />
                          {attendance.location_name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-stone-600">
                        {formatLimaTime(attendance.check_in_at)}
                      </td>
                      <td className="px-4 py-4 text-stone-600">
                        {attendance.check_out_at ? formatLimaTime(attendance.check_out_at) : "En curso"}
                      </td>
                      <td className="px-4 py-4 font-medium text-stone-900">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 aria-hidden="true" className="size-4" />
                          {formatAttendanceDuration(
                            attendance.check_in_at,
                            attendance.check_out_at,
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {managerDashboard.rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-stone-500" colSpan={5}>
                        No hay asistencias para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
