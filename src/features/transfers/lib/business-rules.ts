import type { Database } from "@/types/database.generated";

type TransferStatus = Database["public"]["Enums"]["transfer_status"];

export function hasTransferDifferences(
  sent: ReadonlyArray<{ productId: string; quantity: number }>,
  received: ReadonlyArray<{ productId: string; quantity: number }>,
) {
  if (sent.length !== received.length) {
    return true;
  }

  const receivedByProduct = new Map(
    received.map((item) => [item.productId, item.quantity]),
  );

  return sent.some(
    (item) => receivedByProduct.get(item.productId) !== item.quantity,
  );
}

export function getReceptionStatus(hasDifferences: boolean): TransferStatus {
  return hasDifferences ? "RECEIVED_WITH_DIFFERENCES" : "RECEIVED";
}

const transferTransitions: Record<TransferStatus, readonly TransferStatus[]> = {
  PENDING: ["SENT", "CANCELLED"],
  SENT: ["RECEIVED", "RECEIVED_WITH_DIFFERENCES"],
  RECEIVED: [],
  RECEIVED_WITH_DIFFERENCES: [],
  CANCELLED: [],
};

export function canTransitionTransfer(
  from: TransferStatus,
  to: TransferStatus,
) {
  return transferTransitions[from].includes(to);
}
