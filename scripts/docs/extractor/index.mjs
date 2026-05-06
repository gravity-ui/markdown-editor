import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative} from 'node:path';

import {isInternalExtension} from '../config.mjs';
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

const CATEGORIES = ['base', 'behavior', 'markdown', 'yfm', 'additional'];

/**
 * Scans extension directories, builds IR, and generates raw markdown docs
 */
export class ExtensionExtractor {
    constructor(editorPkg, outDir) {
        this.editorPkg = editorPkg;
        this.extensionsDir = join(editorPkg, 'src/extensions');
        this.presetsDir = join(editorPkg, 'src/presets');
        this.outDir = outDir;
        this.rawDir = join(outDir, 'raw');
    }

    /**
     * Scans a single extension directory and returns its metadata.
     */
    scan(extDir, category) {
        const name = basename(extDir);
        const allFiles = readAllTsFiles(extDir);
        const nonTestFiles = allFiles.filter((f) => !f.path.endsWith('.test.ts'));
        const allContent = nonTestFiles.map((f) => f.content).join('\n');

        const constants = extractConstants(allContent);

        const specsFiles = nonTestFiles.filter(
            (f) =>
                f.path.includes('Specs') ||
                f.path.includes('const') ||
                f.path.includes('schema') ||
                f.path.includes('parser') ||
                (f.path.endsWith('/index.ts') && dirname(f.path) === extDir),
        );
        const specsContent = specsFiles.map((f) => f.content).join('\n');

        const rawNodes = [...extractAddNode(specsContent), ...extractNodeSpecs(specsContent)];
        const rawMarks = [...extractAddMark(specsContent), ...extractMarkSpecs(specsContent)];

        const nodes = resolveAllConstants(rawNodes, constants);
        const marks = resolveAllConstants(rawMarks, constants);
        const actions = resolveAllConstants(extractActions(allContent), constants);
        const keymaps = extractKeymaps(allContent);
        const inputRules = extractInputRules(allContent);
        const plugins = [...new Set(extractPlugins(allContent))];
        const mdPlugins = [...new Set(extractMdPlugins(allContent))];

        const serializerContent = nonTestFiles
            .filter((f) => f.path.includes('serializer') || f.path.includes('Specs'))
            .map((f) => f.content)
            .join('\n');
        const serializerHints = extractSerializerSyntax(serializerContent);

        const indexFile = nonTestFiles.find(
            (f) => f.path.endsWith('/index.ts') && dirname(f.path) === extDir,
        );
        const options = indexFile ? extractOptionsType(indexFile.content) : [];
        const specsIndexFile = nonTestFiles.find(
            (f) => f.path.includes('Specs') && f.path.endsWith('/index.ts'),
        );
        if (specsIndexFile && options.length === 0) {
            options.push(...extractOptionsType(specsIndexFile.content));
        }

        const testFiles = allFiles.filter((f) => f.path.endsWith('.test.ts'));
        const markupExamples = testFiles.flatMap((f) => extractTestExamples(f.content));

        return {
            name,
            dirPath: relative('.', extDir),
            category,
            nodes,
            marks,
            actions,
            keymaps,
            inputRules,
            plugins,
            mdPlugins,
            serializerHints,
            options,
            markupExamples: [...new Set(markupExamples)],
            presets: [],
        };
    }

    /**
     * Scans all extension categories and returns full IR array
     */
    scanAll() {
        const extensions = [];
        for (const category of CATEGORIES) {
            const catDir = join(this.extensionsDir, category);
            for (const dir of listDirs(catDir)) {
                if (isInternalExtension(dir)) continue;
                const extDir = join(catDir, dir);
                try {
                    extensions.push(this.scan(extDir, category));
                } catch (err) {
                    logger.warn(`failed to scan ${extDir}: ${err.message}`);
                }
            }
        }
        return extensions;
    }

    /**
     * Runs the full extraction pipeline: scan, resolve presets, write IR + raw docs
     */
    run() {
        logger.info('Extracting extension documentation...');

        if (existsSync(this.outDir)) {
            rmSync(this.rawDir, {recursive: true, force: true});
        }
        mkdirSync(this.rawDir, {recursive: true});

        const version = this.getEditorVersion();
        logger.info(`Editor version: ${version}`);

        const presetMap = parsePresets(this.presetsDir);
        const extensions = this.scanAll();

        for (const ext of extensions) {
            ext.presets = getPresetsForExtension(presetMap, ext.name);
        }

        logger.info(`Found ${extensions.length} extensions`);

        writeFileSync(join(this.outDir, 'extensions.json'), JSON.stringify(extensions, null, 2));

        for (const ext of extensions) {
            const rawMd = generateRawMd(ext, presetMap, version);
            writeFileSync(join(this.rawDir, `${ext.name}.md`), rawMd);
        }

        this.printSummary(extensions);
    }

    /**
     * Reads the editor package version
     */
    getEditorVersion() {
        const pkg = JSON.parse(readText(join(this.editorPkg, 'package.json')));
        return pkg.version;
    }

    /**
     * Prints a summary table of extracted extensions.
     */
    printSummary(extensions) {
        const summary = extensions.map((e) => {
            const parts = [e.name];
            if (e.nodes.length) parts.push(`nodes:${e.nodes.join(',')}`);
            if (e.marks.length) parts.push(`marks:${e.marks.join(',')}`);
            if (e.actions.length) parts.push(`actions:${e.actions.length}`);
            if (e.plugins.length) parts.push(`plugins:${e.plugins.length}`);
            return `  ${parts.join(' | ')}`;
        });

        logger.info('\nExtracted extensions:');
        logger.info(summary.join('\n'));
        logger.success(`Raw docs written to ${this.rawDir}/`);
        logger.success(`IR written to ${join(this.outDir, 'extensions.json')}`);
    }
}
