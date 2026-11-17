export function formatPrice(value: number): string {
  return value.toFixed(2);
}

export function formatDay(unix: number): string {
  const date = new Date(unix * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Date, plus UTC clock when the bar is not stamped at midnight. */
export function formatBarTime(unix: number): string {
  const date = new Date(unix * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const day = formatDay(unix);
  if (hours === 0 && minutes === 0 && seconds === 0) return day;
  return `${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} UTC`;
}
