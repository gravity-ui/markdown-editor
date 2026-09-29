import {existsSync, mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';

import {EXTENSION_CATEGORIES, isInternalExtension} from '../config.mjs';
import {logger} from '../logger.mjs';
import {listDirs, readText} from '../utils.mjs';

import {writeExtensionsJson, writeRawMarkdownFiles} from './output.mjs';
import {getPresetsForExtension, parsePresets} from './presets.mjs';
import {scanExtension} from './scan.mjs';

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
        return scanExtension({extDir, category, repoRoot: this.repoRoot});
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
