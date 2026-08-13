type ErrorContext = {
  method?: string;
  path?: string;
  routerKind?: string;
  routePath?: string;
  routeType?: string;
};

type ErrorWithDigest = Error & { digest?: string };

function normalizePath(path?: string) {
  return path?.split("?", 1)[0];
}

export function logServerError(error: unknown, context: ErrorContext = {}) {
  const knownError = error instanceof Error ? (error as ErrorWithDigest) : null;

  console.error(
    JSON.stringify({
      level: "error",
      event: "unhandled_server_error",
      timestamp: new Date().toISOString(),
      errorName: knownError?.name ?? "UnknownError",
      digest: knownError?.digest,
      method: context.method,
      path: normalizePath(context.path),
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    }),
  );
}
