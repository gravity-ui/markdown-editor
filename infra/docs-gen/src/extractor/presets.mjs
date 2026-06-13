import {existsSync} from 'node:fs';
import {join} from 'node:path';

import ts from 'typescript';

import {PRESET_DEFS} from '../config.mjs';
import {readText} from '../utils.mjs';

import {forEachNode, getExpressionName, parseSource, unwrapExpression} from './ast.mjs';

/**
 * Extracts direct extension uses from a preset source file.
 */
function extractPresetUses(content) {
    const sourceFile = parseSource(content);
    const directUses = [];

    forEachNode(sourceFile, (node) => {
        if (!ts.isCallExpression(node)) return;

        const expression = unwrapExpression(node.expression);
        if (!ts.isPropertyAccessExpression(expression) || expression.name.text !== 'use') return;

        const firstArg = node.arguments[0];
        const extensionName = firstArg ? getExpressionName(firstArg, sourceFile) : null;
        if (!extensionName) return;

        if (!extensionName.endsWith('Preset') && !extensionName.endsWith('Specs')) {
            directUses.push(extensionName);
        }
    });

    return directUses;
}

/**
 * Parses preset files into inherited extension membership.
 */
export function parsePresets(presetsDir) {
    const presetMap = new Map();

    for (const def of PRESET_DEFS) {
        const filePath = join(presetsDir, def.file);
        if (!existsSync(filePath)) continue;

        const directUses = extractPresetUses(readText(filePath));
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
