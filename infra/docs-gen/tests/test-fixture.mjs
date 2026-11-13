import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';

import ts from 'typescript';

import {buildSourceIndex} from '../src/extension-pages/indexes/source-index.mjs';
import {EDITOR_PACKAGE} from '../src/extension-pages/packages.mjs';

export const FIXTURE_FILE = 'src/extensions/markdown/Sample/index.ts';

const BUILDER_SOURCE = [
    'class ExtensionBuilder {',
    '    use(extension: unknown, options?: unknown): this { return this; }',
    '    configureMd(cb: (md: any) => any): this { return this; }',
    '    addAction(name: string, cb: () => unknown): this { return this; }',
    '    addKeymap(cb: () => Record<string, () => boolean>): this { return this; }',
    '}',
].join('\n');

/** Indexes one TypeScript file placed at `FIXTURE_FILE` in a temporary editor package directory. */
export function indexFixture(source) {
    const dir = mkdtempSync(join(tmpdir(), 'docs-gen-'));
    const fileName = join(dir, FIXTURE_FILE);
    mkdirSync(dirname(fileName), {recursive: true});
    writeFileSync(fileName, `${BUILDER_SOURCE}\n${source}\n`);

    const packages = [{...EDITOR_PACKAGE, dir}];
    const program = ts.createProgram({rootNames: [fileName], options: {noEmit: true}});
    const file = program.getSourceFile(fileName);
    const index = buildSourceIndex(program, [file], packages);

    return {packages, index, file, cleanup: () => rmSync(dir, {recursive: true, force: true})};
}
