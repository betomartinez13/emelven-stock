/** Parse date strings from MySQL (no timezone suffix) as UTC. */
function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (!date.includes('Z') && !date.includes('+')) {
    return new Date(date.replace(' ', 'T') + 'Z');
  }
  return new Date(date);
}

/** Shift UTC date to Venezuela time (UTC−4, no DST). */
function toVE(date: Date): Date {
  return new Date(date.getTime() - 4 * 60 * 60 * 1000);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export const formatDate = (date: string | Date): string => {
  const d = toVE(parseDate(date));
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};

export const formatDateTime = (date: string | Date): string => {
  const d = toVE(parseDate(date));
const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? 'a. m.' : 'p. m.';
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${pad(h12)}:${pad(m)} ${ampm}`;
};

export const formatNumber = (n: number): string => {
  return new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 }).format(n);
};

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatDateShort = (date: string | Date): string => {
  const d = toVE(parseDate(date));
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
