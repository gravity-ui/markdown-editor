import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/specs';
import {LinkAttr, LinkSpecs, linkMarkName, linkType} from '../LinkSpecs';

import {addEmptyLink} from './linkEnhanceActions';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(LinkSpecs),
}).buildDeps();

const {doc, p} = builders<'doc' | 'p'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
});

function createState(content: ReturnType<typeof doc>) {
    return EditorState.create({schema, doc: content});
}

describe('addEmptyLink', () => {
    it('should add link mark to a single-character selection', () => {
        const state = createState(doc(p('a')));
        // Select "a" (positions 1-2)
        const tr = state.tr.setSelection(TextSelection.create(state.doc, 1, 2));
        const stateWithSelection = state.apply(tr);

        let dispatched: EditorState | undefined;
        addEmptyLink(stateWithSelection, (resultTr) => {
            dispatched = stateWithSelection.apply(resultTr);
        });

        expect(dispatched).toBeDefined();
        // The link mark should be active after the command
        const storedMarks = dispatched!.storedMarks;
        const linkMark = storedMarks?.find((m) => m.type === linkType(schema));
        expect(linkMark).toBeDefined();
        expect(linkMark!.attrs[LinkAttr.IsPlaceholder]).toBe(true);
    });

    it('should add link mark to a multi-character selection', () => {
        const state = createState(doc(p('hello')));
        // Select "hello" (positions 1-6)
        const tr = state.tr.setSelection(TextSelection.create(state.doc, 1, 6));
        const stateWithSelection = state.apply(tr);

        let dispatched: EditorState | undefined;
        addEmptyLink(stateWithSelection, (resultTr) => {
            dispatched = stateWithSelection.apply(resultTr);
        });

        expect(dispatched).toBeDefined();
        // Verify link mark is on the text
        const textNode = dispatched!.doc.firstChild!.firstChild!;
        const linkMark = textNode.marks.find((m) => m.type === linkType(schema));
        expect(linkMark).toBeDefined();
    });

    it('should not activate on empty selection', () => {
        const state = createState(doc(p('hello')));
        const result = addEmptyLink(state);
        expect(result).toBe(false);
    });
});
