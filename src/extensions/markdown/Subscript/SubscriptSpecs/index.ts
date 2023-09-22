import subPlugin from 'markdown-it-sub';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const subscriptMarkName = 'sub';
export const subscriptType = markTypeFactory(subscriptMarkName);

export const SubscriptSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(subPlugin))
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
