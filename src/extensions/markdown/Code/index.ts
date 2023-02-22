import {toggleMark} from 'prosemirror-commands';
import codemark from 'prosemirror-codemark';
import {Plugin} from 'prosemirror-state';
import {createToggleMarkAction} from '../../../utils/actions';
import type {Action, ExtensionAuto} from '../../../core';
import {codeMarkName, CodeSpecs, codeType} from './CodeSpecs';

import './code.scss';

export {codeMarkName, codeType} from './CodeSpecs';
/** @deprecated Use `codeMarkName` instead */
export const code = codeMarkName;
const codeAction = 'code';

export type CodeOptions = {
    codeKey?: string | null;
};

export const Code: ExtensionAuto<CodeOptions> = (builder, opts) => {
    builder.use(CodeSpecs);
    builder.addAction(codeAction, ({schema}) => createToggleMarkAction(codeType(schema)));

    if (opts?.codeKey) {
        const {codeKey} = opts;
        builder.addKeymap(({schema}) => ({[codeKey]: toggleMark(codeType(schema))}));
    }

    builder
        // codemark adds inputRule for `code`,
        // adds fake cursor behaviour when crossing inline_code boundaries,
        // wrap current selected text to inline_code when '`' was pressed.
        // See demo: https://curvenote.github.io/prosemirror-codemark/
        .addPlugin(({schema}) => codemark({markType: codeType(schema)}));

    builder.addPlugin(
        () =>
            // apply codemark when typing text between ``
            new Plugin({
                props: {
                    handleTextInput: (view, from, to, text) => {
                        const {
                            selection: {$anchor},
                            tr,
                            schema,
                        } = view.state;
                        if (
                            $anchor.nodeBefore?.text?.endsWith('`') &&
                            $anchor.nodeAfter?.text?.startsWith('`')
                        ) {
                            view.dispatch(
                                tr.replaceRangeWith(
                                    from - 1,
                                    to + 1,
                                    view.state.schema.text(text, [codeType(schema).create()]),
                                ),
                            );

                            return true;
                        }
                        return false;
                    },
                },
            }),
    );
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [codeAction]: Action;
        }
    }
}
