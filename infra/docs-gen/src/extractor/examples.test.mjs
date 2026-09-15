/**
 * English: Unit coverage for serializer markdown example extraction.
 *
 * Русский: Unit-покрытие извлечения markdown examples из serializer tests.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {extractTestExamples} from './examples.mjs';

/**
 * Reads a repository file as UTF-8 text.
 */
function readRepoFile(relativePath) {
    return readFileSync(new URL(`../../../../${relativePath}`, import.meta.url), 'utf-8');
}

test('extractTestExamples resolves literals, local bindings, joins, and template bindings', () => {
    const content = [
        "const formula = 'x + y';",
        'const markup = `',
        '# title',
        '`.trimStart();',
        "same(['Term', ': Description'].join('\\n'), doc());",
        'checker.same(markup, doc());',
        'same(`$$${formula}$$\\n\\n`, doc());',
    ].join('\n');

    assert.deepEqual(extractTestExamples(content), [
        'Term\n: Description',
        '# title\n',
        '$$x + y$$\n\n',
    ]);
});

test('extractTestExamples captures joined Deflist markup', () => {
    const examples = extractTestExamples(
        readRepoFile('packages/editor/src/extensions/markdown/Deflist/Deflist.test.ts'),
    );

    assert.ok(examples.includes('Term\n: Description'));
});

test('extractTestExamples captures markup stored in local constants', () => {
    const examples = extractTestExamples(
        readRepoFile('packages/editor/src/extensions/yfm/YfmTable/YfmTable.test.ts'),
    );

    assert.ok(examples.some((example) => example.includes('nested table')));
});
