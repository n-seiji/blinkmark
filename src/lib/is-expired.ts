const ONE_DAY_MS = 1_000 * 60 * 60 * 24;
const EXPIRY_DAYS = 7;

export function isExpired(lastAccessedAt: number, now: number): boolean {
  const daysSinceAccess = (now - lastAccessedAt) / ONE_DAY_MS;
  return daysSinceAccess > EXPIRY_DAYS;
}
