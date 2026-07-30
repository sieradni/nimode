import { beforeAll, describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve(__dirname, '../../package.json');
const vitePath = path.resolve(__dirname, '../../vite.config.ts');

let pkg: Record<string, unknown>;

beforeAll(() => {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
});

describe('build configuration', () => {
  it('should have deploy script in package.json', () => {
    expect((pkg.scripts as Record<string, string>).deploy).toBe('gh-pages -d dist');
  });

  it('should have gh-pages in devDependencies', () => {
    expect(pkg.devDependencies).toHaveProperty('gh-pages');
  });

  it('should have correct base path in vite config', () => {
    const content = fs.readFileSync(vitePath, 'utf-8');
    expect(content).toContain("base: '/nimode/'");
  });

  it('should have correct outDir in vite config', () => {
    const content = fs.readFileSync(vitePath, 'utf-8');
    expect(content).toContain("outDir: 'dist'");
  });
});
