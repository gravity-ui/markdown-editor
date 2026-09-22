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
    assert.throws(() => parseArgs(['--out-dir']), /Missing value for --out-dir/u);
    assert.throws(() => parseArgs(['--only', '--help']), /Missing value for --only/u);
});
