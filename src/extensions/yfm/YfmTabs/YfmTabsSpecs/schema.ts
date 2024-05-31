import type {NodeSpec} from 'prosemirror-model';

import {PlaceholderOptions} from '../../../../utils/placeholder';

import {TabAttrs, TabPanelAttrs, TabsAttrs, TabsListAttrs, TabsNode} from './const';

import {YfmTabsSpecsOptions} from '.';

const DEFAULT_PLACEHOLDERS = {
    TabTitle: 'Tab title',
};

export const getSchemaSpecs: (
    opts: YfmTabsSpecsOptions,
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
            return ['div', node.attrs, 0];
        },
        placeholder: {
            content:
                placeholder?.[TabsNode.Tab] ??
                opts?.tabPlaceholder ??
                DEFAULT_PLACEHOLDERS.TabTitle,
            alwaysVisible: true,
        },
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
        },
        content: `${TabsNode.TabsList} ${TabsNode.TabPanel}+`,
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tabs'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
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
});
