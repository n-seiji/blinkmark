import { Clipboard, showToast, Toast } from "@raycast/api";
import { isValidUrl, fetchPageTitle, saveBookmark, generateId } from "./utils";
import { BookmarkItem } from "./types";

export default async function Command() {
  try {
    const clipboardText = await Clipboard.readText();

    if (!clipboardText) {
      await showToast({
        style: Toast.Style.Failure,
        title: "クリップボードが空です",
        message: "URLをクリップボードにコピーしてください",
      });
      return;
    }

    const trimmedText = clipboardText.trim();

    if (!isValidUrl(trimmedText)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "無効なURL",
        message: "クリップボードの内容がURLではありません",
      });
      return;
    }

    await showToast({
      style: Toast.Style.Animated,
      title: "URLを処理中...",
      message: "タイトルを取得しています",
    });

    let title: string;
    try {
      title = await fetchPageTitle(trimmedText);
    } catch (error) {
      console.warn("Title fetch failed, using URL as title:", error);
      title = trimmedText;
    }

    const now = Date.now();

    const bookmark: BookmarkItem = {
      id: generateId(),
      url: trimmedText,
      title,
      createdAt: now,
      lastAccessedAt: now,
    };

    await saveBookmark(bookmark);

    await showToast({
      style: Toast.Style.Success,
      title: "リンクを追加しました",
      message: title,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "エラーが発生しました",
      message: error instanceof Error ? error.message : "不明なエラー",
    });
  }
}
