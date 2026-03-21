# Fuwari 中文博客

这是一个基于 [Astro](https://astro.build) 和 [Fuwari](https://github.com/saicaca/fuwari) 的个人博客仓库，默认使用中文，并已接入基于 GitHub Discussions 的 `giscus` 评论系统。

## 功能

- 基于 Astro、Tailwind CSS 和 Svelte
- 支持亮色、暗色和自动主题
- 支持搜索、RSS、目录、代码高亮和扩展 Markdown 语法
- 评论系统使用 `giscus`，评论数据存储在独立仓库 `yanhexiong/blog-comments`

## 本地开发

```sh
pnpm install
pnpm dev
```

常用命令：

- `pnpm dev`：启动本地开发服务器
- `pnpm check`：运行 Astro 检查
- `pnpm type-check`：运行 TypeScript 类型检查
- `pnpm build`：构建生产版本并生成 Pagefind 索引
- `pnpm preview`：本地预览构建结果
- `pnpm format`：格式化 `src/`
- `pnpm lint`：运行 Biome 检查并自动修复
- `pnpm new-post guide/my-post`：创建新文章

## 文章 Frontmatter

```yaml
---
title: 我的第一篇文章
published: 2026-03-21
description: 这里填写文章摘要
image: ./cover.jpg
tags: [Astro, Fuwari]
category: 前端
draft: false
lang: zh_CN
---
```

## 评论配置

站点默认启用评论区，配置位于 `src/config.ts`。

当前使用的评论仓库：

- `repo`: `yanhexiong/blog-comments`
- `mapping`: `pathname`

启用 `giscus` 之前，请先完成以下配置：

1. 确认 `yanhexiong/blog-comments` 是公开仓库。
2. 在该仓库开启 GitHub Discussions。
3. 安装 [giscus GitHub App](https://github.com/apps/giscus) 并授权到 `yanhexiong/blog-comments`。
4. 打开 [giscus 配置页](https://giscus.app/zh-CN)，选择仓库和分类后，复制 `repoId`、`category`、`categoryId`。
5. 将这三个值填入 `src/config.ts` 的 `commentConfig` 中。

## 部署

生产站点地址配置在 `astro.config.mjs` 的 `site` 字段，目前为 `https://blog.727613.xyz`。部署到 Vercel、Netlify 或 GitHub Pages 前，请先确认域名和该配置一致。
