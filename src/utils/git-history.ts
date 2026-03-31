import { execFileSync } from "node:child_process";
import path from "node:path";

export type GitRevision = {
	hash: string;
	shortHash: string;
	committedAt: string;
	subject: string;
	url?: string;
};

const revisionCache = new Map<string, GitRevision[]>();
let repoWebUrlCache: string | null | undefined;

function normalizeGitHubRepoUrl(remoteUrl: string): string | null {
	const trimmedUrl = remoteUrl
		.trim()
		.replace(/\.git$/, "")
		.replace(/\/$/, "");
	if (!trimmedUrl) {
		return null;
	}

	if (trimmedUrl.startsWith("git@github.com:")) {
		return `https://github.com/${trimmedUrl.slice("git@github.com:".length)}`;
	}

	if (trimmedUrl.startsWith("ssh://git@github.com/")) {
		return `https://github.com/${trimmedUrl.slice(
			"ssh://git@github.com/".length,
		)}`;
	}

	if (trimmedUrl.startsWith("https://github.com/")) {
		return trimmedUrl;
	}

	if (trimmedUrl.startsWith("http://github.com/")) {
		return trimmedUrl.replace("http://github.com/", "https://github.com/");
	}

	return null;
}

function getGitHubRepoUrl(): string | null {
	if (repoWebUrlCache !== undefined) {
		return repoWebUrlCache;
	}

	try {
		const remoteUrl = execFileSync(
			"git",
			["config", "--get", "remote.origin.url"],
			{ encoding: "utf8" },
		);
		repoWebUrlCache = normalizeGitHubRepoUrl(remoteUrl);
	} catch {
		repoWebUrlCache = null;
	}

	return repoWebUrlCache;
}

function toRepoRelativePath(filePath: string): string {
	const resolvedPath = path.resolve(process.cwd(), filePath);
	return path.relative(process.cwd(), resolvedPath).split(path.sep).join("/");
}

export function getGitRevisions(filePath: string): GitRevision[] {
	const relativePath = toRepoRelativePath(filePath);
	const cachedRevisions = revisionCache.get(relativePath);
	if (cachedRevisions) {
		return cachedRevisions;
	}

	try {
		const output = execFileSync(
			"git",
			[
				"log",
				"--follow",
				"--format=%H%x1f%h%x1f%cI%x1f%s%x1e",
				"--",
				relativePath,
			],
			{ encoding: "utf8" },
		);
		const repoUrl = getGitHubRepoUrl();
		const revisions = output
			.split("\x1e")
			.map((record) => record.trim())
			.filter(Boolean)
			.map((record) => {
				const [hash, shortHash, committedAt, subject] = record.split("\x1f");

				return {
					hash,
					shortHash,
					committedAt,
					subject,
					url: repoUrl ? `${repoUrl}/commit/${hash}` : undefined,
				};
			});

		revisionCache.set(relativePath, revisions);
		return revisions;
	} catch {
		revisionCache.set(relativePath, []);
		return [];
	}
}
