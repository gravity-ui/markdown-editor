/**
 * English: Reads extension files and prepares source groups for metadata scanning.
 *
 * Русский: Читает файлы расширения и готовит группы source files для metadata scanning.
 */
import {readAllTsFiles} from '../utils.mjs';

import {joinContents, selectSourceFiles, selectSpecFiles} from './source-files.mjs';

/**
 * Reads extension files and separates production sources from tests.
 */
export function readExtensionSources(extDir) {
    const allFiles = readAllTsFiles(extDir);
    const sourceFiles = selectSourceFiles(allFiles);

    return {
        allFiles,
        sourceFiles,
        allContent: joinContents(sourceFiles),
    };
}

/**
 * Builds the source text used for schema extraction.
 */
export function buildSchemaContent(sourceFiles, extDir) {
    return joinContents(selectSpecFiles(sourceFiles, extDir));
}
