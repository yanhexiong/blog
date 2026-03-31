import MarkdownIt from "markdown-it";

const fullRenderer = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
});

const snippetRenderer = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
});

const renderCache = new Map<string, string>();

export async function renderRevisionMarkdown(
	content: string,
	options?: {
		allowHtml?: boolean;
	},
): Promise<string> {
	const normalizedContent = content.trim();
	if (!normalizedContent) {
		return "";
	}

	const allowHtml = options?.allowHtml ?? false;
	const cacheKey = `${allowHtml ? "html" : "text"}\0${normalizedContent}`;
	const cachedOutput = renderCache.get(cacheKey);
	if (cachedOutput !== undefined) {
		return cachedOutput;
	}

	const renderedHtml = (allowHtml ? fullRenderer : snippetRenderer).render(
		normalizedContent,
	);
	renderCache.set(cacheKey, renderedHtml);
	return renderedHtml;
}
