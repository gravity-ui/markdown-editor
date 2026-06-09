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
 * Parses preset files into inherited extension membership.
 */
export function parsePresets(presetsDir) {
    const presetMap = new Map();

    for (const def of PRESET_DEFS) {
        const filePath = join(presetsDir, def.file);
        if (!existsSync(filePath)) continue;

        const content = readText(filePath);
        const directUses = [];
        const useRe = /\.use\(\s*(\w+)/g;
        let match;

        while ((match = useRe.exec(content))) {
            const extensionName = match[1];
            if (!extensionName.endsWith('Preset') && !extensionName.endsWith('Specs')) {
                directUses.push(extensionName);
            }
        }

        const inherited = def.parent ? presetMap.get(def.parent) || [] : [];
        presetMap.set(def.name, [...new Set([...inherited, ...directUses])]);
    }

    return presetMap;
}

/**
 * Finds presets that include an extension.
 */
export function getPresetsForExtension(presetMap, extensionName) {
    const presets = [];

    for (const [presetName, extensions] of presetMap) {
        if (extensions.includes(extensionName)) {
            presets.push(presetName);
        }
    }

    return presets;
}
