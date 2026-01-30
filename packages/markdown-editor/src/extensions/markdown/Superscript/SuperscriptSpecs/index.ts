import {log} from '@diplodoc/transform/lib/log.js';
import sup from '@diplodoc/transform/lib/plugins/sup.js';

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const superscriptMarkName = 'sup';
export const superscriptType = markTypeFactory(superscriptMarkName);

export const SuperscriptSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sup, {log}))
        .addMark(superscriptMarkName, () => ({
            spec: {
                excludes: '_',
                parseDOM: [{tag: 'sup'}],
                toDOM() {
                    return ['sup'];
                },
            },
            toMd: {
                open: (state) => {
                    state.escapeWhitespace = true;
                    return '^';
                },
                close: (state) => {
                    state.escapeWhitespace = false;
                    return '^';
                },
                mixable: true,
                expelEnclosingWhitespace: true,
            },
            fromMd: {tokenSpec: {name: superscriptMarkName, type: 'mark'}},
        }));
};
