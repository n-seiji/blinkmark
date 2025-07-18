import { Action, ActionPanel, Form, Toast, showToast } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { useCallback, useState } from "react";
import type { BookmarkItem } from "./types";
import { fetchPageTitle, generateId, isValidUrl, saveBookmark } from "./utils";

interface FormValues {
	url: string;
	title: string;
}

export default function Command() {
	const [isLoadingTitle, setIsLoadingTitle] = useState(false);

	const { handleSubmit, itemProps, setValue, reset } = useForm<FormValues>({
		onSubmit: async (values) => {
			try {
				const now = Date.now();
				const bookmark: BookmarkItem = {
					id: generateId(),
					url: values.url.trim(),
					title: values.title.trim(),
					createdAt: now,
					lastAccessedAt: now,
				};

				await saveBookmark(bookmark);

				await showToast({
					style: Toast.Style.Success,
					title: "ブックマークを追加しました",
					message: bookmark.title,
				});

				reset();
			} catch (error) {
				await showToast({
					style: Toast.Style.Failure,
					title: "ブックマークの追加に失敗しました",
					message: error instanceof Error ? error.message : "不明なエラー",
				});
			}
		},
		validation: {
			url: (value) => {
				if (!value || value.trim().length === 0) {
					return "URLを入力してください";
				}
				if (!isValidUrl(value.trim())) {
					return "有効なURLを入力してください";
				}
			},
			title: FormValidation.Required,
		},
	});

	const handleUrlBlur = useCallback(
		async (url?: string) => {
			if (!url || !isValidUrl(url)) {
				return;
			}

			setIsLoadingTitle(true);
			try {
				const title = await fetchPageTitle(url);
				setValue("title", title);
			} catch (error) {
				console.warn("Failed to fetch title:", error);
				setValue("title", url);
			} finally {
				setIsLoadingTitle(false);
			}
		},
		[setValue],
	);

	return (
		<Form
			actions={
				<ActionPanel>
					<Action.SubmitForm
						title="ブックマークを追加"
						icon="bookmark"
						onSubmit={handleSubmit}
					/>
				</ActionPanel>
			}
		>
			<Form.TextField
				title="URL"
				placeholder="https://example.com"
				{...itemProps.url}
				onBlur={(event) => {
					if (itemProps.url.onBlur) {
						itemProps.url.onBlur(event);
					}
					handleUrlBlur(event.target.value);
				}}
			/>
			<Form.TextField
				title="タイトル"
				placeholder={isLoadingTitle ? "タイトルを取得中..." : "ページタイトル"}
				{...itemProps.title}
				value={itemProps.title.value || ""}
			/>
		</Form>
	);
}
