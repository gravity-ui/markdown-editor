import {ActionKind} from 'prosemirror-autocomplete';
import {EditorView} from 'prosemirror-view';

import {DecoClassName} from '../../behavior/CommandMenu/const';
import {ListNode} from '../Lists/ListsSpecs';

import {ActionButtonNodesFilter} from './types';

export const defaultNodeFilter: ActionButtonNodesFilter = (node) => {
    const {name, spec} = node.type;
    if (name === ListNode.ListItem) return true;
    if (spec.complex && spec.complex !== 'root') return false;
    return undefined;
};

export const getActionPlug = (view: EditorView) => {
    return {
        filter: '',
        kind: ActionKind.open,
        range: {
            from: 0,
            to: 1,
        },
        trigger: '/',
        view: view,
        type: {
            name: 'command',
            trigger: /(?:^|\s)(\/)$/,
            allArrowKeys: false,
            cancelOnFirstSpace: true,
            decorationAttrs: {class: DecoClassName},
        },
    };
};
