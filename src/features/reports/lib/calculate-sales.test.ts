import { describe, expect, it } from "vitest";

import { calculateSales } from "./calculate-sales";

describe("calculateSales", () => {
  it("applies the documented reconciliation formula", () => {
    expect(calculateSales({
      openingQuantity: 10,
      entryQuantity: 5,
      receivedTransferQuantity: 3,
      positiveAdjustmentQuantity: 2,
      sentTransferQuantity: 4,
      wasteQuantity: 1,
      negativeAdjustmentQuantity: 1,
      closingQuantity: 6,
    })).toBe(8);
  });

  it("supports decimal quantities for liter products", () => {
    expect(calculateSales({
      openingQuantity: 8.5,
      entryQuantity: 1.25,
      receivedTransferQuantity: 0.5,
      positiveAdjustmentQuantity: 0,
      sentTransferQuantity: 1,
      wasteQuantity: 0.25,
      negativeAdjustmentQuantity: 0,
      closingQuantity: 6,
    })).toBe(3);
  });

  it("preserves negative anomalies for review", () => {
    expect(calculateSales({
      openingQuantity: 2,
      entryQuantity: 0,
      receivedTransferQuantity: 0,
      positiveAdjustmentQuantity: 0,
      sentTransferQuantity: 0,
      wasteQuantity: 0,
      negativeAdjustmentQuantity: 0,
      closingQuantity: 3,
    })).toBe(-1);
  });
});
