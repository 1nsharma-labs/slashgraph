import fs from 'fs';
import path from 'path';

export class AstScanner {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 10;
    this.ignoreDirs = new Set(options.ignoreDirs || [
      'node_modules', '.git', 'dist', 'build', '.next', '.cache', 'coverage', '.turbo'
    ]);
  }

  scanDirectory(rootDir) {
    const results = {
      filesScanned: 0,
      totalLines: 0,
      routes: [],
      models: [],
      envVars: new Set(),
      dependencies: {},
      modules: []
    };

    this.walk(rootDir, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!['.js', '.mjs', '.ts', '.tsx', '.jsx', '.py', '.prisma', '.sql'].includes(ext)) {
        return;
      }

      results.filesScanned++;
      const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        results.totalLines += lines.length;

        // 1. Extract Routes
        this.extractRoutes(content, relativePath, results.routes);

        // 2. Extract Models & Schemas
        this.extractModels(content, relativePath, results.models);

        // 3. Extract Env Vars
        this.extractEnvVars(content, results.envVars);

        // 4. Extract Imports
        const imports = this.extractImports(content);
        results.dependencies[relativePath] = imports;

        results.modules.push({
          path: relativePath,
          lines: lines.length,
          type: this.categorizeModule(relativePath, content)
        });
      } catch {
        // Skip unreadable files
      }
    });

    results.envVars = Array.from(results.envVars).sort();
    return results;
  }

  walk(dir, fileCallback, currentDepth = 0) {
    if (currentDepth > this.maxDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (this.ignoreDirs.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.walk(fullPath, fileCallback, currentDepth + 1);
      } else if (entry.isFile()) {
        fileCallback(fullPath);
      }
    }
  }

  extractRoutes(content, file, routesList) {
    // Express/Fastify/Koa: (app|router).(get|post|put|delete|patch)\(['"`]([^'"`]+)
    const expressRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match;
    while ((match = expressRegex.exec(content)) !== null) {
      routesList.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file,
        type: 'rest'
      });
    }

    // Next.js App Router route handlers: export async function GET / POST
    const nextRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
    while ((match = nextRegex.exec(content)) !== null) {
      // Derive route path from file path
      let routePath = '/' + file.replace(/^(?:app|src\/app)\//, '').replace(/\/route\.[jt]sx?$/, '');
      if (routePath === '/route') routePath = '/';
      routesList.push({
        method: match[1].toUpperCase(),
        path: routePath,
        file,
        type: 'nextjs'
      });
    }

    // Python Flask/FastAPI: @app.get('/...') or @router.post('/...')
    const pyRegex = /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = pyRegex.exec(content)) !== null) {
      routesList.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file,
        type: 'fastapi-flask'
      });
    }
  }

  extractModels(content, file, modelsList) {
    // Prisma: model User { ... }
    const prismaRegex = /model\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = prismaRegex.exec(content)) !== null) {
      const modelName = match[1];
      const body = match[2];
      const fields = body.trim().split('\n')
        .map(l => l.trim().split(/\s+/)[0])
        .filter(f => f && !f.startsWith('//') && !f.startsWith('@@'));

      modelsList.push({
        name: modelName,
        file,
        fields,
        orm: 'prisma'
      });
    }

    // Mongoose: const UserSchema = new Schema({ ... })
    const mongooseRegex = /(?:const|let|var)\s+([A-Za-z0-9_]+)Schema\s*=\s*new\s+Schema/g;
    while ((match = mongooseRegex.exec(content)) !== null) {
      modelsList.push({
        name: match[1],
        file,
        orm: 'mongoose'
      });
    }

    // TypeORM / Sequelize: @Entity('users') or class User extends Model
    const typeormRegex = /@Entity\s*\(\s*['"`]?([A-Za-z0-9_]+)?['"`]?\s*\)\s*export\s+class\s+([A-Za-z0-9_]+)/g;
    while ((match = typeormRegex.exec(content)) !== null) {
      modelsList.push({
        name: match[2],
        table: match[1] || match[2],
        file,
        orm: 'typeorm'
      });
    }

    // SQL CREATE TABLE
    const sqlRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_"`]+)/gi;
    while ((match = sqlRegex.exec(content)) !== null) {
      modelsList.push({
        name: match[1].replace(/[`"]/g, ''),
        file,
        orm: 'sql-ddl'
      });
    }
  }

  extractEnvVars(content, envSet) {
    // process.env.XYZ
    const nodeEnvRegex = /process\.env\.([A-Z0-9_]+)/g;
    let match;
    while ((match = nodeEnvRegex.exec(content)) !== null) {
      envSet.add(match[1]);
    }

    // os.environ.get('XYZ') or os.getenv('XYZ')
    const pyEnvRegex = /(?:os\.environ\.get|os\.getenv)\s*\(\s*['"`]([A-Z0-9_]+)['"`]/g;
    while ((match = pyEnvRegex.exec(content)) !== null) {
      envSet.add(match[1]);
    }
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /(?:import\s+(?:[\w*\s{},]*)\s+from\s+|require\s*\(\s*)['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const imp = match[1];
      if (imp.startsWith('.')) {
        imports.push(imp);
      }
    }
    return imports;
  }

  categorizeModule(file, content) {
    const lower = file.toLowerCase();
    if (lower.includes('route') || lower.includes('controller') || lower.includes('api')) return 'API/Controller';
    if (lower.includes('model') || lower.includes('schema') || lower.includes('entity')) return 'Database/Model';
    if (lower.includes('service') || lower.includes('manager')) return 'Service/BusinessLogic';
    if (lower.includes('middleware') || lower.includes('guard')) return 'Security/Middleware';
    if (lower.includes('util') || lower.includes('helper')) return 'Utility';
    if (lower.includes('test') || lower.includes('spec')) return 'Test';
    return 'CoreModule';
  }
}
