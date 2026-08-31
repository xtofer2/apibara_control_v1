const limaDateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

const limaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const shiftDateLabelFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  dateStyle: "medium",
});

export function getLimaShiftDate(date = new Date()) {
  return limaDateFormatter.format(date);
}

export function formatShiftDate(value: string) {
  return shiftDateLabelFormatter.format(new Date(`${value}T12:00:00-05:00`));
}

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
