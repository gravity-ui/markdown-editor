import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {sourceHash} from '../src/extension-readme/source-hash.mjs';

let dir;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'docs-gen-hash-'));
    mkdirSync(join(dir, 'SampleSpecs'));
    writeFileSync(join(dir, 'index.ts'), 'export const sample = 1;\n');
    writeFileSync(join(dir, 'SampleSpecs/index.ts'), 'export const specs = 1;\n');
});

afterEach(() => {
    rmSync(dir, {recursive: true, force: true});
});

describe('sourceHash', () => {
    it('should return the same sha256 digest on every call', () => {
        const hash = sourceHash(dir);

        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        expect(sourceHash(dir)).toBe(hash);
    });

    it('should ignore README.md files', () => {
        const hash = sourceHash(dir);
        writeFileSync(join(dir, 'README.md'), '# Sample\n');
        writeFileSync(join(dir, 'SampleSpecs/README.md'), '# Specs\n');

        expect(sourceHash(dir)).toBe(hash);
    });

    it('should change when a nested file changes', () => {
        const hash = sourceHash(dir);
        writeFileSync(join(dir, 'SampleSpecs/index.ts'), 'export const specs = 2;\n');

        expect(sourceHash(dir)).not.toBe(hash);
    });

    it('should change when a file is renamed', () => {
        const hash = sourceHash(dir);
        rmSync(join(dir, 'index.ts'));
        writeFileSync(join(dir, 'main.ts'), 'export const sample = 1;\n');

        expect(sourceHash(dir)).not.toBe(hash);
    });
});
