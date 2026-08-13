import { describe, expect, it } from "vitest";

import {
  canTransitionTransfer,
  getReceptionStatus,
  hasTransferDifferences,
} from "./business-rules";

const sent = [
  { productId: "classic", quantity: 3 },
  { productId: "api", quantity: 1.5 },
];

describe("transfer reception differences", () => {
  it("recognizes an exact reception", () => {
    expect(hasTransferDifferences(sent, sent)).toBe(false);
    expect(getReceptionStatus(false)).toBe("RECEIVED");
  });

  it("recognizes quantity and product-set differences", () => {
    expect(hasTransferDifferences(sent, [
      { productId: "classic", quantity: 2 },
      { productId: "api", quantity: 1.5 },
    ])).toBe(true);
    expect(hasTransferDifferences(sent, sent.slice(0, 1))).toBe(true);
    expect(getReceptionStatus(true)).toBe("RECEIVED_WITH_DIFFERENCES");
  });
});

describe("transfer status transitions", () => {
  it("allows the documented lifecycle", () => {
    expect(canTransitionTransfer("PENDING", "SENT")).toBe(true);
    expect(canTransitionTransfer("SENT", "RECEIVED")).toBe(true);
    expect(canTransitionTransfer("SENT", "RECEIVED_WITH_DIFFERENCES")).toBe(true);
  });

  it("prevents completed transfers from moving again", () => {
    expect(canTransitionTransfer("RECEIVED", "SENT")).toBe(false);
    expect(canTransitionTransfer("RECEIVED_WITH_DIFFERENCES", "RECEIVED")).toBe(false);
    expect(canTransitionTransfer("CANCELLED", "SENT")).toBe(false);
  });
});
