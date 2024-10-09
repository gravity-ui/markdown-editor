import {chainCommands, setBlockType} from 'prosemirror-commands';
import {Command, TextSelection} from 'prosemirror-state';
import {hasParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto} from '../../../core';
import {inlineNodeInputRule, textblockTypeInputRule} from '../../../utils/inputrules';
import {isTextSelection} from '../../../utils/selection';

import {MathSpecs} from './MathSpecs';
import {
    ignoreIfCursorInsideMathInline,
    removeEmptyMathInlineIfCursorIsAtBeginning,
} from './commands';
import {mathBType, mathIType} from './const';
import {MathNodeViewOptions, mathViewAndEditPlugin} from './view-and-edit';

import './index.scss';

export {MathNode, mathBType, mathIType} from './MathSpecs';
export {MathBlockNodeView, MathInlineNodeView} from './view-and-edit';

const mathIAction = 'addMathInline';
const mathBAction = 'toMathBlock';

const mathITemplate = 'f(x)=';

// !!! YfmPreset/YfmSpecsPreset does not use or re-export the Math extension

export type MathOptions = Pick<
    MathNodeViewOptions,
    'loadRuntimeScript' | 'sanitize' | 'katexOptions'
>;

export const Math: ExtensionAuto<MathOptions> = (builder, opts) => {
    builder.use(MathSpecs);

    builder.addKeymap(() => ({
        Enter: ignoreIfCursorInsideMathInline, // ignore breaks in math inline
        Backspace: chainCommands(removeEmptyMathInlineIfCursorIsAtBeginning),
    }));

    builder
        .addPlugin(() =>
            mathViewAndEditPlugin({
                ...opts,
                reactRenderer: builder.context.get('reactrenderer')!,
            }),
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
    namespace WysiwygEditor {
        interface Actions {
            [mathIAction]: Action;
            [mathBAction]: Action;
        }
    }
}
