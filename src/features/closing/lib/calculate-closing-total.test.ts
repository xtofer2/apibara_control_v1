import { describe, expect, it } from "vitest";

import { calculateClosingTotal } from "./calculate-closing-total";

describe("calculateClosingTotal", () => {
  it("adds CASH and YAPE records without a redundant total", () => {
    expect(calculateClosingTotal([{ amount: 200.5 }, { amount: 150.25 }]))
      .toBe(350.75);
  });

  it("returns zero for an empty payment collection", () => {
    expect(calculateClosingTotal([])).toBe(0);
  });
});
