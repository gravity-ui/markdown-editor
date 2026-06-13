import {basename, relative} from 'node:path';

import {EXTENSION_DOC_FIELD_CONFIG} from '../config.mjs';
import {readAllTsFiles} from '../utils.mjs';

import {
    extractActions,
    extractAddMark,
    extractAddNode,
    extractInputRules,
    extractKeymaps,
    extractMarkSpecs,
    extractMdPlugins,
    extractNodeSpecs,
    extractPlugins,
    extractSerializerSyntax,
} from './ast.mjs';
import {extractConstants, resolveAllConstants} from './constants.mjs';
import {extractTestExamples} from './examples.mjs';
import {extractOptionsType} from './options.mjs';
import {
    findRootIndexFile,
    findSpecsIndexFile,
    isTestFile,
    joinContents,
    selectSerializerFiles,
    selectSourceFiles,
    selectSpecFiles,
} from './source-files.mjs';

/**
 * Deduplicates extracted values while keeping the source order.
 */
function unique(values) {
    return [...new Set(values)];
}

/**
 * Reads extension files and separates production sources from tests.
 */
function readExtensionSources(extDir) {
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
function buildSchemaContent(sourceFiles, extDir) {
    return joinContents(selectSpecFiles(sourceFiles, extDir));
}

/**
 * Extracts schema nodes and marks.
 */
export function extractSchema(specContent, constants) {
    return {
        nodes: resolveAllConstants(
            [...extractAddNode(specContent), ...extractNodeSpecs(specContent)],
            constants,
        ),
        marks: resolveAllConstants(
            [...extractAddMark(specContent), ...extractMarkSpecs(specContent)],
            constants,
        ),
    };
}

/**
 * Builds option declaration names preferred for an extension.
 */
function buildPreferredOptionNames(extensionName) {
    return [`${extensionName}Options`, `${extensionName}SpecsOptions`];
}

/**
 * Extracts extension options from local source declarations.
 */
export function extractOptions(sourceFiles, extDir, extensionName) {
    const rootIndexFile = findRootIndexFile(sourceFiles, extDir);
    const specsIndexFile = findSpecsIndexFile(sourceFiles);
    const preferredNames = buildPreferredOptionNames(extensionName);
    const allOptions = extractOptionsType(joinContents(sourceFiles), preferredNames);

    if (allOptions.length > 0) return allOptions;
    if (rootIndexFile) return extractOptionsType(rootIndexFile.content, preferredNames);
    if (specsIndexFile) return extractOptionsType(specsIndexFile.content, preferredNames);

    return [];
}

/**
 * Extracts unique markup examples from test files.
 */
export function extractMarkupExamples(files) {
    return [
        ...new Set(
            files
                .filter((file) => isTestFile(file.path))
                .flatMap((file) => extractTestExamples(file.content)),
        ),
    ];
}

/**
 * Extracts raw action identifiers.
 */
function extractActionNames(content, constants) {
    return resolveAllConstants(extractActions(content), constants);
}

/**
 * Extracts unique ProseMirror plugin names.
 */
function extractPluginNames(content) {
    return unique(extractPlugins(content));
}

/**
 * Extracts unique markdown-it plugin names.
 */
function extractMdPluginNames(content) {
    return unique(extractMdPlugins(content));
}

/**
 * Extracts unique serializer output snippets.
 */
function extractSerializerHints(sourceFiles) {
    const serializerContent = joinContents(selectSerializerFiles(sourceFiles));
    return unique(extractSerializerSyntax(serializerContent));
}

const FIELD_EXTRACTORS = {
    name: ({name}) => name,
    sourcePath: ({sourcePath}) => sourcePath,
    category: ({category}) => category,
    nodes: ({schema}) => schema.nodes,
    marks: ({schema}) => schema.marks,
    actions: ({allContent, constants}) => extractActionNames(allContent, constants),
    keymaps: ({allContent}) => extractKeymaps(allContent),
    inputRules: ({allContent}) => extractInputRules(allContent),
    plugins: ({allContent}) => extractPluginNames(allContent),
    mdPlugins: ({allContent}) => extractMdPluginNames(allContent),
    serializerHints: ({sourceFiles}) => extractSerializerHints(sourceFiles),
    options: ({sourceFiles, extDir, name}) => extractOptions(sourceFiles, extDir, name),
    markupExamples: ({allFiles}) => extractMarkupExamples(allFiles),
    presets: () => [],
};

/**
 * Builds the final extension IR record.
 */
function createExtensionRecord(context) {
    const record = {};

    for (const fieldName of Object.keys(EXTENSION_DOC_FIELD_CONFIG)) {
        const extractField = FIELD_EXTRACTORS[fieldName];
        if (!extractField) {
            throw new Error(`Missing docs-gen field extractor: ${fieldName}`);
        }

        record[fieldName] = extractField(context);
    }

    return record;
}

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
