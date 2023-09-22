import insPlugin from 'markdown-it-ins';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const underlineMarkName = 'ins';
export const underlineType = markTypeFactory(underlineMarkName);

export const UnderlineSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(insPlugin))
        .addMark(underlineMarkName, () => ({
            spec: {
                parseDOM: [{tag: 'ins'}, {tag: 'u'}],
                toDOM() {
                    return ['ins'];
                },
            },
            toYfm: {open: '++', close: '++', mixable: true, expelEnclosingWhitespace: true},
            fromYfm: {tokenSpec: {name: underlineMarkName, type: 'mark'}},
        }));
};
