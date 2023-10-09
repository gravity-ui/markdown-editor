import type {Node} from 'prosemirror-model';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const codeMarkName = 'code';
export const codeType = markTypeFactory(codeMarkName);

export const CodeSpecs: ExtensionAuto = (builder) => {
    builder.addMark(
        codeMarkName,
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
                tokenSpec: {name: codeMarkName, type: 'mark', code: true, noCloseToken: true},
                tokenName: 'code_inline',
            },
        }),
        builder.Priority.Lowest,
    );
};

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
