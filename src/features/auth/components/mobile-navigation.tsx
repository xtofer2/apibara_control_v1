"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  BarChart3,
  CalendarCheck2,
  CircleCheckBig,
  Clock3,
  Home,
  LogOut,
  Menu,
  PackagePlus,
  PackageSearch,
  ScrollText,
  Settings,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import type { NavigationItem } from "@/features/auth/config/navigation";

const icons = {
  home: Home,
  catalogs: PackageSearch,
  attendance: CalendarCheck2,
  shift: Clock3,
  inventory: PackagePlus,
  transfers: Truck,
  closing: CircleCheckBig,
  reports: BarChart3,
  audit: ScrollText,
  settings: Settings,
};

type MobileNavigationProps = {
  initials: string;
  items: NavigationItem[];
  profileName: string;
  roleLabel: string;
};

function isCurrentPath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation({
  initials,
  items,
  profileName,
  roleLabel,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <header className="border-b border-stone-200 bg-white px-5 py-4 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/dashboard">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-600 font-bold text-white">
              A
            </span>
            <span className="font-semibold text-stone-950">Apibara Control</span>
          </Link>
          <Dialog.Trigger
            aria-label="Abrir menú principal"
            className="flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <Menu aria-hidden="true" className="size-5" />
          </Dialog.Trigger>
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-stone-950/55 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(84vw,320px)] flex-col bg-stone-950 p-5 text-white shadow-2xl transition-transform duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
          <div className="flex items-center justify-between gap-3">
            <Link
              className="flex min-w-0 items-center gap-3"
              href="/dashboard"
              onClick={() => setOpen(false)}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 font-bold shadow-lg shadow-orange-600/20">
                A
              </span>
              <span className="min-w-0">
                <Dialog.Title className="block truncate font-semibold">
                  Apibara Control
                </Dialog.Title>
                <span className="block text-xs text-stone-500">Operaciones</span>
              </span>
            </Link>
            <Dialog.Close
              aria-label="Cerrar menú principal"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>

          <div className="mt-6 flex items-center gap-3 border-y border-white/10 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-sm font-semibold text-orange-200">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profileName}</p>
              <p className="text-xs text-stone-500">{roleLabel}</p>
            </div>
          </div>

          <nav aria-label="Navegación principal" className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const Icon = icons[item.icon];
              const active = isCurrentPath(pathname, item.href);
              const className = [
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active
                  ? "bg-orange-500/20 text-orange-300"
                  : "text-stone-300 hover:bg-white/10 hover:text-white",
              ].join(" ");

              if (!item.available) {
                return (
                  <span
                    className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone-500"
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
                  aria-current={active ? "page" : undefined}
                  className={className}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={logoutAction} className="mt-4 border-t border-white/10 pt-4">
            <Button
              className="h-10 w-full justify-start text-stone-400 hover:bg-white/10 hover:text-white"
              type="submit"
              variant="ghost"
            >
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </Button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
