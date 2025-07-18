import parse from "node-html-parser";

export async function fetchPageTitle(url: string): Promise<string> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
	console.debug(`title:${title}`);

	if (title && title.length > 0) {
		return title;
	}

	return url;
}
