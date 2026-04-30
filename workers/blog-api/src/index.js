const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "yanhexiong/blog-comments";
const DEFAULT_CONTENT_REPO = "yanhexiong/blog";
const DEFAULT_CONTENT_BRANCH = "main";
const DEFAULT_CATEGORY_ID = "DIC_kwDORsrG5c4C46ai";
const DEFAULT_SERIES = "linux-tutorial-series";
const DEFAULT_SERIES_LIST = [DEFAULT_SERIES];
const PER_PAGE = 100;
const CACHE_PREFIX = "board:";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const CACHE_MAX_AGE_SECONDS = 24 * 60 * 60;
const CONTENT_ROOT_PATH = "src/content/posts";

const CONTENT_PATH_REGEX = /(?:https?:\/\/[^/\s]+)?\/?posts\/[a-z0-9/_-]+\/?/gi;
const LABEL_KEYWORDS = [
	"命令",
	"回答",
	"判断结果",
	"输出解读",
	"判断依据",
	"步骤",
	"作用",
	"结果",
	"验证方法",
	"你的判断",
	"启动命令",
	"查看命令",
	"分析过程",
	"思路",
	"内核版本",
	"发行版信息",
	"根目录内容",
	"系统时间",
	"command",
	"answer",
	"result",
	"reason",
	"step",
	"steps",
];
const SECTION_KEYWORDS = [
	"实践题",
	"简答题",
	"思考题",
	"practice",
	"discussion",
	"answer",
	"answers",
	"short answer",
];

function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LABEL_PATTERN = LABEL_KEYWORDS.map(escapeRegex).join("|");
const SECTION_PATTERN = SECTION_KEYWORDS.map(escapeRegex).join("|");
const LABEL_REGEX = new RegExp(`(?:${LABEL_PATTERN})\\s*[:：]`, "g");
const FILLED_LABEL_REGEX = new RegExp(
	`(?:^|\\n)\\s*(?:-\\s*)?(?:${LABEL_PATTERN})\\s*[:：]\\s*\\S[^\\n]*`,
	"gm",
);
const EMPTY_LABEL_REGEX = new RegExp(
	`(?:^|\\n)\\s*(?:-\\s*)?(?:${LABEL_PATTERN})\\s*[:：]\\s*$`,
	"gm",
);
const FILLED_NUMBERED_REGEX =
	/(?:^|\n)\s*\d+\s*[.)、．。）][^\n]*[:：]\s*\S[^\n]*/gm;
const SECTION_REGEX = new RegExp(`(?:${SECTION_PATTERN})`, "g");

export default {
	async fetch(request, env, ctx) {
		return handleFetch(request, env, ctx);
	},
	async scheduled(_controller, env, ctx) {
		const seriesSlugs = getSeriesSlugs(env);
		for (const seriesSlug of seriesSlugs) {
			ctx.waitUntil(refreshSeriesCache(seriesSlug, env));
		}
	},
};

async function handleFetch(request, env, ctx) {
	if (request.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: corsHeaders(),
		});
	}

	const url = new URL(request.url);
	const pathname = url.pathname;

	if (pathname === "/health") {
		return json(
			{
				ok: true,
				service: "blog-api",
				now: new Date().toISOString(),
			},
			200,
		);
	}

	if (pathname !== "/api/board" && pathname !== "/board") {
		return json(
			{
				ok: true,
				service: "blog-api",
				endpoints: ["/health", "/api/board?series=linux-tutorial-series"],
			},
			200,
		);
	}

	const seriesSlug =
		url.searchParams.get("series")?.trim() || env.BOARD_DEFAULT_SERIES || DEFAULT_SERIES;
	const forceRefresh = url.searchParams.get("refresh") === "1";
	const cacheKey = getCacheKey(seriesSlug);
	const cached = forceRefresh ? null : await readBoardCache(cacheKey, env);

	if (cached) {
		if (Date.now() - cached.cachedAt > REFRESH_INTERVAL_MS) {
			ctx.waitUntil(refreshSeriesCache(seriesSlug, env));
		}

		return json(attachCacheDebug(cached.board, cached.cachedAt, "hit"), 200);
	}

	const refreshed = await refreshSeriesCache(seriesSlug, env);
	if (refreshed.ok) {
		return json(attachCacheDebug(refreshed.board, refreshed.cachedAt, "miss"), 200);
	}

	return json(
		{
			posts: [],
			users: [],
			status: refreshed.status,
			errorMessage: refreshed.errorMessage,
			debug: {
				tokenPresent: Boolean(env.GH_TOKEN),
				discussionsMatched: 0,
				postMatches: [],
				cache: {
					state: "error",
					cachedAt: null,
				},
			},
		},
		refreshed.status === "error" ? 500 : 200,
	);
}

function corsHeaders() {
	return {
		"access-control-allow-origin": "*",
		"access-control-allow-methods": "GET,OPTIONS",
		"access-control-allow-headers": "content-type,authorization",
	};
}

function json(data, status) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			...corsHeaders(),
		},
	});
}

function getSeriesSlugs(env) {
	const configured = env.BOARD_SERIES_SLUGS?.trim();
	if (!configured) {
		return DEFAULT_SERIES_LIST;
	}

	return configured
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function getCacheKey(seriesSlug) {
	return `${CACHE_PREFIX}${seriesSlug}`;
}

function attachCacheDebug(board, cachedAt, state) {
	return {
		...board,
		debug: {
			...board.debug,
			cache: {
				state,
				cachedAt: new Date(cachedAt).toISOString(),
			},
		},
	};
}

async function readBoardCache(cacheKey, env) {
	if (!env.ANSWER_BOARD_CACHE) {
		return null;
	}

	const raw = await env.ANSWER_BOARD_CACHE.get(cacheKey, "json");
	if (!raw || typeof raw !== "object") {
		return null;
	}

	if (!raw.board || typeof raw.cachedAt !== "number") {
		return null;
	}

	return raw;
}

async function writeBoardCache(cacheKey, value, env) {
	if (!env.ANSWER_BOARD_CACHE) {
		return;
	}

	await env.ANSWER_BOARD_CACHE.put(cacheKey, JSON.stringify(value), {
		expirationTtl: CACHE_MAX_AGE_SECONDS,
	});
}

async function refreshSeriesCache(seriesSlug, env) {
	const boardResult = await buildBoardData(seriesSlug, env);
	if (!boardResult.ok) {
		return boardResult;
	}

	const cachedAt = Date.now();
	const payload = {
		board: boardResult.board,
		cachedAt,
	};
	await writeBoardCache(getCacheKey(seriesSlug), payload, env);

	return {
		ok: true,
		board: boardResult.board,
		cachedAt,
	};
}

async function buildBoardData(seriesSlug, env) {
	const parsedRepo = parseRepo(env.GH_REPO || DEFAULT_REPO);
	const parsedContentRepo = parseRepo(
		env.BOARD_CONTENT_REPO || DEFAULT_CONTENT_REPO,
	);
	const contentBranch =
		(env.BOARD_CONTENT_BRANCH || DEFAULT_CONTENT_BRANCH).trim();
	const categoryId = (env.GH_CATEGORY_ID || DEFAULT_CATEGORY_ID).trim();
	const token = (env.GH_TOKEN || "").trim();

	if (!parsedRepo || !categoryId) {
		return {
			ok: false,
			status: "not-configured",
			errorMessage: "repo/categoryId not configured",
		};
	}

	const contentPostsResult =
		parsedContentRepo && contentBranch
			? await fetchSeriesContentPosts(
					seriesSlug,
					parsedContentRepo,
					contentBranch,
					token,
				)
			: { ok: false, posts: [] };

	const discussionsResult = await fetchAll(
		`/repos/${parsedRepo.owner}/${parsedRepo.name}/discussions`,
		token,
	);

	if (!discussionsResult.ok) {
		return classifyFetchFailure(token, discussionsResult);
	}

	const filtered = discussionsResult.items
		.filter((discussion) => discussion?.category?.node_id === categoryId)
		.map((discussion) => {
			const paths = extractDiscussionPaths(discussion.title, discussion.body || "");
			const pathname = paths.find((path) => postSlugFromPath(path, seriesSlug));
			const postSlug = pathname ? postSlugFromPath(pathname, seriesSlug) : null;
			return {
				discussion,
				pathname,
				postSlug,
			};
		})
		.filter((item) => item.postSlug);

	const postsMap = new Map();
	if (contentPostsResult.ok) {
		for (const post of contentPostsResult.posts) {
			postsMap.set(post.slug, {
				...post,
				discussionNumber: null,
				discussionTitle: undefined,
			});
		}
	}

	for (const item of filtered) {
		const existing = postsMap.get(item.postSlug) || {
			slug: item.postSlug,
			title: postTitleFromSlug(item.postSlug),
			pathname: postPathnameFromSlug(item.postSlug),
		};
		postsMap.set(item.postSlug, {
			...existing,
			discussionNumber: item.discussion.number,
			discussionTitle: item.discussion.title,
		});
	}

	const postMatches = [];
	const userMap = new Map();

	for (const post of [...postsMap.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
		let comments = [];
		if (post.discussionNumber) {
			const commentsResult = await fetchAll(
				`/repos/${parsedRepo.owner}/${parsedRepo.name}/discussions/${post.discussionNumber}/comments`,
				token,
			);

			if (!commentsResult.ok) {
				return classifyFetchFailure(token, commentsResult);
			}

			comments = commentsResult.items;
		}

		let matchedCommentCount = 0;
		const commentPreviews = [];

		for (const comment of comments) {
			if (!comment?.user?.login) {
				continue;
			}

			const debug = evaluateAnswerTemplate(comment.body || "");
			commentPreviews.push({
				authorLogin: comment.user.login,
				matched: debug.matched,
				score: debug.score,
				headingMatches: debug.headingMatches,
				numberedMatches: debug.numberedMatches,
				bulletMatches: debug.bulletMatches,
				labelMatches: debug.labelMatches,
				filledLabelMatches: debug.filledLabelMatches,
				filledNumberedMatches: debug.filledNumberedMatches,
				emptyLabelMatches: debug.emptyLabelMatches,
				sectionMatches: debug.sectionMatches,
				length: debug.length,
				preview: (comment.body || "").replace(/\s+/g, " ").slice(0, 180),
			});

			if (!debug.matched) {
				continue;
			}

			matchedCommentCount++;
			upsertAnswer(userMap, post.slug, comment);
		}

		postMatches.push({
			postSlug: post.slug,
			discussionTitle: post.discussionTitle,
			commentCount: comments.length,
			matchedCommentCount,
			commentPreviews,
		});
	}

	const users = [...userMap.values()].sort((a, b) => {
		if (b.answers.length !== a.answers.length) {
			return b.answers.length - a.answers.length;
		}

		return a.login.localeCompare(b.login);
	});

	const posts = [...postsMap.values()]
		.sort((a, b) => a.slug.localeCompare(b.slug))
		.map((post) => ({
			slug: post.slug,
			title: post.title,
			pathname: post.pathname || postPathnameFromSlug(post.slug),
		}));

	return {
		ok: true,
		board: {
			posts,
			users,
			status: "ok",
			debug: {
				tokenPresent: Boolean(token),
				discussionsMatched: postMatches.length,
				postMatches,
			},
		},
	};
}

function classifyFetchFailure(token, result) {
	const normalized = (result.errorMessage || "").toLowerCase();
	const isRateLimited =
		result.status === 403 ||
		normalized.includes("rate limit") ||
		normalized.includes("api rate limit exceeded");
	const isUnauthorized = result.status === 401 || normalized.includes("bad credentials");

	if (!token && (isRateLimited || isUnauthorized)) {
		return {
			ok: false,
			status: "missing-token",
			errorMessage: result.errorMessage,
		};
	}

	return {
		ok: false,
		status: "error",
		errorMessage: result.errorMessage,
	};
}

function parseRepo(repo) {
	const [owner, name] = (repo || "").split("/");
	if (!owner || !name) {
		return null;
	}

	return { owner, name };
}

function normalizePathname(pathname) {
	if (!pathname) {
		return "";
	}

	const normalized = pathname
		.toLowerCase()
		.replace(/^https?:\/\/[^/]+/, "")
		.replace(/\/+$/, "");

	return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function extractDiscussionPaths(title, body) {
	const matches = `${title || ""}\n${body || ""}`.match(CONTENT_PATH_REGEX) || [];
	return [...new Set(matches.map((match) => normalizePathname(match)))];
}

function postSlugFromPath(pathname, seriesSlug) {
	const normalized = normalizePathname(pathname);
	const prefix = `/posts/${seriesSlug}/`;
	if (!normalized.startsWith(prefix)) {
		return null;
	}

	const tail = normalized.slice(prefix.length);
	if (!tail) {
		return null;
	}

	return `${seriesSlug}/${tail}`;
}

function postPathnameFromSlug(slug) {
	return `/posts/${slug}/`;
}

function postTitleFromSlug(slug) {
	const tail = slug.split("/").pop() || slug;
	return tail
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function encodeRepoPath(path) {
	return path
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
}

function decodeBase64Utf8(base64) {
	const binary = atob((base64 || "").replace(/\s+/g, ""));
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder("utf-8").decode(bytes);
}

function extractFrontmatter(markdown) {
	const match = (markdown || "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	return match?.[1] || "";
}

function parseFrontmatterTitle(markdown) {
	const frontmatter = extractFrontmatter(markdown);
	if (!frontmatter) {
		return null;
	}

	const lines = frontmatter.split(/\r?\n/);
	for (const line of lines) {
		const match = line.match(/^title:\s*(.+?)\s*$/);
		if (!match) {
			continue;
		}

		let value = match[1].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		return value || null;
	}

	return null;
}

function slugFromContentPath(path, seriesSlug) {
	const normalized = (path || "").replace(/\\/g, "/");
	const prefix = `${CONTENT_ROOT_PATH}/${seriesSlug}/`;
	if (!normalized.startsWith(prefix) || !normalized.endsWith(".md")) {
		return null;
	}

	const relativePath = normalized.slice(CONTENT_ROOT_PATH.length + 1, -3);
	if (!relativePath) {
		return null;
	}

	if (relativePath === `${seriesSlug}/index`) {
		return null;
	}

	if (relativePath.endsWith("/index")) {
		return relativePath.slice(0, -"/index".length);
	}

	return relativePath;
}

async function fetchRepoDirectoryEntries(repoInfo, dirPath, branch, token) {
	return fetchGitHubJson(
		`/repos/${repoInfo.owner}/${repoInfo.name}/contents/${encodeRepoPath(dirPath)}?ref=${encodeURIComponent(branch)}`,
		token,
	);
}

async function fetchRepoFileContent(repoInfo, filePath, branch, token) {
	return fetchGitHubJson(
		`/repos/${repoInfo.owner}/${repoInfo.name}/contents/${encodeRepoPath(filePath)}?ref=${encodeURIComponent(branch)}`,
		token,
	);
}

async function listMarkdownFilesRecursive(repoInfo, dirPath, branch, token) {
	const result = await fetchRepoDirectoryEntries(repoInfo, dirPath, branch, token);
	if (!result.ok) {
		return {
			ok: false,
			status: result.status,
			errorMessage: result.errorMessage,
			paths: [],
		};
	}

	const entries = Array.isArray(result.data) ? result.data : [result.data];
	const paths = [];

	for (const entry of entries) {
		if (!entry?.path || !entry?.type) {
			continue;
		}

		if (entry.type === "dir") {
			const nested = await listMarkdownFilesRecursive(
				repoInfo,
				entry.path,
				branch,
				token,
			);
			if (!nested.ok) {
				return nested;
			}
			paths.push(...nested.paths);
			continue;
		}

		if (entry.type === "file" && entry.path.endsWith(".md")) {
			paths.push(entry.path);
		}
	}

	return {
		ok: true,
		paths,
	};
}

async function fetchSeriesContentPosts(seriesSlug, repoInfo, branch, token) {
	const rootPath = `${CONTENT_ROOT_PATH}/${seriesSlug}`;
	const fileListResult = await listMarkdownFilesRecursive(
		repoInfo,
		rootPath,
		branch,
		token,
	);
	if (!fileListResult.ok) {
		return {
			ok: false,
			status: fileListResult.status,
			errorMessage: fileListResult.errorMessage,
			posts: [],
		};
	}

	const posts = [];
	for (const filePath of fileListResult.paths) {
		const slug = slugFromContentPath(filePath, seriesSlug);
		if (!slug) {
			continue;
		}

		const fileResult = await fetchRepoFileContent(repoInfo, filePath, branch, token);
		if (!fileResult.ok) {
			return {
				ok: false,
				status: fileResult.status,
				errorMessage: fileResult.errorMessage,
				posts: [],
			};
		}

		const content =
			fileResult.data?.encoding === "base64" && typeof fileResult.data?.content === "string"
				? decodeBase64Utf8(fileResult.data.content)
				: "";
		const title = parseFrontmatterTitle(content) || postTitleFromSlug(slug);
		posts.push({
			slug,
			title,
			pathname: postPathnameFromSlug(slug),
		});
	}

	return {
		ok: true,
		posts: posts.sort((a, b) => a.slug.localeCompare(b.slug)),
	};
}

function normalizeCommentText(text) {
	return (text || "")
		.toLowerCase()
		.replaceAll("\r", "")
		.replace(/[ \t]+/g, " ");
}

function evaluateAnswerTemplate(commentBody) {
	const normalized = normalizeCommentText(commentBody);
	if (!normalized.trim()) {
		return {
			matched: false,
			score: 0,
			headingMatches: 0,
			numberedMatches: 0,
			bulletMatches: 0,
			fencedBlockMatches: 0,
			labelMatches: 0,
			filledLabelMatches: 0,
			filledNumberedMatches: 0,
			emptyLabelMatches: 0,
			sectionMatches: 0,
			length: 0,
		};
	}

	let score = 0;
	const headingMatches = (normalized.match(/(?:^|\n)\s*##+\s+/g) || []).length;
	const numberedMatches =
		(normalized.match(/(?:^|\n)\s*\d+\s*[.)\u3001\uff0e\uff1f\u3002\uff09]\s*/g) || []).length;
	const bulletMatches = (normalized.match(/(?:^|\n)\s*-\s+/g) || []).length;
	const fencedBlockMatches = (normalized.match(/```/g) || []).length;
	const labelMatches = (normalized.match(LABEL_REGEX) || []).length;
	const filledLabelMatches = (normalized.match(FILLED_LABEL_REGEX) || []).length;
	const filledNumberedMatches =
		(normalized.match(FILLED_NUMBERED_REGEX) || []).length;
	const emptyLabelMatches = (normalized.match(EMPTY_LABEL_REGEX) || []).length;
	const sectionMatches = (normalized.match(SECTION_REGEX) || []).length;

	if (headingMatches >= 1) score += 2;
	if (numberedMatches >= 2) score += 2;
	if (bulletMatches >= 3) score += 1;
	if (fencedBlockMatches >= 2) score += 1;
	if (labelMatches >= 3) score += 2;
	if (sectionMatches >= 1) score += 1;
	if (normalized.length >= 80) score += 1;

	const structureMatched =
		score >= 3 ||
		(normalized.length >= 80 &&
			(numberedMatches >= 2 || bulletMatches >= 3 || headingMatches >= 1));
	const filledAnswerMatches = filledLabelMatches + filledNumberedMatches;
	const contentMatched =
		filledAnswerMatches >= 2 ||
		(filledAnswerMatches >= 1 &&
			sectionMatches >= 2 &&
			normalized.length >= 180);
	const matched = structureMatched && contentMatched;

	return {
		matched,
		score,
		headingMatches,
		numberedMatches,
		bulletMatches,
		fencedBlockMatches,
		labelMatches,
		filledLabelMatches,
		filledNumberedMatches,
		emptyLabelMatches,
		sectionMatches,
		length: normalized.length,
	};
}

function githubHeaders(token) {
	const headers = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "blog-api-worker",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}

async function fetchGitHubJson(path, token) {
	const response = await fetch(`${GITHUB_API}${path}`, {
		method: "GET",
		headers: githubHeaders(token),
	});

	const text = await response.text();
	let body = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = null;
	}

	if (!response.ok) {
		return {
			ok: false,
			status: response.status,
			errorMessage: body?.message || `GitHub API ${response.status}`,
		};
	}

	return {
		ok: true,
		status: response.status,
		data: body,
	};
}

async function fetchAll(path, token) {
	const items = [];

	for (let page = 1; ; page++) {
		const separator = path.includes("?") ? "&" : "?";
		const pagedPath = `${path}${separator}per_page=${PER_PAGE}&page=${page}`;
		const result = await fetchGitHubJson(pagedPath, token);

		if (!result.ok) {
			return {
				ok: false,
				status: result.status,
				errorMessage: result.errorMessage,
				items: [],
			};
		}

		const pageItems = Array.isArray(result.data) ? result.data : [];
		items.push(...pageItems);

		if (pageItems.length < PER_PAGE) {
			break;
		}
	}

	return {
		ok: true,
		items,
	};
}

function upsertAnswer(userMap, postSlug, comment) {
	const login = comment?.user?.login;
	if (!login) {
		return;
	}

	const existing = userMap.get(login) || {
		login,
		url: comment.user.html_url,
		avatarUrl: comment.user.avatar_url,
		answers: [],
	};

	const nextAnswer = {
		postSlug,
		commentUrl: comment.html_url,
		createdAt: comment.created_at,
	};

	const index = existing.answers.findIndex((answer) => answer.postSlug === postSlug);
	if (index >= 0) {
		if (new Date(nextAnswer.createdAt) > new Date(existing.answers[index].createdAt)) {
			existing.answers[index] = nextAnswer;
		}
	} else {
		existing.answers.push(nextAnswer);
	}

	userMap.set(login, existing);
}
