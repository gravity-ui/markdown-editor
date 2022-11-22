import type {NodeSpec} from 'prosemirror-model';
import {NoteAttrs, NoteNode} from './const';

const DEFAULT_TITLE_PLACEHOLDER = 'Note';

export type YfmNoteSpecOptions = {
    yfmNoteTitlePlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSpec = (opts?: YfmNoteSpecOptions): Record<NoteNode, NodeSpec> => ({
    [NoteNode.Note]: {
        attrs: {
            [NoteAttrs.Class]: {default: 'yfm-note yfm-accent-info'},
            [NoteAttrs.Type]: {default: 'info'},
        },
        content: `${NoteNode.NoteTitle} block+`,
        group: 'block',
        parseDOM: [
            {
                tag: 'div.yfm-note',
                getAttrs: (node) => ({
                    [NoteAttrs.Class]: (node as Element).getAttribute(NoteAttrs.Class) || '',
                    [NoteAttrs.Type]: (node as Element).getAttribute(NoteAttrs.Type) || '',
                }),
            },
        ],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: true,
        allowSelection: true,
        allowGapCursor: true,
        complex: 'root',
    },

    [NoteNode.NoteTitle]: {
        content: 'text*',
        group: 'block',
        parseDOM: [
            {
                tag: 'p[yfm_block="yfm-note-title"]',
                priority: 100,
            },
        ],
        toDOM() {
            return ['p', {yfm_block: 'yfm-note-title'}, 0];
        },
        selectable: false,
        allowSelection: false,
        placeholder: {
            content: opts?.yfmNoteTitlePlaceholder ?? DEFAULT_TITLE_PLACEHOLDER,
            alwaysVisible: true,
        },
        complex: 'leaf',
    },
});
