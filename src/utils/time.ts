export function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatTime12h(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export function calculateHours(
  start: string,
  breakStart: string,
  breakEnd: string,
  end: string
): number {
  if (!start || !end) return 0;

  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);
  const breakMinutes =
    breakStart && breakEnd
      ? parseTime(breakEnd) - parseTime(breakStart)
      : 0;

  const totalMinutes = endMinutes - startMinutes - breakMinutes;
  return Math.max(0, totalMinutes / 60);
}

export function calculateBreakHours(breakStart: string, breakEnd: string): number {
  if (!breakStart || !breakEnd) return 0;
  const minutes = parseTime(breakEnd) - parseTime(breakStart);
  return Math.max(0, minutes / 60);
}

export function calculateOvertime(hoursWorked: number, expectedHours: number): number {
  return Math.max(0, hoursWorked - expectedHours);
}
