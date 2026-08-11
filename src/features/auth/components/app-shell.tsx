import {
  BarChart3,
  CalendarCheck2,
  Clock3,
  Home,
  LogOut,
  PackageSearch,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import {
  roleLabels,
  type NavigationItem,
} from "@/features/auth/config/navigation";
import type { CurrentProfile } from "@/features/auth/server/profile-repository";

const icons = {
  home: Home,
  catalogs: PackageSearch,
  attendance: CalendarCheck2,
  shift: Clock3,
  reports: BarChart3,
  settings: Settings,
};

type AppShellProps = {
  children: React.ReactNode;
  navigation: NavigationItem[];
  profile: CurrentProfile;
};

function Navigation({ items }: { items: NavigationItem[] }) {
  return (
    <nav aria-label="Navegación principal" className="space-y-1">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const className =
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition";

        if (!item.available) {
          return (
            <span
              className={`${className} cursor-not-allowed text-stone-500`}
              key={item.href}
              title="Disponible en una próxima fase"
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                Pronto
              </span>
            </span>
          );
        }

        return (
          <Link
            className={`${className} bg-orange-500/10 text-orange-300 hover:bg-orange-500/15`}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, navigation, profile }: AppShellProps) {
  const initials = profile.full_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-stone-100 lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/10 bg-stone-950 p-5 text-white lg:flex lg:flex-col">
        <Link className="flex items-center gap-3 px-2 py-3" href="/dashboard">
          <span className="flex size-10 items-center justify-center rounded-xl bg-orange-600 font-bold shadow-lg shadow-orange-600/20">
            A
          </span>
          <span>
            <span className="block font-semibold">Apibara Control</span>
            <span className="block text-xs text-stone-500">Operaciones</span>
          </span>
        </Link>

        <div className="mt-8 flex-1">
          <Navigation items={navigation} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-stone-800 text-sm font-semibold text-stone-200">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-stone-500">{roleLabels[profile.role]}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <Button
              className="h-9 w-full justify-start text-stone-400 hover:bg-white/10 hover:text-white"
              type="submit"
              variant="ghost"
            >
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-stone-200 bg-white px-5 py-4 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link className="flex items-center gap-3 lg:hidden" href="/dashboard">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-600 font-bold text-white">
                A
              </span>
              <span className="font-semibold text-stone-950">Apibara Control</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-stone-900">
                  {profile.full_name}
                </p>
                <p className="text-xs text-stone-500">
                  {roleLabels[profile.role]}
                </p>
              </div>
              <form action={logoutAction} className="lg:hidden">
                <Button aria-label="Cerrar sesión" size="icon" type="submit" variant="outline">
                  <LogOut aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
        </header>

        <div className="border-b border-stone-200 bg-white px-5 py-3 lg:hidden">
          <div className="mx-auto max-w-6xl overflow-x-auto">
            <Navigation items={navigation} />
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl p-5 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
