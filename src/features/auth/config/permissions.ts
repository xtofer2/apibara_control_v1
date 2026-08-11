import type { AppRole } from "./navigation";

export type AppPermission =
  | "catalogs.read"
  | "attendance.operate"
  | "shifts.operate"
  | "inventory.entry"
  | "inventory.waste"
  | "transfers.operate"
  | "closing.operate"
  | "attendance.read_all"
  | "reports.read"
  | "audit.read"
  | "inventory.adjustment"
  | "transfers.review"
  | "profiles.manage"
  | "catalogs.manage"
  | "configuration.manage";

const employeePermissions: readonly AppPermission[] = [
  "catalogs.read",
  "attendance.operate",
  "shifts.operate",
  "inventory.entry",
  "inventory.waste",
  "transfers.operate",
  "closing.operate",
];

const managerPermissions: readonly AppPermission[] = [
  ...employeePermissions,
  "attendance.read_all",
  "reports.read",
  "audit.read",
  "inventory.adjustment",
  "transfers.review",
];

const permissionsByRole: Record<AppRole, readonly AppPermission[]> = {
  EMPLOYEE: employeePermissions,
  MANAGER: managerPermissions,
  ADMIN: [
    ...managerPermissions,
    "profiles.manage",
    "catalogs.manage",
    "configuration.manage",
  ],
};

export function hasPermission(role: AppRole, permission: AppPermission) {
  return permissionsByRole[role].includes(permission);
}
