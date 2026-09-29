import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {extractOptionsType} from './options.mjs';

/**
 * Reads a repository file as UTF-8 text.
 */
function readRepoFile(relativePath) {
    return readFileSync(new URL(`../../../../${relativePath}`, import.meta.url), 'utf-8');
}

/**
 * Maps option fields by name.
 */
function mapFields(fields) {
    return new Map(fields.map((field) => [field.name, field.type]));
}

test('extractOptionsType resolves local aliases', () => {
    const content = [
        readRepoFile('packages/editor/src/extensions/markdown/Image/index.ts'),
        readRepoFile('packages/editor/src/extensions/markdown/Image/imageUrlPaste/index.ts'),
    ].join('\n');

    assert.deepEqual(extractOptionsType(content, ['ImageOptions']), [
        {name: 'parseInsertedUrlAsImage', type: 'ParseInsertedUrlAsImage'},
    ]);
});

test('extractOptionsType resolves Pick utility types', () => {
    const content = [
        readRepoFile('packages/editor/src/extensions/behavior/Clipboard/index.ts'),
        readRepoFile('packages/editor/src/extensions/behavior/Clipboard/clipboard.ts'),
    ].join('\n');

    assert.deepEqual(extractOptionsType(content, ['ClipboardOptions']), [
        {name: 'pasteFileHandler', type: '(file: File) => void'},
    ]);
});

test('extractOptionsType keeps nested object option types intact', () => {
    const fields = mapFields(
        extractOptionsType(
            readRepoFile('packages/editor/src/extensions/additional/Mermaid/index.ts'),
            ['MermaidOptions'],
        ),
    );

    assert.equal(fields.get('autoSave'), '{ enabled: boolean; delay?: number; }');
    assert.equal(
        fields.get('theme'),
        "{ dark: MermaidConfig['theme']; light: MermaidConfig['theme']; }",
    );
});

test('extractOptionsType reads interface declarations with local fields', () => {
    const fields = mapFields(
        extractOptionsType(
            readRepoFile('packages/editor/src/extensions/additional/YfmHtmlBlock/index.ts'),
            ['YfmHtmlBlockOptions'],
        ),
    );

    assert.equal(fields.get('useConfig'), '() => IHTMLIFrameElementConfig | undefined');
    assert.equal(fields.get('autoSave'), '{ enabled: boolean; delay?: number; }');
});

test('extractOptionsType merges intersections without corrupting nested fields', () => {
    const content = [
        readRepoFile('packages/editor/src/extensions/markdown/CodeBlock/index.ts'),
        readRepoFile('packages/editor/src/extensions/markdown/CodeBlock/CodeBlockSpecs/index.ts'),
    ].join('\n');
    const fields = mapFields(extractOptionsType(content, ['CodeBlockOptions']));

    assert.equal(fields.get('codeBlockKey'), 'string | null');
    assert.equal(fields.get('lineWrapping'), '{ enabled?: boolean; }');
});
