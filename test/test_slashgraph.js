import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import { AstScanner } from '../core/src/parser/astScanner.js';
import { DossierGenerator } from '../core/src/graph/dossierGenerator.js';
import { UrlMindAnalyzer } from '../core/src/urlmind/urlAnalyzer.js';
import { EnterpriseLicenseVerifier } from '../ee/license/verifier.js';
import { ArchitectureDriftGuard } from '../ee/drift/architectureDrift.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🧪 Running SlashGraph Test Suite...\n');

// 1. AstScanner Tests
console.log('▶ Testing AstScanner (Codebase Topology Extraction)...');
const scanner = new AstScanner();
const scanResult = scanner.scanDirectory(projectRoot);

assert(scanResult.filesScanned > 0, 'Should scan at least 1 file');
console.log(`  ✔ Scanned ${scanResult.filesScanned} files (${scanResult.totalLines} lines of code)`);

// Test route extraction logic directly
const sampleExpress = `
  app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));
  router.post('/api/v1/auth/login', authHandler);
`;
const mockRoutes = [];
scanner.extractRoutes(sampleExpress, 'src/routes.js', mockRoutes);
assert(mockRoutes.length === 2, 'Should extract 2 routes');
assert(mockRoutes[0].path === '/api/v1/health', 'First route path mismatch');
assert(mockRoutes[1].method === 'POST', 'Second route method mismatch');
console.log('  ✔ Express & Router AST route extraction verified');

// Test schema extraction logic
const samplePrisma = `
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    createdAt DateTime @default(now())
  }
`;
const mockModels = [];
scanner.extractModels(samplePrisma, 'prisma/schema.prisma', mockModels);
assert(mockModels.length === 1, 'Should extract 1 Prisma model');
assert(mockModels[0].name === 'User', 'Model name mismatch');
assert(mockModels[0].fields.includes('email'), 'Field email should be present');
console.log('  ✔ Prisma model & field extraction verified');

// 2. DossierGenerator Tests
console.log('\n▶ Testing DossierGenerator (Architecture Dossier & Graph JSON)...');
const dossier = DossierGenerator.generateMarkdownDossier({
  filesScanned: 15,
  totalLines: 1200,
  routes: mockRoutes,
  models: mockModels,
  envVars: ['DATABASE_URL', 'PORT'],
  modules: [{ path: 'src/routes.js', lines: 50, type: 'API/Controller' }]
});
assert(dossier.includes('# 🗺️ Architecture Dossier'), 'Dossier header missing');
assert(dossier.includes('/api/v1/health'), 'Route should be included in dossier');
assert(dossier.includes('DATABASE_URL'), 'Env var should be listed in dossier');
console.log('  ✔ High-density Markdown Architecture Dossier successfully generated');

const graphJson = DossierGenerator.generateGraphJson({
  routes: mockRoutes,
  models: mockModels,
  modules: [{ path: 'src/routes.js', lines: 50, type: 'API/Controller' }]
});
assert(graphJson.nodes.length >= 3, 'Should generate nodes for modules, routes, and models');
assert(graphJson.links.length >= 2, 'Should generate dependency links');
console.log(`  ✔ Generated Graph Topology: ${graphJson.nodes.length} nodes, ${graphJson.links.length} links`);

// 3. Urlmind Analyzer Tests
console.log('\n▶ Testing UrlMindAnalyzer (Urlmind Web & API Intelligence)...');
const urlAnalyzer = new UrlMindAnalyzer();
const intel = await urlAnalyzer.analyzeUrl('https://example.com', { simulate: true });
assert(intel.status === 200, 'Status should be 200');
assert(intel.techStack.length > 0, 'Tech stack should be detected');
assert(intel.security.hsts === true, 'HSTS header should be evaluated');
console.log(`  ✔ Urlmind detected tech stack: ${intel.techStack.join(', ')}`);

// 4. Enterprise Edition Tests
console.log('\n▶ Testing Enterprise Edition (License & Architecture Drift Guard)...');
const sampleKey = EnterpriseLicenseVerifier.generateSampleKey('team@acme.corp');
const verif = EnterpriseLicenseVerifier.verifyKey(sampleKey);
assert(verif.valid === true, 'Sample enterprise key should verify');
console.log(`  ✔ Verified enterprise license for: ${verif.licensee}`);

const driftGuard = new ArchitectureDriftGuard(sampleKey);
// Test circular dependency detector
const cycles = driftGuard.detectCircularDependencies({
  'a.js': ['./b.js'],
  'b.js': ['./c.js'],
  'c.js': ['./a.js']
});
assert(cycles.length > 0, 'Circular dependency should be flagged');
console.log(`  ✔ Detected circular dependency: ${cycles[0].join(' -> ')}`);

console.log('\n🎉 ALL SLASHGRAPH TESTS PASSED WITH 100% SUCCESS!\n');
