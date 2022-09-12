import {keymap} from 'prosemirror-keymap';
import {Fragment} from 'prosemirror-model';
import {Command, TextSelection} from 'prosemirror-state';
import {findParentNodeOfType} from 'prosemirror-utils';
import {pType} from '../../base/BaseSchema';
import {checkboxInputType, checkboxLabelType, checkboxType} from './utils';

export const splitCheckbox: Command = (state, dispatch) => {
    const {$from, $to} = state.selection;
    const {schema} = state;
    const label = findParentNodeOfType(checkboxLabelType(schema))(state.selection);

    if (!label) return false;

    const checkbox = findParentNodeOfType(checkboxType(schema))(state.selection);

    if (label.node.content.size === 0 && checkbox) {
        dispatch?.(
            state.tr
                .replaceWith(
                    checkbox.pos,
                    checkbox.pos + checkbox.node.nodeSize,
                    pType(schema).create(),
                )
                .scrollIntoView(),
        );

        return true;
    }

    if ($from.pos === $to.pos) {
        const {tr} = state;

        const node = checkboxType(schema).create({}, [
            checkboxInputType(schema).create(),
            checkboxLabelType(schema).create(
                {},
                Fragment.from($from.parent.cut($from.parentOffset).content),
            ),
        ]);

        tr.insert($from.after(), [node]);

        tr.replace(label.start + $from.parentOffset, label.pos + label.node.nodeSize);
        tr.setSelection(new TextSelection(tr.doc.resolve(tr.selection.$from.after() + 4)));
        dispatch?.(tr);

        return true;
    }

    return false;
};

const removeCheckbox: Command = (state, dispatch) => {
    const label = findParentNodeOfType(checkboxLabelType(state.schema))(state.selection);
    const checkbox = findParentNodeOfType(checkboxType(state.schema))(state.selection);

    if (!label || !checkbox) {
        return false;
    }

    const idx = state.selection.from - label.pos - 2;

    if (idx < 0) {
        const {tr} = state;
        dispatch?.(
            tr
                .replaceWith(
                    checkbox.pos,
                    checkbox.pos + checkbox.node.nodeSize,
                    pType(state.schema).create(null, label.node.content),
                )
                .setSelection(new TextSelection(tr.doc.resolve(state.selection.from - 2))),
        );
        return true;
    }

    return false;
};

export const keymapPlugin = () =>
    keymap({
        Enter: splitCheckbox,
        Backspace: removeCheckbox,
    });
