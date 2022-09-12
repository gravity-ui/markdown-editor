import type {NodeSpec} from 'prosemirror-model';
import {DeflistNode} from './const';

const DEFAULT_PLACEHOLDERS = {
    Term: 'Definition term',
    Desc: 'Definition description',
};

export type DeflistSpecOptions = {
    deflistTermPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    deflistDescPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSpec = (opts?: DeflistSpecOptions): Record<DeflistNode, NodeSpec> => ({
    [DeflistNode.List]: {
        group: 'block',
        content: `(${DeflistNode.Term} ${DeflistNode.Desc})+`,
        parseDOM: [{tag: 'dl'}],
        toDOM() {
            return ['dl', 0];
        },
        selectable: true,
        allowSelection: true,
        complex: 'root',
    },

    [DeflistNode.Term]: {
        defining: true,
        group: 'block',
        content: 'inline*',
        parseDOM: [{tag: 'dt'}],
        toDOM() {
            return ['dt', 0];
        },
        placeholder: {
            content: opts?.deflistTermPlaceholder ?? DEFAULT_PLACEHOLDERS.Term,
            alwaysVisible: true,
        },
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [DeflistNode.Desc]: {
        defining: true,
        group: 'block',
        content: 'block+',
        parseDOM: [{tag: 'dd'}],
        toDOM() {
            return ['dd', 0];
        },
        placeholder: {
            content: opts?.deflistDescPlaceholder ?? DEFAULT_PLACEHOLDERS.Desc,
            alwaysVisible: true,
        },
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
});
