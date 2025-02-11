import type {NodeType} from 'prosemirror-model';
import {Command, Selection, TextSelection} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {nodeInputRule} from '../../../utils/inputrules';
import {get$Cursor, isNodeSelection} from '../../../utils/selection';
import {pType} from '../../base/BaseSchema/BaseSchemaSpecs';

import {
    HorizontalRuleSpecs,
    horizontalRuleMarkupAttr,
    horizontalRuleNodeName,
    horizontalRuleType,
} from './HorizontalRuleSpecs';

export {
    horizontalRuleMarkupAttr,
    horizontalRuleNodeName,
    horizontalRuleType,
} from './HorizontalRuleSpecs';
const hrAction = 'hRule';

export const HorizontalRule: ExtensionAuto = (builder) => {
    builder.use(HorizontalRuleSpecs);

    builder.addInputRules((deps) => ({
        rules: [
            // --- or ___ or *** at start of line are converted to horizontal line
            // and add new empty paragraph after
            nodeInputRule(
                /^(---|___|\*\*\*)$/,
                (markup) => [
                    horizontalRuleType(deps.schema).create({[horizontalRuleMarkupAttr]: markup}),
                    pType(deps.schema).create(),
                ],
                1,
            ),
        ],
    }));

    builder.addAction(hrAction, ({schema}) => {
        const cmd = addHr(horizontalRuleType(schema));
        return {
            isActive: (state) => isHrSelection(state.selection),
            isEnable: cmd,
            run: cmd,
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [hrAction]: Action;
        }
    }
}

const addHr =
    (hr: NodeType): Command =>
    (state, dispatch) => {
        if (isHrSelection(state.selection)) return true;

        if (isNodeSelection(state.selection)) {
            dispatch?.(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
            return true;
        }

        const $cursor = get$Cursor(state.selection);
        if (!$cursor || $cursor.parent.type.spec.complex) return false;

        if (!dispatch) return true;

        const {tr} = state;
        const isEmptyParagraph =
            $cursor.parent.type === pType(state.schema) && $cursor.parent.nodeSize === 2;

        if (isEmptyParagraph) {
            const pos = $cursor.before();
            tr.insert(pos, hr.create());
        } else {
            const pos = $cursor.after();
            tr.insert(pos, [hr.create(), pType(state.schema).create()]);
            tr.setSelection(TextSelection.create(tr.doc, pos + 2)); // set cursor to paragraph after hr
        }

        dispatch(tr.scrollIntoView());

        return true;
    };

function isHrSelection(selection: Selection) {
    return isNodeSelection(selection) && selection.node.type.name === horizontalRuleNodeName;
}
