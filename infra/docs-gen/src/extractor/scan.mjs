/**
 * English: Builds one raw extension record from filtered extension source files.
 *
 * Русский: Собирает одну raw-запись расширения из отфильтрованных source files.
 */
import {basename, relative} from 'node:path';

import {extractConstants} from './constants.mjs';
import {buildSchemaContent, readExtensionSources} from './extension-sources.mjs';
import {createExtensionRecord} from './record-fields.mjs';
import {extractSchema} from './schema.mjs';

/**
 * Scans one extension directory into raw metadata.
 */
export function scanExtension({extDir, category, repoRoot}) {
    const name = basename(extDir);
    const {allFiles, sourceFiles, allContent} = readExtensionSources(extDir);
    const constants = extractConstants(allContent);
    const schema = extractSchema(buildSchemaContent(sourceFiles, extDir), constants);

    return createExtensionRecord({
        extDir,
        name,
        sourcePath: relative(repoRoot, extDir),
        category,
        allFiles,
        sourceFiles,
        allContent,
        constants,
        schema,
    });
}
