export function formatPrice(value: number): string {
  return value.toFixed(2);
}

function utcParts(unix: number): { year: string; month: string; day: string; hour: string; minute: string } {
  const date = new Date(unix * 1000);
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
    hour: String(date.getUTCHours()).padStart(2, '0'),
    minute: String(date.getUTCMinutes()).padStart(2, '0'),
  };
}

export function formatDay(unix: number): string {
  const part = utcParts(unix);
  return `${part.year}-${part.month}-${part.day}`;
}

/** Date and time from the bar's unix seconds, kept in UTC. Does not use the clock. */
export function formatUtcDateTime(unix: number): string {
  const part = utcParts(unix);
  return `${part.year}-${part.month}-${part.day} ${part.hour}:${part.minute}`;
}

/**
 * Stamp for a real bar time. `withTime` is for an intraday series.
 * The suffix is UTC because timestamps are not converted to an exchange zone.
 */
export function formatBarClock(unix: number, withTime: boolean): string {
  return `${withTime ? formatUtcDateTime(unix) : formatDay(unix)} UTC`;
}
