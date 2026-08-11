"use client";

import { Clock3, LoaderCircle, LogIn, LogOut, MapPin } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialAttendanceActionState } from "@/features/attendance/action-state";
import {
  checkInAction,
  checkOutAction,
} from "@/features/attendance/actions";

type AttendanceControlProps = {
  current: {
    checkInLabel: string;
    locationName: string;
  } | null;
  locations: Array<{ id: string; name: string; code: string }>;
};

function Feedback({
  message,
  status,
}: {
  message?: string;
  status: "idle" | "success" | "error";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={
        status === "error"
          ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      }
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function AttendanceControl({
  current,
  locations,
}: AttendanceControlProps) {
  const [checkInState, checkInFormAction, checkInPending] = useActionState(
    checkInAction,
    initialAttendanceActionState,
  );
  const [checkOutState, checkOutFormAction, checkOutPending] = useActionState(
    checkOutAction,
    initialAttendanceActionState,
  );

  if (current) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" />
              Jornada en curso
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              {current.locationName}
            </h2>
            <div className="mt-3 flex items-center gap-2 text-sm text-stone-600">
              <Clock3 aria-hidden="true" className="size-4" />
              Entrada registrada a las {current.checkInLabel}
            </div>
          </div>

          <form action={checkOutFormAction}>
            <Button
              className="h-11 bg-stone-950 px-5 text-white hover:bg-stone-800"
              disabled={checkOutPending}
              type="submit"
            >
              {checkOutPending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              Registrar salida
            </Button>
          </form>
        </div>
        <div className="mt-5">
          <Feedback
            message={checkOutState.message}
            status={checkOutState.status}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <LogIn aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Registrar entrada
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Selecciona la sede donde comenzarás tu jornada.
          </p>
        </div>
      </div>

      <form action={checkInFormAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-stone-700"
            htmlFor="attendance-location"
          >
            Sede
          </label>
          <div className="relative">
            <MapPin
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 size-4 text-stone-400"
            />
            <select
              className="h-10 w-full rounded-xl border border-stone-200 bg-white pr-3 pl-10 text-sm text-stone-950 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              defaultValue=""
              id="attendance-location"
              name="location_id"
              required
            >
              <option disabled value="">
                Selecciona una sede
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} · {location.code}
                </option>
              ))}
            </select>
          </div>
          {checkInState.fieldErrors?.location_id ? (
            <p className="text-sm text-red-600">
              {checkInState.fieldErrors.location_id[0]}
            </p>
          ) : null}
        </div>

        <Feedback message={checkInState.message} status={checkInState.status} />

        <Button
          className="h-11 bg-orange-600 px-5 text-white hover:bg-orange-700"
          disabled={checkInPending || locations.length === 0}
          type="submit"
        >
          {checkInPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <LogIn aria-hidden="true" />
          )}
          Registrar entrada
        </Button>
      </form>
    </section>
  );
}
