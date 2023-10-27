import type {NodeSpec} from 'prosemirror-model';
import type {YfmCutSpecsOptions} from './index';
import {CutNode} from '../const';
import {PlaceholderOptions} from '../../../../utils/placeholder';

const DEFAULT_PLACEHOLDERS = {
    Title: 'Cut title',
    Content: 'Cut content',
};

export const getSpec = (
    opts?: YfmCutSpecsOptions,
    placeholder?: PlaceholderOptions,
): Record<CutNode, NodeSpec> => ({
    [CutNode.Cut]: {
        attrs: {class: {default: 'yfm-cut'}},
        content: `${CutNode.CutTitle} ${CutNode.CutContent}`,
        group: 'block yfm-cut',
        parseDOM: [{tag: 'div.yfm-cut'}],
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
        parseDOM: [{tag: 'div.yfm-cut-title'}],
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
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [CutNode.CutContent]: {
        attrs: {class: {default: 'yfm-cut-content'}},
        content: '(block | paragraph)+',
        group: 'block yfm-cut',
        parseDOM: [{tag: 'div.yfm-cut-content'}],
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
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
});
