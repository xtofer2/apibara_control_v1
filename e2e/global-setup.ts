import { execFileSync } from "node:child_process";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const supabaseCli = path.join(projectRoot, "node_modules", ".bin", "supabase");

function runSupabase(args: string[]) {
  execFileSync(supabaseCli, args, {
    cwd: projectRoot,
    stdio: "pipe",
    timeout: 120_000,
  });
}

export default function globalSetup() {
  let alreadyRunning = true;

  try {
    runSupabase(["status"]);
  } catch {
    alreadyRunning = false;
    runSupabase(["start"]);
  }

  runSupabase(["migration", "up", "--local"]);

  return () => {
    if (!alreadyRunning) {
      runSupabase(["stop"]);
    }
  };
}
