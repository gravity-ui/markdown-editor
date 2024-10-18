import type {NodeSpec} from 'prosemirror-model';

import type {PlaceholderOptions} from '../../../../utils/placeholder';
import {CutNode} from '../const';

import type {YfmCutSpecsOptions} from './index';

const DEFAULT_PLACEHOLDERS = {
    Title: 'Cut title',
    Content: 'Cut content',
};

export const getSchemaSpecs = (
    opts?: YfmCutSpecsOptions,
    placeholder?: PlaceholderOptions,
): Record<CutNode, NodeSpec> => ({
    [CutNode.Cut]: {
        attrs: {class: {default: 'yfm-cut'}, open: {default: null}},
        content: `${CutNode.CutTitle} ${CutNode.CutContent}`,
        group: 'block yfm-cut',
        parseDOM: [{tag: '.yfm-cut'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: true,
        allowSelection: true,
        defining: true,
        complex: 'root',
    },

    [CutNode.CutTitle]: {
        attrs: {class: {default: 'yfm-cut-title'}},
        content: 'inline*',
        group: 'block yfm-cut',
        parseDOM: [{tag: '.yfm-cut-title'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        placeholder: {
            content:
                placeholder?.[CutNode.CutTitle] ??
                opts?.yfmCutTitlePlaceholder ??
                DEFAULT_PLACEHOLDERS.Title,
            alwaysVisible: true,
        },
        definingAsContext: true,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [CutNode.CutContent]: {
        attrs: {class: {default: 'yfm-cut-content'}},
        content: '(block | paragraph)+',
        group: 'block yfm-cut',
        parseDOM: [{tag: '.yfm-cut-content'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        placeholder: {
            content:
                placeholder?.[CutNode.CutContent] ??
                opts?.yfmCutContentPlaceholder ??
                DEFAULT_PLACEHOLDERS.Content,
            alwaysVisible: true,
        },
        definingAsContext: true,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
});
