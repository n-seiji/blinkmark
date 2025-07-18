import { LocalStorage } from "@raycast/api";
import { IDS_KEY, STORAGE_KEY } from "./constant";

export async function deleteBookmark(id: string): Promise<void> {
	const bookmarkKey = `${STORAGE_KEY}_${id}`;

	// Delete bookmark data
	await LocalStorage.removeItem(bookmarkKey);

	// Remove ID from index
	const existingIndexJson = await LocalStorage.getItem<string>(IDS_KEY);
	const bookmarkIds: string[] = existingIndexJson
		? JSON.parse(existingIndexJson)
		: [];
	const updatedIndex = bookmarkIds.filter((existingId) => existingId !== id);
	await LocalStorage.setItem(IDS_KEY, JSON.stringify(updatedIndex));
}

export async function deleteExpiredBookmarks(): Promise<void> {
	const indexJson = await LocalStorage.getItem<string>(IDS_KEY);
	const bookmarkIds: string[] = indexJson ? JSON.parse(indexJson) : [];

	for (const id of bookmarkIds) {
		await deleteBookmark(id);
	}
}
