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
            const firstChar = name.charAt(0);
            const startsWithUppercaseLetter =
                firstChar !== '' &&
                firstChar === firstChar.toUpperCase() &&
                firstChar !== firstChar.toLowerCase();

            return statSync(full).isDirectory() && startsWithUppercaseLetter;
        })
        .sort();
}

/**
 * Finds recursive directory entries matching a predicate.
 */
export function findFiles(dir, predicate) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir, {recursive: true})
        .filter((entry) => predicate(entry))
        .map((entry) => join(dir, entry))
        .sort();
}

/**
 * Reads recursive TypeScript source files.
 */
export function readAllTsFiles(dir) {
    return findFiles(dir, (entry) => entry.endsWith('.ts') || entry.endsWith('.tsx')).map(
        (path) => ({path, content: readText(path)}),
    );
}
