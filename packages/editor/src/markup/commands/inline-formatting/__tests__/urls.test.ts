import {redo, undo} from '@codemirror/commands';
import {EditorSelection} from '@codemirror/state';
import {colorPlugin} from '@diplodoc/color-extension';
import monospacePlugin from '@diplodoc/transform/lib/plugins/monospace.js';
import MarkdownIt from 'markdown-it';
import insPlugin from 'markdown-it-ins';
import markPlugin from 'markdown-it-mark';
import {describe, expect, it} from 'vitest';

import {toggleInlineCode} from '../../code';
import {
    colorify,
    toggleBold,
    toggleItalic,
    toggleMarked,
    toggleMonospace,
    toggleStrikethrough,
    toggleUnderline,
} from '../../marks';
import {wrapToMathInline} from '../../math';

import {createEditor} from './test-helpers';

const styles = [
    {name: 'bold', command: toggleBold, marker: '**', tag: 'strong'},
    {name: 'italic', command: toggleItalic, marker: '_', tag: 'em'},
    {name: 'strike', command: toggleStrikethrough, marker: '~~', tag: 's'},
    {name: 'underline', command: toggleUnderline, marker: '++', tag: 'ins'},
    {name: 'monospace', command: toggleMonospace, marker: '##', tag: 'samp'},
    {name: 'highlight', command: toggleMarked, marker: '==', tag: 'mark'},
];
const urls = [
    'https://example.com/path',
    'https://example.com/path?q=one&next=two',
    'https://example.com/path#part',
    'https://example.com/path_',
];

describe.each(styles)('URL formatting with $name', ({command, marker, tag}) => {
    it.each(urls)('should normalize a complete URL %s before formatting', (url) => {
        const editor = createEditor(url, {linkify: true});
        editor.run(command);

        expect(editor.text).toBe(`${marker}<${url}>${marker}`);
        const link = render(`<${url}>`, true).slice(3, -5);
        expect(render(editor.text, true)).toBe(`<p><${tag}>${link}</${tag}></p>\n`);

        editor.run(command);
        expect(editor.text).toBe(`<${url}>`);
        expect(render(editor.text, true)).toBe(render(`<${url}>`, true));
    });

    it.each(urls)('should keep a bare URL %s when linkify is disabled', (url) => {
        const editor = createEditor(url);
        editor.run(command);

        const expectedMarker = marker === '_' && url.endsWith('_') ? '*' : marker;
        expect(editor.text).toBe(`${expectedMarker}${url}${expectedMarker}`);
        const text = render(url, false).slice(3, -5);
        expect(render(editor.text, false)).toBe(`<p><${tag}>${text}</${tag}></p>\n`);
        editor.run(command);
        expect(editor.text).toBe(url);
    });

    it.each([
        ['www.example.com/path', '[www.example.com/path](http://www.example.com/path)'],
        ['user@example.com', '<user@example.com>'],
    ])('should normalize a complete address %s', (url, normalized) => {
        const editor = createEditor(url, {linkify: true});
        editor.run(command);

        expect(editor.text).toBe(`${marker}${normalized}${marker}`);
        const link = render(normalized, true).slice(3, -5);
        expect(render(editor.text, true)).toBe(`<p><${tag}>${link}</${tag}></p>\n`);
        editor.run(command);
        expect(editor.text).toBe(normalized);
    });
});

describe('URL normalization boundaries', () => {
    it('should normalize a whole URL when linkify is enabled', () => {
        const editor = createEditor('https://example.com/path', {linkify: true});
        editor.run(toggleUnderline);
        expect(editor.text).toBe('++<https://example.com/path>++');
        const renderer = new MarkdownIt({linkify: true});
        expect(renderer.render(editor.text)).toBe(
            '<p>++<a href="https://example.com/path">https://example.com/path</a>++</p>\n',
        );
        editor.run(toggleUnderline);
        expect(editor.text).toBe('<https://example.com/path>');
        editor.run(undo);
        editor.run(undo);
        expect(editor.text).toBe('https://example.com/path');
    });

    it('should keep one wrapper around a paragraph containing several URLs', () => {
        const doc = 'first https://example.com/one and https://example.com/two last';
        const editor = createEditor(doc, {linkify: true});
        editor.run(toggleUnderline);

        expect(editor.text).toBe(
            '++first <https://example.com/one> and <https://example.com/two> last++',
        );
        expect(render(editor.text, true)).toBe(
            '<p><ins>first <a href="https://example.com/one">https://example.com/one</a> and <a href="https://example.com/two">https://example.com/two</a> last</ins></p>\n',
        );
    });

    it.each([
        '[text](https://example.com/path)',
        '<https://example.com/path>',
        '`https://example.com/path`',
    ])('should keep a complete existing inline node unchanged inside bold in %s', (doc) => {
        const editor = createEditor(doc, {linkify: true});
        editor.run(toggleBold);
        expect(editor.text).toBe(`**${doc}**`);
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it('should keep a partially selected URL literal', () => {
        const doc = 'https://example.com/path/to';
        const from = doc.indexOf('path');
        const editor = createEditor(doc, {
            linkify: true,
            selection: EditorSelection.single(from, doc.length),
        });
        editor.run(toggleBold);
        expect(editor.text).toBe('https://example.com/**path/to**');
        editor.run(toggleBold);
        expect(editor.text).toBe(doc);
    });

    it('should normalize a URL inside color markup', () => {
        const editor = createEditor('https://example.com/path', {linkify: true});
        editor.run(colorify('red'));

        expect(editor.text).toBe('{red}(<https://example.com/path>)');
        expect(render(editor.text, true)).toBe(
            '<p><span class="yfm-colorify yfm-colorify--red"><a href="https://example.com/path">https://example.com/path</a></span></p>\n',
        );
    });

    it('should keep a URL literal inside color markup when linkify is disabled', () => {
        const editor = createEditor('https://example.com/path');
        editor.run(colorify('red'));
        expect(editor.text).toBe('{red}(https://example.com/path)');
        expect(render(editor.text, false)).toBe(
            '<p><span class="yfm-colorify yfm-colorify--red">https://example.com/path</span></p>\n',
        );
    });

    it.each([
        ['inline code', toggleInlineCode, '`https://example.com/path`'],
        ['inline math', wrapToMathInline, '$https://example.com/path$'],
    ] as const)('should keep the selected address literal in %s', (_name, command, expected) => {
        const editor = createEditor('https://example.com/path', {linkify: true});
        editor.run(command);
        expect(editor.text).toBe(expected);
    });

    it('should restore the raw URL and selection with undo', () => {
        const doc = 'https://example.com/path';
        const original = EditorSelection.single(doc.length, 0);
        const editor = createEditor(doc, {linkify: true, selection: original});
        editor.run(toggleItalic);
        editor.run(toggleItalic);
        expect(editor.text).toBe(`<${doc}>`);

        editor.run(undo);
        expect(editor.text).toBe(`_<${doc}>_`);
        editor.run(undo);
        expect(editor.text).toBe(doc);
        expect(editor.state.selection.eq(original)).toBe(true);
        editor.run(redo);
        expect(editor.text).toBe(`_<${doc}>_`);
        editor.run(redo);
        expect(editor.text).toBe(`<${doc}>`);
    });
});

function render(doc: string, linkify: boolean) {
    return new MarkdownIt({linkify})
        .use(insPlugin)
        .use(markPlugin)
        .use(monospacePlugin)
        .use(colorPlugin)
        .render(doc);
}
