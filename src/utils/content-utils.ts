import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import getReadingTime from "reading-time";

type PostQueryOptions = {
	includeHiddenFromLists?: boolean;
};

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts(options: PostQueryOptions = {}) {
	const { includeHiddenFromLists = false } = options;
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const visibleBlogPosts = includeHiddenFromLists
		? allBlogPosts
		: allBlogPosts.filter((post) => post.data.hideFromLists !== true);

	const sorted = visibleBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts(options: PostQueryOptions = {}) {
	const sorted = await getRawSortedPosts(options);

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(
	options: PostQueryOptions = {},
): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts(options);

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getRawSortedPosts();

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export type ProfileStats = {
	articleCount: number;
	collectionCount: number;
	wordCount: number;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getRawSortedPosts();
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}

export async function getProfileStats(): Promise<ProfileStats> {
	const allBlogPosts = await getRawSortedPosts({
		includeHiddenFromLists: true,
	});
	const slugSet = new Set(allBlogPosts.map((post) => post.slug));
	const collectionSlugs = new Set<string>();

	for (const post of allBlogPosts) {
		const parentSlug = post.slug.split("/").slice(0, -1).join("/");
		if (parentSlug && slugSet.has(parentSlug)) {
			collectionSlugs.add(parentSlug);
		}
	}

	return {
		articleCount: allBlogPosts.filter((post) => !collectionSlugs.has(post.slug))
			.length,
		collectionCount: collectionSlugs.size,
		wordCount: allBlogPosts.reduce((total, post) => {
			return total + getReadingTime(post.body).words;
		}, 0),
	};
}
