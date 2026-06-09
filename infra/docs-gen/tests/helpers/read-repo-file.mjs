import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

/**
 * Reads a repository file as UTF-8 text.
 */
export function readRepoFile(relativePath) {
    return readFileSync(join(REPO_ROOT, relativePath), 'utf-8');
}
