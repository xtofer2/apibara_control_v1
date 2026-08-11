import { ShieldX } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <ShieldX aria-hidden="true" className="size-7" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950">
        No tienes permiso
      </h1>
      <p className="mt-3 leading-7 text-stone-600">
        Tu cuenta está activa, pero el rol asignado no permite realizar esta operación.
      </p>
      <Link
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-8 h-11 w-full",
        )}
        href="/dashboard"
      >
        Volver al panel
      </Link>
    </section>
  );
}
