import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

export function readSourceFiles(dir) {
    if (!existsSync(dir)) return [];

    const files = [];
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...readSourceFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push({path: fullPath, content: readFileSync(fullPath, 'utf-8')});
        }
    }

    return files.sort((left, right) => left.path.localeCompare(right.path));
}
