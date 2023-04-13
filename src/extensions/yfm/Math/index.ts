import {chainCommands, setBlockType} from 'prosemirror-commands';
import {hasParentNodeOfType} from 'prosemirror-utils';
import {Command, TextSelection} from 'prosemirror-state';
import {textblockTypeInputRule} from 'prosemirror-inputrules';

import type {Action, ExtensionAuto} from '../../../core';
import {isTextSelection} from '../../../utils/selection';
import {inlineNodeInputRule} from '../../../utils/inputrules';

import {MathSpecs} from './MathSpecs';
import {mathViewAndEditPlugin} from './view-and-edit';
import {mathBType, mathIType} from './const';
import {
    ignoreIfCursorInsideMathInline,
    moveCursorToEndOfMathInline,
    removeEmptyMathInlineIfCursorIsAtBeginning,
} from './commands';

import './index.scss';

export {MathNode, mathBType, mathIType} from './MathSpecs';
export {MathBlockNodeView, MathInlineNodeView} from './view-and-edit';

const mathIAction = 'addMathInline';
const mathBAction = 'toMathBlock';

const mathITemplate = 'f(x)=';

export const Math: ExtensionAuto = (builder) => {
    builder.use(MathSpecs);

    builder.addKeymap(() => ({
        Enter: ignoreIfCursorInsideMathInline, // ignore breaks in math inline
        Backspace: chainCommands(
            moveCursorToEndOfMathInline,
            removeEmptyMathInlineIfCursorIsAtBeginning,
        ),
    }));

    builder
        .addPlugin(() =>
            mathViewAndEditPlugin({reactRenderer: builder.context.get('reactrenderer')!}),
        )
        .addInputRules((deps) => ({
            rules: [
                textblockTypeInputRule(/^\$\$\s$/, mathBType(deps.schema)),
                inlineNodeInputRule(/\$[^$\s]+\$$/, (match) =>
                    mathIType(deps.schema).create(null, deps.schema.text(match.replace(/\$/g, ''))),
                ),
            ],
        }));
    builder
        .addAction(mathIAction, (deps) => {
            const type = mathIType(deps.schema);
            const cmd: Command = (state, dispatch) => {
                const {selection} = state;
                if (isTextSelection(selection) && selection.$from.sameParent(selection.$to)) {
                    if (dispatch) {
                        const fragment = selection.content().content;
                        const selectedText =
                            fragment.textBetween(0, fragment.size) || mathITemplate;
                        const tr = state.tr;
                        selection.replaceWith(
                            tr,
                            type.create(null, deps.schema.text(selectedText)),
                        );
                        tr.setSelection(
                            TextSelection.create(tr.doc, selection.from + selectedText.length + 1),
                        );
                        dispatch(tr);
                    }
                    return true;
                }
                return false;
            };
            return {
                isActive: (state) => hasParentNodeOfType(type)(state.selection),
                isEnable: cmd,
                run: cmd,
            };
        })
        .addAction(mathBAction, (deps) => {
            const type = mathBType(deps.schema);
            const cmd = setBlockType(type);
            return {
                isActive: (state) => hasParentNodeOfType(type)(state.selection),
                isEnable: cmd,
                run: cmd,
            };
        });
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [mathIAction]: Action;
            [mathBAction]: Action;
        }
    }
}
