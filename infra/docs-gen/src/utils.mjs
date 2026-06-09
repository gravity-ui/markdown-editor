import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

export function readText(filePath) {
    return readFileSync(filePath, 'utf-8');
}

export function listDirs(dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
        .filter((name) => {
            const full = join(dir, name);
            return statSync(full).isDirectory() && /^[A-Z]/.test(name);
        })
        .sort();
}

export function findFiles(dir, pattern) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir, {recursive: true})
        .filter((entry) => pattern.test(entry))
        .map((entry) => join(dir, entry))
        .sort();
}

export function readAllTsFiles(dir) {
    return findFiles(dir, /\.tsx?$/).map((path) => ({path, content: readText(path)}));
}
