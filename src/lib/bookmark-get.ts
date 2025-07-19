import { LocalStorage } from "@raycast/api";
import { isExpired } from "./is-expired";
import type { BookmarkItem } from "./types";

export async function getBookmarks(): Promise<BookmarkItem[]> {
	const bookmarks = await LocalStorage.allItems<{
		// not work if define as BookmarkItem instead of below
		[key: string]: string;
	}>();
	const now = Date.now();
	const validBookmarks: BookmarkItem[] = [];

	for (const [id, bookmarkStr] of Object.entries(bookmarks)) {
		const bookmark: BookmarkItem = JSON.parse(bookmarkStr);
		if (isExpired(bookmark.lastAccessedAt, now)) {
			// TODO refactor to use LocalStorage.removeItem directly
			console.debug(`Bookmark "${bookmark.url}" expired, deleting`);
			LocalStorage.removeItem(id);
			continue;
		}
		validBookmarks.push(bookmark);
	}

	return validBookmarks.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
}
