import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {discoverExtensions} from './extension-pages/discover-extensions.mjs';
import {buildSourceIndex} from './extension-pages/indexes/source-index.mjs';
import {REPO_PACKAGES} from './extension-pages/packages.mjs';
import {createExtensionProgram, projectSourceFiles} from './extension-pages/program.mjs';
import {renderExtensionPage} from './extension-pages/render-page.mjs';
import {REPO_ROOT} from './repo-root.mjs';

export const EXTENSION_PAGES_DIR = join(REPO_ROOT, 'tmp/docs-gen/stubs');

/** Builds the program, the indexes and the extension list once for all pages. */
export function createGenerator(packages = REPO_PACKAGES) {
    const program = createExtensionProgram(packages);
    const index = buildSourceIndex(program, projectSourceFiles(program, packages), packages);

    return {index, packages, extensions: discoverExtensions(index, packages)};
}

/** Renders pages of all discovered extensions by name. */
export function renderExtensionPages(generator) {
    const extensions = new Map();
    for (const extension of generator.extensions) {
        const previous = extensions.get(extension.name);
        if (previous) {
            throw new Error(
                `Duplicate extension page "${extension.name}": ${previous.package.name} and ${extension.package.name}`,
            );
        }
        extensions.set(extension.name, extension);
    }

    return new Map(
        [...extensions].map(([name, extension]) => [
            name,
            renderExtensionPage(generator, extension),
        ]),
    );
}

/** Replaces the contents of the output directory with a page for every discovered extension. */
export function generateExtensionPages({packages = REPO_PACKAGES, outDir}) {
    const pages = renderExtensionPages(createGenerator(packages));

    rmSync(outDir, {recursive: true, force: true});
    mkdirSync(outDir, {recursive: true});
    for (const [name, page] of pages) writeFileSync(join(outDir, `${name}.md`), page);

    return [...pages.keys()];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const names = generateExtensionPages({outDir: EXTENSION_PAGES_DIR});
    process.stdout.write(`Generated ${names.length} extension pages.\n`);
}
