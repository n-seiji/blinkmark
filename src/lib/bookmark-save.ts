import { LocalStorage } from "@raycast/api";
import { IDS_KEY, STORAGE_KEY } from "./constant";
import type { BookmarkItem } from "./types";

export async function saveBookmark(bookmark: BookmarkItem): Promise<void> {
	// Validate data
	if (!bookmark.id || !bookmark.url || !bookmark.title) {
		throw new Error("Invalid bookmark data: missing required fields");
	}

	if (
		typeof bookmark.createdAt !== "number" ||
		typeof bookmark.lastAccessedAt !== "number"
	) {
		throw new Error("Invalid bookmark data: timestamps must be numbers");
	}

	console.debug("Saving bookmark:", bookmark);

	// Check if bookmark with same ID already exists
	const bookmarkKey = `${STORAGE_KEY}_${bookmark.id}`;
	const existingBookmarkJson = await LocalStorage.getItem<string>(bookmarkKey);

	if (existingBookmarkJson) {
		throw new Error(
			`Bookmark with ID ${bookmark.id} already exists for URL: ${bookmark.url}`,
		);
	}

	// Save bookmark data
	const bookmarkJson = JSON.stringify(bookmark);
	await LocalStorage.setItem(bookmarkKey, bookmarkJson);

	// Update index (maintain list of existing bookmark IDs)
	const existingIndexJson = await LocalStorage.getItem<string>(IDS_KEY);
	const existingIndex: string[] = existingIndexJson
		? JSON.parse(existingIndexJson)
		: [];

	if (!existingIndex.includes(bookmark.id)) {
		existingIndex.push(bookmark.id);
		await LocalStorage.setItem(IDS_KEY, JSON.stringify(existingIndex));
	}

	console.debug("Bookmark saved successfully");
}
