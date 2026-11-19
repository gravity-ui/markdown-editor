import {
    AllSelection,
    EditorState,
    NodeSelection,
    type Selection,
    TextSelection,
} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from 'src/core';

import {BaseSchemaSpecs} from '../../base/specs';

import {CodeBlockSpecs} from './CodeBlockSpecs';
import {setCodeBlockType} from './commands';

const deps = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(CodeBlockSpecs, {}),
}).buildDeps();
const command = setCodeBlockType(deps);

describe('setCodeBlockType', () => {
    it.each(['text', 'all', 'node'] as const)(
        'should preserve conversion for %s selection',
        (kind) => {
            const doc = deps.markupParser.parse('one');
            let selection: Selection = TextSelection.create(doc, 1, doc.content.size - 1);
            if (kind === 'all') selection = new AllSelection(doc);
            if (kind === 'node') selection = NodeSelection.create(doc, 0);
            let state = EditorState.create({doc, selection});
            expect(
                command(state, (tr) => {
                    state = state.apply(tr);
                }),
            ).toBe(true);
            expect(state.doc.firstChild!.type.name).toBe('code_block');
            expect(state.doc.textContent).toBe('one');
            state.doc.check();
        },
    );
});
