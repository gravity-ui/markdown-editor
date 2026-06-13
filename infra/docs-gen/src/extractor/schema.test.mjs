import assert from 'node:assert/strict';
import {test} from 'node:test';

import {extractAddMark, extractAddNode, extractMarkSpecs, extractNodeSpecs} from './ast.mjs';

test('schema extraction captures legacy and granular builder methods', () => {
    const content = [
        "builder.addNode('legacyNode', () => ({}));",
        'builder',
        '    .addNodeSpec(NodeName.Granular, () => ({}))',
        '    .addMark(MarkName.Legacy, () => ({}))',
        "    .addMarkSpec('granularMark', () => ({}));",
    ].join('\n');

    assert.deepEqual(extractAddNode(content), ['legacyNode']);
    assert.deepEqual(extractNodeSpecs(content), ['NodeName.Granular']);
    assert.deepEqual(extractAddMark(content), ['MarkName.Legacy']);
    assert.deepEqual(extractMarkSpecs(content), ['granularMark']);
});
