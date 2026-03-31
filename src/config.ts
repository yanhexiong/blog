import type {
	AnalyticsConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Harrison Yan",
	subtitle: "Blog",
	lang: "zh_CN",
	themeColor: {
		hue: 250,
		fixed: false,
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png",
		position: "center",
		credit: {
			enable: false,
			text: "",
			url: "",
		},
	},
	toc: {
		enable: true,
		depth: 2,
	},
	favicon: [],
};

export const navBarConfig: NavBarConfig = {
	links: [LinkPreset.Home, LinkPreset.Archive, LinkPreset.About],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/profile.png",
	name: "Harrison Yan",
	bio: "AI 方向学生，记录 Linux、开发与智能体相关学习笔记。",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/yanhexiong",
		},
		{
			name: "Email",
			icon: "fa6-solid:envelope",
			url: "mailto:592604831@qq.com",
		},
		{
			name: "QQ",
			icon: "fa6-brands:qq",
			url: "https://wpa.qq.com/msgrd?v=3&uin=592604831&site=qq&menu=yes",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const analyticsConfig: AnalyticsConfig = {
	enable: true,
	scriptUrl: "https://cloud.umami.is/script.js",
	websiteId: "3e7f68ba-c8f6-43e3-84e2-4e62ed9dc230",
	hostUrl: "",
	domains: ["blog.727613.xyz"],
	autoTrack: true,
	doNotTrack: true,
	shareUrl: "https://cloud.umami.is/share/VMkUrHT0JZ8tocmF",
	shareLabel: "统计",
};

export const commentConfig: CommentConfig = {
	enable: true,
	repo: "yanhexiong/blog-comments",
	repoId: "R_kgDORsrG5Q",
	category: "Announcements",
	categoryId: "DIC_kwDORsrG5c4C46ai",
	mapping: "pathname",
	strict: false,
	reactionsEnabled: true,
	emitMetadata: false,
	inputPosition: "bottom",
	theme: {
		light: "light",
		dark: "dark",
	},
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};
