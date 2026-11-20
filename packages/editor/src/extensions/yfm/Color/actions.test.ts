import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from 'src/core';

import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {Color, colorType} from './index';

const {schema, rawActions} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Color),
}).build();
const action = rawActions.colorify;

describe('Color action with text', () => {
    it('should report mixed colors within one text selection', () => {
        const doc = schema.node(BaseNode.Doc, null, paragraph('red', 'blue'));
        const state = EditorState.create({doc, selection: TextSelection.create(doc, 1, 3)});

        expect(action.meta?.(state)).toBeNull();
    });

    it('should read stored color at a text cursor', () => {
        const doc = schema.node(BaseNode.Doc, null, paragraph());
        const state = EditorState.create({
            doc,
            storedMarks: [colorType(schema).create({color: 'red'})],
        });

        expect(action.meta?.(state)).toBe('red');
    });
});

function paragraph(...colors: (string | undefined)[]) {
    return schema.node(BaseNode.Paragraph, null, colors.map(text));
}

function text(color?: string) {
    return schema.text('x', color ? [colorType(schema).create({color})] : []);
}
