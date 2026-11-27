import {cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {EDITOR_PACKAGE, packagesAt} from '../src/extension-pages/packages.mjs';
import {sourceHash} from '../src/extension-readme/source-hash.mjs';
import {main} from '../src/generate-extension-readmes.mjs';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');
const FAKE_AGENT = join(FIXTURES_DIR, 'fake-agent.mjs');
const SAMPLE_DIR = 'editor/src/extensions/markdown/Sample';
const COMMON = {editor: '1.2.3', commit: 'a'.repeat(40), date: '2026-01-02'};
const PROMPT_END = '<<<END OF PROMPT>>>';

let root;
let answerFile;
let promptLog;

/** Builds a README for the Sample extension of the fixture. */
function readme({
    generated = 'ai',
    hash = sourceHash(join(root, SAMPLE_DIR)),
    heading = '### Connect',
} = {}) {
    return [
        '---',
        `generated: ${generated}`,
        `editor: ${COMMON.editor}`,
        `commit: ${COMMON.commit}`,
        `date: ${COMMON.date}`,
        `source-hash: ${hash}`,
        '---',
        '',
        '## Description',
        '',
        'Inserts a sample block.',
        '',
        '## Examples',
        '',
        heading,
        '',
        '```ts',
        "import {Sample} from '@gravity-ui/markdown-editor/extensions/markdown/Sample/index.js';",
        '```',
        '',
    ].join('\n');
}

/** Runs the command on the fixture copy; the fake agent prints `answer`. */
async function run(argv, answer = readme()) {
    writeFileSync(answerFile, answer);
    let stdout = '';
    const code = await main(argv, {
        packages: packagesAt(root, [{...EDITOR_PACKAGE, dir: 'editor'}]),
        root,
        env: {DOCS_README_AGENT: `node "${FAKE_AGENT}" "${answerFile}" "${promptLog}"`},
        frontmatter: () => COMMON,
        stdout: {
            write: (text) => {
                stdout += text;
            },
        },
        stderr: {write: () => {}},
    });

    return {code, stdout};
}

/** Lists the prompts that the fake agent received. */
function prompts() {
    if (!existsSync(promptLog)) return [];
    return readFileSync(promptLog, 'utf8').split(`\n${PROMPT_END}\n`).slice(0, -1);
}

const readmePath = () => join(root, SAMPLE_DIR, 'README.md');

beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'docs-gen-readme-'));
    cpSync(join(FIXTURES_DIR, 'editor'), join(root, 'editor'), {recursive: true});
    answerFile = join(root, 'answer.md');
    promptLog = join(root, 'prompts.log');
});

afterEach(() => {
    rmSync(root, {recursive: true, force: true});
});

describe('docs:readme', () => {
    it('should write a missing README from the agent answer', async () => {
        const {code, stdout} = await run(['Sample']);

        expect(code).toBe(0);
        expect(readFileSync(readmePath(), 'utf8')).toBe(readme());
        expect(stdout).toContain('Written: 1 (Sample)');

        const [prompt] = prompts();
        expect(prompt).toContain('# Extension README');
        expect(prompt).toContain('name: Sample');
        expect(prompt).toContain(`dir: ${SAMPLE_DIR}`);
        expect(prompt).toContain(
            "import: import {Sample} from '@gravity-ui/markdown-editor/extensions/markdown/Sample/index.js';",
        );
        expect(prompt).toContain('### Options');
        expect(prompt).toContain(`source-hash: ${sourceHash(join(root, SAMPLE_DIR))}`);
    });

    it('should skip a fresh README', async () => {
        writeFileSync(readmePath(), readme());

        const {code, stdout} = await run(['Sample']);

        expect(code).toBe(0);
        expect(prompts()).toEqual([]);
        expect(stdout).toContain('Fresh: 1 (Sample)');
    });

    it('should overwrite a stale README', async () => {
        writeFileSync(readmePath(), readme({hash: 'c'.repeat(64)}));

        const {code, stdout} = await run(['Sample']);

        expect(code).toBe(0);
        expect(readFileSync(readmePath(), 'utf8')).toBe(readme());
        expect(stdout).toContain('Written: 1 (Sample)');
    });

    it('should skip an edited README', async () => {
        const edited = readme({generated: 'edited', hash: 'c'.repeat(64)});
        writeFileSync(readmePath(), edited);

        const {code, stdout} = await run(['Sample']);

        expect(code).toBe(0);
        expect(readFileSync(readmePath(), 'utf8')).toBe(edited);
        expect(prompts()).toEqual([]);
        expect(stdout).toContain('Edited: 1 (Sample)');
    });

    it('should overwrite an edited README named with --force', async () => {
        writeFileSync(readmePath(), readme({generated: 'edited'}));

        const {code} = await run(['--force', 'Sample']);

        expect(code).toBe(0);
        expect(readFileSync(readmePath(), 'utf8')).toBe(readme());
    });

    it('should retry an invalid answer once and exit with code 1', async () => {
        const {code, stdout} = await run(['Sample'], readme({heading: '### Install'}));

        expect(code).toBe(1);
        expect(existsSync(readmePath())).toBe(false);
        expect(stdout).toContain('Errors: 1 (Sample)');
        expect(stdout).toContain('Expected `### Connect`, found `### Install`');

        const [first, second] = prompts();
        expect(prompts()).toHaveLength(2);
        expect(first).not.toContain('## Previous answer');
        expect(second).toContain('## Previous answer');
        expect(second).toContain('Expected `### Connect`, found `### Install`');
    });

    it('should reject an answer whose frontmatter differs from the computed one', async () => {
        const {code, stdout} = await run(['Sample'], readme({hash: 'c'.repeat(64)}));

        expect(code).toBe(1);
        expect(prompts()).toHaveLength(2);
        expect(stdout).toContain('`source-hash` must be');
    });

    it('should list missing and stale READMEs with --check and write nothing', async () => {
        writeFileSync(readmePath(), readme({hash: 'c'.repeat(64)}));

        const {code, stdout} = await run(['--check']);

        expect(code).toBe(0);
        expect(prompts()).toEqual([]);
        expect(stdout).toContain('Missing: 2 (Empty, Helper)');
        expect(stdout).toContain('Stale: 1 (Sample)');
        expect(existsSync(join(root, 'editor/src/extensions/markdown/Empty/README.md'))).toBe(
            false,
        );
    });

    it('should exit with code 1 for an unknown extension', async () => {
        const {code} = await run(['Missing']);

        expect(code).toBe(1);
        expect(prompts()).toEqual([]);
    });
});
