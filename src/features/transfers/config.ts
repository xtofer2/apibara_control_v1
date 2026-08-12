import type { Database } from "@/types/database.generated";

type TransferStatus = Database["public"]["Enums"]["transfer_status"];

export const transferStatusLabels: Record<TransferStatus, string> = {
  PENDING: "Pendiente",
  SENT: "En tránsito",
  RECEIVED: "Recibida",
  RECEIVED_WITH_DIFFERENCES: "Recibida con diferencias",
  CANCELLED: "Cancelada",
};
