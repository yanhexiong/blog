# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application: routes in `src/pages/`, shared layouts in `src/layouts/`, UI in `src/components/`, helpers in `src/utils/`, and plugins in `src/plugins/`. Blog content lives in `src/content/posts/`; the about page content is in `src/content/spec/about.md`; collection rules are defined in `src/content/config.ts`. Use `src/assets/` for bundled images and `public/` for static files such as favicons. `docs/` holds translated README files, and `scripts/new-post.js` is the post scaffold helper. Treat `.astro/`, `dist/`, and `node_modules/` as generated output.

## Build, Test, and Development Commands
Use `pnpm`; `preinstall` blocks other package managers.

- `pnpm dev` starts Astro locally at `http://localhost:4321`.
- `pnpm check` runs Astro diagnostics.
- `pnpm type-check` runs `tsc --noEmit`.
- `pnpm build` creates the production site and Pagefind index in `dist/`.
- `pnpm preview` serves the built site locally.
- `pnpm format` formats `src/` with Biome.
- `pnpm lint` runs `biome check --write ./src` and may rewrite files.
- `pnpm new-post guide/my-post` creates `src/content/posts/guide/my-post.md`.

## Coding Style & Naming Conventions
Follow `biome.json`: tabs for indentation, double quotes in JavaScript/TypeScript, and organized imports. Keep Astro and Svelte components in PascalCase, for example `PostCard.astro` and `LightDarkSwitch.svelte`. Prefer kebab-case for utility and plugin files, such as `content-utils.ts` and `remark-reading-time.mjs`. Keep post slugs lowercase and path-based. Frontmatter should match the content schema: `title` and `published` are required; fields like `updated`, `tags`, `category`, `draft`, and `lang` are optional.

## Testing Guidelines
There is no dedicated unit-test framework or coverage gate in this repo. Minimum verification before a PR is `pnpm check`, `pnpm type-check`, and `pnpm build`. For UI or content changes, also run `pnpm dev` or `pnpm preview` and verify the affected page manually. CI currently runs Biome quality checks plus Astro check/build jobs on Node 22 and 23.

## Commit & Pull Request Guidelines
Recent history uses short imperative summaries such as `modify profile` and `change domain`, but `CONTRIBUTING.md` asks contributors to prefer Conventional Commits when practical, for example `feat: add archive filter` or `fix: correct RSS path`. Keep each PR focused on one purpose. Follow `.github/pull_request_template.md`: select the change type, link the related issue, describe the changes, list test steps, and attach screenshots when the UI changes.
