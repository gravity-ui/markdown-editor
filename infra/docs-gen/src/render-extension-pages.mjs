import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function values(calls, method) {
    return [
        ...new Set(
            calls.filter((call) => call.method === method && call.value).map((call) => call.value),
        ),
    ];
}

/**
 * Adds source-derived metadata to a generated extension page.
 * @param {string} content
 * @param {{calls: {method: string, value: string | null}[], source: string}} extension
 * @returns {string}
 */
export function renderExtensionPage(content, extension) {
    const lines = [
        content.trimEnd(),
        '',
        '## Source-derived metadata',
        '',
        `Source: \`${extension.source}\``,
        '',
    ];
    const sections = [
        ['Nodes', values(extension.calls, 'addNodeSpec')],
        ['Marks', values(extension.calls, 'addMarkSpec')],
        ['Actions', values(extension.calls, 'addAction')],
    ];

    for (const [heading, names] of sections) {
        if (names.length === 0) continue;
        lines.push(`### ${heading}`, '', ...names.map((name) => `- \`${name}\``), '');
    }

    return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * Writes one rendered page per extension from the AST metadata manifest.
 * @param {string} root
 * @returns {number}
 */
export function writeRenderedPages(root = REPO_ROOT) {
    const manifest = JSON.parse(readFileSync(join(root, 'tmp/docs-gen/extensions.json'), 'utf8'));
    const outDir = join(root, 'tmp/docs-gen/pages');
    rmSync(outDir, {recursive: true, force: true});
    mkdirSync(outDir, {recursive: true});

    for (const extension of manifest.extensions) {
        const page = readFileSync(join(root, 'tmp/docs-gen/stubs', `${extension.name}.md`), 'utf8');
        writeFileSync(join(outDir, `${extension.name}.md`), renderExtensionPage(page, extension));
    }

    return manifest.extensions.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.stdout.write(`Rendered ${writeRenderedPages()} extension pages.\n`);
}
