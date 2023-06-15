import type {PluginSimple} from 'markdown-it';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

const sub: PluginSimple = require('markdown-it-sub');

export const subscriptMarkName = 'sub';
export const subscriptType = markTypeFactory(subscriptMarkName);

export const SubscriptSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sub))
        .addMark(subscriptMarkName, () => ({
            spec: {
                excludes: '_',
                parseDOM: [{tag: 'sub'}],
                toDOM() {
                    return ['sub'];
                },
            },
            toYfm: {
                open: (state) => {
                    state.escapeWhitespace = true;
                    return '~';
                },
                close: (state) => {
                    state.escapeWhitespace = false;
                    return '~';
                },
                mixable: false,
                expelEnclosingWhitespace: true,
            },
            fromYfm: {tokenSpec: {name: subscriptMarkName, type: 'mark'}},
        }));
};
