import codemark from 'prosemirror-codemark';
import {
    AllSelection,
    EditorState,
    NodeSelection,
    type Selection,
    TextSelection,
} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from 'src/core';

import {BaseSchemaSpecs} from '../../base/specs';

import {Code, codeType} from './index';

const {schema, markupParser, plugins} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Code, {}),
}).build();

const original = codemark({markType: codeType(schema)});
const keyboardPlugin = plugins.find((plugin) => plugin.spec.key === original[0].spec.key)!;

describe('Code keyboard handling', () => {
    it.each(['text', 'all', 'node'] as const)(
        'should preserve Codemark handling for %s selection',
        (kind) => {
            const doc = markupParser.parse('word');
            let selection: Selection = TextSelection.create(doc, 1, doc.content.size - 1);
            if (kind === 'all') selection = new AllSelection(doc);
            if (kind === 'node') selection = NodeSelection.create(doc, 0);
            const view = new EditorView(null, {
                state: EditorState.create({doc, plugins, selection}),
            });
            try {
                expect(
                    keyboardPlugin.props.handleKeyDown!.call(
                        keyboardPlugin,
                        view,
                        new KeyboardEvent('keydown', {key: '`'}),
                    ),
                ).toBe(true);
                expect(view.state.doc.rangeHasMark(1, 5, codeType(schema))).toBe(true);
            } finally {
                view.destroy();
            }
        },
    );
});
