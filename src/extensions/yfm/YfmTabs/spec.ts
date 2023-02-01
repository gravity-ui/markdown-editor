import {NodeSpec} from 'prosemirror-model';
import {TabsNode} from './const';

export const spec: Record<TabsNode, NodeSpec> = {
    [TabsNode.Tab]: {
        attrs: {
            id: {default: 'unknown'},
            class: {default: 'unknown'},
            role: {default: 'unknown'},
            'aria-controls': {default: 'unknown'},
            'aria-selected': {default: 'unknown'},
            tabindex: {default: 'unknown'},
        },
        marks: '',
        content: 'text*',
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tab'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [TabsNode.TabPanel]: {
        attrs: {
            id: {default: 'unknown'},
            class: {default: 'unknown'},
            role: {default: 'unknown'},
            'data-title': {default: 'unknown'},
            'aria-labelledby': {default: 'unknown'},
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
    },

    [TabsNode.Tabs]: {
        attrs: {class: {default: 'unknown'}},
        content: 'yfm_tabs_list yfm_tab_panel+',
        group: 'block',
        parseDOM: [{tag: 'div.yfm-tabs'}],
        toDOM(node) {
            return ['div', node.attrs, 0];
        },
        complex: 'root',
    },

    [TabsNode.TabsList]: {
        attrs: {class: {default: 'unknown'}, role: {default: 'unknown'}},
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
};
