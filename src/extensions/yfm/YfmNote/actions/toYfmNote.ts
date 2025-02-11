import type {Node, Schema} from 'prosemirror-model';
import {Command, EditorState} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findParentNodeOfType, hasParentNodeOfType} from 'prosemirror-utils';

import type {ActionSpec} from '../../../../core';
import {NoteAttrs} from '../const';
import {noteContentType, noteTitleType, noteType} from '../utils';

export function isInsideYfmNote(state: EditorState) {
    return hasParentNodeOfType(noteType(state.schema))(state.selection);
}

export type YfmNoteType = 'info' | 'tip' | 'alert' | 'warning';

const createYfmNoteNode = (schema: Schema) => (type: YfmNoteType, content: Node | Node[]) => {
    return noteType(schema).create(
        {
            [NoteAttrs.Class]: `yfm-note yfm-accent-${type}`,
            [NoteAttrs.Type]: type,
        },
        [
            noteTitleType(schema).createAndFill()!,
            noteContentType(schema).createAndFill({}, content)!,
        ],
    );
};

export const createYfmNote: Command = (state, dispatch) => {
    const parent = findParentNodeOfType(state.schema.nodes.paragraph)(state.selection);
    if (parent) {
        const yfmNote = createYfmNoteNode(state.schema)('info', parent.node);

        dispatch?.(state.tr.replaceWith(parent.pos, parent.pos + parent.node.nodeSize, yfmNote));

        return true;
    }

    return false;
};

export const toYfmNote: ActionSpec = {
    isEnable(state) {
        return createYfmNote(state);
    },
    run(state, dispatch) {
        createYfmNote(state, dispatch);
    },
};
