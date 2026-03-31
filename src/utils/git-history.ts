import { execFileSync } from "node:child_process";
import path from "node:path";

type GitHistoryChange = {
	status: string;
	paths: string[];
};

type GitHistoryRecord = {
	hash: string;
	shortHash: string;
	committedAt: string;
	changes: GitHistoryChange[];
};

export type GitRevisionChange = {
	kind: "content" | "metadata";
	before: string;
	after: string;
};

export type GitRevision = {
	hash: string;
	shortHash: string;
	committedAt: string;
	pathAtRevision: string;
	bodyContent: string;
	addedLines: number;
	removedLines: number;
	changes: GitRevisionChange[];
};

type ParsedPatch = {
	addedLines: number;
	removedLines: number;
	changes: GitRevisionChange[];
};

const revisionCache = new Map<string, GitRevision[]>();
const gitOutputCache = new Map<string, string>();

function execGit(args: string[]): string {
	const cacheKey = args.join("\0");
	const cachedOutput = gitOutputCache.get(cacheKey);
	if (cachedOutput !== undefined) {
		return cachedOutput;
	}

	try {
		const output = execFileSync("git", args, { encoding: "utf8" }).replace(
			/\r\n/g,
			"\n",
		);
		gitOutputCache.set(cacheKey, output);
		return output;
	} catch {
		gitOutputCache.set(cacheKey, "");
		return "";
	}
}

function toRepoRelativePath(filePath: string): string {
	const resolvedPath = path.resolve(process.cwd(), filePath);
	return path.relative(process.cwd(), resolvedPath).split(path.sep).join("/");
}

function parseGitHistory(relativePath: string): GitHistoryRecord[] {
	const output = execGit([
		"log",
		"--follow",
		"--name-status",
		"-M",
		"--format=%H%x1f%h%x1f%cI",
		"--",
		relativePath,
	]);

	if (!output) {
		return [];
	}

	const records: GitHistoryRecord[] = [];
	let currentRecord: GitHistoryRecord | null = null;

	for (const rawLine of output.split("\n")) {
		const line = rawLine.trimEnd();
		if (!line) {
			continue;
		}

		if (line.includes("\x1f")) {
			if (currentRecord) {
				records.push(currentRecord);
			}

			const [hash, shortHash, committedAt] = line.split("\x1f");
			currentRecord = {
				hash,
				shortHash,
				committedAt,
				changes: [],
			};
			continue;
		}

		if (!currentRecord) {
			continue;
		}

		const parts = line.split("\t").filter(Boolean);
		if (parts.length === 0) {
			continue;
		}

		currentRecord.changes.push({
			status: parts[0],
			paths: parts.slice(1),
		});
	}

	if (currentRecord) {
		records.push(currentRecord);
	}

	return records;
}

function resolvePathAtRevision(
	change: GitHistoryChange | undefined,
	fallbackPath: string,
): { pathAtRevision: string; previousPath: string } {
	if (!change || change.paths.length === 0) {
		return {
			pathAtRevision: fallbackPath,
			previousPath: fallbackPath,
		};
	}

	const statusCode = change.status[0];
	if ((statusCode === "R" || statusCode === "C") && change.paths.length >= 2) {
		const [previousPath, pathAtRevision] = change.paths;
		return {
			pathAtRevision,
			previousPath,
		};
	}

	const resolvedPath = change.paths[0] || fallbackPath;
	return {
		pathAtRevision: resolvedPath,
		previousPath: resolvedPath,
	};
}

function readRevisionContent(hash: string, filePathAtRevision: string): string {
	return execGit(["show", `${hash}:${filePathAtRevision}`]);
}

function readRevisionPatch(hash: string, filePathAtRevision: string): string {
	return execGit([
		"show",
		"--format=",
		"--find-renames",
		"--unified=3",
		hash,
		"--",
		filePathAtRevision,
	]).trimEnd();
}

function readParentRevisionContent(
	hash: string,
	filePathAtPreviousRevision: string,
): string {
	return execGit(["show", `${hash}^:${filePathAtPreviousRevision}`]);
}

function splitFrontmatter(content: string): {
	body: string;
	frontmatterLineCount: number;
} {
	if (!content.startsWith("---\n")) {
		return {
			body: content.trim(),
			frontmatterLineCount: 0,
		};
	}

	const endMarker = "\n---\n";
	const endIndex = content.indexOf(endMarker, 4);
	if (endIndex < 0) {
		return {
			body: content.trim(),
			frontmatterLineCount: 0,
		};
	}

	const frontmatter = content.slice(0, endIndex + endMarker.length);

	return {
		body: content.slice(endIndex + endMarker.length).trim(),
		frontmatterLineCount: frontmatter.split("\n").length - 1,
	};
}

function trimEdgeBlankLines(lines: string[]): string[] {
	let start = 0;
	let end = lines.length;

	while (start < end && lines[start].trim() === "") {
		start++;
	}

	while (end > start && lines[end - 1].trim() === "") {
		end--;
	}

	return lines.slice(start, end);
}

function pushParsedChange(
	changes: GitRevisionChange[],
	kind: GitRevisionChange["kind"],
	beforeLines: string[],
	afterLines: string[],
) {
	const before = trimEdgeBlankLines(beforeLines).join("\n");
	const after = trimEdgeBlankLines(afterLines).join("\n");

	if ((!before && !after) || before === after) {
		return;
	}

	changes.push({
		kind,
		before,
		after,
	});
}

function parsePatch(
	patch: string,
	currentFrontmatterLineCount: number,
	previousFrontmatterLineCount: number,
): ParsedPatch {
	const lines = patch.split("\n");
	const changes: GitRevisionChange[] = [];
	let addedLines = 0;
	let removedLines = 0;

	let metadataBeforeBuffer: string[] = [];
	let metadataAfterBuffer: string[] = [];
	let contentBeforeBuffer: string[] = [];
	let contentAfterBuffer: string[] = [];
	let previousLineNumber = 0;
	let currentLineNumber = 0;

	const flushHunk = () => {
		pushParsedChange(
			changes,
			"metadata",
			metadataBeforeBuffer,
			metadataAfterBuffer,
		);
		pushParsedChange(
			changes,
			"content",
			contentBeforeBuffer,
			contentAfterBuffer,
		);
		metadataBeforeBuffer = [];
		metadataAfterBuffer = [];
		contentBeforeBuffer = [];
		contentAfterBuffer = [];
	};

	for (const line of lines) {
		if (line.startsWith("@@")) {
			flushHunk();
			const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
			if (!match) {
				previousLineNumber = 0;
				currentLineNumber = 0;
				continue;
			}
			previousLineNumber = Number(match[1]);
			currentLineNumber = Number(match[2]);
			continue;
		}

		if (previousLineNumber === 0 && currentLineNumber === 0) {
			continue;
		}

		if (line.startsWith("+") && !line.startsWith("+++")) {
			const targetBuffer =
				currentLineNumber <= currentFrontmatterLineCount
					? metadataAfterBuffer
					: contentAfterBuffer;
			targetBuffer.push(line.slice(1));
			currentLineNumber++;
			addedLines++;
			continue;
		}

		if (line.startsWith("-") && !line.startsWith("---")) {
			const targetBuffer =
				previousLineNumber <= previousFrontmatterLineCount
					? metadataBeforeBuffer
					: contentBeforeBuffer;
			targetBuffer.push(line.slice(1));
			previousLineNumber++;
			removedLines++;
			continue;
		}

		if (line.startsWith(" ")) {
			const contentLine = line.slice(1);
			const previousBuffer =
				previousLineNumber <= previousFrontmatterLineCount
					? metadataBeforeBuffer
					: contentBeforeBuffer;
			const currentBuffer =
				currentLineNumber <= currentFrontmatterLineCount
					? metadataAfterBuffer
					: contentAfterBuffer;

			previousBuffer.push(contentLine);
			currentBuffer.push(contentLine);
			previousLineNumber++;
			currentLineNumber++;
		}
	}

	flushHunk();

	return {
		addedLines,
		removedLines,
		changes,
	};
}

export function getGitRevisions(filePath: string): GitRevision[] {
	const relativePath = toRepoRelativePath(filePath);
	const cachedRevisions = revisionCache.get(relativePath);
	if (cachedRevisions) {
		return cachedRevisions;
	}

	const historyRecords = parseGitHistory(relativePath);
	const revisions: GitRevision[] = [];

	let historicalPath = relativePath;
	for (const record of historyRecords) {
		const { pathAtRevision, previousPath } = resolvePathAtRevision(
			record.changes[0],
			historicalPath,
		);
		historicalPath = previousPath;

		if (record.changes.some((change) => change.status.startsWith("A"))) {
			continue;
		}

		const content = readRevisionContent(record.hash, pathAtRevision);
		const previousContent = readParentRevisionContent(
			record.hash,
			previousPath,
		);
		const patch = readRevisionPatch(record.hash, pathAtRevision);
		const parsedCurrentContent = splitFrontmatter(content);
		const parsedPreviousContent = splitFrontmatter(previousContent);
		const parsedPatch = parsePatch(
			patch,
			parsedCurrentContent.frontmatterLineCount,
			parsedPreviousContent.frontmatterLineCount,
		);

		if (parsedPatch.changes.length === 0) {
			continue;
		}

		if (!parsedPatch.changes.some((change) => change.kind === "content")) {
			continue;
		}

		revisions.push({
			hash: record.hash,
			shortHash: record.shortHash,
			committedAt: record.committedAt,
			pathAtRevision,
			bodyContent: parsedCurrentContent.body,
			addedLines: parsedPatch.addedLines,
			removedLines: parsedPatch.removedLines,
			changes: parsedPatch.changes,
		});
	}

	revisionCache.set(relativePath, revisions);
	return revisions;
}
