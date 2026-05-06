import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {extractKeymaps} from './regex.mjs';

function readRepoFile(relativePath) {
    return readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
}

test('extractKeymaps handles direct object returns and ignores computed keys', () => {
    const content = [
        'builder.addKeymap(() => ({',
        '    Tab: handleTab,',
        "    'Shift-Tab': handleShiftTab,",
        '    [dynamicKey]: ignoreMe,',
        '}));',
    ].join('\n');

    assert.deepEqual(extractKeymaps(content), ['Tab', 'Shift-Tab']);
});

test('extractKeymaps merges returned object literals with spread bindings', () => {
    const content = [
        'builder.addKeymap(() => {',
        '    const bindings: Keymap = {Backspace: resetHeading};',
        '    return {',
        '        Tab: handleTab,',
        '        ...bindings,',
        "        'Shift-Tab': handleShiftTab,",
        '    };',
        '});',
    ].join('\n');

    assert.deepEqual(extractKeymaps(content), ['Tab', 'Backspace', 'Shift-Tab']);
});

test('extractKeymaps captures static keymaps from the Lists extension', () => {
    const content = readRepoFile('../../../packages/editor/src/extensions/markdown/Lists/index.ts');

    assert.deepEqual(extractKeymaps(content), [
        'Tab',
        'Shift-Tab',
        'Backspace',
        'Mod-[',
        'Mod-]',
        'Enter',
    ]);
});

test('extractKeymaps captures static bindings from block-body callbacks and ignores dynamic ones', () => {
    const headingContent = readRepoFile(
        '../../../packages/editor/src/extensions/markdown/Heading/index.ts',
    );
    const historyContent = readRepoFile(
        '../../../packages/editor/src/extensions/behavior/History/index.ts',
    );
    const editorModeContent = readRepoFile(
        '../../../packages/editor/src/extensions/behavior/EditorModeKeymap/index.ts',
    );

    assert.deepEqual(extractKeymaps(headingContent), ['Backspace']);
    assert.deepEqual(extractKeymaps(historyContent), []);
    assert.deepEqual(extractKeymaps(editorModeContent), []);
});
