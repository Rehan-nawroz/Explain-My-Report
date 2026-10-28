/** Human "resets in …" label for the quota notice. Pure, so it is safe in client components. */
export function formatResetWindow(
  resetsAtIso: string,
  now: number = Date.now(),
): string {
  const delta = Date.parse(resetsAtIso) - now;
  if (!Number.isFinite(delta) || delta <= 0) return "now";

  const minutes = Math.ceil(delta / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
