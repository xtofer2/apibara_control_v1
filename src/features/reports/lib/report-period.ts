export type BusinessReportView = "day" | "week" | "month";

export type DateInterval = {
  from: string;
  to: string;
};

function asUtcDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, amount: number) {
  const date = asUtcDate(value);
  date.setUTCDate(date.getUTCDate() + amount);

  return toDateValue(date);
}

export function startOfWeek(value: string) {
  const date = asUtcDate(value);
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;

  return addDays(value, -daysFromMonday);
}

export function getWeekIntervals(selectedDate: string, today: string) {
  const from = startOfWeek(selectedDate);
  const fullTo = addDays(from, 6);
  const to = fullTo > today ? today : fullTo;
  const elapsedDays = Math.round(
    (asUtcDate(to).getTime() - asUtcDate(from).getTime()) / 86_400_000,
  );
  const previousFrom = addDays(from, -7);

  return {
    current: { from, to },
    previous: {
      from: previousFrom,
      to: addDays(previousFrom, elapsedDays),
    },
  };
}

export function getMonthIntervals(month: string, today: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const from = `${month}-01`;
  const fullTo = toDateValue(new Date(Date.UTC(year, monthNumber, 0, 12)));
  const to = fullTo > today ? today : fullTo;
  const previousMonthDate = new Date(Date.UTC(year, monthNumber - 2, 1, 12));
  const previousFrom = toDateValue(previousMonthDate);
  const previousFullTo = toDateValue(new Date(Date.UTC(year, monthNumber - 1, 0, 12)));
  const elapsedDays = Math.round(
    (asUtcDate(to).getTime() - asUtcDate(from).getTime()) / 86_400_000,
  );

  return {
    current: { from, to },
    previous: {
      from: previousFrom,
      to: [addDays(previousFrom, elapsedDays), previousFullTo].sort()[0],
    },
  };
}
