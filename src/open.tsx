import {
	Action,
	ActionPanel,
	Icon,
	List,
	Toast,
	open,
	showToast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import type { BookmarkItem } from "./types";
import { deleteBookmark, getBookmarks, updateLastAccessed } from "./utils";

export default function Command() {
	const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadBookmarks();
	}, []);

	const loadBookmarks = async () => {
		try {
			const items = await getBookmarks();
			setBookmarks(items);
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "エラーが発生しました",
				message: error instanceof Error ? error.message : "不明なエラー",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenUrl = async (bookmark: BookmarkItem) => {
		try {
			await updateLastAccessed(bookmark.id);
			await open(bookmark.url);
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "URLを開けませんでした",
				message: error instanceof Error ? error.message : "不明なエラー",
			});
		}
	};

	const handleDeleteBookmark = async (id: string) => {
		try {
			await deleteBookmark(id);
			await loadBookmarks();
			await showToast({
				style: Toast.Style.Success,
				title: "リンクを削除しました",
			});
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "削除に失敗しました",
				message: error instanceof Error ? error.message : "不明なエラー",
			});
		}
	};

	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return "今日";
		}
		if (diffDays === 1) {
			return "昨日";
		}
		if (diffDays < 7) {
			return `${diffDays}日前`;
		}
		return date.toLocaleDateString("ja-JP");
	};

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="リンクを検索..."
			filtering={true}
		>
			{bookmarks.length === 0 ? (
				<List.EmptyView
					icon={Icon.Bookmark}
					title="保存されたリンクがありません"
					description="addコマンドでリンクを追加してください"
				/>
			) : (
				bookmarks.map((bookmark) => (
					<List.Item
						key={bookmark.id}
						title={bookmark.title}
						subtitle={bookmark.url}
						accessories={[
							{ text: `最終アクセス: ${formatDate(bookmark.lastAccessedAt)}` },
						]}
						keywords={[bookmark.title, bookmark.url]}
						actions={
							<ActionPanel>
								<Action
									title="URLを開く"
									icon={Icon.Globe}
									onAction={() => handleOpenUrl(bookmark)}
								/>
								<Action
									title="リンクを削除"
									icon={Icon.Trash}
									style={Action.Style.Destructive}
									onAction={() => handleDeleteBookmark(bookmark.id)}
								/>
							</ActionPanel>
						}
					/>
				))
			)}
		</List>
	);
}
