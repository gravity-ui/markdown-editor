import assert from 'node:assert/strict';
import {test} from 'node:test';

import {extractActions} from './regex.mjs';

test('extractActions captures direct and chained builder.addAction calls', () => {
    const content = [
        "builder.addAction('bold', () => boldAction);",
        'builder',
        '    .addAction(BoldAction.Toggle, () => toggle)',
        '    .addAction(BoldAction.Off, () => off);',
    ].join('\n');

    assert.deepEqual(extractActions(content), ['bold', 'BoldAction.Toggle', 'BoldAction.Off']);
});

test('extractActions ignores non-builder addAction calls', () => {
    const content = [
        "tr.addAction('shouldNotMatch', cb);",
        "service.addAction('alsoSkip', cb);",
        "builder.addAction('keepMe', cb);",
    ].join('\n');

    assert.deepEqual(extractActions(content), ['keepMe']);
});
