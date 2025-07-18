import { LocalStorage } from "@raycast/api";
import { createHash } from "node:crypto";
import type { BookmarkItem } from "./types";

export function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch {
		return false;
	}
}

export async function updateLastAccessed(id: string): Promise<void> {
	const bookmarkKey = `${STORAGE_KEY}_${id}`;
	const bookmarkJson = await LocalStorage.getItem<string>(bookmarkKey);

	if (bookmarkJson) {
		const bookmark: BookmarkItem = JSON.parse(bookmarkJson);
		bookmark.lastAccessedAt = Date.now();
		await LocalStorage.setItem(bookmarkKey, JSON.stringify(bookmark));
	}
}

/**
 * Generates a unique ID from URL using hash
 */
export function generateId(url: string): string {
	// Use built-in crypto API for hashing
	const encoder = new TextEncoder();
	const data = encoder.encode(url);

	const hash = createHash("md5").update(data).digest("hex");
	return hash;
}
