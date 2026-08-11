import "server-only";

import { redirect } from "next/navigation";

import { getCurrentProfile } from "./current-profile";

export async function requireCurrentProfile() {
  const result = await getCurrentProfile();

  if (result.status === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (result.status === "PROFILE_UNAVAILABLE") {
    redirect("/account-unavailable");
  }

  if (result.status === "INACTIVE") {
    redirect("/account-unavailable?reason=inactive");
  }

  return result.profile;
}
