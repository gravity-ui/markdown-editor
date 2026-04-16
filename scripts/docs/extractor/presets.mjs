import {existsSync} from 'node:fs';
import {join} from 'node:path';

import {readText} from '../utils.mjs';

const PRESET_DEFS = [
    {name: 'ZeroPreset', file: 'zero.ts', parent: null},
    {name: 'CommonMarkPreset', file: 'commonmark.ts', parent: 'ZeroPreset'},
    {name: 'DefaultPreset', file: 'default.ts', parent: 'CommonMarkPreset'},
    {name: 'YfmPreset', file: 'yfm.ts', parent: 'DefaultPreset'},
    {name: 'FullPreset', file: 'full.ts', parent: 'YfmPreset'},
];

/**
 * Builds a Map of preset name -> list of extension names (with inheritance)
 */
export function parsePresets(presetsDir) {
    const presetMap = new Map();

    for (const def of PRESET_DEFS) {
        const filePath = join(presetsDir, def.file);
        if (!existsSync(filePath)) continue;

        const content = readText(filePath);
        const directUses = [];
        const useRe = /\.use\(\s*(\w+)/g;
        let m;
        while ((m = useRe.exec(content))) {
            if (!m[1].endsWith('Preset') && !m[1].endsWith('Specs')) {
                directUses.push(m[1]);
            }
        }

        // Inherit parent preset's extensions
        const inherited = def.parent ? presetMap.get(def.parent) || [] : [];
        presetMap.set(def.name, [...new Set([...inherited, ...directUses])]);
    }

    return presetMap;
}

/**
 * Returns the list of preset names that include a given extension
 */
export function getPresetsForExtension(presetMap, extName) {
    const presets = [];
    for (const [presetName, extensions] of presetMap) {
        if (extensions.includes(extName)) {
            presets.push(presetName);
        }
    }
    return presets;
}
