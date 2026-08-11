import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 px-5 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.1),transparent_30%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-stone-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-orange-300 uppercase">
              Mi Negocio Apibara
            </p>
            <h1 className="mt-5 max-w-md text-5xl font-semibold tracking-tight text-balance">
              Operaciones claras, todos los días.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-stone-300">
              Asistencia, turnos, inventario, transferencias y cierres en un
              solo lugar.
            </p>
          </div>
          <p className="text-sm text-stone-500">
            Sistema interno · Acceso autorizado
          </p>
        </section>

        <section className="p-7 sm:p-12 lg:p-14">
          <div className="mx-auto max-w-sm">
            <div className="mb-9">
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white shadow-lg shadow-orange-600/20">
                A
              </div>
              <p className="text-sm font-semibold text-orange-600">
                Apibara Control
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                Bienvenido
              </h2>
              <p className="mt-3 leading-7 text-stone-500">
                Ingresa con las credenciales asignadas por tu administrador.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
