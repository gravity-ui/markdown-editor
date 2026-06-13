/**
 * English: Filesystem helpers shared by docs-gen build and extraction flows.
 *
 * Русский: Filesystem helper-ы, общие для build и extraction flow docs-gen.
 */
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

/**
 * Reads a UTF-8 text file.
 */
export function readText(filePath) {
    return readFileSync(filePath, 'utf-8');
}

/**
 * Lists uppercase-named child directories.
 */
export function listDirs(dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
        .filter((name) => {
            const full = join(dir, name);
            return statSync(full).isDirectory() && /^[A-Z]/.test(name);
        })
        .sort();
}

/**
 * Finds recursive directory entries matching a pattern.
 */
export function findFiles(dir, pattern) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir, {recursive: true})
        .filter((entry) => pattern.test(entry))
        .map((entry) => join(dir, entry))
        .sort();
}

/**
 * Reads recursive TypeScript source files.
 */
export function readAllTsFiles(dir) {
    return findFiles(dir, /\.tsx?$/).map((path) => ({path, content: readText(path)}));
}
