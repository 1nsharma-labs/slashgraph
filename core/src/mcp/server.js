import readline from 'readline';
import { AstScanner } from '../parser/astScanner.js';
import { DossierGenerator } from '../graph/dossierGenerator.js';
import { UrlMindAnalyzer } from '../urlmind/urlAnalyzer.js';

export class SlashMcpServer {
  constructor(options = {}) {
    this.scanner = new AstScanner(options);
    this.urlAnalyzer = new UrlMindAnalyzer();
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const request = JSON.parse(trimmed);
        const response = await this.handleMessage(request);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        }) + '\n');
      }
    });

    process.stderr.write('🗺️ SlashGraph MCP Server running on stdio\n');
  }

  async handleMessage(req) {
    const { id, method, params } = req;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'slashgraph-mcp',
            version: '1.0.0'
          }
        }
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'slashgraph_analyze_codebase',
              description: 'Scans the workspace directory, maps routes, database models, and env vars, and returns a high-density Markdown Architecture Dossier.',
              inputSchema: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Directory path to scan (defaults to current directory)' }
                }
              }
            },
            {
              name: 'slashgraph_find_route',
              description: 'Locates the exact file, handler, and framework type for any HTTP route path or method.',
              inputSchema: {
                type: 'object',
                properties: {
                  route_path: { type: 'string', description: 'Route path (e.g. /api/users or /login)' },
                  directory: { type: 'string', description: 'Project directory' }
                },
                required: ['route_path']
              }
            },
            {
              name: 'slashgraph_inspect_schema',
              description: 'Returns all database models, Prisma schemas, SQL tables, and entity definitions across the project.',
              inputSchema: {
                type: 'object',
                properties: {
                  directory: { type: 'string', description: 'Project directory' }
                }
              }
            },
            {
              name: 'slashgraph_urlmind',
              description: 'Executes Urlmind deep intelligence on any live web URL, extracting tech stack, security headers, metadata, and endpoints.',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'Website URL to analyze' }
                },
                required: ['url']
              }
            }
          ]
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let content = '';

        if (toolName === 'slashgraph_analyze_codebase') {
          const targetDir = args.path || process.cwd();
          const scan = this.scanner.scanDirectory(targetDir);
          content = DossierGenerator.generateMarkdownDossier(scan, targetDir);
        } else if (toolName === 'slashgraph_find_route') {
          const targetDir = args.directory || process.cwd();
          const scan = this.scanner.scanDirectory(targetDir);
          const found = scan.routes.filter(r => r.path.toLowerCase().includes(args.route_path.toLowerCase()));
          content = found.length > 0 ? JSON.stringify(found, null, 2) : `No routes matching "${args.route_path}" found.`;
        } else if (toolName === 'slashgraph_inspect_schema') {
          const targetDir = args.directory || process.cwd();
          const scan = this.scanner.scanDirectory(targetDir);
          content = JSON.stringify(scan.models, null, 2);
        } else if (toolName === 'slashgraph_urlmind') {
          const res = await this.urlAnalyzer.analyzeUrl(args.url);
          content = JSON.stringify(res, null, 2);
        } else {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool "${toolName}" not found.` }
          };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: content }]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error: ${err.message}` }]
          }
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {}
    };
  }
}
