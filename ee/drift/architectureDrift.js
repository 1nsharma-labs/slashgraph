import fs from 'fs';
import path from 'path';
import { AstScanner } from '../../core/src/parser/astScanner.js';
import { EnterpriseLicenseVerifier } from '../license/verifier.js';

export class ArchitectureDriftGuard {
  constructor(licenseKey, options = {}) {
    this.verification = EnterpriseLicenseVerifier.verifyKey(licenseKey);
    if (!this.verification.valid) {
      throw new Error(`Enterprise License required to run Architecture Drift Guard: ${this.verification.reason}`);
    }
    this.scanner = new AstScanner(options);
  }

  auditCodebase(rootDir) {
    const scan = this.scanner.scanDirectory(rootDir);
    const violations = [];

    // 1. Check for missing environment variables in .env.example
    const envExamplePath = path.join(rootDir, '.env.example');
    const declaredEnv = new Set();
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const varName = trimmed.split('=')[0].trim();
          if (varName) declaredEnv.add(varName);
        }
      });
    }

    scan.envVars.forEach(v => {
      if (declaredEnv.size > 0 && !declaredEnv.has(v)) {
        violations.push({
          type: 'UNDECLARED_ENV_VAR',
          severity: 'HIGH',
          message: `Environment variable "${v}" is used in code but not documented in .env.example`
        });
      }
    });

    // 2. Check for circular dependencies
    const circular = this.detectCircularDependencies(scan.dependencies);
    circular.forEach(cycle => {
      violations.push({
        type: 'CIRCULAR_DEPENDENCY',
        severity: 'CRITICAL',
        message: `Circular module dependency detected: ${cycle.join(' -> ')}`
      });
    });

    return {
      passed: violations.length === 0,
      totalViolations: violations.length,
      violations,
      stats: {
        filesScanned: scan.filesScanned,
        routes: scan.routes.length,
        models: scan.models.length
      }
    };
  }

  detectCircularDependencies(dependencies) {
    const cycles = [];
    const visited = new Set();
    const recStack = new Set();

    const dfs = (node, path) => {
      visited.add(node);
      recStack.add(node);

      const neighbors = dependencies[node] || [];
      for (const rawNeighbor of neighbors) {
        // Resolve neighbor relative path
        const neighbor = this.resolvePath(node, rawNeighbor);
        if (!neighbor || !dependencies[neighbor]) continue;

        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path, neighbor]);
        } else if (recStack.has(neighbor)) {
          cycles.push([...path, neighbor]);
        }
      }

      recStack.delete(node);
    };

    for (const mod of Object.keys(dependencies)) {
      if (!visited.has(mod)) {
        dfs(mod, [mod]);
      }
    }

    return cycles;
  }

  resolvePath(fromFile, toFile) {
    const dir = path.dirname(fromFile);
    let resolved = path.join(dir, toFile).replace(/\\/g, '/');
    if (!path.extname(resolved)) {
      if (fs.existsSync(resolved + '.js')) return resolved + '.js';
      if (fs.existsSync(resolved + '.ts')) return resolved + '.ts';
    }
    return resolved;
  }
}
