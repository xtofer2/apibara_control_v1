import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "../..");
const databaseContainer = "supabase_db_apibara-control-v1";

function readLocalEnvironment() {
  const values = new Map<string, string>();
  const source = readFileSync(path.join(projectRoot, ".env.local"), "utf8");

  for (const line of source.split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith("#")) continue;
    const separator = normalized.indexOf("=");
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    const value = normalized.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    values.set(key, value);
  }

  const apiUrl = values.get("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = values.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!apiUrl || !publishableKey) {
    throw new Error("E2E requires the local Supabase URL and publishable key in .env.local.");
  }

  return { apiUrl, publishableKey };
}

async function signUpEmployee(email: string, password: string) {
  const { apiUrl, publishableKey } = readLocalEnvironment();
  let lastError = "Supabase Auth did not respond.";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: "Empleado E2E" },
        }),
      });

      if (response.ok) return;
      lastError = await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Could not create the E2E employee: ${lastError}`);
}

export async function resetAndSeedEmployee(email: string, password: string) {
  execFileSync("docker", [
    "exec",
    databaseContainer,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `truncate table
      public.audit_logs,
      public.attendance,
      public.closing_payments,
      public.closing_items,
      public.closings,
      public.transfer_items,
      public.transfers,
      public.inventory_movement_items,
      public.inventory_movements,
      public.opening_items,
      public.openings,
      public.work_shifts,
      public.profiles,
      auth.users
    cascade;

    update public.locations set
      name = case code
        when 'JESUS' then 'Av. Jesus'
        when 'MIGUEL_GRAU' then 'Miguel Grau'
        else name
      end,
      active = true;

    update public.products set active = true;
    update public.payment_methods set active = true
    where code in ('CASH', 'YAPE');`,
  ], {
    cwd: projectRoot,
    stdio: "pipe",
    timeout: 30_000,
  });
  await signUpEmployee(email, password);
}
