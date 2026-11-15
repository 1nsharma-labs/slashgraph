# Show HN: SlashGraph – Universal Codebase & System Architecture Intelligence Graph

Hey Hacker News,

I’m Amit (@1nsharma), founder of 1nsharma-labs. Today I’m releasing **SlashGraph** (Apache 2.0).

### The Problem
When developers feed entire codebases into Claude, Cursor, or Windsurf:
1. **Context Bloat & Token Burn:** Loading hundreds of files eats tens of thousands of tokens per prompt, costing real money.
2. **Hallucinated Architecture:** Models lose track of where routes are wired to controllers, which database schemas exist, or what environment variables are required.
3. **Black-box Repositories & URLs:** Engineers joining a project or auditing an external API waste hours mapping endpoints manually.

### What SlashGraph Does
SlashGraph combines zero-token AST extraction with Urlmind intelligence:
- **Instant AST Extraction (< 150ms):** Extracts Express, Fastify, Next.js, and FastAPI routes; Prisma, TypeORM, SQL schemas; and environment variables without needing external compilers.
- **Ultra-Compact Architecture Dossier (< 600 tokens):** Generates a dense Markdown dossier you can paste into your LLM prompt, giving it 100% architectural awareness for a fraction of the token cost.
- **Urlmind Web & API Inspector:** Run `slashgraph url <target>` to instantly audit tech stacks, CDNs, security headers (HSTS, CSP, CORS), and public API routes.
- **Native MCP Server:** Exposes tools directly to Claude Desktop and Cursor.
- **Interactive Visualizer:** Run `slashgraph serve` to explore your codebase topology as an interactive 60fps graph in your browser.

- **GitHub:** https://github.com/1nsharma-labs/slashgraph
- **Live In-Browser Topology Visualizer:** https://1nsharma-labs.github.io/slashgraph/

I'd love your thoughts, feedback, and PRs!
