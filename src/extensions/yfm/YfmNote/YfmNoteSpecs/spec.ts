import type {NodeSpec} from 'prosemirror-model';
import {YfmNoteSpecsOptions} from './index';
import {NoteAttrs, NoteNode} from './const';
import {PlaceholderOptions} from '../../../../utils/placeholder';

const DEFAULT_TITLE_PLACEHOLDER = 'Note';

export const getSpec = (
    opts?: YfmNoteSpecsOptions,
    placeholder?: PlaceholderOptions,
): Record<NoteNode, NodeSpec> => ({
    [NoteNode.Note]: {
        attrs: {
            [NoteAttrs.Class]: {default: 'yfm-note yfm-accent-info'},
            [NoteAttrs.Type]: {default: 'info'},
        },
        content: `${NoteNode.NoteTitle} block+`,
        group: 'block yfm-note',
        parseDOM: [
            {
                tag: 'div.yfm-note',
                priority: 100,
                getAttrs: (node) => ({
                    [NoteAttrs.Class]: (node as Element).getAttribute(NoteAttrs.Class) || '',
                    [NoteAttrs.Type]: (node as Element).getAttribute(NoteAttrs.Type) || 'info',
                }),
            },
        ],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: true,
        allowSelection: true,
        complex: 'root',
    },

    [NoteNode.NoteTitle]: {
        content: 'inline*',
        group: 'block yfm-note',
        parseDOM: [
            {
                tag: 'p.yfm-note-title',
                priority: 100,
            },
        ],
        toDOM() {
            return ['p', {class: 'yfm-note-title'}, 0];
        },
        selectable: false,
        allowSelection: false,
        placeholder: {
            content:
                placeholder?.[NoteNode.NoteTitle] ??
                opts?.yfmNoteTitlePlaceholder ??
                DEFAULT_TITLE_PLACEHOLDER,
            alwaysVisible: true,
        },
        complex: 'leaf',
    },
});
