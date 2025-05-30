import type {NodeSpec} from 'prosemirror-model';

import type {PlaceholderOptions} from '../../../../utils/placeholder';

import {TabAttrs, TabPanelAttrs, TabsAttrs, TabsListAttrs, TabsNode} from './const';

const DEFAULT_PLACEHOLDERS = {
    TabTitle: 'Tab title',
    RadioTabLabelTitle: 'Radio title',
};

export type YfmTabsSchemaOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    tabPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const getSchemaSpecs: (
    opts: YfmTabsSchemaOptions,
    placeholder?: PlaceholderOptions,
) => Record<TabsNode, NodeSpec> = (opts, placeholder) => ({
    [TabsNode.Tab]: {
        attrs: {
            [TabAttrs.id]: {default: 'unknown'},
            [TabAttrs.class]: {default: 'yfm-tab'},
            [TabAttrs.role]: {default: 'unknown'},
            [TabAttrs.ariaControls]: {default: 'unknown'},
            [TabAttrs.ariaSelected]: {default: 'unknown'},
            [TabAttrs.tabindex]: {default: 'unknown'},
            [TabAttrs.dataDiplodocKey]: {default: 'unknown'},
            [TabAttrs.dataDiplodocid]: {default: 'unknown'},
            [TabAttrs.dataDiplodocIsActive]: {default: 'unknown'},
        },
        marks: '',
        content: 'text*',
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tab'}],
        toDOM(node) {
            return ['div', {draggable: 'false', ...node.attrs}, 0];
        },
        placeholder: {
            content:
                placeholder?.[TabsNode.Tab] ??
                opts?.tabPlaceholder ??
                DEFAULT_PLACEHOLDERS.TabTitle,
            alwaysVisible: true,
        },
        selectionContext: false,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [TabsNode.TabPanel]: {
        attrs: {
            [TabPanelAttrs.id]: {default: 'unknown'},
            [TabPanelAttrs.class]: {default: 'yfm-tab-panel'},
            [TabPanelAttrs.role]: {default: 'unknown'},
            [TabPanelAttrs.dataTitle]: {default: 'unknown'},
            [TabPanelAttrs.ariaLabelledby]: {default: 'unknown'},
        },
        content: '(block | paragraph)+',
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tab-panel'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
        isolating: true,
    },

    [TabsNode.Tabs]: {
        attrs: {
            [TabsAttrs.class]: {default: 'yfm-tabs'},
            [TabsAttrs.dataDiplodocGroup]: {default: 'unknown'},
            [TabsAttrs.dataDiplodocVariant]: {default: 'regular'},
        },
        content: `${TabsNode.TabsList} ${TabsNode.TabPanel}+`,
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tabs'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: true,
        complex: 'root',
    },

    [TabsNode.TabsList]: {
        attrs: {
            [TabsListAttrs.class]: {default: 'yfm-tab-list'},
            [TabsListAttrs.role]: {default: 'unknown'},
        },
        content: `${TabsNode.Tab}*`,
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tab-list'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },

    [TabsNode.RadioTabs]: {
        attrs: {
            [TabsAttrs.class]: {default: 'yfm-tabs yfm-tabs-vertical'},
            [TabsAttrs.dataDiplodocGroup]: {default: 'unknown'},
            [TabsAttrs.dataDiplodocVariant]: {default: 'radio'},
        },
        content: `(${TabsNode.RadioTab} ${TabsNode.TabPanel})+`,
        group: 'block',
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        complex: 'root',
    },
    [TabsNode.RadioTab]: {
        attrs: {
            [TabAttrs.id]: {default: null},
            [TabAttrs.class]: {default: 'yfm-tab yfm-vertical-tab'},
            [TabAttrs.role]: {default: 'unknown'},
            [TabAttrs.ariaControls]: {default: 'unknown'},
            [TabAttrs.ariaSelected]: {default: 'unknown'},
            [TabAttrs.tabindex]: {default: 'unknown'},
            [TabAttrs.dataDiplodocKey]: {default: 'unknown'},
            [TabAttrs.dataDiplodocid]: {default: 'unknown'},
            [TabAttrs.dataDiplodocIsActive]: {default: 'false'},
            [TabAttrs.dataDiplodocVerticalTab]: {default: 'true'},
        },
        content: `${TabsNode.RadioTabInput} ${TabsNode.RadioTabLabel}`,
        group: 'block',
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'inner',
    },
    [TabsNode.RadioTabInput]: {
        attrs: {
            [TabAttrs.class]: {default: 'radio'},
            type: {default: 'radio'},
            checked: {default: null},
        },
        group: 'block',
        toDOM(node) {
            return ['input', node.attrs];
        },
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
    [TabsNode.RadioTabLabel]: {
        attrs: {},
        marks: '',
        content: 'text*',
        group: 'block',
        toDOM(node) {
            return ['label', node.attrs, 0];
        },
        placeholder: {
            content: placeholder?.[TabsNode.RadioTab] ?? DEFAULT_PLACEHOLDERS.RadioTabLabelTitle,
            alwaysVisible: true,
        },
        selectionContext: false,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },
});
