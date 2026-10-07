import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {DecorationSet} from 'prosemirror-view';
import {describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/specs';
import {VideoSpecs} from '../../../yfm/Video/VideoSpecs';
import {BreakNodeName, BreaksSpecs} from '../../Breaks/BreaksSpecs';
import {ImageSpecs} from '../../Image/ImageSpecs';
import {LinkAttr, LinkSpecs, linkMarkName} from '../LinkSpecs';
import {linkTooltipPlugin} from '../plugins/LinkTooltipPlugin';

import {addEmptyLink} from './linkEnhanceActions';

const deps = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(LinkSpecs)
            .use(ImageSpecs)
            .use(BreaksSpecs, {})
            .use(VideoSpecs, {}),
}).buildDeps();
const {schema} = deps;
const {doc, p, link, image, video, br} = builders<'doc' | 'p' | 'link' | 'image' | 'video' | 'br'>(
    schema,
    {
        image: {nodeType: 'image', src: 'image.png'},
        video: {nodeType: 'video', service: 'youtube', videoid: 'example'},
        br: {nodeType: BreakNodeName.HardBreak},
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
        link: {markType: linkMarkName, [LinkAttr.Href]: 'https://example.com'},
    },
);
const tooltip = linkTooltipPlugin(deps);

function decorations(state: EditorState) {
    const result = tooltip.props.decorations?.call(tooltip, state);
    expect(result).toBeInstanceOf(DecorationSet);
    return result instanceof DecorationSet ? result.find() : [];
}

describe('addEmptyLink', () => {
    it.each([
        ['two inline images', () => doc(p('before <from>', image(), image(), '<to> after'))],
        [
            'an image surrounded by whitespace',
            () => doc(p('before <from> ', image(), ' <to> after')),
        ],
        ['an inline video', () => doc(p('before <from>', video(), '<to> after'))],
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

    it('should reject a selection containing only whitespace and line breaks', () => {
        const document = doc(p('before<from> ', br(), ' \u00a0<to>after'));
        const state = EditorState.create({
            schema,
            doc: document,
            selection: TextSelection.create(document, document.tag.from, document.tag.to),
        });
        const dispatch = vi.fn();

        expect(addEmptyLink(state)).toBe(false);
        expect(addEmptyLink(state, dispatch)).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it.each([' ', '   ', '\t', '\u00a0', '\u2009', ' \t\u00a0 '])(
        'should reject whitespace-only selection %j without dispatching',
        (text) => {
            const document = doc(p('before <from>', text, '<to> after'));
            const state = EditorState.create({
                schema,
                doc: document,
                selection: TextSelection.create(document, document.tag.from, document.tag.to),
            });
            const dispatch = vi.fn();

            expect(addEmptyLink(state)).toBe(false);
            expect(addEmptyLink(state, dispatch)).toBe(false);
            expect(dispatch).not.toHaveBeenCalled();
        },
    );

    it.each(['a', '1', 'я', 'a ', ' a', ' a ', 'word', ' word '])(
        'should provide a tooltip anchor for selected text %j',
        (text) => {
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
            expect(decorations(state)).toEqual([
                expect.objectContaining({
                    from: document.tag.from + text.length - text.trimStart().length,
                    to: document.tag.to - (text.length - text.trimEnd().length),
                }),
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
