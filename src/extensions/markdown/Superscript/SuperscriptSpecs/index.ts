import log from '@doc-tools/transform/lib/log';
import sup from '@doc-tools/transform/lib/plugins/sup';

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
            toYfm: {open: '^', close: '^', mixable: true, expelEnclosingWhitespace: true},
            fromYfm: {tokenSpec: {name: superscriptMarkName, type: 'mark'}},
        }));
};
