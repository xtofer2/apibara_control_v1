import type { Instrumentation } from "next";

import { logServerError } from "@/lib/observability/server-logger";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logServerError(error, {
    method: request.method,
    path: request.path,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
