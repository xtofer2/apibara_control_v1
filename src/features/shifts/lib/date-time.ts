const limaDateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export function formatShiftDateTime(value: string) {
  return limaDateTimeFormatter.format(new Date(value));
}

export function formatCash(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
}

export function formatQuantity(value: number, unit: "UNIT" | "LITER") {
  return unit === "UNIT" ? String(value) : `${value.toFixed(3)} L`;
}
