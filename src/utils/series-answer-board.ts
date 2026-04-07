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
	title: string;
	url: string;
	category: { id: string } | null;
	comments: { nodes: DiscussionCommentNode[] };
};

type GitHubGraphQLResponse = {
	data?: {
		repository?: {
			discussions: {
				nodes: DiscussionNode[];
				pageInfo: {
					hasNextPage: boolean;
					endCursor: string | null;
				};
			};
		};
	};
	errors?: Array<{ message: string }>;
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

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

function normalizeCommentText(text: string): string {
	return text
		.toLowerCase()
		.replaceAll("\r", "")
		.replace(/[ \t]+/g, " ");
}

function normalizePathname(pathname: string): string {
	return pathname
		.toLowerCase()
		.replace(/^https?:\/\/[^/]+/, "")
		.replace(/\/+$/, "");
}

function extractTemplateSignature(postBody: string): TemplateSignature {
	const codeBlocks = [...postBody.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)];
	const template = codeBlocks.at(-1)?.[1] ?? "";
	const headingCount = (template.match(/(?:^|\n)\s*##+\s+/g) || []).length;
	const numberedCount = (template.match(/(?:^|\n)\s*\d+[.)、．]/g) || [])
		.length;
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
	const numberedMatches = (normalized.match(/(?:^|\n)\s*\d+[.)、．]/g) || [])
		.length;
	const bulletMatches = (normalized.match(/(?:^|\n)\s*-\s+/g) || []).length;
	const fencedBlockMatches = (normalized.match(/```/g) || []).length;
	const labelMatches = (
		normalized.match(
			/(命令|回答|判断结果|输出解读|判断依据|步骤|作用|结果|内核版本|发行版信息|根目录内容|系统时间|实践题|思考题)\s*[:：]/g,
		) || []
	).length;
	const sectionMatches = (
		normalized.match(/(实践题|思考题|practice|discussion|answers?)/g) || []
	).length;

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

function getCommentRepoInfo() {
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

async function fetchGitHubGraphQL(
	query: string,
	variables: Record<string, unknown>,
	token: string,
): Promise<GitHubGraphQLResponse> {
	const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query, variables }),
	});

	return (await response.json()) as GitHubGraphQLResponse;
}

async function fetchDiscussions(
	token: string,
): Promise<{ discussions: DiscussionNode[]; errorMessage?: string }> {
	const repoInfo = getCommentRepoInfo();
	if (!repoInfo) {
		return { discussions: [], errorMessage: "comments repo is not configured" };
	}

	const discussions: DiscussionNode[] = [];
	let cursor: string | null = null;

	const query = `
		query SeriesAnswerBoard($owner: String!, $name: String!, $after: String) {
			repository(owner: $owner, name: $name) {
				discussions(first: 50, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
					nodes {
						title
						url
						category {
							id
						}
						comments(first: 100) {
							nodes {
								author {
									login
									url
									avatarUrl
								}
								bodyText
								url
								createdAt
							}
						}
					}
					pageInfo {
						hasNextPage
						endCursor
					}
				}
			}
		}
	`;

	try {
		while (true) {
			const result = await fetchGitHubGraphQL(
				query,
				{
					owner: repoInfo.owner,
					name: repoInfo.name,
					after: cursor,
				},
				token,
			);

			if (result.errors?.length) {
				return {
					discussions: [],
					errorMessage: result.errors.map((error) => error.message).join("; "),
				};
			}

			const page = result.data?.repository?.discussions;
			if (!page) {
				return {
					discussions: [],
					errorMessage: "repository discussions response is empty",
				};
			}

			discussions.push(
				...page.nodes.filter(
					(discussion) => discussion.category?.id === repoInfo.categoryId,
				),
			);

			if (!page.pageInfo.hasNextPage) {
				break;
			}

			cursor = page.pageInfo.endCursor;
		}
	} catch (error) {
		return {
			discussions: [],
			errorMessage:
				error instanceof Error ? error.message : "failed to fetch discussions",
		};
	}

	return { discussions };
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

	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
	if (!token) {
		return {
			posts: posts.map(({ signature: _signature, ...post }) => post),
			users: [],
			status: "missing-token",
			debug: {
				tokenPresent: false,
				discussionsMatched: 0,
				postMatches: [],
			},
		};
	}

	if (!getCommentRepoInfo()) {
		return {
			posts: posts.map(({ signature: _signature, ...post }) => post),
			users: [],
			status: "not-configured",
			debug: {
				tokenPresent: true,
				discussionsMatched: 0,
				postMatches: [],
			},
		};
	}

	const { discussions, errorMessage } = await fetchDiscussions(token);
	if (errorMessage) {
		return {
			posts: posts.map(({ signature: _signature, ...post }) => post),
			users: [],
			status: "error",
			errorMessage,
			debug: {
				tokenPresent: true,
				discussionsMatched: 0,
				postMatches: [],
			},
		};
	}

	const userMap = new Map<string, SeriesAnswerBoardUser>();
	const postMatches: SeriesAnswerBoardData["debug"]["postMatches"] = [];
	let discussionsMatched = 0;

	for (const post of posts) {
		const normalizedPostPath = normalizePathname(post.pathname);
		const relatedDiscussion = discussions.find((discussion) => {
			const normalizedTitle = normalizePathname(discussion.title);
			return (
				normalizedTitle.includes(normalizedPostPath) ||
				normalizedPostPath.includes(normalizedTitle)
			);
		});

		if (!relatedDiscussion) {
			postMatches.push({
				postSlug: post.slug,
				commentCount: 0,
				matchedCommentCount: 0,
				commentPreviews: [],
			});
			continue;
		}

		discussionsMatched++;
		let matchedCommentCount = 0;
		const commentPreviews: SeriesAnswerBoardData["debug"]["postMatches"][number]["commentPreviews"] =
			[];

		for (const comment of relatedDiscussion.comments.nodes) {
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

			const existingUser = userMap.get(comment.author.login) ?? {
				login: comment.author.login,
				url: comment.author.url,
				avatarUrl: comment.author.avatarUrl,
				answers: [],
			};

			const existingAnswerIndex = existingUser.answers.findIndex(
				(answer) => answer.postSlug === post.slug,
			);

			const nextAnswer = {
				postSlug: post.slug,
				commentUrl: comment.url,
				createdAt: comment.createdAt,
			};

			if (existingAnswerIndex >= 0) {
				existingUser.answers[existingAnswerIndex] = nextAnswer;
			} else {
				existingUser.answers.push(nextAnswer);
			}

			userMap.set(comment.author.login, existingUser);
		}

		postMatches.push({
			postSlug: post.slug,
			discussionTitle: relatedDiscussion.title,
			commentCount: relatedDiscussion.comments.nodes.length,
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
		posts: posts.map(({ signature: _signature, ...post }) => post),
		users,
		status: "ok",
		debug: {
			tokenPresent: true,
			discussionsMatched,
			postMatches,
		},
	};
}
