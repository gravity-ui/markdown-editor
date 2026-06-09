import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative} from 'node:path';

import {EXTENSION_CATEGORIES, isInternalExtension} from '../config.mjs';
import {logger} from '../logger.mjs';
import {listDirs, readAllTsFiles, readText} from '../utils.mjs';

import {extractConstants, resolveAllConstants} from './constants.mjs';
import {generateRawMd} from './markdown-gen.mjs';
import {getPresetsForExtension, parsePresets} from './presets.mjs';
import {
    extractActions,
    extractAddMark,
    extractAddNode,
    extractInputRules,
    extractKeymaps,
    extractMarkSpecs,
    extractMdPlugins,
    extractNodeSpecs,
    extractOptionsType,
    extractPlugins,
    extractSerializerSyntax,
    extractTestExamples,
} from './regex.mjs';

/**
 * Checks whether a file path points to a TypeScript test file.
 */
function isTestFile(path) {
    return /\.test\.tsx?$/.test(path);
}

/**
 * Selects production files from all extension files.
 */
function selectSourceFiles(files) {
    return files.filter((file) => !isTestFile(file.path));
}

/**
 * Joins file contents into one source string.
 */
function joinContents(files) {
    return files.map((file) => file.content).join('\n');
}

/**
 * Checks whether a source file can contain schema metadata.
 */
function isSpecSourceFile(file, extDir) {
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
function selectSpecFiles(files, extDir) {
    return files.filter((file) => isSpecSourceFile(file, extDir));
}

/**
 * Selects files that can contain serializer hints.
 */
function selectSerializerFiles(files) {
    return files.filter((file) => file.path.includes('serializer') || file.path.includes('Specs'));
}

/**
 * Finds an extension root index file.
 */
function findRootIndexFile(files, extDir) {
    return files.find((file) => file.path.endsWith('/index.ts') && dirname(file.path) === extDir);
}

/**
 * Finds a specs index file.
 */
function findSpecsIndexFile(files) {
    return files.find((file) => file.path.includes('Specs') && file.path.endsWith('/index.ts'));
}

/**
 * Extracts schema nodes and marks.
 */
function extractSchema(specContent, constants) {
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
 * Extracts extension options from root or specs index files.
 */
function extractOptions(sourceFiles, extDir) {
    const rootIndexFile = findRootIndexFile(sourceFiles, extDir);
    const specsIndexFile = findSpecsIndexFile(sourceFiles);
    const options = rootIndexFile ? extractOptionsType(rootIndexFile.content) : [];

    if (options.length === 0 && specsIndexFile) {
        options.push(...extractOptionsType(specsIndexFile.content));
    }

    return options;
}

/**
 * Extracts unique markup examples from test files.
 */
function extractMarkupExamples(files) {
    return [
        ...new Set(
            files
                .filter((file) => isTestFile(file.path))
                .flatMap((file) => extractTestExamples(file.content)),
        ),
    ];
}

/**
 * Writes extension IR as JSON.
 */
function writeExtensionsJson(outDir, version, extensions) {
    writeFileSync(
        join(outDir, 'extensions.json'),
        JSON.stringify({version, extensions}, null, 2) + '\n',
    );
}

/**
 * Writes raw Markdown files for extensions.
 */
function writeRawMarkdownFiles(rawDir, extensions, presetMap, version) {
    for (const extension of extensions) {
        writeFileSync(
            join(rawDir, `${extension.name}.md`),
            generateRawMd(extension, presetMap, version),
        );
    }
}

export class ExtensionExtractor {
    /**
     * Creates an extension extractor for editor source paths.
     */
    constructor({editorPkg, outDir, repoRoot}) {
        this.editorPkg = editorPkg;
        this.repoRoot = repoRoot;
        this.extensionsDir = join(editorPkg, 'src/extensions');
        this.presetsDir = join(editorPkg, 'src/presets');
        this.outDir = outDir;
        this.rawDir = join(outDir, 'raw');
    }

    /**
     * Scans one extension directory into raw metadata.
     */
    scan(extDir, category) {
        const name = basename(extDir);
        const allFiles = readAllTsFiles(extDir);
        const sourceFiles = selectSourceFiles(allFiles);
        const allContent = joinContents(sourceFiles);
        const constants = extractConstants(allContent);
        const specContent = joinContents(selectSpecFiles(sourceFiles, extDir));
        const {nodes, marks} = extractSchema(specContent, constants);
        const actions = resolveAllConstants(extractActions(allContent), constants);
        const serializerContent = joinContents(selectSerializerFiles(sourceFiles));

        return {
            name,
            sourcePath: relative(this.repoRoot, extDir),
            category,
            nodes,
            marks,
            actions,
            keymaps: extractKeymaps(allContent),
            inputRules: extractInputRules(allContent),
            plugins: [...new Set(extractPlugins(allContent))],
            mdPlugins: [...new Set(extractMdPlugins(allContent))],
            serializerHints: [...new Set(extractSerializerSyntax(serializerContent))],
            options: extractOptions(sourceFiles, extDir),
            markupExamples: extractMarkupExamples(allFiles),
            presets: [],
        };
    }

    /**
     * Scans all configured extension categories.
     */
    scanAll({only} = {}) {
        const onlySet = only?.length ? new Set(only) : null;
        const extensions = [];

        for (const category of EXTENSION_CATEGORIES) {
            const categoryDir = join(this.extensionsDir, category);
            for (const dirName of listDirs(categoryDir)) {
                if (isInternalExtension(dirName) || (onlySet && !onlySet.has(dirName))) continue;

                extensions.push(this.scan(join(categoryDir, dirName), category));
            }
        }

        return extensions;
    }

    /**
     * Writes extracted JSON IR and raw Markdown files.
     */
    run({only} = {}) {
        logger.info('Extracting raw extension data...');

        if (existsSync(this.rawDir)) {
            rmSync(this.rawDir, {recursive: true, force: true});
        }
        mkdirSync(this.rawDir, {recursive: true});

        const version = this.getEditorVersion();
        const presetMap = parsePresets(this.presetsDir);
        const extensions = this.scanAll({only});

        for (const extension of extensions) {
            extension.presets = getPresetsForExtension(presetMap, extension.name);
        }

        writeExtensionsJson(this.outDir, version, extensions);
        writeRawMarkdownFiles(this.rawDir, extensions, presetMap, version);

        logger.success(`Raw data written to ${this.outDir}`);
        logger.info(`Extensions: ${extensions.length}`);

        return {version, extensions};
    }

    /**
     * Reads the editor package version.
     */
    getEditorVersion() {
        const pkg = JSON.parse(readText(join(this.editorPkg, 'package.json')));
        return pkg.version;
    }
}
