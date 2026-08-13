import { afterEach, describe, expect, it, vi } from "vitest";

import { logServerError } from "./server-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logServerError", () => {
  it("emits structured metadata without leaking query parameters", () => {
    const error = Object.assign(new Error("Database unavailable"), {
      digest: "reference-123",
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    logServerError(error, {
      method: "GET",
      path: "/dashboard/reports?token=must-not-leak",
      routeType: "render",
    });

    expect(consoleError).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(consoleError.mock.calls[0][0]));

    expect(payload).toMatchObject({
      level: "error",
      event: "unhandled_server_error",
      errorName: "Error",
      digest: "reference-123",
      method: "GET",
      path: "/dashboard/reports",
      routeType: "render",
    });
    expect(JSON.stringify(payload)).not.toContain("Database unavailable");
    expect(JSON.stringify(payload)).not.toContain("must-not-leak");
  });
});
