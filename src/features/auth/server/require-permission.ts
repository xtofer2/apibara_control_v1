import "server-only";

import { redirect } from "next/navigation";

import {
  hasPermission,
  type AppPermission,
} from "@/features/auth/config/permissions";

import { requireCurrentProfile } from "./require-current-profile";

export async function requirePermission(permission: AppPermission) {
  const profile = await requireCurrentProfile();

  if (!hasPermission(profile.role, permission)) {
    redirect("/dashboard/forbidden");
  }

  return profile;
}
