import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import {
  findProfileById,
  type CurrentProfile,
} from "./profile-repository";

export type CurrentProfileResult =
  | { status: "UNAUTHENTICATED" }
  | { status: "PROFILE_UNAVAILABLE" }
  | { status: "INACTIVE"; profile: CurrentProfile }
  | { status: "ACTIVE"; profile: CurrentProfile };

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfileResult> => {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return { status: "UNAUTHENTICATED" };
    }

    const { data: profile, error: profileError } = await findProfileById(
      supabase,
      userId,
    );

    if (profileError || !profile) {
      return { status: "PROFILE_UNAVAILABLE" };
    }

    if (!profile.active) {
      return { status: "INACTIVE", profile };
    }

    return { status: "ACTIVE", profile };
  },
);
