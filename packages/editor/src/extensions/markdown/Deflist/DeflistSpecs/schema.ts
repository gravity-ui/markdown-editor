import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';
import type {PlaceholderOptions} from 'src/utils/placeholder';

import {DeflistAttr, DeflistNode} from './const';

export type DeflistSchemaOptions = {
    /**
     * @deprecated use placeholder option in BehaviorPreset instead.
     */
    deflistTermPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    /**
     * @deprecated use placeholder option in BehaviorPreset instead.
     */
    deflistDescPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

const DEFAULT_PLACEHOLDERS = {
    Term: 'Definition term',
    Desc: 'Definition description',
};

const getSchemaSpecs = (
    opts?: DeflistSchemaOptions,
    placeholder?: PlaceholderOptions,
): Record<DeflistNode, NodeSpec> => ({
    [DeflistNode.List]: {
        group: 'block',
        content: `(${DeflistNode.Term} ${DeflistNode.Desc})+`,
        parseDOM: [{tag: 'dl'}],
        toDOM() {
            return ['dl', 0];
        },
        selectable: true,
        allowSelection: true,
        selectAll: 'node',
        complex: 'root',
    },

    [DeflistNode.Term]: {
        attrs: {[DeflistAttr.Line]: {default: null}},
        defining: true,
        group: 'block',
        content: 'inline*',
        parseDOM: [{tag: 'dt'}],
        toDOM(node) {
            return ['dt', node.attrs, 0];
        },
        placeholder: {
            content:
                placeholder?.[DeflistNode.Term] ??
                opts?.deflistTermPlaceholder ??
                DEFAULT_PLACEHOLDERS.Term,
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
            content:
                placeholder?.[DeflistNode.Desc] ??
                opts?.deflistDescPlaceholder ??
                DEFAULT_PLACEHOLDERS.Desc,
            alwaysVisible: true,
        },
        selectable: false,
        allowSelection: false,
        selectAll: 'node',
        complex: 'leaf',
    },
});

export const DeflistSchemaSpecs: ExtensionAuto<DeflistSchemaOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder
        .addNodeSpec(DeflistNode.List, () => schemaSpecs[DeflistNode.List])
        .addNodeSpec(DeflistNode.Term, () => schemaSpecs[DeflistNode.Term])
        .addNodeSpec(DeflistNode.Desc, () => schemaSpecs[DeflistNode.Desc]);
};
