export type SalesReconciliation = {
  openingQuantity: number;
  entryQuantity: number;
  receivedTransferQuantity: number;
  positiveAdjustmentQuantity: number;
  sentTransferQuantity: number;
  wasteQuantity: number;
  negativeAdjustmentQuantity: number;
  closingQuantity: number;
};

export function calculateSales(input: SalesReconciliation) {
  return input.openingQuantity
    + input.entryQuantity
    + input.receivedTransferQuantity
    + input.positiveAdjustmentQuantity
    - input.sentTransferQuantity
    - input.wasteQuantity
    - input.negativeAdjustmentQuantity
    - input.closingQuantity;
}
