import type {NodeSpec} from 'prosemirror-model';

import {PlaceholderOptions} from '../../../../utils/placeholder';

import {NoteAttrs, NoteNode} from './const';

import {YfmNoteSpecsOptions} from './index';

const DEFAULT_TITLE_PLACEHOLDER = 'Note';
const DEFAULT_CONTENT_PLACEHOLDER = 'Note content';

export const getSchemaSpecs = (
    opts?: YfmNoteSpecsOptions,
    placeholder?: PlaceholderOptions,
): Record<NoteNode, NodeSpec> => ({
    [NoteNode.Note]: {
        attrs: {
            [NoteAttrs.Class]: {default: 'yfm-note yfm-accent-info'},
            [NoteAttrs.Type]: {default: 'info'},
        },
        content: `${NoteNode.NoteTitle} ${NoteNode.NoteContent}`,
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
    [NoteNode.NoteContent]: {
        content: '(block | paragraph)+',
        group: 'block yfm-note',
        parseDOM: [
            {
                tag: 'div.yfm-note-content',
                priority: 100,
            },
        ],
        toDOM() {
            return ['div', {class: 'yfm-note-content'}, 0];
        },
        selectable: false,
        allowSelection: false,
        placeholder: {
            content: placeholder?.[NoteNode.NoteContent] ?? DEFAULT_CONTENT_PLACEHOLDER,
            alwaysVisible: true,
        },
        complex: 'leaf',
    },
});
