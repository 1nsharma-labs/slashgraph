#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { AstScanner } from '../parser/astScanner.js';
import { DossierGenerator } from '../graph/dossierGenerator.js';
import { UrlMindAnalyzer } from '../urlmind/urlAnalyzer.js';
import { SlashMcpServer } from '../mcp/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANNER = `
   ____  _           _     ____                 _     
  / ___|| | __ _ ___| |__ / ___|_ __ __ _ _ __ | |__  
  \\___ \\| |/ _\` / __| '_ \\ |  _| '__/ _\` | '_ \\| '_ \\ 
   ___) | | (_| \\__ \\ | | | |_| | | | (_| | |_) | | | |
  |____/|_|\\__,_|___/_| |_|\\____|_|  \\__,_| .__/|_| |_|
                                          |_|         
  Universal Codebase & System Architecture Intelligence Graph
  Powered by Urlmind & SLASH • Created by Amit Sharma (@1nsharma) • 1nsharma-labs
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const scanner = new AstScanner();
  const urlAnalyzer = new UrlMindAnalyzer();

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(BANNER);
    console.log(`Usage: slashgraph <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  analyze [dir]     Scan codebase and generate high-density Architecture Dossier`);
    console.log(`  url <target>      Run Urlmind deep intelligence analysis on any website or API`);
    console.log(`  routes [dir]      List all extracted HTTP API endpoints, methods, and files`);
    console.log(`  schema [dir]      List all extracted database models, Prisma schemas & SQL tables`);
    console.log(`  serve [dir]       Launch local interactive architecture visualizer in browser`);
    console.log(`  mcp               Launch Model Context Protocol (MCP) server for Claude / Cursor`);
    console.log(`\nExamples:`);
    console.log(`  slashgraph analyze ./my-project`);
    console.log(`  slashgraph url https://github.com`);
    console.log(`  slashgraph routes .`);
    console.log(`  slashgraph serve .\n`);
    process.exit(0);
  }

  if (command === 'mcp') {
    const server = new SlashMcpServer();
    server.start();
    return;
  }

  console.log(BANNER);

  if (command === 'analyze') {
    const targetDir = path.resolve(args[1] || process.cwd());
    console.log(`🔍 Scanning codebase at: ${targetDir} ...\n`);
    const scan = scanner.scanDirectory(targetDir);
    const dossier = DossierGenerator.generateMarkdownDossier(scan, path.basename(targetDir));

    const outputPath = path.join(process.cwd(), 'ARCH_DOSSIER.md');
    fs.writeFileSync(outputPath, dossier, 'utf-8');

    console.log(`📊 Scan Complete:`);
    console.log(`  Files Scanned:   ${scan.filesScanned}`);
    console.log(`  Total Lines:     ${scan.totalLines}`);
    console.log(`  Routes Detected: ${scan.routes.length}`);
    console.log(`  Data Models:     ${scan.models.length}`);
    console.log(`  Env Variables:   ${scan.envVars.length}`);
    console.log(`\n📄 Generated Architecture Dossier written to: ${outputPath}`);
    console.log(`💡 Tip: Paste ARCH_DOSSIER.md into Claude / Cursor system prompt to give the AI 100% architectural awareness!\n`);
  } else if (command === 'url') {
    const targetUrl = args[1];
    if (!targetUrl) {
      console.error(`❌ Error: Please specify a URL (e.g. slashgraph url https://example.com)`);
      process.exit(1);
    }

    console.log(`🌐 Analyzing URL with Urlmind: ${targetUrl} ...\n`);
    const intel = await urlAnalyzer.analyzeUrl(targetUrl);

    console.log(`🎯 URL Intelligence Report:`);
    console.log(`  Target:       ${intel.url}`);
    console.log(`  HTTP Status:  ${intel.status}`);
    console.log(`  Tech Stack:   ${intel.techStack.join(', ')}`);
    console.log(`  Page Title:   ${intel.meta.title}`);
    console.log(`  Description:  ${intel.meta.description}`);
    console.log(`\n🔒 Security Headers Audit:`);
    console.log(`  HSTS:         ${intel.security.hsts ? '✅ Enabled' : '⚠️ Missing'}`);
    console.log(`  CSP:          ${intel.security.csp ? '✅ Enabled' : '⚠️ Missing'}`);
    console.log(`  X-Frame-Opts: ${intel.security.xFrameOptions ? '✅ Enabled' : '⚠️ Missing'}`);
    console.log(`  CORS *:       ${intel.security.corsWildcard ? '⚠️ Wildcard Open' : '✅ Restricted'}`);

    if (intel.endpoints.length > 0) {
      console.log(`\n⚡ Discovered API Endpoints:`);
      intel.endpoints.forEach(ep => console.log(`  - ${ep}`));
    }
    console.log('');
  } else if (command === 'routes') {
    const targetDir = path.resolve(args[1] || process.cwd());
    const scan = scanner.scanDirectory(targetDir);
    console.log(`⚡ Discovered API Endpoints (${scan.routes.length}):\n`);
    if (scan.routes.length === 0) {
      console.log(`  No route handlers detected.`);
    } else {
      scan.routes.forEach(r => {
        console.log(`  [${r.method}] ${r.path} -> ${r.file} (${r.type})`);
      });
    }
    console.log('');
  } else if (command === 'schema') {
    const targetDir = path.resolve(args[1] || process.cwd());
    const scan = scanner.scanDirectory(targetDir);
    console.log(`🗄️ Discovered Database Schemas & Entities (${scan.models.length}):\n`);
    if (scan.models.length === 0) {
      console.log(`  No database models or SQL schemas detected.`);
    } else {
      scan.models.forEach(m => {
        const fields = m.fields ? ` (fields: ${m.fields.join(', ')})` : '';
        console.log(`  • Model "${m.name}" [${m.orm}] in ${m.file}${fields}`);
      });
    }
    console.log('');
  } else if (command === 'serve') {
    const targetDir = path.resolve(args[1] || process.cwd());
    const scan = scanner.scanDirectory(targetDir);
    const graphData = DossierGenerator.generateGraphJson(scan);

    const uiHtmlPath = path.resolve(__dirname, '../../ui/index.html');
    let htmlContent = fs.existsSync(uiHtmlPath)
      ? fs.readFileSync(uiHtmlPath, 'utf-8')
      : `<h1>SlashGraph Visualizer</h1>`;

    // Inject graph data into html
    htmlContent = htmlContent.replace('/* __INJECT_GRAPH_DATA__ */', `window.INITIAL_GRAPH_DATA = ${JSON.stringify(graphData)};`);

    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    });

    const PORT = 4242;
    server.listen(PORT, () => {
      console.log(`🚀 SlashGraph Interactive Visualizer running at: http://localhost:${PORT}`);
      console.log(`  Visualizing: ${scan.modules.length} modules, ${scan.routes.length} routes, ${scan.models.length} models.`);
      console.log(`  Press Ctrl+C to stop.`);
    });
  } else {
    console.error(`Unknown command: "${command}". Run "slashgraph help" for usage.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
