import type {NodeType} from 'prosemirror-model';
import {Command, NodeSelection, Selection} from 'prosemirror-state';
import type {Action, ExtensionAuto} from '../../../core';
import {nodeTypeFactory} from '../../../utils/schema';
import {nodeInputRule} from '../../../utils/inputrules';
import {pType} from '../../base/BaseSchema';

export const horizontalRule = 'horizontal_rule';
const hrAction = 'hRule';
export const markupAttr = 'markup';
const hrType = nodeTypeFactory(horizontalRule);

export const HorizontalRule: ExtensionAuto = (builder) => {
    builder.addNode(horizontalRule, () => ({
        spec: {
            attrs: {[markupAttr]: {default: '---'}},
            group: 'block',
            parseDOM: [{tag: 'hr'}],
            toDOM() {
                return ['div', ['hr']];
            },
        },
        fromYfm: {
            tokenName: 'hr',
            tokenSpec: {
                name: horizontalRule,
                type: 'node',
                getAttrs: (token) => ({[markupAttr]: token.markup}),
            },
        },
        toYfm: (state, node) => {
            state.write(node.attrs[markupAttr]);
            state.closeBlock(node);
        },
    }));

    builder.addInputRules((deps) => ({
        rules: [
            // --- or ___ or *** at start of line are converted to horizontal line
            // and add new empty paragraph after
            nodeInputRule(
                /^(---|___|\*\*\*)$/,
                [hrType(deps.schema).create(), pType(deps.schema).create()],
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
    return selection instanceof NodeSelection && selection.node.type.name === horizontalRule;
}
