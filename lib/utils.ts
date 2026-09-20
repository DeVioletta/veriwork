/** Angka pertama pada string gaji, untuk pengurutan. -1 jika tidak ada. */
export function salaryValue(range: string): number {
  const m = range.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : -1;
}

export function initials(text: string): string {
  return (text || '??').trim().slice(0, 2).toUpperCase();
}
