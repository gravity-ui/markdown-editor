import type {PluginSimple} from 'markdown-it';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

const ins: PluginSimple = require('markdown-it-ins');

export const underlineMarkName = 'ins';
export const underlineType = markTypeFactory(underlineMarkName);

export const UnderlineSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(ins))
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
