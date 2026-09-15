/**
 * English: Orchestrates extension discovery, filtering, scanning, enrichment, and output.
 *
 * Русский: Управляет обнаружением, фильтрацией, сканированием, обогащением и выводом расширений.
 */
import {existsSync, mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';

import {logger} from '../logger.mjs';
import {readText} from '../utils.mjs';

import {collectExtensionRefs, filterExtensionRefs} from './extension-refs.mjs';
import {writeExtensionsJson, writeRawMarkdownFiles} from './output.mjs';
import {getPresetsForExtension, parsePresets} from './presets.mjs';
import {scanExtension} from './scan.mjs';

export class ExtensionExtractor {
    /**
     * Creates an extension extractor for configured source paths.
     */
    constructor({entryPoints, outDir, repoRoot, versionPackageDir}) {
        this.entryPoints = entryPoints;
        this.repoRoot = repoRoot;
        this.versionPackageDir = versionPackageDir;
        this.outDir = outDir;
        this.rawDir = join(outDir, 'raw');
    }

    /**
     * Scans one extension directory into raw metadata.
     */
    scan(ref) {
        return scanExtension({...ref, repoRoot: this.repoRoot});
    }

    /**
     * Scans all configured extension entry points.
     */
    scanAll({only} = {}) {
        const allRefs = collectExtensionRefs(this.entryPoints);
        const extensionRefs = filterExtensionRefs(allRefs, {only});

        return {
            totalCount: allRefs.length,
            extensions: extensionRefs.map((ref) => this.scan(ref)),
        };
    }

    /**
     * Parses presets from the configured editor entry point.
     */
    getPresetMap() {
        const presetEntryPoint = this.entryPoints.find((entryPoint) => entryPoint.presetsDir);
        if (!presetEntryPoint) return new Map();

        return parsePresets(join(presetEntryPoint.packageDir, presetEntryPoint.presetsDir));
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
        const presetMap = this.getPresetMap();

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
        const pkg = JSON.parse(readText(join(this.versionPackageDir, 'package.json')));
        return pkg.version;
    }
}
