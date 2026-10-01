import {transform as yfmCut} from '@diplodoc/cut-extension';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {createMarkupChecker} from '../../tests/sameMarkup';
import {DirectiveContext} from '../../tests/utils';
import {ExtensionsManager} from '../core';
import {BaseNode, BaseSchemaSpecs} from '../extensions/base/specs';
import {
    HeadingSpecs,
    ImageSpecs,
    LinkSpecs,
    ListsSpecs,
    linkMarkName,
} from '../extensions/markdown/specs';
import {CutAttr, CutNode, YfmCutSpecs} from '../extensions/yfm/YfmCut/YfmCutSpecs';

import {type SlotMatch, type SlotRule, blockContentSlots, byType} from './block-content-slots';

const paragraph = byType('paragraph_open');

const paragraphWithoutImage: SlotMatch = (group) =>
    paragraph(group) && group.every(({children}) => !children?.some(({type}) => type === 'image'));

const cut = (body: string) => `{% cut "title" %}\n\n${body}\n\n{% endcut %}\n`;

function cutMd(slots: SlotRule[]): MarkdownIt {
    return new MarkdownIt()
        .use(yfmCut({bundle: false}))
        .use(blockContentSlots, {bodyToken: CutNode.CutContent, slots});
}

/** Tokens between the first `yfm_cut_content_open` and its own closing token */
function cutBody(tokens: Token[]): Token[] {
    const open = tokens.findIndex(({type}) => type === `${CutNode.CutContent}_open`);
    let close = open;
    for (let depth = 1; depth > 0; ) depth += tokens[++close].nesting;
    return tokens.slice(open + 1, close);
}

const parseCut = (slots: SlotRule[], body: string) => cutMd(slots).parse(cut(body), {});
const bodyOf = (slots: SlotRule[], body: string) => cutBody(parseCut(slots, body));

const types = (tokens: Token[]) => tokens.map(({type}) => type);
const texts = (tokens: Token[]) =>
    tokens.filter(({type}) => type === 'inline').map(({content}) => content);

describe('byType', () => {
    it('should match the type of the group opening token', () => {
        const group = [{type: 'paragraph_open'}, {type: 'inline'}] as Token[];

        expect(byType('paragraph_open')(group)).toBe(true);
        expect(byType('heading_open', 'paragraph_open')(group)).toBe(true);
        expect(byType('inline')(group)).toBe(false);
    });
});

describe('blockContentSlots', () => {
    it('should keep matching groups and drop the rest', () => {
        const body = bodyOf(
            [{slot: 'content', match: paragraph}],
            'text\n\n# heading\n\n- item\n\nmore text',
        );

        expect(types(body)).toEqual([
            'paragraph_open',
            'inline',
            'paragraph_close',
            'paragraph_open',
            'inline',
            'paragraph_close',
        ]);
        expect(texts(body)).toEqual(['text', 'more text']);
    });

    it('should keep nested markdown of a matched group intact', () => {
        const body = bodyOf(
            [{slot: 'content', match: byType('bullet_list_open')}],
            '- item\n\n  nested',
        );

        expect(types(body)).toEqual([
            'bullet_list_open',
            'list_item_open',
            'paragraph_open',
            'inline',
            'paragraph_close',
            'paragraph_open',
            'inline',
            'paragraph_close',
            'list_item_close',
            'bullet_list_close',
        ]);
        expect(texts(body)).toEqual(['item', 'nested']);
    });

    it('should keep a paragraph with an image, since the image is an inline child', () => {
        const body = bodyOf([{slot: 'content', match: paragraph}], 'text\n\n![pic](/pic.png)');

        expect(texts(body)).toEqual(['text', '![pic](/pic.png)']);
    });

    it('should drop a paragraph with an image when the predicate reads inline children', () => {
        const body = bodyOf(
            [{slot: 'content', match: paragraphWithoutImage}],
            'text with [link](/l)\n\n![pic](/pic.png)',
        );

        expect(texts(body)).toEqual(['text with [link](/l)']);
    });

    it('should route unmatched groups into the fallback slot', () => {
        const body = bodyOf(
            [
                {slot: 'cut-heading', wrap: {class: 'heading'}, match: byType('heading_open')},
                {slot: 'cut-rest', fallback: true},
            ],
            '# heading\n\ntext',
        );

        expect(types(body)).toEqual([
            'cut-heading_open',
            'heading_open',
            'inline',
            'heading_close',
            'cut-heading_close',
            'paragraph_open',
            'inline',
            'paragraph_close',
        ]);
    });

    it('should leave the body empty when nothing matches', () => {
        const tokens = parseCut([{slot: 'content', match: paragraph}], '# heading');

        expect(types(tokens)).toEqual([
            'yfm_cut_open',
            'yfm_cut_title_open',
            'inline',
            'yfm_cut_title_close',
            'yfm_cut_content_open',
            'yfm_cut_content_close',
            'yfm_cut_close',
        ]);
    });

    it('should drop filtered content from the rendered html', () => {
        const html = cutMd([{slot: 'content', match: paragraphWithoutImage}]).render(
            cut('text\n\n# heading\n\n![pic](/pic.png)'),
        );

        expect(html).toContain('text');
        expect(html).not.toContain('<h1');
        expect(html).not.toContain('<img');
    });

    it('should route the body of a nested block', () => {
        const body = bodyOf(
            [{slot: 'content', match: byType('paragraph_open', 'yfm_cut_open')}],
            cut('text\n\n# heading'),
        );

        expect(types(body)).toEqual([
            'yfm_cut_open',
            'yfm_cut_title_open',
            'inline',
            'yfm_cut_title_close',
            'yfm_cut_content_open',
            'paragraph_open',
            'inline',
            'paragraph_close',
            'yfm_cut_content_close',
            'yfm_cut_close',
        ]);
    });

    describe('wrappers', () => {
        const slots: SlotRule[] = [
            {slot: 'cut-list', wrap: {class: 'list'}, match: byType('bullet_list_open')},
            {slot: 'cut-text', wrap: {tag: 'section'}, fallback: true},
        ];

        it('should wrap routed groups and emit slots in the declared order', () => {
            const body = bodyOf(slots, 'text\n\n- item\n\nmore text');

            expect(types(body)).toEqual([
                'cut-list_open',
                'bullet_list_open',
                'list_item_open',
                'paragraph_open',
                'inline',
                'paragraph_close',
                'list_item_close',
                'bullet_list_close',
                'cut-list_close',
                'cut-text_open',
                'paragraph_open',
                'inline',
                'paragraph_close',
                'paragraph_open',
                'inline',
                'paragraph_close',
                'cut-text_close',
            ]);
            expect(texts(body)).toEqual(['item', 'text', 'more text']);
        });

        it('should describe the wrapper as a block token', () => {
            const body = bodyOf(slots, '- item');

            expect(body.at(0)).toMatchObject({
                type: 'cut-list_open',
                tag: 'div',
                nesting: 1,
                block: true,
                attrs: [['class', 'list']],
            });
            expect(body.at(-1)).toMatchObject({
                type: 'cut-list_close',
                tag: 'div',
                nesting: -1,
                block: true,
                attrs: null,
            });
        });

        it('should take the wrapper tag from the slot', () => {
            const body = bodyOf(slots, 'text');

            expect(body.at(0)).toMatchObject({type: 'cut-text_open', tag: 'section', attrs: null});
        });

        it('should raise the level of wrapped tokens', () => {
            const plain = bodyOf([{slot: 'cut-text', fallback: true}], '- item');
            const wrapped = bodyOf(slots, '- item');

            expect(plain.map(({level}) => level)).toEqual([0, 1, 2, 3, 2, 1, 0]);
            expect(wrapped.map(({level}) => level)).toEqual([0, 1, 2, 3, 4, 3, 2, 1, 0]);
        });

        it('should span the wrapper map over its groups', () => {
            const body = bodyOf(slots, 'text\n\n- item\n\nmore text');
            const list = body.find(({type}) => type === 'cut-list_open');
            const text = body.find(({type}) => type === 'cut-text_open');

            expect(list?.map).toEqual([4, 5]);
            expect(text?.map).toEqual([2, 7]);
        });

        it('should omit the wrapper of an empty slot', () => {
            const body = bodyOf(slots, 'text');

            expect(types(body)).toEqual([
                'cut-text_open',
                'paragraph_open',
                'inline',
                'paragraph_close',
                'cut-text_close',
            ]);
        });
    });

    describe('scheme validation', () => {
        const use = (slots: SlotRule[]) => () => cutMd(slots);

        it('should require a slot', () => {
            expect(use([])).toThrow('at least one slot is required');
        });

        it('should require unique slot names', () => {
            expect(
                use([
                    {slot: 'content', match: paragraph},
                    {slot: 'content', fallback: true},
                ]),
            ).toThrow('duplicate slot "content"');
        });

        it('should require a match or a fallback', () => {
            expect(use([{slot: 'content'} as SlotRule])).toThrow(
                'slot "content" needs either match or fallback',
            );
            expect(
                use([{slot: 'content', match: paragraph, fallback: true} as unknown as SlotRule]),
            ).toThrow('slot "content" needs either match or fallback');
        });

        it('should reject a second fallback slot', () => {
            expect(
                use([
                    {slot: 'content', fallback: true},
                    {slot: 'rest', fallback: true},
                ]),
            ).toThrow('only one fallback slot is allowed');
        });
    });

    describe('wysiwyg', () => {
        const {schema, markupParser: parser, serializer} = buildDeps();
        const {
            doc,
            p,
            a,
            cut: cutNode,
            cutTitle,
            cutContent,
        } = builders<'doc' | 'p' | 'cut' | 'cutTitle' | 'cutContent', 'a'>(schema, {
            doc: {nodeType: BaseNode.Doc},
            p: {nodeType: BaseNode.Paragraph},
            a: {markType: linkMarkName},
            cut: {nodeType: CutNode.Cut},
            cutTitle: {nodeType: CutNode.CutTitle},
            cutContent: {nodeType: CutNode.CutContent},
        });
        const {parse} = createMarkupChecker({parser, serializer});

        const markup = {[CutAttr.Markup]: '{%'};

        it('should parse the filtered body into the document', () => {
            parse(
                cut('text with [link](/l)\n\n# heading\n\n![pic](/pic.png)'),
                doc(
                    cutNode(
                        markup,
                        cutTitle('title'),
                        cutContent(p('text with ', a({href: '/l'}, 'link'))),
                    ),
                ),
            );
        });

        it('should parse a fully filtered body into an empty cut content', () => {
            parse(cut('# heading'), doc(cutNode(markup, cutTitle('title'), cutContent())));
        });
    });
});

function buildDeps() {
    return new ExtensionsManager({
        extensions: (builder) => {
            builder.context.set('directiveSyntax', new DirectiveContext(undefined));
            builder
                .use(BaseSchemaSpecs, {})
                .use(LinkSpecs)
                .use(HeadingSpecs, {})
                .use(ListsSpecs)
                .use(ImageSpecs)
                .use(YfmCutSpecs, {})
                .configureMd((md) =>
                    md.use(blockContentSlots, {
                        bodyToken: CutNode.CutContent,
                        slots: [{slot: 'content', match: paragraphWithoutImage}],
                    }),
                )
                .overrideNodeSpec(CutNode.CutContent, (spec) => ({...spec, content: 'paragraph*'}));
        },
    }).buildDeps();
}
