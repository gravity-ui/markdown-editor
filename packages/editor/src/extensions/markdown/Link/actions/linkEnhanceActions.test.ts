import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {DecorationSet} from 'prosemirror-view';
import {describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/specs';
import {ImageSpecs} from '../../Image/ImageSpecs';
import {LinkAttr, LinkSpecs, linkMarkName} from '../LinkSpecs';
import {linkTooltipPlugin} from '../plugins/LinkTooltipPlugin';

import {addEmptyLink} from './linkEnhanceActions';

const deps = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(LinkSpecs).use(ImageSpecs),
}).buildDeps();
const {schema} = deps;
const {doc, p, link} = builders<'doc' | 'p' | 'link'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    link: {markType: linkMarkName, [LinkAttr.Href]: 'https://example.com'},
});
const tooltip = linkTooltipPlugin(deps);

function decorations(state: EditorState) {
    const result = tooltip.props.decorations?.call(tooltip, state);
    expect(result).toBeInstanceOf(DecorationSet);
    return result instanceof DecorationSet ? result.find() : [];
}

describe('addEmptyLink', () => {
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
