import type { Database } from "@/types/database.generated";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type NavigationItem = {
  label: string;
  href: string;
  icon:
    | "home"
    | "catalogs"
    | "attendance"
    | "shift"
    | "reports"
    | "settings";
  available: boolean;
};

const employeeItems: NavigationItem[] = [
  { label: "Inicio", href: "/dashboard", icon: "home", available: true },
  {
    label: "Catálogos",
    href: "/dashboard/catalogs",
    icon: "catalogs",
    available: true,
  },
  {
    label: "Asistencia",
    href: "/dashboard/attendance",
    icon: "attendance",
    available: true,
  },
  {
    label: "Turno operativo",
    href: "/dashboard/shift",
    icon: "shift",
    available: false,
  },
];

const managerItems: NavigationItem[] = [
  {
    label: "Reportes",
    href: "/dashboard/reports",
    icon: "reports",
    available: false,
  },
];

const adminItems: NavigationItem[] = [
  {
    label: "Administración",
    href: "/dashboard/admin",
    icon: "settings",
    available: true,
  },
];

export const roleLabels: Record<AppRole, string> = {
  EMPLOYEE: "Empleado",
  MANAGER: "Gerente",
  ADMIN: "Administrador",
};

export function getNavigationForRole(role: AppRole) {
  if (role === "ADMIN") {
    return [...employeeItems, ...managerItems, ...adminItems];
  }

  if (role === "MANAGER") {
    return [...employeeItems, ...managerItems];
  }

  return employeeItems;
}
