import { LocalStorage } from "@raycast/api";
import { parse } from "node-html-parser";
import { BookmarkItem, BookmarkStorage } from "./types";

const STORAGE_KEY = "blinkmark_bookmarks";
const EXPIRY_DAYS = 7;

export function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch {
		return false;
	}
}

export async function fetchPageTitle(url: string): Promise<string> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.warn(`HTTP ${response.status} for ${url}`);
			return url;
		}

		const contentType = response.headers.get("content-type");
		if (!contentType || !contentType.includes("text/html")) {
			console.warn(`Non-HTML content type: ${contentType} for ${url}`);
			return url;
		}

		const html = await response.text();
		const doc = parse(html);
		const title = doc.querySelector("title")?.text?.trim();
		console.log("title:" + title);

		if (title && title.length > 0) {
			return title;
		}

		return url;
	} catch (error) {
		console.warn(`Failed to fetch title for ${url}:`, error);
		return url;
	}
}

export async function getBookmarks(): Promise<BookmarkItem[]> {
	try {
		const indexKey = `${STORAGE_KEY}_index`;
		const indexJson = await LocalStorage.getItem<string>(indexKey);
		const bookmarkIds: string[] = indexJson ? JSON.parse(indexJson) : [];
		
		if (bookmarkIds.length === 0) return [];

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
				
				if (!bookmark || typeof bookmark !== 'object' || 
					!bookmark.id || !bookmark.url || !bookmark.title ||
					typeof bookmark.lastAccessedAt !== 'number') {
					console.warn(`Invalid bookmark data for id ${id}, removing`);
					expiredIds.push(id);
					await LocalStorage.removeItem(bookmarkKey);
					continue;
				}

				const daysSinceAccess =
					(now - bookmark.lastAccessedAt) / (1000 * 60 * 60 * 24);
				if (daysSinceAccess > EXPIRY_DAYS) {
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

		// インデックスから期限切れのIDを削除
		if (expiredIds.length > 0) {
			const updatedIndex = bookmarkIds.filter(id => !expiredIds.includes(id));
			await LocalStorage.setItem(indexKey, JSON.stringify(updatedIndex));
		}

		return validBookmarks.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
	} catch (error) {
		console.error("Failed to get bookmarks:", error);
		return [];
	}
}

export async function saveBookmark(bookmark: BookmarkItem): Promise<void> {
	try {
		// データの検証
		if (!bookmark.id || !bookmark.url || !bookmark.title) {
			throw new Error("Invalid bookmark data: missing required fields");
		}
		
		if (typeof bookmark.createdAt !== 'number' || typeof bookmark.lastAccessedAt !== 'number') {
			throw new Error("Invalid bookmark data: timestamps must be numbers");
		}
		
		console.log("Saving bookmark:", bookmark);
		
		// 各ブックマークを個別のキーで保存する方式に変更
		const bookmarkKey = `${STORAGE_KEY}_${bookmark.id}`;
		
		// クリーンなデータオブジェクトを作成（プロトタイプチェーンなどを除去）
		const cleanBookmark: BookmarkItem = {
			id: String(bookmark.id),
			url: String(bookmark.url),
			title: String(bookmark.title),
			createdAt: Number(bookmark.createdAt),
			lastAccessedAt: Number(bookmark.lastAccessedAt)
		};
		
		// JSON文字列として保存
		const bookmarkJson = JSON.stringify(cleanBookmark);
		await LocalStorage.setItem(bookmarkKey, bookmarkJson);
		
		// インデックスを更新（存在するブックマークIDの一覧を保持）
		const indexKey = `${STORAGE_KEY}_index`;
		const existingIndexJson = await LocalStorage.getItem<string>(indexKey);
		const existingIndex: string[] = existingIndexJson ? JSON.parse(existingIndexJson) : [];
		
		if (!existingIndex.includes(bookmark.id)) {
			existingIndex.push(bookmark.id);
			await LocalStorage.setItem(indexKey, JSON.stringify(existingIndex));
		}
		
		console.log("Bookmark saved successfully");
		
	} catch (error) {
		console.error("Failed to save bookmark:", error);
		throw error;
	}
}

export async function updateLastAccessed(id: string): Promise<void> {
	try {
		const bookmarkKey = `${STORAGE_KEY}_${id}`;
		const bookmarkJson = await LocalStorage.getItem<string>(bookmarkKey);
		
		if (bookmarkJson) {
			const bookmark: BookmarkItem = JSON.parse(bookmarkJson);
			bookmark.lastAccessedAt = Date.now();
			await LocalStorage.setItem(bookmarkKey, JSON.stringify(bookmark));
		}
	} catch (error) {
		console.error("Failed to update last accessed:", error);
		throw error;
	}
}

export async function deleteBookmark(id: string): Promise<void> {
	try {
		const bookmarkKey = `${STORAGE_KEY}_${id}`;
		const indexKey = `${STORAGE_KEY}_index`;
		
		// ブックマークデータを削除
		await LocalStorage.removeItem(bookmarkKey);
		
		// インデックスからIDを削除
		const existingIndexJson = await LocalStorage.getItem<string>(indexKey);
		const existingIndex: string[] = existingIndexJson ? JSON.parse(existingIndexJson) : [];
		const updatedIndex = existingIndex.filter(existingId => existingId !== id);
		await LocalStorage.setItem(indexKey, JSON.stringify(updatedIndex));
		
	} catch (error) {
		console.error("Failed to delete bookmark:", error);
		throw error;
	}
}

export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
