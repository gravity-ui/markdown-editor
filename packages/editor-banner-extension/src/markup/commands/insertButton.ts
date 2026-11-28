import {
    EditorSelection,
    type EditorState,
    type StateCommand,
} from '@gravity-ui/markdown-editor/cm/state';
import {buttonDefaults} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../i18n';
import {escapeLabel} from '../../wysiwyg/utils/directive';

const open = ':button[';

function labelEnd(text: string, index: number) {
    let depth = 1;
    for (let i = index; i < text.length; i++) {
        const char = text[i];
        if (char === '\\') i++;
        else if (char === '[') depth++;
        else if (char === ']' && --depth === 0) return i + 1;
    }
    return -1;
}

// A quote opens the link title only after a space.
function linkEnd(text: string, index: number) {
    if (text[index] !== '(') return index;
    let depth = 0;
    let quote = '';
    for (let i = index; i < text.length; i++) {
        const char = text[i];
        if (char === '\\') i++;
        else if (quote) {
            if (char === quote) quote = '';
        } else if ((char === '"' || char === "'") && /\s/.test(text[i - 1])) quote = char;
        else if (char === '(') depth++;
        else if (char === ')' && --depth === 0) return i + 1;
    }
    return index;
}

function attrsEnd(text: string, index: number) {
    if (text[index] !== '{') return index;
    let quote = '';
    for (let i = index + 1; i < text.length; i++) {
        const char = text[i];
        if (char === '\\') i++;
        else if (quote) {
            if (char === quote) quote = '';
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '}') return i + 1;
    }
    return index;
}

function buttonEnd(state: EditorState, from: number, to: number) {
    const line = state.doc.lineAt(from);
    let result: number | undefined;
    let index = line.text.indexOf(open);
    while (index !== -1) {
        const label = labelEnd(line.text, index + open.length);
        if (label === -1) {
            index = line.text.indexOf(open, index + 1);
            continue;
        }
        const end = attrsEnd(line.text, linkEnd(line.text, label));
        if (line.from + index <= to && from <= line.from + end) result = line.from + end;
        index = line.text.indexOf(open, end);
    }
    return result;
}

export const insertButton: StateCommand = ({state, dispatch}) => {
    const {view, color} = buttonDefaults;
    const tr = state.changeByRange(({from, to}) => {
        const text = state.sliceDoc(from, to);
        const trimmed = text.includes('\n') ? '' : text.trim();
        let start = trimmed ? from + text.indexOf(trimmed) : to;
        let end = trimmed ? start + trimmed.length : to;
        const after = buttonEnd(state, start, end);
        const label = after === undefined ? trimmed : '';
        if (after !== undefined) {
            start = after;
            end = after;
        }
        const escaped = label ? escapeLabel(label) : i18n('button-placeholder');
        const prefix = after === undefined ? open : ` ${open}`;
        const insert = `${prefix}${escaped}]{view="${view}" color="${color}"}`;
        const labelFrom = start + prefix.length;
        return {
            changes: {from: start, to: end, insert},
            range: EditorSelection.range(labelFrom, labelFrom + escaped.length),
        };
    });
    dispatch(state.update(tr, {scrollIntoView: true}));
    return true;
};
