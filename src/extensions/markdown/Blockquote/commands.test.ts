import {Node} from 'prosemirror-model';
import {EditorState, TextSelection, Transaction, Selection, Command} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {get$Cursor, isNodeSelection} from '../../../utils/selection';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {HtmlAttr, HtmlNode, Html} from '../Html';
import {DeflistNode, DeflistSpecs} from '../Deflist/DeflistSpecs';

import {blockquoteNodeName, BlockquoteSpecs} from './BlockquoteSpecs';
import {joinPrevQuote} from './commands';

const {schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSpecsPreset, {}).use(BlockquoteSpecs).use(Html).use(DeflistSpecs, {}),
}).buildDeps();

const {doc, p, bq, htmlBlock, dList, dTerm, dDesc} = builders<
    'doc' | 'p' | 'bq' | 'htmlBlock',
    'dList' | 'dTerm' | 'dDesc'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    htmlBlock: {nodeType: HtmlNode.Block},
    dList: {nodeType: DeflistNode.List},
    dTerm: {nodeType: DeflistNode.Term},
    dDesc: {nodeType: DeflistNode.Desc},
});

function shouldDispatch(
    cmd: Command,
    init: {doc: Node; sel?: (doc: Node) => Selection},
    expected: {doc: Node; sel?: (sel: Selection) => boolean},
    onSuccess?: (tr: Transaction) => void,
) {
    const state = EditorState.create({
        doc: init.doc,
        selection: init.sel?.(init.doc),
    });

    let tr: Transaction;
    const res = cmd(state, (tr_) => {
        tr = tr_;
    });

    expect(res).toBe(true);
    expect(tr!.doc).toMatchNode(expected.doc);
    if (expected.sel) expect(expected.sel(tr!.selection)).toBe(true);

    onSuccess?.(tr!);
}

describe('Blockqoute commands', () => {
    describe('joinPrevQuote', () => {
        const shouldDispatchWithCursorSelection = (
            initDoc: Node,
            initCursorSel: number,
            expectDoc: Node,
            expectCursor: number,
        ) =>
            shouldDispatch(
                joinPrevQuote,
                {doc: initDoc, sel: (doc) => TextSelection.create(doc, initCursorSel)},
                {doc: expectDoc},
                (tr) => expect(get$Cursor(tr.selection)?.pos).toBe(expectCursor),
            );

        const shouldDispatchWithNodeSelection = (
            initDoc: Node,
            initCursorSel: number,
            expectDoc: Node,
            expectNodeSel: number,
        ) =>
            shouldDispatch(
                joinPrevQuote,
                {doc: initDoc, sel: (doc) => TextSelection.create(doc, initCursorSel)},
                {doc: expectDoc, sel: isNodeSelection},
                (tr) => expect(tr.selection.from).toBe(expectNodeSel),
            );

        it('should join to textblock in quote', () => {
            shouldDispatchWithCursorSelection(
                doc(bq(p('para in blockqoute')), p('text')),
                23, // at start of second paragraph
                doc(bq(p('para in blockqoutetext'))),
                20,
            );
        });

        it('should join to textblock in nested quotes', () => {
            shouldDispatchWithCursorSelection(
                doc(bq(bq(bq(p('para in nested blockqoutes')))), p('text')),
                35, // at start of second paragraph
                doc(bq(bq(bq(p('para in nested blockqoutestext'))))),
                30,
            );
        });

        it('should join to last textblock in qoute', () => {
            shouldDispatchWithCursorSelection(
                doc(bq(p('first'), p('second')), p('third')),
                18, // at start of third paragraph
                doc(bq(p('first'), p('secondthird'))),
                15,
            );
        });

        it('should select last atom block', () => {
            shouldDispatchWithNodeSelection(
                doc(bq(htmlBlock({[HtmlAttr.Content]: '<div/>'})), p('para')),
                4, // at start of para
                doc(bq(htmlBlock({[HtmlAttr.Content]: '<div/>'})), p('para')),
                1, // before html-block
            );
        });

        it('should select last atom block and remove current empty textblock', () => {
            shouldDispatchWithNodeSelection(
                doc(bq(htmlBlock({[HtmlAttr.Content]: '<div/>'})), p('')),
                4, // at start of para
                doc(bq(htmlBlock({[HtmlAttr.Content]: '<div/>'}))),
                1, // before html-block
            );
        });

        it('should move current textblock to end of last non-qoute block', () => {
            shouldDispatchWithCursorSelection(
                doc(bq(dList(dTerm('Term'), dDesc(p('Definition')))), p('current')),
                25, // at start of current paragraph
                doc(bq(dList(dTerm('Term'), dDesc(p('Definition'), p('current'))))),
                22, // at start of current paragraph
            );
        });
    });
});
