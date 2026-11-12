# Nacho’s professional MCP

Public, read-only career and engineering reference material. The visitor’s own agent compares it with their requirements. No model API key, database, or write tools are required.

## Hosting boundaries

- Website: **https://asknacho.to/**, served by GitHub Pages from the root HTML and assets.
- MCP: **https://mcp.asknacho.to/api/mcp**, served by the separate Vercel project `nacho-mcp` in `ignaciomaldonados-projects`.
- The MCP domain root returns JSON connection metadata. It does not host the website.
- The Vercel build generates only the document corpus, public Markdown/JSON documents, and `/llms.txt`. It never copies the website or assets. Generated `public/` is cleared each build and excluded from CLI uploads.
- GitHub Pages excludes `mcp/`. Deploying the MCP does not publish website changes; publishing the website does not deploy the MCP. Git auto-deployment for Vercel is not configured.

## Local development

Use Node 22. From `mcp/`:

```sh
npm ci
npm run sync
npm run build
npm test
npm run dev
```

Local endpoint: http://127.0.0.1:3100/api/mcp. The root and `/health` return JSON; no local website preview is served by this process.

Streamable HTTP client configuration:

```json
{
  "mcpServers": {
    "nacho": { "url": "https://mcp.asknacho.to/api/mcp" }
  }
}
```

A browser GET to the endpoint returns 405 intentionally; connect using an MCP client. This server supports stateless Streamable HTTP with JSON responses, not legacy SSE sessions.

## Content and provenance

- `content/career.md` is a snapshot of work and side-project content in the root `index.html`. Run `npm run sync` after editing that content and inspect the diff. Deployment uses this snapshot and needs no website files.
- `content/profile.md` summarizes the supplied material and its limitations.
- `content/guidance/` preserves all eight supplied files from `Nacho agents.md.zip`. They are reference documents, not runtime agent instructions. The hidden research archive is not included.
- `npm run build` generates the allowlisted corpus and public Markdown/JSON copies with provenance and content hashes. Update the content date when reviewing new sources.
- Examples are fictional; career claims are self-reported. Detailed management case studies and independently verified metrics remain gaps.

Tools: `get_profile`, `list_documents`, `read_document`, `search_documents`. Every tool is read-only. Ten resources expose the same documents; `assess_fit` is an optional prompt. Text fallback: `/llms.txt`, `/documents/index.json`, and `/documents/profile.md`.

Add sources explicitly to the source list in `scripts/build.mjs`.

## Deploy and verify

From `mcp/`, independently of GitHub Pages:

```sh
npm run build
npm test
vercel project inspect --non-interactive
vercel deploy --environment preview --scope ignaciomaldonados-projects
```

After verifying the target and an authorized production release:

```sh
vercel deploy --prod --scope ignaciomaldonados-projects
node scripts/smoke.mjs
```

The smoke script uses an ordinary unauthenticated MCP client against the public custom domain. To test a protected preview, pass its `https://…vercel.app` URL; the script uses the authenticated Vercel CLI as HTTP transport without printing credentials. Previews retain Vercel protection. Never commit bypass credentials.

Changes remain local until committed and pushed. No database is provisioned.
