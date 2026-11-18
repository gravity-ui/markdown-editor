import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    type Command,
    EditorState,
    TextSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {
    BaseNode,
    BaseSchemaSpecs,
    YfmHeadingAttr,
    YfmHeadingSpecs,
    headingNodeName,
} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {FoldingHeadingSpecs} from '../FoldingHeadingSpecs';
import {FoldingHeadingAttr} from '../const';

import {
    openHeadingAndCreateParagraphAfterIfCursorAtEndOfHeading,
    removeFoldingIfCursorAtStartOfHeading,
    toggleFoldingOfHeading,
} from './index';

const {schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(YfmHeadingSpecs, {}).use(FoldingHeadingSpecs),
}).buildDeps();

const {doc, p, h2} = builders<'doc' | 'p' | 'h2'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    h2: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 2},
});

const folded = {[FoldingHeadingAttr.Folding]: true};
const unfolded = {[FoldingHeadingAttr.Folding]: false};

function run(command: Command, initial: ReturnType<typeof doc>, pos: number) {
    let state = EditorState.create({schema, doc: initial});
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, pos)));
    const result = command(state, (tr: Transaction) => {
        state = state.apply(tr);
    });
    return {result, state};
}

describe('FoldingHeading commands', () => {
    it('should make a heading folding and add an empty section', () => {
        const {result, state} = run(toggleFoldingOfHeading, doc(h2('heading')), 2);
        expect(result).toBe(true);
        expect(state.doc.toJSON()).toEqual(doc(h2(unfolded, 'heading'), p()).toJSON());
    });

    it('should make a folding heading common', () => {
        const {state} = run(toggleFoldingOfHeading, doc(h2(folded, 'heading'), p('text')), 2);
        expect(state.doc.toJSON()).toEqual(doc(h2('heading'), p('text')).toJSON());
    });

    it('should not toggle folding outside of a heading', () => {
        const {result} = run(toggleFoldingOfHeading, doc(p('text')), 2);
        expect(result).toBe(false);
    });

    it('should open a folded heading and add a paragraph on Enter at its end', () => {
        const {result, state} = run(
            openHeadingAndCreateParagraphAfterIfCursorAtEndOfHeading,
            doc(h2(folded, 'heading'), p('text')),
            8,
        );
        expect(result).toBe(true);
        expect(state.doc.toJSON()).toEqual(doc(h2(unfolded, 'heading'), p(), p('text')).toJSON());
        expect(state.selection.from).toBe(10);
    });

    it('should remove folding on Backspace at the start of a heading', () => {
        const {result, state} = run(
            removeFoldingIfCursorAtStartOfHeading,
            doc(h2(folded, 'heading')),
            1,
        );
        expect(result).toBe(true);
        expect(state.doc.toJSON()).toEqual(doc(h2('heading')).toJSON());
    });
});
