import { AppShell } from "@/features/auth/components/app-shell";
import { getNavigationForRole } from "@/features/auth/config/navigation";
import { requireCurrentProfile } from "@/features/auth/server/require-current-profile";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireCurrentProfile();
  const navigation = getNavigationForRole(profile.role);

  return (
    <AppShell navigation={navigation} profile={profile}>
      {children}
    </AppShell>
  );
}
