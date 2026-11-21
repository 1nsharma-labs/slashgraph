<h1 align="center">🗺️ SlashGraph</h1>

<p align="center">
  <b>Universal Codebase & System Architecture Intelligence Graph for AI Agents</b><br>
  <i>Powered by Urlmind & SLASH — Created by Amit Sharma (@1nsharma)</i><br>
  Map entire repositories, extract AST routes, schemas & env vars, and inject zero-token context into Claude Desktop & Cursor.
</p>

<p align="center">
  <a href="https://github.com/1nsharma-labs/slashgraph/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/slashgraph"><img src="https://img.shields.io/badge/npm-v1.0.0-blue.svg" alt="npm version"></a>
  <a href="https://github.com/1nsharma-labs/slashgraph/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-green.svg" alt="License"></a>
  <a href="https://1nsharma-labs.github.io/slashgraph/"><img src="https://img.shields.io/badge/Live_Demo-Interactive_Graph-orange.svg" alt="Live Demo"></a>
  <a href="https://polar.sh/1nsharma-labs"><img src="https://img.shields.io/badge/Sponsor-Polar.sh-purple.svg" alt="Sponsor"></a>
</p>

---

## 🌟 Why SlashGraph?

Feeding full codebases into Cursor, Windsurf, or Claude costs dollars per query and quickly exceeds context windows, causing models to hallucinate routes, models, and dependencies.

**SlashGraph** turns any local directory, Git repository, or live URL into an ultra-dense, token-efficient **Architecture Dossier (< 600 tokens)** and interactive visual knowledge graph.

Inspired by and building on Amit Sharma's foundational inventions:
* [**1nsharma/SLASH**](https://github.com/1nsharma/SLASH): Turning URLs, repositories, and digital systems into one unified real-time intelligence graph.
* [**1nsharma/Urlmind**](https://github.com/1nsharma/Urlmind): Understanding anything on the internet from a single URL with zero friction.

### Key Capabilities
* ⚡ **Zero-Token AST Codebase Mapping:** Automatically discovers Express, Fastify, Next.js, and FastAPI routes; Prisma, TypeORM, and Mongoose database models; and environment variable dependencies in < 150ms.
* 🌐 **Urlmind Web & API Intelligence:** Deeply analyzes live URLs, extracting tech stack signatures, CDN providers, security headers (HSTS, CSP, CORS), and public endpoints.
* 🔮 **Native Model Context Protocol (MCP) Server:** Seamlessly equips Claude Desktop and Cursor with tools to inspect system topology, find routes, and query schemas.
* 🎨 **Interactive 60fps Topology Graph:** Visualizes your entire system graph locally in your browser (`slashgraph serve`).
* 🔒 **Enterprise Architecture Drift Guard (BSL 1.1):** Automatically blocks PRs that introduce circular imports, undeclared environment variables, or orphan database models.

---

## 🚀 Quick Start

### Installation

```bash
# Run on-demand without installing
npx -y slashgraph help

# Or install globally
npm install -g slashgraph
```

---

## 💻 CLI Commands

### 1. Generate Architecture Dossier
Scans your workspace and generates an `ARCH_DOSSIER.md` ready to be copied into Claude or Cursor system prompts:
```bash
slashgraph analyze ./my-project
```

### 2. Inspect Any Web URL via Urlmind
```bash
slashgraph url https://api.github.com
```

### 3. List Discovered HTTP Endpoints
```bash
slashgraph routes .
```

### 4. List Discovered Database Models & Schemas
```bash
slashgraph schema .
```

### 5. Launch Interactive Browser Visualizer
```bash
slashgraph serve .
```

---

## 🔮 Model Context Protocol (MCP) Integration

SlashGraph provides a native MCP stdio server. Add it to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "slashgraph": {
      "command": "npx",
      "args": ["-y", "slashgraph", "mcp"]
    }
  }
}
```

Now Claude Desktop and Cursor can directly execute:
* `slashgraph_analyze_codebase`: Returns the workspace architecture dossier.
* `slashgraph_find_route`: Instantly finds the exact controller file handling `/api/users`.
* `slashgraph_inspect_schema`: Returns full database schema and entity relations.
* `slashgraph_urlmind`: Performs tech stack & security reconnaissance on any URL.

---

## 💼 Commercial & Enterprise Support

SlashGraph follows an **Open-Core** model:
* **Community Core (Apache 2.0):** 100% Free and open-source for developers, AST scanning, Urlmind URL analysis, CLI tools, and full MCP server.
* **Enterprise Edition (BSL 1.1):** Features the **Architecture Drift Guard** (`ee/drift/architectureDrift.js`) for CI/CD pipelines to block circular dependencies, missing `.env.example` vars, and architectural erosion.

### Direct Contact & Payment
* **Lead Architect:** **Amit Sharma** ([@1nsharma](https://github.com/1nsharma))
* **Enterprise Inquiries & Bounties:** [polar.sh/1nsharma-labs](https://polar.sh/1nsharma-labs)
* **Official Contact:** [tech@mowglai.com](mailto:tech@mowglai.com)
* **Global Sponsorship & Cards:** [polar.sh/1nsharma-labs](https://polar.sh/1nsharma-labs) &bull; [github.com/sponsors/1nsharma](https://github.com/sponsors/1nsharma)

---

## 🌐 The 1nsharma Ecosystem

* [**DroidArmor**](https://github.com/1nsharma-labs/droidarmor) — Autonomous AI Mobile Agent & Fast ADB Automation for Android.
* [**OmniMCP**](https://github.com/1nsharma-labs/omnimcp) — Universal Model Context Protocol Hub for Mobile, Desktop, Workspace & Memory.
* [**PromptArmor**](https://github.com/1nsharma-labs/promptarmor) — Sub-2ms Local Prompt Injection & Jailbreak Firewall.
* [**TokenArmor**](https://github.com/1nsharma-labs/tokenarmor) — Open-Source AI Gateway & Token FinOps Firewall.
* [**1nsharma/SLASH**](https://github.com/1nsharma/SLASH) — Unified System & Digital Network Intelligence Graph.
* [**1nsharma/Urlmind**](https://github.com/1nsharma/Urlmind) — Understand Anything on the Internet from a Single URL.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/1nsharma"><b>Amit Sharma</b></a> (@1nsharma-labs)
</p>
