import { LocalStorage, getPreferenceValues } from "@raycast/api";
import { createHash } from "node:crypto";
import type { BookmarkItem } from "./types";
import { getExpiryDays } from "./is-expired";

const ONE_DAY_MS = 1_000 * 60 * 60 * 24;
const ONE_HOUR_MS = 1_000 * 60 * 60;

export function getRemainingTime(lastAccessedAt: number, now: number = Date.now()): { hours: number; days: number; totalMs: number } {
  const preferences = getPreferenceValues<Preferences>();
  const expiredDays = getExpiryDays(preferences);
  
  const expirationTime = lastAccessedAt + (expiredDays * ONE_DAY_MS);
  const remainingMs = expirationTime - now;
  
  const remainingHours = Math.floor(remainingMs / ONE_HOUR_MS);
  const remainingDays = Math.floor(remainingMs / ONE_DAY_MS);
  
  return {
    hours: remainingHours,
    days: remainingDays,
    totalMs: remainingMs
  };
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export async function updateLastAccessed(id: string): Promise<void> {
  const bookmarkJson = await LocalStorage.getItem<string>(id);

  if (bookmarkJson) {
    const bookmark: BookmarkItem = JSON.parse(bookmarkJson);
    bookmark.lastAccessedAt = Date.now();
    await LocalStorage.setItem(id, JSON.stringify(bookmark));
  }
}

export function generateId(url: string): string {
  const hash = createHash("md5").update(url).digest("hex");
  return hash;
}
