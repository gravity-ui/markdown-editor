import {existsSync} from 'node:fs';
import {join} from 'node:path';

import {PRESET_DEFS} from '../config.mjs';
import {readText} from '../utils.mjs';

import {PRESET_USE_RE} from './patterns.mjs';

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
        let match;

        PRESET_USE_RE.lastIndex = 0;
        while ((match = PRESET_USE_RE.exec(content))) {
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
