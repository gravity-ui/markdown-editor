import type {NodeType} from 'prosemirror-model';
import type {Command, Selection} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {nodeInputRule} from '../../../utils/inputrules';
import {isNodeSelection} from '../../../utils/selection';
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
/** @deprecated Use `horizontalRuleNodeName` instead */
export const horizontalRule = horizontalRuleNodeName;
const hrAction = 'hRule';
/** @deprecated Use `horizontalRuleMarkupAttr` instead */
export const markupAttr = horizontalRuleMarkupAttr;
/** @deprecated Use `horizontalRuleType` instead */
const hrType = horizontalRuleType;

export const HorizontalRule: ExtensionAuto = (builder) => {
    builder.use(HorizontalRuleSpecs);

    builder.addInputRules((deps) => ({
        rules: [
            // --- or ___ or *** at start of line are converted to horizontal line
            // and add new empty paragraph after
            nodeInputRule(
                /^(---|___|\*\*\*)$/,
                (markup) => [
                    hrType(deps.schema).create({[horizontalRuleMarkupAttr]: markup}),
                    pType(deps.schema).create(),
                ],
                1,
            ),
        ],
    }));

    builder.addAction(hrAction, ({schema}) => {
        const cmd = addHr(hrType(schema));
        return {
            isActive: (state) => isHrSelection(state.selection),
            isEnable: cmd,
            run: cmd,
        };
    });
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [hrAction]: Action;
        }
    }
}

const addHr =
    (hr: NodeType): Command =>
    (state, dispatch) => {
        if (!isHrSelection(state.selection)) {
            dispatch?.(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
        }

        return true;
    };

function isHrSelection(selection: Selection) {
    return isNodeSelection(selection) && selection.node.type.name === horizontalRuleNodeName;
}
