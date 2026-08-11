const limaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const limaDateLabelFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const limaTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
});

export function getLimaDate(date = new Date()) {
  return limaDateFormatter.format(date);
}

export function formatLimaDate(value: string) {
  return limaDateLabelFormatter.format(new Date(`${value}T12:00:00-05:00`));
}

export function formatLimaTime(value: string) {
  return limaTimeFormatter.format(new Date(value));
}

export function formatAttendanceDuration(
  checkInAt: string,
  checkOutAt: string | null,
) {
  if (!checkOutAt) {
    return "En curso";
  }

  const durationMinutes = Math.max(
    0,
    Math.floor(
      (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 60000,
    ),
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}
