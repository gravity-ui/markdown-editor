/**
 * English: Unit coverage for extension extraction CLI argument parsing.
 *
 * Русский: Unit-покрытие парсинга аргументов CLI извлечения расширений.
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';

import {parseArgs} from '../extract-extension-data.mjs';

test('parseArgs parses selected extensions', () => {
    assert.deepEqual(parseArgs(['--only', 'Bold, Link']).only, ['Bold', 'Link']);
});

test('parseArgs stops option parsing after separator', () => {
    assert.equal(parseArgs(['--help', '--', '--unknown']).help, true);
});

test('parseArgs rejects missing option values', () => {
    assert.throws(() => parseArgs(['--out-dir']), {
        message: 'Missing value for --out-dir',
    });
    assert.throws(() => parseArgs(['--only', '--help']), {
        message: 'Missing value for --only',
    });
});
