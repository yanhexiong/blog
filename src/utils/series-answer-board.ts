import { getCollection } from "astro:content";
import { commentConfig } from "../config";

type DiscussionCommentAuthor = {
	login: string;
	url: string;
	avatarUrl: string;
};

type DiscussionCommentNode = {
	author: DiscussionCommentAuthor | null;
	bodyText: string;
	url: string;
	createdAt: string;
};

type DiscussionNode = {
	number: number;
	title: string;
	body: string;
	url: string;
};

type GitHubRestDiscussion = {
	number: number;
	title: string;
	body: string | null;
	html_url: string;
	category: {
		node_id: string;
	} | null;
};

type GitHubRestDiscussionComment = {
	user: {
		login: string;
		html_url: string;
		avatar_url: string;
	} | null;
	body: string | null;
	html_url: string;
	created_at: string;
};

type TemplateSignature = {
	headingThreshold: number;
	numberedThreshold: number;
	bulletThreshold: number;
	codeFenceCount: number;
};

type AnswerMatchDebug = {
	matched: boolean;
	score: number;
	headingMatches: number;
	numberedMatches: number;
	bulletMatches: number;
	fencedBlockMatches: number;
	labelMatches: number;
	sectionMatches: number;
	length: number;
};

type RepoInfo = {
	owner: string;
	name: string;
	categoryId: string;
};

export type SeriesAnswerBoardPost = {
	slug: string;
	title: string;
	pathname: string;
};

export type SeriesAnswerBoardAnswer = {
	postSlug: string;
	commentUrl: string;
	createdAt: string;
};

export type SeriesAnswerBoardUser = {
	login: string;
	url: string;
	avatarUrl: string;
	answers: SeriesAnswerBoardAnswer[];
};

export type SeriesAnswerBoardData = {
	posts: SeriesAnswerBoardPost[];
	users: SeriesAnswerBoardUser[];
	status: "ok" | "missing-token" | "not-configured" | "error";
	errorMessage?: string;
	debug: {
		tokenPresent: boolean;
		discussionsMatched: number;
		postMatches: Array<{
			postSlug: string;
			discussionTitle?: string;
			commentCount: number;
			matchedCommentCount: number;
			commentPreviews: Array<{
				authorLogin: string;
				matched: boolean;
				score: number;
				headingMatches: number;
				numberedMatches: number;
				bulletMatches: number;
				labelMatches: number;
				sectionMatches: number;
				length: number;
				preview: string;
			}>;
		}>;
	};
};

const GITHUB_REST_ENDPOINT = "https://api.github.com";
const GITHUB_USER_AGENT = "fuwari-series-answer-board";
const CONTENT_PATH_REGEX = /(?:https?:\/\/[^/\s]+)?\/?posts\/[a-z0-9/_-]+\/?/gi;
const LABEL_REGEX =
	/(命令|回答|判断结果|输出解读|判断依据|步骤|作用|结果|内核版本|发行版信息|根目录内容|系统时间|实践题|思考题)\s*[:：]/g;
const SECTION_REGEX = /(实践题|思考题|practice|discussion|answers?)/g;
const PER_PAGE = 100;

function normalizeCommentText(text: string): string {
	return text
		.toLowerCase()
		.replaceAll("\r", "")
		.replace(/[ \t]+/g, " ");
}

function normalizePathname(pathname: string): string {
	if (!pathname) {
		return "";
	}

	const normalized = pathname
		.toLowerCase()
		.replace(/^https?:\/\/[^/]+/, "")
		.replace(/\/+$/, "");

	return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function extractDiscussionPaths(title: string, body: string): string[] {
	const matches = `${title}\n${body}`.match(CONTENT_PATH_REGEX) ?? [];
	return [...new Set(matches.map((match) => normalizePathname(match)))];
}

function extractTemplateSignature(postBody: string): TemplateSignature {
	const codeBlocks = [...postBody.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)];
	const template = codeBlocks.at(-1)?.[1] ?? "";
	const headingCount = (template.match(/(?:^|\n)\s*##+\s+/g) || []).length;
	const numberedCount = (
		template.match(/(?:^|\n)\s*\d+\s*[.)、．。）]\s*/g) || []
	).length;
	const bulletCount = (template.match(/(?:^|\n)\s*-\s+/g) || []).length;

	return {
		headingThreshold: Math.min(2, Math.max(1, headingCount)),
		numberedThreshold: Math.min(4, Math.max(2, Math.ceil(numberedCount / 3))),
		bulletThreshold: Math.min(4, Math.max(1, Math.ceil(bulletCount / 3))),
		codeFenceCount: codeBlocks.length,
	};
}

function evaluateAnswerTemplate(
	commentBody: string,
	signature: TemplateSignature,
): AnswerMatchDebug {
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
			sectionMatches: 0,
			length: 0,
		};
	}

	let score = 0;
	const headingMatches = (normalized.match(/(?:^|\n)\s*##+\s+/g) || []).length;
	const numberedMatches = (
		normalized.match(/(?:^|\n)\s*\d+\s*[.)、．。）]\s*/g) || []
	).length;
	const bulletMatches = (normalized.match(/(?:^|\n)\s*-\s+/g) || []).length;
	const fencedBlockMatches = (normalized.match(/```/g) || []).length;
	const labelMatches = (normalized.match(LABEL_REGEX) || []).length;
	const sectionMatches = (normalized.match(SECTION_REGEX) || []).length;

	if (headingMatches >= signature.headingThreshold) score += 2;
	if (numberedMatches >= signature.numberedThreshold) score += 2;
	if (bulletMatches >= signature.bulletThreshold) score += 1;
	if (signature.codeFenceCount > 0 && fencedBlockMatches >= 2) score += 1;
	if (labelMatches >= 4) score += 2;
	if (sectionMatches >= 1) score += 1;
	if (normalized.length >= 80) score += 1;

	const matched =
		score >= 3 ||
		(normalized.length >= 80 &&
			(numberedMatches >= 2 ||
				bulletMatches >= 3 ||
				headingMatches >= 1 ||
				(sectionMatches >= 1 && labelMatches >= 3)));

	return {
		matched,
		score,
		headingMatches,
		numberedMatches,
		bulletMatches,
		fencedBlockMatches,
		labelMatches,
		sectionMatches,
		length: normalized.length,
	};
}

function getCommentRepoInfo(): RepoInfo | null {
	const [owner, name] = commentConfig.repo.split("/");
	if (!owner || !name || !commentConfig.categoryId.trim()) {
		return null;
	}

	return {
		owner,
		name,
		categoryId: commentConfig.categoryId.trim(),
	};
}

function getGitHubHeaders(token?: string): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": GITHUB_USER_AGENT,
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}

async function fetchGitHubJson<T>(
	path: string,
	token?: string,
): Promise<{ data?: T; errorMessage?: string; status?: number }> {
	try {
		const response = await fetch(`${GITHUB_REST_ENDPOINT}${path}`, {
			method: "GET",
			headers: getGitHubHeaders(token),
		});

		if (!response.ok) {
			let errorMessage = `GitHub API ${response.status}`;
			try {
				const errorData = (await response.json()) as { message?: string };
				if (errorData.message) {
					errorMessage = errorData.message;
				}
			} catch {
				// ignore parse errors
			}
			return {
				errorMessage,
				status: response.status,
			};
		}

		const data = (await response.json()) as T;
		return { data, status: response.status };
	} catch (error) {
		return {
			errorMessage:
				error instanceof Error ? error.message : "failed to fetch GitHub API",
		};
	}
}

async function fetchPaginatedGitHubJson<T>(
	path: string,
	token?: string,
	perPage = PER_PAGE,
): Promise<{ items: T[]; errorMessage?: string; errorStatus?: number }> {
	const items: T[] = [];

	for (let page = 1; ; page++) {
		const separator = path.includes("?") ? "&" : "?";
		const pagePath = `${path}${separator}per_page=${perPage}&page=${page}`;
		const result = await fetchGitHubJson<T[]>(pagePath, token);

		if (!result.data) {
			return {
				items: [],
				errorMessage: result.errorMessage,
				errorStatus: result.status,
			};
		}

		items.push(...result.data);
		if (result.data.length < perPage) {
			break;
		}
	}

	return { items };
}

async function fetchCategoryDiscussions(
	repoInfo: RepoInfo,
	token?: string,
): Promise<{
	discussions: DiscussionNode[];
	errorMessage?: string;
	errorStatus?: number;
}> {
	const result = await fetchPaginatedGitHubJson<GitHubRestDiscussion>(
		`/repos/${repoInfo.owner}/${repoInfo.name}/discussions`,
		token,
	);

	if (result.errorMessage) {
		return {
			discussions: [],
			errorMessage: result.errorMessage,
			errorStatus: result.errorStatus,
		};
	}

	const discussions = result.items
		.filter(
			(discussion) => discussion.category?.node_id === repoInfo.categoryId,
		)
		.map((discussion) => ({
			number: discussion.number,
			title: discussion.title,
			body: discussion.body ?? "",
			url: discussion.html_url,
		}));

	return { discussions };
}

async function fetchDiscussionComments(
	repoInfo: RepoInfo,
	discussionNumber: number,
	token?: string,
): Promise<{
	comments: DiscussionCommentNode[];
	errorMessage?: string;
	errorStatus?: number;
}> {
	const result = await fetchPaginatedGitHubJson<GitHubRestDiscussionComment>(
		`/repos/${repoInfo.owner}/${repoInfo.name}/discussions/${discussionNumber}/comments`,
		token,
	);

	if (result.errorMessage) {
		return {
			comments: [],
			errorMessage: result.errorMessage,
			errorStatus: result.errorStatus,
		};
	}

	const comments = result.items.map((comment) => ({
		author: comment.user
			? {
					login: comment.user.login,
					url: comment.user.html_url,
					avatarUrl: comment.user.avatar_url,
				}
			: null,
		bodyText: comment.body ?? "",
		url: comment.html_url,
		createdAt: comment.created_at,
	}));

	return { comments };
}

function classifyErrorStatus(
	tokenPresent: boolean,
	errorMessage?: string,
	errorStatus?: number,
): { status: SeriesAnswerBoardData["status"]; errorMessage?: string } {
	const normalized = (errorMessage ?? "").toLowerCase();
	const isRateLimited =
		errorStatus === 403 ||
		normalized.includes("rate limit") ||
		normalized.includes("api rate limit exceeded");
	const isUnauthorized =
		errorStatus === 401 || normalized.includes("bad credentials");

	if (!tokenPresent && (isRateLimited || isUnauthorized)) {
		return {
			status: "missing-token",
			errorMessage:
				errorMessage ??
				"anonymous GitHub API requests are rate-limited; provide GITHUB_TOKEN for stable board updates",
		};
	}

	return {
		status: "error",
		errorMessage,
	};
}

function buildStatusResult({
	status,
	posts,
	tokenPresent,
	users = [],
	discussionsMatched = 0,
	postMatches = [],
	errorMessage,
}: {
	status: SeriesAnswerBoardData["status"];
	posts: SeriesAnswerBoardPost[];
	tokenPresent: boolean;
	users?: SeriesAnswerBoardUser[];
	discussionsMatched?: number;
	postMatches?: SeriesAnswerBoardData["debug"]["postMatches"];
	errorMessage?: string;
}): SeriesAnswerBoardData {
	return {
		posts,
		users,
		status,
		errorMessage,
		debug: {
			tokenPresent,
			discussionsMatched,
			postMatches,
		},
	};
}

function matchDiscussionForPost(
	postPathname: string,
	discussions: Array<{ discussion: DiscussionNode; paths: string[] }>,
): DiscussionNode | undefined {
	const normalizedPostPath = normalizePathname(postPathname);
	return discussions.find((item) => item.paths.includes(normalizedPostPath))
		?.discussion;
}

function upsertUserAnswer(
	userMap: Map<string, SeriesAnswerBoardUser>,
	postSlug: string,
	comment: DiscussionCommentNode,
): void {
	if (!comment.author?.login) {
		return;
	}

	const existingUser = userMap.get(comment.author.login) ?? {
		login: comment.author.login,
		url: comment.author.url,
		avatarUrl: comment.author.avatarUrl,
		answers: [],
	};

	const nextAnswer: SeriesAnswerBoardAnswer = {
		postSlug,
		commentUrl: comment.url,
		createdAt: comment.createdAt,
	};

	const existingAnswerIndex = existingUser.answers.findIndex(
		(answer) => answer.postSlug === postSlug,
	);

	if (existingAnswerIndex >= 0) {
		const current = existingUser.answers[existingAnswerIndex];
		if (new Date(nextAnswer.createdAt) > new Date(current.createdAt)) {
			existingUser.answers[existingAnswerIndex] = nextAnswer;
		}
	} else {
		existingUser.answers.push(nextAnswer);
	}

	userMap.set(comment.author.login, existingUser);
}

async function buildBoardData({
	repoInfo,
	posts,
	token,
}: {
	repoInfo: RepoInfo;
	posts: Array<
		SeriesAnswerBoardPost & {
			signature: TemplateSignature;
		}
	>;
	token?: string;
}): Promise<{
	users: SeriesAnswerBoardUser[];
	discussionsMatched: number;
	postMatches: SeriesAnswerBoardData["debug"]["postMatches"];
	errorMessage?: string;
	errorStatus?: number;
}> {
	const discussionResult = await fetchCategoryDiscussions(repoInfo, token);
	if (discussionResult.errorMessage) {
		return {
			users: [],
			discussionsMatched: 0,
			postMatches: [],
			errorMessage: discussionResult.errorMessage,
			errorStatus: discussionResult.errorStatus,
		};
	}

	const discussionsWithPaths = discussionResult.discussions.map(
		(discussion) => ({
			discussion,
			paths: extractDiscussionPaths(discussion.title, discussion.body),
		}),
	);

	const relatedDiscussions = posts.map((post) => ({
		post,
		discussion: matchDiscussionForPost(post.pathname, discussionsWithPaths),
	}));

	const commentsByDiscussion = new Map<number, DiscussionCommentNode[]>();
	for (const item of relatedDiscussions) {
		if (!item.discussion || commentsByDiscussion.has(item.discussion.number)) {
			continue;
		}

		const commentsResult = await fetchDiscussionComments(
			repoInfo,
			item.discussion.number,
			token,
		);

		if (commentsResult.errorMessage) {
			return {
				users: [],
				discussionsMatched: 0,
				postMatches: [],
				errorMessage: commentsResult.errorMessage,
				errorStatus: commentsResult.errorStatus,
			};
		}

		commentsByDiscussion.set(item.discussion.number, commentsResult.comments);
	}

	const userMap = new Map<string, SeriesAnswerBoardUser>();
	const postMatches: SeriesAnswerBoardData["debug"]["postMatches"] = [];
	let discussionsMatched = 0;

	for (const item of relatedDiscussions) {
		const { post, discussion } = item;
		const comments = discussion
			? (commentsByDiscussion.get(discussion.number) ?? [])
			: [];

		if (discussion) {
			discussionsMatched++;
		}

		let matchedCommentCount = 0;
		const commentPreviews: SeriesAnswerBoardData["debug"]["postMatches"][number]["commentPreviews"] =
			[];

		for (const comment of comments) {
			if (!comment.author?.login) {
				continue;
			}

			const debug = evaluateAnswerTemplate(comment.bodyText, post.signature);
			commentPreviews.push({
				authorLogin: comment.author.login,
				matched: debug.matched,
				score: debug.score,
				headingMatches: debug.headingMatches,
				numberedMatches: debug.numberedMatches,
				bulletMatches: debug.bulletMatches,
				labelMatches: debug.labelMatches,
				sectionMatches: debug.sectionMatches,
				length: debug.length,
				preview: comment.bodyText.replace(/\s+/g, " ").slice(0, 180),
			});

			if (!debug.matched) {
				continue;
			}

			matchedCommentCount++;
			upsertUserAnswer(userMap, post.slug, comment);
		}

		postMatches.push({
			postSlug: post.slug,
			discussionTitle: discussion?.title,
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

	return {
		users,
		discussionsMatched,
		postMatches,
	};
}

export async function getSeriesAnswerBoardData(
	seriesSlug: string,
): Promise<SeriesAnswerBoardData> {
	const allPosts = await getCollection("posts", ({ slug }) => {
		return slug.startsWith(`${seriesSlug}/`);
	});

	const posts = allPosts
		.map((post) => ({
			slug: post.slug,
			title: post.data.title,
			pathname: `/posts/${post.slug}/`,
			signature: extractTemplateSignature(post.body),
		}))
		.sort((a, b) => a.slug.localeCompare(b.slug));

	const publicPosts = posts.map(({ signature: _signature, ...post }) => post);
	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
	const tokenPresent = Boolean(token);
	const repoInfo = getCommentRepoInfo();

	if (!repoInfo) {
		return buildStatusResult({
			status: "not-configured",
			posts: publicPosts,
			tokenPresent,
		});
	}

	const boardResult = await buildBoardData({
		repoInfo,
		posts,
		token,
	});

	if (boardResult.errorMessage) {
		const classified = classifyErrorStatus(
			tokenPresent,
			boardResult.errorMessage,
			boardResult.errorStatus,
		);

		return buildStatusResult({
			status: classified.status,
			posts: publicPosts,
			tokenPresent,
			errorMessage: classified.errorMessage,
		});
	}

	return buildStatusResult({
		status: "ok",
		posts: publicPosts,
		tokenPresent,
		users: boardResult.users,
		discussionsMatched: boardResult.discussionsMatched,
		postMatches: boardResult.postMatches,
	});
}
