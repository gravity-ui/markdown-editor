import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {DecorationSet, EditorView} from 'prosemirror-view';
import {describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/specs';
import {BreakNodeName, BreaksSpecs} from '../../Breaks/BreaksSpecs';
import {ImageSpecs} from '../../Image/ImageSpecs';
import {LinkAttr, LinkSpecs, linkMarkName} from '../LinkSpecs';
import {linkTooltipPlugin} from '../plugins/LinkTooltipPlugin';

import {addEmptyLink, linkActionSpec2} from './linkEnhanceActions';

const deps = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(LinkSpecs).use(ImageSpecs).use(BreaksSpecs, {}),
}).buildDeps();
const {schema} = deps;
const {doc, p, link, placeholder, image, br, sb} = builders<
    'doc' | 'p' | 'link' | 'placeholder' | 'image' | 'br' | 'sb'
>(schema, {
    image: {nodeType: 'image', src: 'image.png'},
    br: {nodeType: BreakNodeName.HardBreak},
    sb: {nodeType: BreakNodeName.SoftBreak},
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    link: {markType: linkMarkName, [LinkAttr.Href]: 'https://example.com'},
    placeholder: {markType: linkMarkName, [LinkAttr.Href]: '', [LinkAttr.IsPlaceholder]: true},
});
const tooltip = linkTooltipPlugin(deps);

function decorations(state: EditorState) {
    const result = tooltip.props.decorations?.call(tooltip, state);
    return result instanceof DecorationSet ? result.find() : [];
}

describe('addEmptyLink', () => {
    it.each([
        ['two inline images', () => doc(p('before <from>', image(), image(), '<to> after'))],
        [
            'an image surrounded by whitespace',
            () => doc(p('before <from> ', image(), ' <to> after')),
        ],
    ] as const)('should keep link creation enabled for %s', (_name, createDocument) => {
        const document = createDocument();
        let state = EditorState.create({
            schema,
            doc: document,
            selection: TextSelection.create(document, document.tag.from, document.tag.to),
        });

        expect(addEmptyLink(state)).toBe(true);
        expect(
            addEmptyLink(state, (tr) => {
                state = state.apply(tr);
            }),
        ).toBe(true);

        const objects: {pos: number; size: number}[] = [];
        state.doc.nodesBetween(document.tag.from, document.tag.to, (node, pos) => {
            if (node.isInline && !node.isText) {
                expect(schema.marks[linkMarkName].isInSet(node.marks)?.attrs).toMatchObject({
                    [LinkAttr.Href]: '',
                    [LinkAttr.IsPlaceholder]: true,
                });
                objects.push({pos, size: node.nodeSize});
            }
        });
        expect(objects.length).toBeGreaterThan(0);
        const last = objects[objects.length - 1];
        expect(decorations(state)).toEqual([
            expect.objectContaining({from: last.pos, to: last.pos + last.size}),
        ]);
    });

    it.each([
        ['a space', () => doc(p('before<from> <to>after'))],
        ['whitespace and a line break', () => doc(p('before<from> ', br(), ' \u00a0<to>after'))],
    ] as const)('should reject %s without dispatching', (_name, createDocument) => {
        const document = createDocument();
        const state = EditorState.create({
            schema,
            doc: document,
            selection: TextSelection.create(document, document.tag.from, document.tag.to),
        });
        const dispatch = vi.fn();

        expect(addEmptyLink(state)).toBe(false);
        expect(addEmptyLink(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
        const view = new EditorView(null, {state});
        try {
            expect(linkActionSpec2(deps).isEnable(state, undefined, view)).toBe(false);
        } finally {
            view.destroy();
        }
    });

    it.each([
        ['a', 8, 9, () => doc(p('before ', placeholder('a'), ' after'))],
        [' a ', 9, 10, () => doc(p('before  ', placeholder('a'), '  after'))],
        ['word', 8, 12, () => doc(p('before ', placeholder('word'), ' after'))],
        [' word ', 9, 13, () => doc(p('before  ', placeholder('word'), '  after'))],
    ] as const)(
        'should mark selected text %j and provide its tooltip anchor',
        (text, from, to, createExpected) => {
            const document = doc(p('before <from>', text, '<to> after'));
            let state = EditorState.create({
                schema,
                doc: document,
                selection: TextSelection.create(document, document.tag.from, document.tag.to),
            });

            expect(
                addEmptyLink(state, (tr) => {
                    state = state.apply(tr);
                }),
            ).toBe(true);
            expect(state.doc).toMatchNode(createExpected());
            expect(decorations(state)).toEqual([
                expect.objectContaining({
                    from,
                    to,
                }),
            ]);
        },
    );

    it.each([
        [
            'trailing hard break',
            () => doc(p('before <from>word', br(), '   <to>after')),
            () => doc(p('before ', placeholder('<anchorFrom>word<anchorTo>'), br(), '   after')),
        ],
        [
            'leading hard break',
            () => doc(p('before<from> ', br(), ' word<to> after')),
            () => doc(p('before ', br(), ' ', placeholder('<anchorFrom>word<anchorTo>'), ' after')),
        ],
        [
            'soft breaks at both edges',
            () => doc(p('before<from> ', sb(), ' word', sb(), ' \u00a0<to>after')),
            () =>
                doc(
                    p(
                        'before ',
                        sb(),
                        ' ',
                        placeholder('<anchorFrom>word<anchorTo>'),
                        sb(),
                        ' \u00a0after',
                    ),
                ),
        ],
        [
            'consecutive edge breaks',
            () => doc(p('before<from>', br(), sb(), ' word ', sb(), br(), '<to>after')),
            () =>
                doc(
                    p(
                        'before',
                        br(),
                        sb(),
                        ' ',
                        placeholder('<anchorFrom>word<anchorTo>'),
                        ' ',
                        sb(),
                        br(),
                        'after',
                    ),
                ),
        ],
        [
            'an internal break',
            () => doc(p('before <from>one', br(), 'two<to> after')),
            () =>
                doc(p('before ', placeholder('one', br(), '<anchorFrom>two<anchorTo>'), ' after')),
        ],
        [
            'an image between edge breaks',
            () => doc(p('before<from> ', br(), image(), sb(), ' <to>after')),
            () =>
                doc(
                    p(
                        'before ',
                        br(),
                        placeholder('<anchorFrom>', image(), '<anchorTo>'),
                        sb(),
                        ' after',
                    ),
                ),
        ],
    ] as const)(
        'should preserve content and trim only blank link edges with %s',
        (_name, createDocument, createExpected) => {
            const document = createDocument();
            const expected = createExpected();
            let state = EditorState.create({
                schema,
                doc: document,
                selection: TextSelection.create(document, document.tag.from, document.tag.to),
            });

            expect(
                addEmptyLink(state, (tr) => {
                    state = state.apply(tr);
                }),
            ).toBe(true);
            expect(state.doc).toMatchNode(expected);
            expect(decorations(state)).toEqual([
                expect.objectContaining({from: expected.tag.anchorFrom, to: expected.tag.anchorTo}),
            ]);
        },
    );

    it('should anchor a new single-character link next to an existing link', () => {
        const document = doc(p(link('existing'), '<from>a<to> after'));
        let state = EditorState.create({
            schema,
            doc: document,
            selection: TextSelection.create(document, document.tag.from, document.tag.to),
        });

        expect(
            addEmptyLink(state, (tr) => {
                state = state.apply(tr);
            }),
        ).toBe(true);
        expect(state.doc).toMatchNode(doc(p(link('existing'), placeholder('a'), ' after')));
        expect(decorations(state)).toEqual([
            expect.objectContaining({from: document.tag.from, to: document.tag.to}),
        ]);
    });

    it('should keep a saved link tooltip hidden at its start', () => {
        const document = doc(p('before ', link('<cursor>a'), ' after'));
        const state = EditorState.create({
            schema,
            doc: document,
            selection: TextSelection.create(document, document.tag.cursor),
        });

        expect(decorations(state)).toEqual([]);
    });
});
