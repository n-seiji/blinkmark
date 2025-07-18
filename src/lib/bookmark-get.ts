import { LocalStorage } from "@raycast/api";
import { deleteBookmark } from "./bookmark-delete";
import type { BookmarkItem } from "./types";

export async function getBookmarks(): Promise<BookmarkItem[]> {
	const indexJson = await LocalStorage.getItem<string>(IDS_KEY);
	const bookmarkIds: string[] = indexJson ? JSON.parse(indexJson) : [];

	if (bookmarkIds.length === 0) {
		return [];
	}

	const now = Date.now();
	const validBookmarks: BookmarkItem[] = [];
	const expiredIds: string[] = [];

	for (const id of bookmarkIds) {
		try {
			const bookmarkKey = `${STORAGE_KEY}_${id}`;
			const bookmarkJson = await LocalStorage.getItem<string>(bookmarkKey);

			if (!bookmarkJson) {
				console.warn(`No bookmark data for id ${id}, removing`);
				expiredIds.push(id);
				continue;
			}

			const bookmark: BookmarkItem = JSON.parse(bookmarkJson);

			if (
				!bookmark ||
				typeof bookmark !== "object" ||
				!bookmark.id ||
				!bookmark.url ||
				!bookmark.title ||
				typeof bookmark.lastAccessedAt !== "number"
			) {
				console.warn(`Invalid bookmark data for id ${id}, removing`);
				expiredIds.push(id);
				await LocalStorage.removeItem(bookmarkKey);
				continue;
			}

			const daysSinceAccess =
				(now - bookmark.lastAccessedAt) / (1000 * 60 * 60 * 24);
			if (daysSinceAccess > EXPIRY_DAYS) {
				console.warn(
					`Removing expired bookmark: ${bookmark.title} (${Math.floor(daysSinceAccess)} days old)`,
				);
				expiredIds.push(id);
				await LocalStorage.removeItem(bookmarkKey);
			} else {
				validBookmarks.push(bookmark);
			}
		} catch (error) {
			console.warn(`Failed to load bookmark ${id}:`, error);
			expiredIds.push(id);
		}
	}

	// Remove expired IDs from index
	// TODO refactor
	if (expiredIds.length > 0) {
		for (const id of expiredIds) {
			deleteBookmark(id);
		}
	}

	const sortedBookmarks = validBookmarks.sort(
		(a, b) => b.lastAccessedAt - a.lastAccessedAt,
	);

	return sortedBookmarks;
}
