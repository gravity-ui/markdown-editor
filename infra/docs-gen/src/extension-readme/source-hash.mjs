import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {join, relative, sep} from 'node:path';

import {compareStrings} from '../extension-pages/utils.mjs';

export const README_FILE = 'README.md';

/** Lists files of a directory and its subdirectories as sorted POSIX paths relative to it; `README.md` files are left out. */
function sourceFiles(dir) {
    return readdirSync(dir, {recursive: true, withFileTypes: true})
        .filter((entry) => entry.isFile() && entry.name !== README_FILE)
        .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'))
        .sort(compareStrings);
}

/** Computes the sha256 hex digest of the relative paths and contents of the files of an extension directory. */
export function sourceHash(dir) {
    const hash = createHash('sha256');
    for (const file of sourceFiles(dir)) {
        const content = readFileSync(join(dir, file));
        hash.update(`${file}\0${content.length}\0`);
        hash.update(content);
    }

    return hash.digest('hex');
}
