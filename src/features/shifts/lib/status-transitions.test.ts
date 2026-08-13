import { describe, expect, it } from "vitest";

import { canTransitionShift } from "./status-transitions";

describe("work shift status transitions", () => {
  it("allows an open shift to close", () => {
    expect(canTransitionShift("OPEN", "CLOSED")).toBe(true);
  });

  it("does not reopen or re-close a completed shift", () => {
    expect(canTransitionShift("CLOSED", "OPEN")).toBe(false);
    expect(canTransitionShift("CLOSED", "CLOSED")).toBe(false);
  });
});
