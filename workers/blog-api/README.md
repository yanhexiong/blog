# blog-api Worker

This Worker serves the live answer board API and refreshes a cached snapshot every 15 minutes.

## What it does

- `GET /health`
  - health check
- `GET /api/board?series=linux-tutorial-series`
  - returns the current answer board JSON
- `scheduled()`
  - refreshes KV cache every 15 minutes

## Setup

1. Create KV namespaces.

```powershell
pnpm dlx wrangler kv namespace create ANSWER_BOARD_CACHE --config workers/blog-api/wrangler.toml
pnpm dlx wrangler kv namespace create ANSWER_BOARD_CACHE --preview --config workers/blog-api/wrangler.toml
```

2. Replace the placeholder KV ids in [wrangler.toml](/D:/blog/workers/blog-api/wrangler.toml).

3. Set the GitHub token secret.

```powershell
pnpm dlx wrangler secret put GH_TOKEN --config workers/blog-api/wrangler.toml
```

4. Deploy.

```powershell
pnpm dlx wrangler deploy --config workers/blog-api/wrangler.toml
```

## Notes

- The Worker returns cached data when available.
- If the cache is older than 15 minutes, a request will still return cached data first and refresh in the background.
- The cron trigger also refreshes the cache every 15 minutes, so most requests should hit KV instead of GitHub.
