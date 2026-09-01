"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

type OperationSuccessToastProps = {
  description: string;
  eventId?: string;
  message?: string;
};

export function OperationSuccessToast({
  description,
  eventId,
  message,
}: OperationSuccessToastProps) {
  if (!eventId || !message) return null;

  return (
    <VisibleOperationSuccessToast
      description={description}
      key={eventId}
      message={message}
    />
  );
}

function VisibleOperationSuccessToast({
  description,
  message,
}: {
  description: string;
  message: string;
}) {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 3_600);
    const hideTimer = window.setTimeout(() => setVisible(false), 4_000);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 250);
  }

  return (
    <>
      <div aria-hidden="true" className="operation-success-wash pointer-events-none fixed inset-0 z-70 bg-emerald-400/10" />
      <div
        aria-atomic="true"
        aria-live="polite"
        className={`fixed top-20 right-4 z-80 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-emerald-950/15 md:top-6 ${leaving ? "operation-success-toast-exit" : "operation-success-toast-enter"}`}
        data-testid="operation-success-toast"
        role="status"
      >
        <div className="flex items-start gap-3">
          <div className="operation-success-check flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check aria-hidden="true" className="size-5 stroke-3" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-semibold text-stone-950">{message}</p>
            <p className="mt-1 text-sm leading-5 text-stone-600">{description}</p>
          </div>
          <button
            aria-label="Cerrar confirmación"
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            onClick={dismiss}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-emerald-100">
          <div className="operation-success-progress h-full rounded-full bg-emerald-500" />
        </div>
      </div>
    </>
  );
}
