import {basename, relative} from 'node:path';

import {readAllTsFiles} from '../utils.mjs';

import {extractConstants, resolveAllConstants} from './constants.mjs';
import {extractTestExamples} from './examples.mjs';
import {extractOptionsType} from './options.mjs';
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
} from './regex.mjs';
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

/**
 * Builds the final extension IR record.
 */
function createExtensionRecord({
    name,
    sourcePath,
    category,
    schema,
    actions,
    keymaps,
    inputRules,
    plugins,
    mdPlugins,
    serializerHints,
    options,
    markupExamples,
}) {
    return {
        name,
        sourcePath,
        category,
        nodes: schema.nodes,
        marks: schema.marks,
        actions,
        keymaps,
        inputRules,
        plugins,
        mdPlugins,
        serializerHints,
        options,
        markupExamples,
        presets: [],
    };
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
        name,
        sourcePath: relative(repoRoot, extDir),
        category,
        schema,
        actions: extractActionNames(allContent, constants),
        keymaps: extractKeymaps(allContent),
        inputRules: extractInputRules(allContent),
        plugins: extractPluginNames(allContent),
        mdPlugins: extractMdPluginNames(allContent),
        serializerHints: extractSerializerHints(sourceFiles),
        options: extractOptions(sourceFiles, extDir, name),
        markupExamples: extractMarkupExamples(allFiles),
    });
}
