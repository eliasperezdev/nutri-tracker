/** Número en formato es-AR (coma decimal). */
export function fmt(n: number, digits = 0): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Con signo explícito: +1,2 / −0,4 */
export function fmtSigned(n: number, digits = 1): string {
  const abs = fmt(Math.abs(n), digits);
  if (Math.abs(n) < Math.pow(10, -digits) / 2) return abs;
  return `${n > 0 ? "+" : "−"}${abs}`;
}
