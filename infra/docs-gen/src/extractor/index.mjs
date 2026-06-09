import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative} from 'node:path';

import {extensionCategories, isInternalExtension} from '../config.mjs';
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
        const sourceFiles = allFiles.filter((file) => !isTestFile(file.path));
        const allContent = sourceFiles.map((file) => file.content).join('\n');
        const constants = extractConstants(allContent);

        const specFiles = sourceFiles.filter(
            (file) =>
                file.path.includes('Specs') ||
                file.path.includes('const') ||
                file.path.includes('schema') ||
                file.path.includes('parser') ||
                (file.path.endsWith('/index.ts') && dirname(file.path) === extDir),
        );
        const specContent = specFiles.map((file) => file.content).join('\n');

        const nodes = resolveAllConstants(
            [...extractAddNode(specContent), ...extractNodeSpecs(specContent)],
            constants,
        );
        const marks = resolveAllConstants(
            [...extractAddMark(specContent), ...extractMarkSpecs(specContent)],
            constants,
        );
        const actions = resolveAllConstants(extractActions(allContent), constants);

        const serializerContent = sourceFiles
            .filter((file) => file.path.includes('serializer') || file.path.includes('Specs'))
            .map((file) => file.content)
            .join('\n');

        const rootIndexFile = sourceFiles.find(
            (file) => file.path.endsWith('/index.ts') && dirname(file.path) === extDir,
        );
        const specsIndexFile = sourceFiles.find(
            (file) => file.path.includes('Specs') && file.path.endsWith('/index.ts'),
        );

        const options = rootIndexFile ? extractOptionsType(rootIndexFile.content) : [];
        if (options.length === 0 && specsIndexFile) {
            options.push(...extractOptionsType(specsIndexFile.content));
        }

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
            options,
            markupExamples: [
                ...new Set(
                    allFiles
                        .filter((file) => isTestFile(file.path))
                        .flatMap((file) => extractTestExamples(file.content)),
                ),
            ],
            presets: [],
        };
    }

    /**
     * Scans all configured extension categories.
     */
    scanAll({only} = {}) {
        const onlySet = only?.length ? new Set(only) : null;
        const extensions = [];

        for (const category of extensionCategories) {
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

        writeFileSync(
            join(this.outDir, 'extensions.json'),
            JSON.stringify({version, extensions}, null, 2) + '\n',
        );

        for (const extension of extensions) {
            writeFileSync(
                join(this.rawDir, `${extension.name}.md`),
                generateRawMd(extension, presetMap, version),
            );
        }

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
