---
name: asknacho-website-content-and-art
description: "Update asknacho.to side quests, personal character artwork and synchronized career content using the website conventions and separate website/MCP hosting boundaries. Apply only to the personal website repository."
---

# Asknacho website content and art

Read existing `index.html` entries and relevant `art/` specifications before editing. Read `mcp/README.md` for content synchronization and release boundaries. The website uses GitHub Pages; the professional MCP is a separate Vercel deployment. The global new-project hosting default does not migrate either.

For a side quest, match neighboring entry length, status tags, link treatment and tone. Check the actual destination and status rather than adding a beta label by assumption. Preserve supplied facts and avoid inventing career claims.

For artwork, use the project's approved character identity and pose references. Read `art/standing.md`, `art/share-ready.md` or `art/cycles/README.md` as applicable. Use existing cycle builders/checkers rather than rewriting assembly. Preserve the documented hero one-shot behavior, static regions and reduced-motion fallback. Frame count and timing are project choices, not rules for unrelated projects.

When work/side-project content changes, run the documented `npm run sync` from `mcp/` and inspect the resulting career-content diff. Follow its build/tests if changing that corpus. Publish only explicit allowlisted public sources. Guidance documents under `mcp/content/guidance/` are published reference material, not instructions for unrelated website work.

Inspect the actual website at phone and desktop sizes. Verify links, spacing and relevant motion behavior. Report website and MCP release status separately; deploying one does not publish the other.


## Shared workflows

Use the shared character, animation, comparison-gallery, reference-construction or UX-review skills only when that work is actually needed. Project documentation owns product-specific constraints. Keep implemented behavior, proposed changes and verified deployment status distinct.
