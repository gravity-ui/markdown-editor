/**
 * English: Selects relevant extension source, spec, serializer, and test files.
 *
 * Русский: Выбирает релевантные source, spec, serializer и test файлы расширения.
 */
import {dirname} from 'node:path';

/**
 * Checks whether a file path points to a TypeScript test file.
 */
export function isTestFile(path) {
    return path.endsWith('.test.ts') || path.endsWith('.test.tsx');
}

/**
 * Selects production files from all extension files.
 */
export function selectSourceFiles(files) {
    return files.filter((file) => !isTestFile(file.path));
}

/**
 * Joins file contents into one source string.
 */
export function joinContents(files) {
    return files.map((file) => file.content).join('\n');
}

/**
 * Checks whether a source file can contain schema metadata.
 */
export function isSpecSourceFile(file, extDir) {
    return (
        file.path.includes('Specs') ||
        file.path.includes('const') ||
        file.path.includes('schema') ||
        file.path.includes('parser') ||
        (file.path.endsWith('/index.ts') && dirname(file.path) === extDir)
    );
}

/**
 * Selects files that can contain schema registrations.
 */
export function selectSpecFiles(files, extDir) {
    return files.filter((file) => isSpecSourceFile(file, extDir));
}

/**
 * Selects files that can contain serializer hints.
 */
export function selectSerializerFiles(files) {
    return files.filter((file) => file.path.includes('serializer') || file.path.includes('Specs'));
}

/**
 * Finds an extension root index file.
 */
export function findRootIndexFile(files, extDir) {
    return files.find((file) => file.path.endsWith('/index.ts') && dirname(file.path) === extDir);
}

/**
 * Finds a specs index file.
 */
export function findSpecsIndexFile(files) {
    return files.find((file) => file.path.includes('Specs') && file.path.endsWith('/index.ts'));
}
