export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-stone-950 px-6 py-16 text-stone-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.12),transparent_30%)]" />
      <section className="relative mx-auto w-full max-w-5xl">
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-sm text-orange-100">
          <span className="size-2 rounded-full bg-orange-400" />
          Fundación técnica lista
        </div>

        <p className="mb-4 text-sm font-semibold tracking-[0.22em] text-orange-300 uppercase">
          Mi Negocio Apibara
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          Apibara Control
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300 sm:text-xl">
          Base del sistema interno para asistencia, turnos, inventario,
          transferencias y cierres operativos.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["Mobile first", "Operación rápida desde cada sede"],
            ["Datos confiables", "PostgreSQL como fuente de verdad"],
            ["Historial auditable", "Acciones críticas trazables"],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h2 className="font-medium text-stone-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
