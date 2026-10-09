import {log} from '@diplodoc/transform/lib/log.js';
import yfmPlugin from '@diplodoc/transform/lib/plugins/monospace.js';

import type {ExtensionAuto} from '#core';
import {markTypeFactory} from 'src/utils/schema';

export const monospaceMarkName = 'monospace';
export const monospaceType = markTypeFactory(monospaceMarkName);

export const MonospaceSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addMarkSpec(monospaceMarkName, () => ({
            parseDOM: [{tag: 'samp'}],
            toDOM() {
                return ['samp'];
            },
        }))
        .addMarkdownTokenParserSpec('monospace', () => ({
            name: monospaceMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(monospaceMarkName, () => ({
            open: '##',
            close: '##',
            mixable: true,
            expelEnclosingWhitespace: true,
        }));
};
