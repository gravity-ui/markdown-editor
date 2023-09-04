import type {NodeSpec} from 'prosemirror-model';
import {YfmTabsSpecsOptions} from '.';
import {TabAttrs, TabPanelAttrs, TabsAttrs, TabsListAttrs, TabsNode} from './const';

const DEFAULT_PLACEHOLDERS = {
    TabTitle: 'Tab title',
};

export const getSpec: (opts: YfmTabsSpecsOptions) => Record<TabsNode, NodeSpec> = (opts) => ({
    [TabsNode.Tab]: {
        attrs: {
            [TabAttrs.id]: {default: 'unknown'},
            [TabAttrs.class]: {default: 'yfm-tab'},
            [TabAttrs.role]: {default: 'unknown'},
            [TabAttrs.ariaControls]: {default: 'unknown'},
            [TabAttrs.ariaSelected]: {default: 'unknown'},
            [TabAttrs.tabindex]: {default: 'unknown'},
        },
        marks: '',
        content: 'text*',
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tab'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        placeholder: {
            content: opts?.tabPlaceholder ?? DEFAULT_PLACEHOLDERS.TabTitle,
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
        content: 'block*',
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
        attrs: {[TabsAttrs.class]: {default: 'yfm-tabs'}},
        content: 'yfm_tabs_list yfm_tab_panel+',
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
        content: 'yfm_tab*',
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
