import log from '@diplodoc/transform/lib/log';
import yfmPlugin from '@diplodoc/transform/lib/plugins/monospace';

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const monospaceMarkName = 'monospace';
export const monospaceType = markTypeFactory(monospaceMarkName);

export const MonospaceSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addMark(monospaceMarkName, () => ({
            spec: {
                parseDOM: [{tag: 'samp'}],
                toDOM() {
                    return ['samp'];
                },
            },
            fromMd: {
                tokenSpec: {
                    name: monospaceMarkName,
                    type: 'mark',
                },
            },
            toMd: {
                open: '##',
                close: '##',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }));
};
