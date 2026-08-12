export const auditActionLabels: Record<string, string> = {
  SHIFT_OPENED: "Apertura de turno",
  SHIFT_CLOSED: "Cierre de turno",
  INVENTORY_ENTRY: "Entrada de inventario",
  INVENTORY_WASTE: "Merma de inventario",
  INVENTORY_ADJUSTMENT_POSITIVE: "Ajuste positivo",
  INVENTORY_ADJUSTMENT_NEGATIVE: "Ajuste negativo",
  TRANSFER_SENT: "Transferencia enviada",
  TRANSFER_RECEIVED: "Transferencia recibida",
  TRANSFER_RECEIVED_WITH_DIFFERENCES: "Recepción con diferencias",
  TRANSFER_CANCELLED: "Transferencia cancelada",
  ADMIN_UPDATE: "Corrección administrativa",
};

export const auditActionOptions = Object.entries(auditActionLabels).map(
  ([value, label]) => ({ value, label }),
);
