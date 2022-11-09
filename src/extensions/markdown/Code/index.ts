import type {Node} from 'prosemirror-model';
import {toggleMark} from 'prosemirror-commands';
import codemark from 'prosemirror-codemark';
import {createToggleMarkAction} from '../../../utils/actions';
import type {Action, ExtensionAuto} from '../../../core';
import {markTypeFactory} from '../../../utils/schema';

import './code.scss';

export const code = 'code';
const codeAction = 'code';
export const codeType = markTypeFactory(code);

export type CodeOptions = {
    codeKey?: string | null;
};

export const Code: ExtensionAuto<CodeOptions> = (builder, opts) => {
    builder
        .addMark(
            code,
            () => ({
                spec: {
                    code: true,
                    parseDOM: [{tag: 'code'}],
                    toDOM() {
                        return ['code'];
                    },
                },
                toYfm: {
                    open(_state, _mark, parent, index) {
                        return backticksFor(parent.child(index), -1);
                    },
                    close(_state, _mark, parent, index) {
                        return backticksFor(parent.child(index - 1), 1);
                    },
                    escape: false,
                },
                fromYfm: {
                    tokenSpec: {name: code, type: 'mark', noCloseToken: true},
                    tokenName: 'code_inline',
                },
            }),
            builder.Priority.Lowest,
        )
        .addAction(codeAction, ({schema}) => createToggleMarkAction(codeType(schema)));

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
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [codeAction]: Action;
        }
    }
}

function backticksFor(node: Node, side: number) {
    const ticks = /`+/g;
    let m;
    let len = 0;

    if (node.isText) while ((m = ticks.exec(node.text || ''))) len = Math.max(len, m[0].length);

    let result = len > 0 && side > 0 ? ' `' : '`';
    for (let i = 0; i < len; i++) result += '`';
    if (len > 0 && side < 0) result += ' ';

    return result;
}
