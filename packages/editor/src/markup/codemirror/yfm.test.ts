import {syntaxTree} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import monospacePlugin from '@diplodoc/transform/lib/plugins/monospace.js';
import MarkdownIt from 'markdown-it';
import insPlugin from 'markdown-it-ins';
import markPlugin from 'markdown-it-mark';
import {describe, expect, it} from 'vitest';

import {yfmLang} from './yfm';

const renderer = new MarkdownIt().use(insPlugin).use(markPlugin).use(monospacePlugin);
const styles = [
    {name: 'Underline', marker: '++', tag: 'ins'},
    {name: 'Monospace', marker: '##', tag: 'samp'},
    {name: 'Marked', marker: '==', tag: 'mark'},
];

describe.each(styles)('yfmLang $name', ({name, marker, tag}) => {
    it('should parse nested styles with matching source ranges', () => {
        const doc = `${marker}one ${marker}two${marker} three${marker}`;
        const tree = parse(doc);

        expect(tree.toString()).toBe(
            `Document(Paragraph(${name}(${name}Mark,${name}(${name}Mark,${name}Mark),${name}Mark)))`,
        );
        expect(styleNodes(tree, name)).toEqual([
            [name, 0, 21],
            [`${name}Mark`, 0, 2],
            [name, 6, 13],
            [`${name}Mark`, 6, 8],
            [`${name}Mark`, 11, 13],
            [`${name}Mark`, 19, 21],
        ]);
        expect(renderer.renderInline(doc)).toBe(`<${tag}>one <${tag}>two</${tag}> three</${tag}>`);
    });

    it('should keep adjacent styles separate', () => {
        const doc = `${marker}one${marker} ${marker}two${marker}`;

        expect(styleNodes(parse(doc), name)).toEqual([
            [name, 0, 7],
            [`${name}Mark`, 0, 2],
            [`${name}Mark`, 5, 7],
            [name, 8, 15],
            [`${name}Mark`, 8, 10],
            [`${name}Mark`, 13, 15],
        ]);
        expect(renderer.renderInline(doc)).toBe(`<${tag}>one</${tag}> <${tag}>two</${tag}>`);
    });

    it.each([' ', '\t', '\n'])('should reject inner whitespace %j at a delimiter', (space) => {
        const doc = `text ${marker}${space}one${space}${marker}`;

        expect(styleNodes(parse(doc), name)).toEqual([]);
        expect(renderer.renderInline(doc)).toBe(doc);
    });

    it.each(['a%s!one%s', '%sone!%sa', 'a%s$one%s', '%sone$%sa'])(
        'should reject invalid punctuation boundaries in %s',
        (source) => {
            const doc = source.replaceAll('%s', marker);

            expect(styleNodes(parse(doc), name)).toEqual([]);
            expect(renderer.renderInline(doc)).toBe(doc);
        },
    );

    it('should accept Unicode punctuation around a style', () => {
        const doc = `«${marker}one${marker}»`;

        expect(styleNodes(parse(doc), name)).toEqual([
            [name, 1, 8],
            [`${name}Mark`, 1, 3],
            [`${name}Mark`, 6, 8],
        ]);
        expect(renderer.renderInline(doc)).toBe(`«<${tag}>one</${tag}>»`);
    });

    it.each([
        {source: 'a%s£one two%s', from: 1, to: 13, before: 'a', content: '£one two', after: ''},
        {source: '%sone two£%sa', from: 0, to: 12, before: '', content: 'one two£', after: 'a'},
    ])(
        'should treat a Unicode symbol as text in $source',
        ({source, from, to, before, content, after}) => {
            const doc = source.replaceAll('%s', marker);

            expect(renderer.renderInline(doc)).toBe(`${before}<${tag}>${content}</${tag}>${after}`);
            expect(styleNodes(parse(doc), name)).toEqual([
                [name, from, to],
                [`${name}Mark`, from, from + 2],
                [`${name}Mark`, to - 2, to],
            ]);
        },
    );

    it('should accept a style inside a word', () => {
        const doc = `a${marker}b${marker}c`;

        expect(styleNodes(parse(doc), name)).toEqual([
            [name, 1, 6],
            [`${name}Mark`, 1, 3],
            [`${name}Mark`, 4, 6],
        ]);
        expect(renderer.renderInline(doc)).toBe(`a<${tag}>b</${tag}>c`);
    });

    it('should preserve a link inside a style', () => {
        const doc = `${marker}[one](url)${marker}`;

        expect(parse(doc).toString()).toBe(
            `Document(Paragraph(${name}(${name}Mark,Link(LinkMark,LinkMark,LinkMark,URL,LinkMark),${name}Mark)))`,
        );
        expect(renderer.renderInline(doc)).toBe(`<${tag}><a href="url">one</a></${tag}>`);
    });

    it('should keep styles from crossing a link boundary', () => {
        const doc = `${marker}one [two${marker}](url)`;

        expect(styleNodes(parse(doc), name)).toEqual([]);
        expect(renderer.renderInline(doc)).toBe(`${marker}one <a href="url">two${marker}</a>`);
    });

    it('should preserve nested bold', () => {
        const doc = `${marker}**one**${marker}`;

        expect(parse(doc).toString()).toBe(
            `Document(Paragraph(${name}(${name}Mark,StrongEmphasis(EmphasisMark,EmphasisMark),${name}Mark)))`,
        );
        expect(renderer.renderInline(doc)).toBe(`<${tag}><strong>one</strong></${tag}>`);
    });

    it('should ignore an escaped opening marker', () => {
        const doc = `\\${marker}one${marker}`;

        expect(styleNodes(parse(doc), name)).toEqual([]);
        expect(renderer.renderInline(doc)).toBe(`${marker}one${marker}`);
    });

    it('should ignore markers inside inline code', () => {
        const doc = `\`${marker}one${marker}\``;

        expect(parse(doc).toString()).toBe('Document(Paragraph(InlineCode(CodeMark,CodeMark)))');
        expect(renderer.renderInline(doc)).toBe(`<code>${marker}one${marker}</code>`);
    });

    it.each([3, 4, 5])('should preserve the current handling of a %i-character run', (length) => {
        const run = marker[0].repeat(length);
        const doc = `${run}one${run}`;

        expect(styleNodes(parse(doc), name)).toEqual([
            [name, length - 2, doc.length],
            [`${name}Mark`, length - 2, length],
            [`${name}Mark`, doc.length - 2, doc.length],
        ]);
    });
});

function parse(doc: string) {
    return syntaxTree(EditorState.create({doc, extensions: [yfmLang()]}));
}

function styleNodes(tree: ReturnType<typeof parse>, name: string) {
    const nodes: [string, number, number][] = [];
    tree.iterate({
        enter(node) {
            if (node.name === name || node.name === `${name}Mark`) {
                nodes.push([node.name, node.from, node.to]);
            }
        },
    });
    return nodes;
}
