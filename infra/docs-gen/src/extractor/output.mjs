import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {generateRawMd} from './markdown-gen.mjs';

/**
 * Writes extension IR as JSON.
 */
export function writeExtensionsJson(outDir, version, extensions) {
    writeFileSync(
        join(outDir, 'extensions.json'),
        JSON.stringify({version, extensions}, null, 2) + '\n',
    );
}

/**
 * Writes raw Markdown files for extensions.
 */
export function writeRawMarkdownFiles(rawDir, extensions, presetMap, version) {
    for (const extension of extensions) {
        writeFileSync(
            join(rawDir, `${extension.name}.md`),
            generateRawMd(extension, presetMap, version),
        );
    }
}
