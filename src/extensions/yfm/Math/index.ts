import mathMdPlugin from 'markdown-it-katex';
import {chainCommands, setBlockType} from 'prosemirror-commands';
import {hasParentNodeOfType} from 'prosemirror-utils';
import {Command, TextSelection} from 'prosemirror-state';
import {textblockTypeInputRule} from 'prosemirror-inputrules';
import type {Action, ExtensionAuto} from '../../../core';
import {isTextSelection} from '../../../utils/selection';
import {inlineNodeInputRule} from '../../../utils/inputrules';
import {mathViewAndEditPlugin} from './view-and-edit';
import {CLASSNAMES, mathBType, mathIType, MathNode} from './const';
import {
    ignoreIfCursorInsideMathInline,
    moveCursorToEndOfMathInline,
    removeEmptyMathInlineIfCursorIsAtBeginning,
} from './commands';

import './index.scss';

export {MathNode} from './const';
export {MathBlockNodeView, MathInlineNodeView} from './view-and-edit';

const mathIAction = 'addMathInline';
const mathBAction = 'toMathBlock';

const mathITemplate = 'f(x)=';

export const Math: ExtensionAuto = (builder) => {
    builder.configureMd((md) => md.use(mathMdPlugin));
    builder
        .addNode(MathNode.Inline, () => ({
            spec: {
                group: 'inline math',
                content: 'text*',
                inline: true,
                marks: '',
                code: true,
                toDOM: () => [
                    'span',
                    {class: CLASSNAMES.Inline.Container},
                    ['span', {class: CLASSNAMES.Inline.Sharp, contenteditable: 'false'}, '$'],
                    ['span', {class: CLASSNAMES.Inline.Content}, 0],
                    ['span', {class: CLASSNAMES.Inline.Sharp, contenteditable: 'false'}, '$'],
                ],
                parseDOM: [{tag: `span.${CLASSNAMES.Inline.Content}`, priority: 200}],
            },
            fromYfm: {
                tokenName: 'math_inline',
                tokenSpec: {name: MathNode.Inline, type: 'block', noCloseToken: true},
            },
            toYfm: (state, node) => {
                state.text(`$${node.textContent}$`, false);
                state.closeBlock();
            },
        }))
        .addNode(MathNode.Block, () => ({
            spec: {
                group: 'block math',
                content: 'text*',
                marks: '',
                code: true,
                toDOM: () => ['div', {class: 'math-block'}, 0],
                parseDOM: [{tag: 'div.math-block', priority: 200}],
            },
            fromYfm: {
                tokenName: 'math_block',
                tokenSpec: {name: MathNode.Block, type: 'block', noCloseToken: true},
            },
            toYfm: (state, node) => {
                state.text(`$$${node.textContent}$$\n\n`, false);
                state.closeBlock();
            },
        }));

    builder.addKeymap(() => ({
        Enter: ignoreIfCursorInsideMathInline, // ignore breaks in math inline
        Backspace: chainCommands(
            moveCursorToEndOfMathInline,
            removeEmptyMathInlineIfCursorIsAtBeginning,
        ),
    }));

    builder.addPlugin(mathViewAndEditPlugin).addInputRules((deps) => ({
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
