import {existsSync, mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';

import {EXTENSION_CATEGORIES, isBlacklistedExtension} from '../config.mjs';
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
     * Collects all configured extension directories before filtering.
     */
    collectExtensionRefs() {
        const refs = [];

        for (const category of EXTENSION_CATEGORIES) {
            const categoryDir = join(this.extensionsDir, category);
            for (const dirName of listDirs(categoryDir)) {
                refs.push({
                    name: dirName,
                    category,
                    extDir: join(categoryDir, dirName),
                });
            }
        }

        return refs;
    }

    /**
     * Applies configured extension filters after the full list is known.
     */
    filterExtensionRefs(refs, {only} = {}) {
        const onlySet = only?.length ? new Set(only) : null;

        return refs.filter((ref) => {
            if (isBlacklistedExtension(ref.name)) return false;
            return !onlySet || onlySet.has(ref.name);
        });
    }

    /**
     * Scans all configured extension categories.
     */
    scanAll({only} = {}) {
        const allRefs = this.collectExtensionRefs();
        const extensionRefs = this.filterExtensionRefs(allRefs, {only});

        return {
            totalCount: allRefs.length,
            extensions: extensionRefs.map((ref) => this.scan(ref.extDir, ref.category)),
        };
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
        const {totalCount, extensions} = this.scanAll({only});
        const presetMap = parsePresets(this.presetsDir);

        for (const extension of extensions) {
            extension.presets = getPresetsForExtension(presetMap, extension.name);
        }

        writeExtensionsJson(this.outDir, version, extensions);
        writeRawMarkdownFiles(this.rawDir, extensions, presetMap, version);

        logger.success(`Raw data written to ${this.outDir}`);
        logger.info(`Discovered extensions: ${totalCount}`);
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
